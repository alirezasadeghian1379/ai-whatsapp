import {z} from "zod";
import {requireSession} from "../../utils/auth";
import {encryptSecret} from "../../utils/crypto";
import {db} from "../../utils/db";
import {assertPlanFeature} from "../../utils/plan";

const schema = z.object({
    sessionId: z.string().trim().nullable().optional(),
    provider: z.literal("groq"),
    model: z.enum(["openai/gpt-oss-20b", "openai/gpt-oss-120b", "groq/compound-mini"]),
    apiKey: z.string().trim().optional(),
    systemPrompt: z.string().trim().min(10).max(8000),
    temperature: z.number().min(0).max(2),
    maxTokens: z.number().int().min(50).max(8000),
    autoReply: z.boolean(),
    delaySeconds: z.number().int().min(0).max(300),
    fallbackMessage: z.string().max(1000).nullable(),
    voiceReplyEnabled: z.boolean(),
    voiceModel: z.enum(["edge-tts/fa-IR-DilaraNeural", "edge-tts/fa-IR-FaridNeural"]),
    isEnabled: z.boolean()
});
export default defineEventHandler(async (event) => {
    const auth = await requireSession(event), userId = String(auth.sub),
        parsed = schema.safeParse(await readBody(event));
    await assertPlanFeature(userId, "ai");
    if (!parsed.success) throw createError({statusCode: 422, statusMessage: "تنظیمات AI معتبر نیست."});
    
    const sessionId = parsed.data.sessionId || null;
    if (sessionId) {
        const session = await db.whatsAppSession.findFirst({where: {id: sessionId, userId}});
        if (!session) throw createError({statusCode: 404, statusMessage: "اتصال واتساپ یافت نشد."});
    }

    const existing = await db.aIConfiguration.findFirst({
        where: sessionId ? { userId, sessionId } : { userId, sessionId: null }
    });

    const {apiKey, sessionId: _, ...values} = parsed.data;
    let apiKeyEncryptedToSave: string | undefined = apiKey ? encryptSecret(apiKey) : undefined;
    if (!existing && !apiKey) {
        // If it's a specific session and no API key is provided, try to copy key from general user config
        const generalConfig = await db.aIConfiguration.findFirst({where: {userId, sessionId: null}});
        if (generalConfig?.apiKeyEncrypted) {
            apiKeyEncryptedToSave = generalConfig.apiKeyEncrypted;
        } else {
            throw createError({statusCode: 422, statusMessage: "API Key را وارد کنید."});
        }
    }
    if (existing && existing.provider !== parsed.data.provider && !apiKey) throw createError({
        statusCode: 422,
        statusMessage: "برای ارائه‌دهنده جدید، API Key همان سرویس را وارد کنید."
    });
    
    const data: any = {...values, ...(apiKeyEncryptedToSave ? {apiKeyEncrypted: apiKeyEncryptedToSave} : {})};
    const config = existing ? await db.aIConfiguration.update({
        where: {id: existing.id},
        data
    }) : await db.aIConfiguration.create({data: {userId, sessionId, ...data}});
    return {config: {...config, apiKeyEncrypted: undefined, hasApiKey: !!config.apiKeyEncrypted}};
});
