import {requireSession} from "../../utils/auth";
import {db} from "../../utils/db";
import {assertPlanFeature} from "../../utils/plan";

export default defineEventHandler(async (event) => {
    const auth = await requireSession(event);
    const userId = String(auth.sub);
    await assertPlanFeature(userId, "ai");
    const query = getQuery(event);
    const sessionId = typeof query.sessionId === "string" && query.sessionId ? query.sessionId : null;

    if (sessionId) {
        const session = await db.whatsAppSession.findFirst({
            where: { id: sessionId, userId }
        });
        if (!session) throw createError({ statusCode: 404, statusMessage: "اتصال واتساپ یافت نشد." });
    }

    const config = await db.aIConfiguration.findFirst({
        where: sessionId ? { userId, sessionId } : { userId, sessionId: null }
    });

    const sessions = await db.whatsAppSession.findMany({
        where: { userId },
        select: { id: true, displayName: true, phoneNumber: true, status: true },
        orderBy: { createdAt: "desc" }
    });

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
        } : null,
        sessions
    };
});
