import {requireSession} from "../utils/auth";
import {db} from "../utils/db";

export default defineEventHandler(async (event) => {
    const auth = await requireSession(event), userId = String(auth.sub), now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const [subscription, orders, monthlyUsage, plans, freeCount, whatsappConnections, contacts, messagesSent] = await Promise.all([db.subscription.findFirst({
        where: {
            userId,
            status: "ACTIVE",
            OR: [{endsAt: null}, {endsAt: {gt: now}}]
        }, include: {plan: true}, orderBy: {createdAt: "desc"}
    }), db.order.findMany({
        where: {userId},
        include: {plan: true, payments: true},
        orderBy: {createdAt: "desc"},
        take: 20
    }), db.usage.findFirst({
        where: {userId, periodStart: {gte: periodStart}},
        orderBy: {periodStart: "desc"}
    }), db.plan.findMany({where: {isActive: true}, orderBy: {sortOrder: "asc"}}), db.subscription.count({
        where: {
            userId,
            plan: {slug: "free"}
        }
    }), db.whatsAppSession.count({where: {userId}}), db.contact.count({where: {userId}}), db.message.count({
        where: {conversation: {userId}, direction: "OUTBOUND", createdAt: {gte: periodStart}}
    })]);
    const usage = {
        whatsappConnections,
        contacts,
        messagesSent,
        aiRequests: monthlyUsage?.aiRequests || 0,
        periodStart,
        periodEnd: new Date(now.getFullYear(), now.getMonth() + 1, 1)
    };
    return {subscription, orders, usage, plans, freeUsed: freeCount > 0};
});
