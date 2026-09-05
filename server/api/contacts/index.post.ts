import {z} from "zod";
import {requireSession} from "../../utils/auth";
import {db} from "../../utils/db";
import {assertPlanLimit} from "../../utils/plan";

const schema = z.object({
    name: z.string().trim().max(100).nullable().optional(),
    phone: z.string().trim().regex(/^\+?\d{7,15}$/),
    tags: z.array(z.string().trim().min(1).max(30)).max(20).default([]),
    notes: z.string().trim().max(2000).nullable().optional()
});
export default defineEventHandler(async event => {
    const auth = await requireSession(event), userId = String(auth.sub),
        parsed = schema.safeParse(await readBody(event));
    if (!parsed.success) throw createError({statusCode: 422, statusMessage: "اطلاعات مخاطب معتبر نیست."});
    await assertPlanLimit(userId, "contacts");
    const phone = parsed.data.phone.replace(/^\+/, "");
    try {
        const contact = await db.contact.create({
            data: {
                userId,
                name: parsed.data.name || null,
                phone,
                tags: parsed.data.tags,
                notes: parsed.data.notes || null
            }
        });
        await db.auditLog.create({data: {userId, action: "CONTACT_CREATED", entity: "Contact", entityId: contact.id}});
        return {contact}
    } catch {
        throw createError({statusCode: 409, statusMessage: "این شماره قبلاً در مخاطبان شما ثبت شده است."})
    }
});
