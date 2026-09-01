import {getPaymentProvider} from "../../services/providers";
import {db} from "../../utils/db";

export default defineEventHandler(async event => {
    const q = getQuery(event), authority = String(q.Authority || q.authority || ""),
        status = String(q.Status || q.status || "");
    if (!authority) return sendRedirect(event, "/payment-result?status=failed&reason=missing");
    const payment = await db.payment.findUnique({
        where: {authority},
        include: {order: {include: {plan: true}}, walletDeposit: true}
    });
    if (!payment) return sendRedirect(event, "/payment-result?status=failed&reason=not-found");
    const walletReturn = payment.walletDepositId ? "&target=wallet" : "";
    if (payment.status === "SUCCESS") return sendRedirect(event, `/payment-result?status=success${walletReturn}`);
    if (status.toUpperCase() !== "OK") {
        await db.$transaction(async tx => {
            await tx.payment.update({where: {id: payment.id}, data: {status: "CANCELLED"}});
            if (payment.orderId) await tx.order.update({where: {id: payment.orderId}, data: {status: "CANCELLED"}});
            if (payment.walletDepositId) await tx.walletDeposit.update({
                where: {id: payment.walletDepositId},
                data: {status: "CANCELLED"}
            })
        });
        return sendRedirect(event, `/payment-result?status=cancelled${walletReturn}`);
    }
    const verified = await getPaymentProvider(payment.provider).verify(authority, Number(payment.amount));
    if (!verified.ok) return sendRedirect(event, `/payment-result?status=failed&reason=verify${walletReturn}`);
    if (payment.walletDeposit) {
        await db.$transaction(async tx => {
            const fresh = await tx.payment.findUnique({where: {id: payment.id}});
            if (fresh?.status === "SUCCESS") return;
            const wallet = await tx.wallet.upsert({
                where: {userId: payment.walletDeposit!.userId},
                update: {},
                create: {userId: payment.walletDeposit!.userId}
            });
            const balance = Number(wallet.balance) + Number(payment.amount);
            await tx.payment.update({
                where: {id: payment.id},
                data: {status: "SUCCESS", reference: verified.data.reference}
            });
            await tx.walletDeposit.update({where: {id: payment.walletDepositId!}, data: {status: "SUCCESS"}});
            await tx.wallet.update({where: {id: wallet.id}, data: {balance}});
            await tx.walletTransaction.create({
                data: {
                    walletId: wallet.id,
                    type: "DEPOSIT",
                    amount: payment.amount,
                    balanceAfter: balance,
                    description: "شارژ کیف پول",
                    reference: verified.data.reference
                }
            });
            await tx.notification.create({
                data: {
                    userId: payment.walletDeposit!.userId,
                    type: "wallet.deposit",
                    title: "کیف پول شارژ شد",
                    body: `مبلغ ${Number(payment.amount).toLocaleString("fa-IR")} تومان به کیف پول اضافه شد.`,
                    href: "/dashboard/wallet"
                }
            })
        });
        return sendRedirect(event, "/payment-result?status=success&target=wallet");
    }
    if (!payment.order) return sendRedirect(event, "/payment-result?status=failed&reason=invalid");
    const now = new Date(), endsAt = new Date(now.getTime() + payment.order.plan.durationDays * 86400000),
        userId = payment.order.userId;
    await db.$transaction([db.payment.update({
        where: {id: payment.id},
        data: {status: "SUCCESS", reference: verified.data.reference}
    }), db.order.update({
        where: {id: payment.order.id},
        data: {status: "PAID"}
    }), db.subscription.updateMany({
        where: {userId, status: "ACTIVE"},
        data: {status: "CANCELLED"}
    }), db.subscription.create({
        data: {
            userId,
            planId: payment.order.planId,
            status: "ACTIVE",
            startsAt: now,
            endsAt
        }
    }), db.notification.create({
        data: {
            userId,
            type: "subscription.activated",
            title: "پرداخت موفق",
            body: `پلن ${payment.order.plan.name} فعال شد.`,
            href: "/dashboard/subscription"
        }
    })]);
    return sendRedirect(event, "/payment-result?status=success");
});
