import {hash} from "bcryptjs";
import {z} from "zod";
import {db} from "../../utils/db";
import {issueSession} from "../../utils/auth";
import {databaseAction} from "../../utils/errors";
import {assertRateLimit} from "../../utils/rate-limit";

const schema = z.object({
    name: z.string().trim().min(2).max(80),
    email: z.email().max(254).toLowerCase(),
    phone: z.string().trim().regex(/^\+?\d{7,15}$/).optional(),
    password: z.string().min(10).max(72)
});

export default defineEventHandler(async event => {
    assertRateLimit(event, "register", {limit: 5, windowMs: 60 * 60 * 1000});
    const parsed = schema.safeParse(await readBody(event));
    if (!parsed.success) throw createError({statusCode: 422, statusMessage: "اطلاعات واردشده معتبر نیست."});
    const {name, email, phone, password} = parsed.data;
    const exists = await databaseAction(() => db.user.findFirst({where: {OR: [{email}, ...(phone ? [{phone}] : [])]}}));
    if (exists) throw createError({statusCode: 409, statusMessage: "این ایمیل یا موبایل قبلاً ثبت شده است."});
    const passwordHash = await hash(password, 12);
    const user = await databaseAction(async () => {
        const free = await db.plan.findUnique({where: {slug: "free"}});
        return db.user.create({
            data: {
                name,
                email,
                phone: phone || null,
                passwordHash, ...(free ? {
                    subscriptions: {
                        create: {
                            planId: free.id,
                            status: "ACTIVE",
                            startsAt: new Date(),
                            endsAt: new Date(Date.now() + free.durationDays * 86400000)
                        }
                    }
                } : {})
            }, select: {id: true, name: true, email: true, role: true}
        })
    });
    await issueSession(event, {id: user.id, role: user.role});
    setResponseStatus(event, 201);
    return {user};
});
