import {z} from "zod";
import {requireSession} from "../../utils/auth";
import {db} from "../../utils/db";
import {assertPlanFeature} from "../../utils/plan";

const schema = z.object({
    name: z.string().trim().max(100).nullable(),
    phone: z.string().trim().regex(/^\+?\d{7,15}$/),
    tags: z.array(z.string().trim().min(1).max(30)).max(20),
    notes: z.string().trim().max(2000).nullable()
});

export default defineEventHandler(async event => {
    const auth = await requireSession(event), userId = String(auth.sub), id = getRouterParam(event, "id") || "";
    await assertPlanFeature(userId, "contacts");
    const parsed = schema.safeParse(await readBody(event));
    if (!parsed.success) throw createError({statusCode: 422, statusMessage: "اطلاعات مخاطب معتبر نیست."});
    const exists = await db.contact.findFirst({where: {id, userId}});
    if (!exists) throw createError({statusCode: 404, statusMessage: "مخاطب پیدا نشد."});
    try {
        const contact = await db.contact.update({
            where: {id},
            data: {...parsed.data, phone: parsed.data.phone.replace(/^\+/, "")}
        });
        await db.auditLog.create({data: {userId, action: "CONTACT_UPDATED", entity: "Contact", entityId: id}});
        return {contact};
    } catch {
        throw createError({statusCode: 409, statusMessage: "این شماره برای مخاطب دیگری ثبت شده است."});
    }
});
