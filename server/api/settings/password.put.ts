import {compare, hash} from "bcryptjs";
import {z} from "zod";
import {issueSession, requireSession} from "../../utils/auth";
import {db} from "../../utils/db";

const schema = z.object({
    currentPassword: z.string().min(8),
    newPassword: z.string().min(10).max(72),
    confirmPassword: z.string()
}).refine(x => x.newPassword === x.confirmPassword, {message: "تکرار رمز مطابقت ندارد."});
export default defineEventHandler(async (event) => {
    const auth = await requireSession(event), parsed = schema.safeParse(await readBody(event));
    if (!parsed.success) throw createError({
        statusCode: 422,
        statusMessage: parsed.error.issues[0]?.message || "رمز جدید معتبر نیست."
    });
    const user = await db.user.findUnique({where: {id: String(auth.sub)}});
    if (!user || !await compare(parsed.data.currentPassword, user.passwordHash)) throw createError({
        statusCode: 400,
        statusMessage: "رمز فعلی نادرست است."
    });
    await db.user.update({where: {id: user.id}, data: {passwordHash: await hash(parsed.data.newPassword, 12), sessionVersion: {increment: 1}}});
    await issueSession(event, {id: user.id, role: user.role});
    return {success: true};
});
