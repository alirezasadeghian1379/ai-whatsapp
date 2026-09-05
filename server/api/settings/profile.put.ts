import {z} from "zod";
import {requireSession} from "../../utils/auth";
import {db} from "../../utils/db";
import {compare} from "bcryptjs";

const schema = z.object({
    name: z.string().trim().min(2).max(80),
    email: z.string().email().max(254),
    phone: z.string().trim().regex(/^\+?\d{7,15}$/).nullable(),
    company: z.string().trim().max(100).nullable(),
    notifications: z.record(z.string(), z.boolean()).default({}),
    currentPassword: z.string().min(8).max(72).optional()
});
export default defineEventHandler(async (event) => {
    const auth = await requireSession(event), userId = String(auth.sub),
        parsed = schema.safeParse(await readBody(event));
    if (!parsed.success) throw createError({statusCode: 422, statusMessage: "اطلاعات پروفایل معتبر نیست."});
    const existing = await db.user.findUnique({where: {id: userId}, select: {email: true, passwordHash: true}});
    if (!existing) throw createError({statusCode: 404, statusMessage: "کاربر پیدا نشد."});
    const requestedEmail = parsed.data.email.toLowerCase();
    if (requestedEmail !== existing.email && (!parsed.data.currentPassword || !await compare(parsed.data.currentPassword, existing.passwordHash))) {
        throw createError({statusCode: 403, statusMessage: "برای تغییر ایمیل، رمز عبور فعلی را وارد کنید."});
    }
    const {company, notifications, currentPassword: _currentPassword, ...userData} = parsed.data;
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
