import {requireSession} from "../../utils/auth";
import {db} from "../../utils/db";

export default defineEventHandler(async event => {
    const auth = await requireSession(event), userId = String(auth.sub), id = getRouterParam(event, "id")!;
    const contact = await db.contact.findFirst({
        where: {id, userId},
        include: {_count: {select: {conversations: true}}}
    });
    if (!contact) throw createError({statusCode: 404, statusMessage: "مخاطب پیدا نشد."});
    if (contact._count.conversations) throw createError({
        statusCode: 409,
        statusMessage: "این مخاطب دارای گفتگو است و برای حفظ تاریخچه قابل حذف نیست."
    });
    await db.contact.delete({where: {id}});
    await db.auditLog.create({data: {userId, action: "CONTACT_DELETED", entity: "Contact", entityId: id}});
    return {ok: true}
});
