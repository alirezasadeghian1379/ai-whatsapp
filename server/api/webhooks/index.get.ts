import {requireSession} from "../../utils/auth";
import {db} from "../../utils/db";
import {assertPlanFeature} from "../../utils/plan";

export default defineEventHandler(async (event) => {
    const auth = await requireSession(event);
    await assertPlanFeature(String(auth.sub), "webhooks");
    const hooks = await db.webhook.findMany({
        where: {userId: String(auth.sub)},
        include: {deliveries: {orderBy: {createdAt: "desc"}, take: 1}},
        orderBy: {createdAt: "desc"}
    });
    return {
        webhooks: hooks.map(({deliveries, ...hook}) => ({
            ...hook,
            secretEncrypted: undefined,
            events: hook.events,
            lastDelivery: deliveries[0] || null
        }))
    };
});
