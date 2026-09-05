import {requireSession} from "../../utils/auth";
import {db} from "../../utils/db";
import {assertPlanFeature} from "../../utils/plan";

export default defineEventHandler(async (event) => {
    const auth = await requireSession(event);
    await assertPlanFeature(String(auth.sub), "ai");
    const config = await db.aIConfiguration.findFirst({where: {userId: String(auth.sub)}});
    return {
        config: config ? {
            ...config,
            provider: "groq",
            model: config.provider === "groq" ? config.model : "openai/gpt-oss-20b",
            isEnabled: config.provider === "groq" && config.isEnabled,
            autoReply: config.provider === "groq" && config.autoReply,
            voiceReplyEnabled: config.provider === "groq" && config.voiceReplyEnabled,
            apiKeyEncrypted: undefined,
            hasApiKey: config.provider === "groq" && !!config.apiKeyEncrypted
        } : null
    };
});
