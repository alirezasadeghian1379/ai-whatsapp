import {z} from "zod";
import {requireSession} from "../../utils/auth";
import {db} from "../../utils/db";

const schema = z.object({
    name: z.string().trim().min(2).max(80),
    email: z.string().email(),
    phone: z.string().trim().nullable(),
    company: z.string().trim().max(100).nullable(),
    notifications: z.record(z.string(), z.boolean()).default({})
});
export default defineEventHandler(async (event) => {
    const auth = await requireSession(event), userId = String(auth.sub),
        parsed = schema.safeParse(await readBody(event));
    if (!parsed.success) throw createError({statusCode: 422, statusMessage: "اطلاعات پروفایل معتبر نیست."});
    const {company, notifications, ...userData} = parsed.data;
    try {
        const [user] = await db.$transaction([db.user.update({
            where: {id: userId},
            data: {...userData, email: userData.email.toLowerCase(), phone: userData.phone || null}
        }), db.systemSetting.upsert({
            where: {key: `user:${userId}:preferences`},
            update: {value: {company, notifications}},
            create: {key: `user:${userId}:preferences`, value: {company, notifications}}
        })]);
        return {user: {id: user.id, name: user.name, email: user.email, phone: user.phone}};
    } catch {
        throw createError({statusCode: 409, statusMessage: "ایمیل یا موبایل قبلاً استفاده شده است."});
    }
});
