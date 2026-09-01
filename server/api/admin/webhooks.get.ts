import {requireAdmin} from "../../utils/admin";
import {db} from "../../utils/db";

export default defineEventHandler(async event => {
    await requireAdmin(event);
    const webhooks = await db.webhook.findMany({
        include: {
            user: {select: {id: true, name: true, email: true}},
            deliveries: {select: {httpStatus: true, createdAt: true}, orderBy: {createdAt: "desc"}, take: 1},
            _count: {select: {deliveries: true}},
        },
        orderBy: {updatedAt: "desc"},
        take: 250,
    });
    return {webhooks};
});
