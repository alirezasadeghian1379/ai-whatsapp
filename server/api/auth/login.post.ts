import {compare} from "bcryptjs";
import {z} from "zod";
import {db} from "../../utils/db";
import {issueSession} from "../../utils/auth";
import {databaseAction} from "../../utils/errors";
import {assertRateLimit} from "../../utils/rate-limit";

const schema = z.object({
    identity: z.string().trim().min(3).max(254),
    password: z.string().min(8),
    remember: z.boolean().default(false)
});

export default defineEventHandler(async event => {
    const parsed = schema.safeParse(await readBody(event));
    assertRateLimit(event, "login-ip", {limit: 30, windowMs: 15 * 60 * 1000});
    if (parsed.success) assertRateLimit(event, "login-account", {
        limit: 8,
        windowMs: 15 * 60 * 1000,
        identity: parsed.data.identity,
        bindIp: false
    });
    if (!parsed.success) throw createError({statusCode: 422, statusMessage: "اطلاعات ورود معتبر نیست."});
    const user = await databaseAction(() => db.user.findFirst({where: {OR: [{email: parsed.data.identity.toLowerCase()}, {phone: parsed.data.identity}]}}));
    if (!user || !await compare(parsed.data.password, user.passwordHash)) throw createError({
        statusCode: 401,
        statusMessage: "ایمیل، موبایل یا رمز عبور نادرست است."
    });
    if (user.status !== "ACTIVE") throw createError({statusCode: 403, statusMessage: "حساب کاربری شما فعال نیست."});
    await issueSession(event, {id: user.id, role: user.role}, parsed.data.remember);
    return {user: {id: user.id, name: user.name, email: user.email, role: user.role}};
});
