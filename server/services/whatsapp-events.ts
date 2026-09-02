import {db} from "../utils/db";

export interface IncomingWhatsAppMessage {
    externalId: string;
    messageId?: string | null;
    remoteJid: string;
    originalJid?: string;
    fromMe: boolean;
    source?: "ADMIN" | "AI" | "WHATSAPP" | "CONTACT";
    pushName?: string | null;
    body: string;
    type?: "text" | "image" | "document";
    mediaUrl?: string | null;
    timestamp?: number;
}

export async function recordWhatsAppMessage(input: IncomingWhatsAppMessage) {
    if (!input.remoteJid || input.remoteJid.endsWith("@g.us") || input.remoteJid === "status@broadcast") return;
    const session = await db.whatsAppSession.findUnique({where: {externalId: input.externalId}});
    if (!session) return;
    const phone = (input.remoteJid.split("@")[0] || "").replace(/\D/g, "");
    if (!phone || !input.body.trim()) return;
    const at = input.timestamp ? new Date(input.timestamp * 1000) : new Date();
    if (input.originalJid?.endsWith("@lid") && input.originalJid !== input.remoteJid) {
        const oldContact = await db.contact.findFirst({where: {userId: session.userId, whatsappId: input.originalJid}});
        const correctContact = await db.contact.findUnique({where: {userId_phone: {userId: session.userId, phone}}});
        if (oldContact && !correctContact) await db.contact.update({
            where: {id: oldContact.id},
            data: {phone, whatsappId: input.remoteJid}
        });
    }
    const contact = await db.contact.upsert({
        where: {userId_phone: {userId: session.userId, phone}},
        update: {name: input.pushName || undefined, whatsappId: input.remoteJid, lastInteractionAt: at},
        create: {
            userId: session.userId,
            phone,
            name: input.pushName || null,
            whatsappId: input.remoteJid,
            lastInteractionAt: at
        },
    });
    const conversation = await db.conversation.upsert({
        where: {sessionId_contactId: {sessionId: session.id, contactId: contact.id}},
        update: {lastMessageAt: at, unreadCount: input.fromMe ? undefined : {increment: 1}},
        create: {
            userId: session.userId,
            sessionId: session.id,
            contactId: contact.id,
            lastMessageAt: at,
            unreadCount: input.fromMe ? 0 : 1
        },
    });
    const data = {
        conversationId: conversation.id,
        externalId: input.messageId || null,
        direction: input.fromMe ? "OUTBOUND" : "INBOUND",
        source: input.source || (input.fromMe ? "WHATSAPP" : "CONTACT"),
        type: input.type || "text",
        body: input.body,
        mediaUrl: input.mediaUrl || null,
        status: input.fromMe ? "SENT" : "RECEIVED",
        sentAt: at
    };
    const saved = input.messageId
        ? await db.message.upsert({where: {externalId: input.messageId}, update: {status: data.status, type: data.type, mediaUrl: data.mediaUrl || undefined}, create: data})
        : await db.message.create({data});
    if (!input.fromMe) {
        const {dispatchUserWebhooks, runAutoReply} = await import("./automations");
        void dispatchUserWebhooks(session.userId, "message.received", {
            messageId: saved.id,
            conversationId: conversation.id,
            contact: {id: contact.id, phone, name: contact.name},
            body: input.body
        });
        void runAutoReply({
            userId: session.userId,
            sessionExternalId: session.externalId,
            conversationId: conversation.id,
            phone,
            message: input.body
        });
    }
    return {message: saved, conversation, contact};
}
