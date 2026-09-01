import {db} from "../../utils/db";
import {whatsappStatus} from "../../utils/whatsapp";
import {dispatchUserWebhooks, runAutoReply} from "../../services/automations";

type EvolutionWebhook = { event?: string; instance?: string; data?: any };

function messageText(message: any): string | null {
    return message?.conversation ?? message?.extendedTextMessage?.text ?? message?.imageMessage?.caption ?? message?.videoMessage?.caption ?? null;
}

export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig();
    const suppliedSecret = getHeader(event, "x-webhook-secret");
    if (!config.whatsappWebhookSecret || suppliedSecret !== config.whatsappWebhookSecret) throw createError({
        statusCode: 401,
        statusMessage: "Webhook unauthorized"
    });
    const payload = await readBody<EvolutionWebhook>(event);
    const externalId = payload.instance;
    if (!externalId) throw createError({statusCode: 400, statusMessage: "Invalid webhook payload"});
    const session = await db.whatsAppSession.findUnique({where: {externalId}});
    if (!session) return {received: true};
    const eventName = String(payload.event || "").replace(/\./g, "_").toUpperCase();
    if (eventName === "CONNECTION_UPDATE") {
        const status = whatsappStatus(String(payload.data?.state ?? payload.data?.status ?? "connecting"));
        await db.whatsAppSession.update({
            where: {id: session.id},
            data: {
                status,
                phoneNumber: payload.data?.wuid?.split("@")[0] ?? session.phoneNumber,
                connectedAt: status === "CONNECTED" ? (session.connectedAt ?? new Date()) : session.connectedAt,
                lastSeenAt: new Date()
            }
        });
        if (status !== session.status) await db.notification.create({
            data: {
                userId: session.userId,
                type: status === "CONNECTED" ? "whatsapp.connected" : "whatsapp.disconnected",
                title: status === "CONNECTED" ? "واتساپ متصل شد" : "اتصال واتساپ قطع شد",
                body: session.displayName || session.phoneNumber,
                href: "/dashboard/whatsapp"
            }
        });
        void dispatchUserWebhooks(session.userId, status === "CONNECTED" ? "whatsapp.connected" : "whatsapp.disconnected", {
            sessionId: session.id,
            status
        });
    }
    if (eventName === "MESSAGES_UPSERT") {
        const item = Array.isArray(payload.data) ? payload.data[0] : payload.data;
        const key = item?.key;
        const remoteJid = String(key?.remoteJid ?? "");
        if (remoteJid && !remoteJid.endsWith("@g.us") && remoteJid !== "status@broadcast") {
            const phone = (remoteJid.split("@")[0] || "").replace(/\D/g, "");
            const body = messageText(item?.message);
            if (phone && body) {
                const contact = await db.contact.upsert({
                    where: {userId_phone: {userId: session.userId, phone}},
                    update: {name: item?.pushName || undefined, whatsappId: remoteJid, lastInteractionAt: new Date()},
                    create: {
                        userId: session.userId,
                        phone,
                        name: item?.pushName || null,
                        whatsappId: remoteJid,
                        lastInteractionAt: new Date()
                    }
                });
                const conversation = await db.conversation.upsert({
                    where: {
                        sessionId_contactId: {
                            sessionId: session.id,
                            contactId: contact.id
                        }
                    },
                    update: {lastMessageAt: new Date(), unreadCount: key?.fromMe ? undefined : {increment: 1}},
                    create: {
                        userId: session.userId,
                        sessionId: session.id,
                        contactId: contact.id,
                        lastMessageAt: new Date(),
                        unreadCount: key?.fromMe ? 0 : 1
                    }
                });
                const data = {
                    conversationId: conversation.id,
                    externalId: key?.id || null,
                    direction: key?.fromMe ? "OUTBOUND" : "INBOUND",
                    body,
                    status: key?.fromMe ? "SENT" : "RECEIVED",
                    sentAt: new Date(Number(item?.messageTimestamp || 0) * 1000 || Date.now())
                };
                const saved = key?.id ? await db.message.upsert({
                    where: {externalId: key.id},
                    update: {status: data.status},
                    create: data
                }) : await db.message.create({data});
                if (!key?.fromMe) {
                    void dispatchUserWebhooks(session.userId, "message.received", {
                        messageId: saved.id,
                        conversationId: conversation.id,
                        contact: {id: contact.id, phone, name: contact.name},
                        body
                    });
                    void runAutoReply({
                        userId: session.userId,
                        sessionExternalId: session.externalId,
                        conversationId: conversation.id,
                        phone,
                        message: body
                    });
                }
            }
        }
    }
    return {received: true};
});
