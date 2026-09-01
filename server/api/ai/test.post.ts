import {z} from "zod";
import {OpenAIProvider} from "../../services/providers";
import {requireSession} from "../../utils/auth";
import {decryptSecret} from "../../utils/crypto";
import {db} from "../../utils/db";

const schema = z.object({message: z.string().trim().min(1).max(4000)});
export default defineEventHandler(async (event) => {
    const auth = await requireSession(event), parsed = schema.safeParse(await readBody(event));
    if (!parsed.success) throw createError({statusCode: 422});
    const config = await db.aIConfiguration.findFirst({where: {userId: String(auth.sub)}});
    if (!config?.apiKeyEncrypted) throw createError({
        statusCode: 409,
        statusMessage: "ابتدا تنظیمات و API Key هوش مصنوعی را ذخیره کنید."
    });
    const result = await new OpenAIProvider(decryptSecret(config.apiKeyEncrypted), config.model).complete({
        systemPrompt: config.systemPrompt,
        message: parsed.data.message,
        temperature: config.temperature,
        maxTokens: config.maxTokens
    });
    if (!result.ok) throw createError({statusCode: 502, statusMessage: result.error});
    return result.data;
});
