import {requireSession} from "../utils/auth";
import {db} from "../utils/db";
import {getPlanAccess} from "../utils/plan";

export default defineEventHandler(async (event) => {
    const auth = await requireSession(event), userId = String(auth.sub), start = new Date();
    start.setHours(0, 0, 0, 0);
    const month = new Date(start.getFullYear(), start.getMonth(), 1);
    const [sessions, today, monthly, conversations, ai, subscription, usage, recent, access] = await Promise.all([
        db.whatsAppSession.findMany({where: {userId}, orderBy: {updatedAt: "desc"}}),
        db.message.count({where: {conversation: {userId}, createdAt: {gte: start}}}),
        db.message.count({where: {conversation: {userId}, createdAt: {gte: month}}}),
        db.conversation.count({where: {userId, isArchived: false}}),
        db.aIConfiguration.findFirst({where: {userId}}),
        db.subscription.findFirst({
            where: {userId, status: "ACTIVE", OR: [{endsAt: null}, {endsAt: {gt: new Date()}}]},
            include: {plan: true},
            orderBy: {endsAt: "desc"}
        }),
        db.usage.findFirst({where: {userId, periodStart: {gte: month}}, orderBy: {periodStart: "desc"}}),
        db.message.findMany({
            where: {conversation: {userId}},
            include: {conversation: {include: {contact: true}}},
            orderBy: {createdAt: "desc"},
            take: 5
        }),
        getPlanAccess(userId)
    ]);
    return {
        sessions: {
            total: sessions.length,
            connected: sessions.filter(x => x.status === "CONNECTED").length,
            limit: subscription?.plan.maxWhatsAppConnections || 0,
            primary: sessions.find(x => x.status === "CONNECTED") || sessions[0] || null
        },
        messages: {today, monthly},
        conversations,
        ai: {enabled: !!ai?.isEnabled, requests: usage?.aiRequests || 0},
        access,
        subscription,
        usage,
        recent: recent.map(x => ({
            id: x.id,
            body: x.body,
            direction: x.direction,
            contact: x.conversation.contact.name || x.conversation.contact.phone,
            createdAt: x.createdAt
        }))
    };
});
