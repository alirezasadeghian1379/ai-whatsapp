import {getWhatsAppProvider} from "../../services/providers"
import {requireSession} from "../../utils/auth"
import {db} from "../../utils/db"
import {assertPlanFeature} from "../../utils/plan"

export default defineEventHandler(async event => {
    const auth = await requireSession(event), id = getRouterParam(event, "id") || ""
    await assertPlanFeature(String(auth.sub), "messages")
    const conversation = await db.conversation.findFirst({
        where: {id, userId: String(auth.sub)},
        include: {contact: true, session: true, messages: {orderBy: {createdAt: "asc"}, take: 200}}
    })
    if (!conversation) throw createError({statusCode: 404, statusMessage: "گفتگو پیدا نشد."})
    if (!conversation.unreadCount) return {conversation}

    const unread = conversation.messages.filter(message => message.direction === "INBOUND" && message.status === "RECEIVED")
    const messageIds = unread.flatMap(message => message.externalId ? [message.externalId] : [])
    if (conversation.session.status === "CONNECTED" && messageIds.length) {
        // The panel must remain responsive if WhatsApp is reconnecting, so the
        // provider receipt is best-effort while the local unread state is reliable.
        void getWhatsAppProvider().markRead(conversation.session.externalId, conversation.contact.phone, messageIds)
    }
    await db.$transaction([
        db.conversation.update({where: {id}, data: {unreadCount: 0}}),
        db.message.updateMany({where: {id: {in: unread.map(message => message.id)}}, data: {status: "READ"}})
    ])
    return {
        conversation: {
            ...conversation,
            unreadCount: 0,
            messages: conversation.messages.map(message => unread.some(item => item.id === message.id) ? {
                ...message,
                status: "READ"
            } : message)
        }
    }
})
