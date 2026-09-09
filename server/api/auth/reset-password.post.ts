import {createHash} from "node:crypto";
import {hash} from "bcryptjs";
import {z} from "zod";
import {db} from "../../utils/db";
import {assertRateLimit} from "../../utils/rate-limit";

const schema = z.object({
    token: z.string().min(20),
    password: z.string().min(10).max(72),
    confirmPassword: z.string()
}).refine(x => x.password === x.confirmPassword, {message: "تکرار رمز عبور مطابقت ندارد."});
export default defineEventHandler(async event => {
    assertRateLimit(event, "reset-password", {limit: 10, windowMs: 15 * 60_000});
    const p = schema.safeParse(await readBody(event));
    if (!p.success) throw createError({
        statusCode: 422,
        statusMessage: p.error.issues[0]?.message || "اطلاعات معتبر نیست."
    });
    const tokenHash = createHash("sha256").update(p.data.token).digest("hex"),
        record = await db.passwordResetToken.findFirst({where: {tokenHash, usedAt: null, expiresAt: {gt: new Date()}}});
    if (!record) throw createError({statusCode: 400, statusMessage: "لینک بازیابی نامعتبر یا منقضی شده است."});
    const passwordHash = await hash(p.data.password, 12), now = new Date();
    const completed = await db.$transaction(async tx => {
        const claimed = await tx.passwordResetToken.updateMany({
            where: {id: record.id, usedAt: null, expiresAt: {gt: now}},
            data: {usedAt: now}
        });
        if (claimed.count !== 1) return false;
        await tx.user.update({where: {id: record.userId}, data: {passwordHash, sessionVersion: {increment: 1}}});
        await tx.auditLog.create({
            data: {userId: record.userId, action: "auth.password.reset", entity: "User", entityId: record.userId}
        });
        return true;
    });
    if (!completed) throw createError({statusCode: 400, statusMessage: "لینک بازیابی نامعتبر یا منقضی شده است."});
    return {success: true}
});
