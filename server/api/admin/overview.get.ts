import {requireAdmin} from "../../utils/admin";
import {db} from "../../utils/db";

function dateKey(date: Date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export default defineEventHandler(async event => {
    await requireAdmin(event);
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

    const [users, activeUsers, newUsersThisMonth, subscriptions, connectedSessions, allSessions, messagesToday,
        messagesThisMonth, failedMessagesToday, aiThisMonth, revenue, monthlyRevenue, pendingPayments,
        recentUsers, recentPayments, recentActivity, weeklyUsers, weeklyPayments] = await Promise.all([
        db.user.count(),
        db.user.count({where: {status: "ACTIVE"}}),
        db.user.count({where: {createdAt: {gte: monthStart}}}),
        db.subscription.count({where: {status: "ACTIVE", OR: [{endsAt: null}, {endsAt: {gt: now}}]}}),
        db.whatsAppSession.count({where: {status: "CONNECTED"}}),
        db.whatsAppSession.count(),
        db.message.count({where: {createdAt: {gte: today}}}),
        db.message.count({where: {createdAt: {gte: monthStart}}}),
        db.message.count({where: {createdAt: {gte: today}, status: "FAILED"}}),
        db.usage.aggregate({_sum: {aiRequests: true}, where: {periodStart: {gte: monthStart}}}),
        db.payment.aggregate({_sum: {amount: true}, where: {status: "SUCCESS"}}),
        db.payment.aggregate({_sum: {amount: true}, where: {status: "SUCCESS", createdAt: {gte: monthStart}}}),
        db.payment.count({where: {status: "PENDING"}}),
        db.user.findMany({
            orderBy: {createdAt: "desc"}, take: 7,
            select: {
                id: true, name: true, email: true, role: true, status: true, createdAt: true,
                subscriptions: {
                    where: {status: "ACTIVE", OR: [{endsAt: null}, {endsAt: {gt: now}}]},
                    orderBy: {createdAt: "desc"}, take: 1,
                    select: {endsAt: true, plan: {select: {name: true}}}
                }
            }
        }),
        db.payment.findMany({
            orderBy: {createdAt: "desc"}, take: 7,
            select: {
                id: true, amount: true, status: true, provider: true, createdAt: true,
                order: {select: {user: {select: {id: true, name: true, email: true}}, plan: {select: {name: true}}}},
                walletDeposit: {select: {user: {select: {id: true, name: true, email: true}}}}
            }
        }),
        db.auditLog.findMany({
            orderBy: {createdAt: "desc"}, take: 8,
            select: {id: true, action: true, entity: true, entityId: true, createdAt: true, user: {select: {name: true, email: true}}}
        }),
        db.user.findMany({where: {createdAt: {gte: sevenDaysAgo}}, select: {createdAt: true}}),
        db.payment.findMany({where: {status: "SUCCESS", createdAt: {gte: sevenDaysAgo}}, select: {createdAt: true, amount: true}})
    ]);

    const days = Array.from({length: 7}, (_, index) => {
        const date = new Date(sevenDaysAgo);
        date.setDate(date.getDate() + index);
        return {key: dateKey(date), date, users: 0, revenue: 0};
    });
    const byDay = new Map(days.map(day => [day.key, day]));
    for (const user of weeklyUsers) byDay.get(dateKey(user.createdAt))!.users++;
    for (const payment of weeklyPayments) byDay.get(dateKey(payment.createdAt))!.revenue += Number(payment.amount);

    return {
        summary: {
            users, activeUsers, newUsersThisMonth, subscriptions,
            connectedSessions, allSessions, messagesToday, messagesThisMonth,
            failedMessagesToday, aiThisMonth: aiThisMonth._sum.aiRequests || 0,
            revenue: Number(revenue._sum.amount || 0), monthlyRevenue: Number(monthlyRevenue._sum.amount || 0),
            pendingPayments
        },
        recentUsers: recentUsers.map(({subscriptions, ...user}) => ({
            ...user,
            subscription: subscriptions[0] ? {planName: subscriptions[0].plan.name, endsAt: subscriptions[0].endsAt} : null
        })),
        recentPayments: recentPayments.map(payment => ({
            id: payment.id,
            amount: Number(payment.amount),
            status: payment.status,
            provider: payment.provider,
            createdAt: payment.createdAt,
            kind: payment.order ? "subscription" : "wallet",
            planName: payment.order?.plan.name || null,
            user: payment.order?.user || payment.walletDeposit?.user || null
        })),
        recentActivity,
        trends: days
    };
});
