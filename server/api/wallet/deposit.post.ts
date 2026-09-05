import {z} from "zod";
import {getPaymentProvider} from "../../services/providers";
import {requireSession} from "../../utils/auth";
import {db} from "../../utils/db";

const schema = z.object({
    amount: z.coerce.number().int().min(10_000).max(100_000_000)
});
export default defineEventHandler(async event => {
    const auth = await requireSession(event), p = schema.safeParse(await readBody(event));
    if (!p.success) throw createError({
        statusCode: 422,
        statusMessage: "مبلغ شارژ باید بین ۱۰ هزار تا ۱۰۰ میلیون تومان باشد."
    });
    const userId = String(auth.sub), deposit = await db.walletDeposit.create({data: {userId, amount: p.data.amount}});
    const callbackUrl = `${String(useRuntimeConfig().appUrl).replace(/\/$/, "")}/api/payments/callback`;
    const result = await getPaymentProvider("zarinpal").createPayment({
        orderId: deposit.id,
        amount: p.data.amount,
        callbackUrl
    });
    if (!result.ok) {
        await db.walletDeposit.update({where: {id: deposit.id}, data: {status: "FAILED"}});
        throw createError({statusCode: 502, statusMessage: "درگاه پرداخت در دسترس نیست؛ لطفاً دوباره تلاش کنید."})
    }
    await db.payment.create({
        data: {
            walletDepositId: deposit.id,
            provider: "zarinpal",
            authority: result.data.authority,
            amount: p.data.amount,
            status: "PENDING"
        }
    });
    return {redirectUrl: result.data.redirectUrl}
});
