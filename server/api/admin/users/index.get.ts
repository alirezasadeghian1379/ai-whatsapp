import {requireAdmin} from "../../../utils/admin";
import {db} from "../../../utils/db";

export default defineEventHandler(async event => {
    await requireAdmin(event);
    const q = String(getQuery(event).search || "");
    return {
        users: await db.user.findMany({
            where: q ? {OR: [{name: {contains: q}}, {email: {contains: q}}, {phone: {contains: q}}]} : {},
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                status: true,
                createdAt: true,
                updatedAt: true,
                wallet: {select: {balance: true}},
                subscriptions: {where: {status: "ACTIVE"}, include: {plan: {select: {name: true, slug: true}}}, orderBy: {createdAt: "desc"}, take: 1},
                _count: {select: {whatsappSessions: true, conversations: true, orders: true, webhooks: true}}
            },
            orderBy: {createdAt: "desc"},
            take: 100
        })
    }
});
