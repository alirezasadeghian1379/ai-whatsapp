import {requireSession} from "../../utils/auth";
import {db} from "../../utils/db";
import {assertPlanFeature} from "../../utils/plan";

export default defineEventHandler(async event => {
    const auth = await requireSession(event), userId = String(auth.sub),
        q = String(getQuery(event).search || "").trim();
    await assertPlanFeature(userId, "contacts");
    const contacts = await db.contact.findMany({
        where: {userId, ...(q ? {OR: [{name: {contains: q}}, {phone: {contains: q}}, {notes: {contains: q}}]} : {})},
        include: {_count: {select: {conversations: true}}},
        orderBy: [{lastInteractionAt: "desc"}, {createdAt: "desc"}],
        take: 300
    });
    return {contacts}
});
