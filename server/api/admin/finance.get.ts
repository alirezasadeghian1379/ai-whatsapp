import {requireAdmin} from "../../utils/admin";
import {db} from "../../utils/db";

export default defineEventHandler(async event => {
    await requireAdmin(event);
    const [wallets, payments, deposits] = await Promise.all([db.wallet.findMany({
        include: {
            user: {
                select: {
                    name: true,
                    email: true
                }
            }, transactions: {orderBy: {createdAt: "desc"}, take: 3}
        }, orderBy: {balance: "desc"}, take: 100
    }), db.payment.findMany({
        include: {
            order: {include: {user: {select: {name: true, email: true}}, plan: true}},
            walletDeposit: {include: {user: {select: {name: true, email: true}}}}
        }, orderBy: {createdAt: "desc"}, take: 100
    }), db.walletDeposit.findMany({
        include: {user: {select: {name: true, email: true}}},
        orderBy: {createdAt: "desc"},
        take: 100
    })]);
    return {wallets, payments, deposits}
});
