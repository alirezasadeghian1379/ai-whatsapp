import {z} from "zod";
import {getPaymentProvider} from "../../services/providers";
import {requireSession} from "../../utils/auth";
import {db} from "../../utils/db";

const schema = z.object({planId: z.string().min(1), provider: z.enum(["mock", "zarinpal"]).optional()});
export default defineEventHandler(async event => {
    const auth = await requireSession(event), parsed = schema.safeParse(await readBody(event));
    if (!parsed.success) throw createError({statusCode: 422, statusMessage: "درخواست پرداخت معتبر نیست."});
    const plan = await db.plan.findFirst({where: {id: parsed.data.planId, isActive: true}});
    if (!plan) throw createError({statusCode: 404, statusMessage: "پلن انتخاب‌شده پیدا نشد."});
    const userId = String(auth.sub), amount = Number(plan.price);
    const active = await db.subscription.findFirst({
        where: {
            userId,
            status: "ACTIVE",
            OR: [{endsAt: null}, {endsAt: {gt: new Date()}}]
        }, include: {plan: true}
    });
    if (active?.planId === plan.id) throw createError({
        statusCode: 409,
        statusMessage: "این پلن در حال حاضر برای شما فعال است."
    });
    if (amount === 0) {
        if (active && Number(active.plan.price) > 0) throw createError({
            statusCode: 409,
            statusMessage: "با داشتن اشتراک پولی امکان فعال‌سازی پلن رایگان وجود ندارد."
        });
        if (await db.subscription.count({where: {userId, plan: {slug: "free"}}})) throw createError({
            statusCode: 409,
            statusMessage: "پلن رایگان فقط یک‌بار قابل فعال‌سازی است."
        });
        const now = new Date(), endsAt = new Date(now.getTime() + plan.durationDays * 86400000);
        await db.$transaction([db.subscription.updateMany({
            where: {userId, status: "ACTIVE"},
            data: {status: "CANCELLED"}
        }), db.subscription.create({
            data: {
                userId,
                planId: plan.id,
                status: "ACTIVE",
                startsAt: now,
                endsAt
            }
        }), db.notification.create({
            data: {
                userId,
                type: "subscription.activated",
                title: "اشتراک فعال شد",
                body: `پلن ${plan.name} برای شما فعال شد.`,
                href: "/dashboard/subscription"
            }
        })]);
        return {redirectUrl: "/dashboard/subscription?payment=success", activated: true};
    }
    const providerName = parsed.data.provider || String(useRuntimeConfig().paymentProvider || "mock");
    const order = await db.order.create({data: {userId, planId: plan.id, amount, status: "PENDING"}});
    const payment = await getPaymentProvider(providerName).createPayment({
        orderId: order.id,
        amount,
        callbackUrl: useRuntimeConfig().paymentCallbackUrl
    });
    if (!payment.ok) {
        await db.order.update({where: {id: order.id}, data: {status: "FAILED"}});
        throw createError({
            statusCode: 502,
            statusMessage: "درگاه پرداخت در دسترس نیست؛ لطفاً کمی بعد دوباره تلاش کنید."
        })
    }
    await db.payment.create({
        data: {
            orderId: order.id,
            provider: providerName,
            authority: payment.data.authority,
            amount,
            status: "PENDING"
        }
    });
    return {redirectUrl: payment.data.redirectUrl};
});
