import {db} from "./db";

export type PlanLimit = "whatsapp" | "webhooks" | "messages" | "ai" | "contacts";

export async function assertPlanLimit(userId: string, limit: PlanLimit) {
    const user = await db.user.findUnique({where: {id: userId}, select: {role: true}});
    if (user && ["ADMIN", "SUPER_ADMIN"].includes(user.role)) return;
    const subscription = await db.subscription.findFirst({
        where: {
            userId,
            status: "ACTIVE",
            OR: [{endsAt: null}, {endsAt: {gt: new Date()}}]
        }, include: {plan: true}, orderBy: {endsAt: "desc"}
    });
    if (!subscription) throw createError({
        statusCode: 402,
        statusMessage: "برای استفاده از این قابلیت به اشتراک فعال نیاز دارید."
    });
    let used = 0, max = 0;
    if (limit === "whatsapp") {
        used = await db.whatsAppSession.count({where: {userId}});
        max = subscription.plan.maxWhatsAppConnections
    } else if (limit === "webhooks") {
        used = await db.webhook.count({where: {userId}});
        max = subscription.plan.maxWebhooks
    } else if (limit === "contacts") {
        used = await db.contact.count({where: {userId}});
        max = subscription.plan.maxContacts;
    } else {
        const start = new Date();
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        if (limit === "messages") {
            used = await db.message.count({where: {conversation: {userId}, createdAt: {gte: start}}});
            max = subscription.plan.maxMessages
        } else {
            used = (await db.usage.findFirst({where: {userId, periodStart: {gte: start}}}))?.aiRequests || 0;
            max = subscription.plan.maxAIRequests
        }
    }
    if (used >= max) throw createError({
        statusCode: 429,
        statusMessage: "سقف مجاز پلن شما برای این دوره تکمیل شده است."
    })
}
