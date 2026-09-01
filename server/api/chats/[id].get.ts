import {requireSession} from "../../utils/auth";
import {db} from "../../utils/db";

export default defineEventHandler(async (event) => {
    const auth = await requireSession(event), id = getRouterParam(event, "id") || "";
    const conversation = await db.conversation.findFirst({
        where: {id, userId: String(auth.sub)},
        include: {contact: true, session: true, messages: {orderBy: {createdAt: "asc"}, take: 200}}
    });
    if (!conversation) throw createError({statusCode: 404, statusMessage: "گفتگو پیدا نشد."});
    if (conversation.unreadCount) await db.conversation.update({where: {id}, data: {unreadCount: 0}});
    return {conversation: {...conversation, unreadCount: 0}};
});
