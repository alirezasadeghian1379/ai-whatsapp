import {z} from "zod";
import {requireSession} from "../../utils/auth";
import {encryptSecret} from "../../utils/crypto";
import {db} from "../../utils/db";

const schema = z.object({
    provider: z.enum(["openai", "groq"]),
    model: z.string().trim().min(2).max(100),
    apiKey: z.string().trim().optional(),
    systemPrompt: z.string().trim().min(10).max(8000),
    temperature: z.number().min(0).max(2),
    maxTokens: z.number().int().min(50).max(8000),
    autoReply: z.boolean(),
    delaySeconds: z.number().int().min(0).max(300),
    fallbackMessage: z.string().max(1000).nullable(),
    isEnabled: z.boolean()
});
export default defineEventHandler(async (event) => {
    const auth = await requireSession(event), userId = String(auth.sub),
        parsed = schema.safeParse(await readBody(event));
    if (!parsed.success) throw createError({statusCode: 422, statusMessage: "تنظیمات AI معتبر نیست."});
    const existing = await db.aIConfiguration.findFirst({where: {userId}});
    const {apiKey, ...values} = parsed.data;
    if (!existing && !apiKey) throw createError({statusCode: 422, statusMessage: "API Key را وارد کنید."});
    if (existing && existing.provider !== parsed.data.provider && !apiKey) throw createError({
        statusCode: 422,
        statusMessage: "برای ارائه‌دهنده جدید، API Key همان سرویس را وارد کنید."
    });
    const data = {...values, ...(apiKey ? {apiKeyEncrypted: encryptSecret(apiKey)} : {})};
    const config = existing ? await db.aIConfiguration.update({
        where: {id: existing.id},
        data
    }) : await db.aIConfiguration.create({data: {userId, ...data}});
    return {config: {...config, apiKeyEncrypted: undefined, hasApiKey: !!config.apiKeyEncrypted}};
});
