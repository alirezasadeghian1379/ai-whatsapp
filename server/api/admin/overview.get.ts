import {requireAdmin} from "../../utils/admin";
import {db} from "../../utils/db";

export default defineEventHandler(async event => {
    await requireAdmin(event);
    const [users, activeUsers, subscriptions, revenue, sessions, messages, ai, webhooks] = await Promise.all([db.user.count(), db.user.count({where: {status: "ACTIVE"}}), db.subscription.count({where: {status: "ACTIVE"}}), db.payment.aggregate({
        _sum: {amount: true},
        where: {status: "SUCCESS"}
    }), db.whatsAppSession.count({where: {status: "CONNECTED"}}), db.message.count(), db.usage.aggregate({_sum: {aiRequests: true}}), db.webhook.count({where: {status: "ACTIVE"}})]);
    return {
        users,
        activeUsers,
        subscriptions,
        revenue: Number(revenue._sum.amount || 0),
        sessions,
        messages,
        ai: ai._sum.aiRequests || 0,
        webhooks
    }
});
