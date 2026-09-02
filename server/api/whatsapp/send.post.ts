import {z} from "zod";
import {getWhatsAppProvider} from "../../services/providers";
import {recordWhatsAppMessage} from "../../services/whatsapp-events";
import {dispatchUserWebhooks} from "../../services/automations";
import {ownedWhatsAppSession} from "../../utils/whatsapp";
import {assertPlanLimit} from "../../utils/plan";

const schema = z.object({
    sessionId: z.string().min(1),
    to: z.string().transform((value) => value.replace(/\D/g, "")).pipe(z.string().min(8).max(16)),
    body: z.string().trim().min(1).max(4096)
});

export default defineEventHandler(async (event) => {
    const parsed = schema.safeParse(await readBody(event));
    if (!parsed.success) throw createError({statusCode: 422, statusMessage: "شماره مقصد یا متن پیام معتبر نیست."});
    const session = await ownedWhatsAppSession(event, parsed.data.sessionId);
    await assertPlanLimit(session.userId, "messages");
    if (session.status !== "CONNECTED") throw createError({
        statusCode: 409,
        statusMessage: "ابتدا واتساپ را متصل کنید."
    });
    const result = await getWhatsAppProvider().sendMessage(session.externalId, parsed.data.to, parsed.data.body);
    if (!result.ok) throw createError({statusCode: 502, statusMessage: result.error});
    // Outbound messages must create the contact/conversation too; previously
    // this only happened after the recipient sent an inbound message.
    const recorded = await recordWhatsAppMessage({
        externalId: session.externalId,
        messageId: result.data.messageId,
        remoteJid: `${parsed.data.to}@s.whatsapp.net`,
        fromMe: true,
        source: "ADMIN",
        body: parsed.data.body,
        timestamp: Math.floor(Date.now() / 1000)
    });
    if (recorded) void dispatchUserWebhooks(session.userId, "message.sent", {
        messageId: recorded.message.id,
        conversationId: recorded.conversation.id,
        phone: parsed.data.to,
        body: parsed.data.body
    });
    return {success: true, messageId: result.data.messageId, conversationId: recorded?.conversation.id};
});
