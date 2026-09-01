import {requireSession} from "../../utils/auth";
import {db} from "../../utils/db";

export default defineEventHandler(async (event) => {
    const auth = await requireSession(event), query = getQuery(event), search = String(query.search || "").trim();
    const conversations = await db.conversation.findMany({
        where: {
            userId: String(auth.sub),
            isArchived: query.archived === "true", ...(search ? {contact: {OR: [{name: {contains: search}}, {phone: {contains: search}}]}} : {})
        },
        include: {
            contact: true,
            session: {select: {status: true, displayName: true}},
            messages: {orderBy: {createdAt: "desc"}, take: 1}
        },
        orderBy: [{isPinned: "desc"}, {lastMessageAt: "desc"}]
    });
    return {conversations: conversations.map(({messages, ...item}) => ({...item, lastMessage: messages[0] || null}))};
});
