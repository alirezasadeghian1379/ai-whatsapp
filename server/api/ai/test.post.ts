import {z} from "zod";
import {getAIProvider} from "../../services/providers";
import {requireSession} from "../../utils/auth";
import {decryptSecret} from "../../utils/crypto";
import {db} from "../../utils/db";
import {assertPlanLimit} from "../../utils/plan";

const schema = z.object({message: z.string().trim().min(1).max(4000)});
export default defineEventHandler(async (event) => {
    const auth = await requireSession(event), parsed = schema.safeParse(await readBody(event));
    await assertPlanLimit(String(auth.sub), "ai");
    if (!parsed.success) throw createError({statusCode: 422});
    const config = await db.aIConfiguration.findFirst({where: {userId: String(auth.sub)}});
    if (config && config.provider !== "groq") throw createError({
        statusCode: 409,
        statusMessage: "تنظیمات قبلی دیگر پشتیبانی نمی‌شود؛ لطفاً کلید API سرویس Groq را ذخیره کنید."
    });
    if (!config?.apiKeyEncrypted) throw createError({
        statusCode: 409,
        statusMessage: "ابتدا تنظیمات و API Key هوش مصنوعی را ذخیره کنید."
    });
    const result = await getAIProvider(config.provider, decryptSecret(config.apiKeyEncrypted), config.model).complete({
        systemPrompt: config.systemPrompt,
        message: parsed.data.message,
        temperature: config.temperature,
        maxTokens: config.maxTokens
    });
    if (!result.ok) throw createError({statusCode: 502, statusMessage: result.error});
    const periodStart = new Date();
    periodStart.setDate(1);
    periodStart.setHours(0, 0, 0, 0);
    const periodEnd = new Date(periodStart.getFullYear(), periodStart.getMonth() + 1, 1);
    await db.usage.upsert({
        where: {userId_periodStart: {userId: String(auth.sub), periodStart}},
        update: {aiRequests: {increment: 1}},
        create: {userId: String(auth.sub), periodStart, periodEnd, aiRequests: 1}
    });
    return result.data;
});
