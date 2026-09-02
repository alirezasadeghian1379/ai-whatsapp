import {requireSession} from "../../../utils/auth";
import {db} from "../../../utils/db";
import {assertPlanFeature} from "../../../utils/plan";

export default defineEventHandler(async event => {
    const auth = await requireSession(event);
    await assertPlanFeature(String(auth.sub), "sms");
    const configurations = await db.smsConfiguration.findMany({
        where: {userId: String(auth.sub)},
        select: {
            id: true,
            title: true,
            provider: true,
            sender: true,
            isDefault: true,
            isEnabled: true,
            createdAt: true
        },
        orderBy: {createdAt: "desc"}
    });
    return {
        configurations,
        providers: [{id: "mock", name: "آزمایشی"}, {id: "kavenegar", name: "کاوه‌نگار"}, {
            id: "melipayamak",
            name: "ملی پیامک"
        }, {id: "farazsms", name: "فراز اس‌ام‌اس"}]
    }
});
