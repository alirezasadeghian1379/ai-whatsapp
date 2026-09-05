import {z} from "zod";
import {sendContactEmail} from "../services/mail";
import {db} from "../utils/db";

const schema = z.object({
    name: z.string().trim().min(2).max(80),
    email: z.string().trim().email().max(160),
    subject: z.string().trim().min(3).max(120),
    message: z.string().trim().min(10).max(4000)
});
export default defineEventHandler(async event => {
    const parsed = schema.safeParse(await readBody(event));
    if (!parsed.success) throw createError({statusCode: 422, statusMessage: "اطلاعات فرم تماس کامل یا معتبر نیست."});
    await sendContactEmail(parsed.data);
    await db.auditLog.create({
        data: {
            action: "CONTACT_MESSAGE_SENT",
            entity: "ContactForm",
            ipAddress: getRequestIP(event, {xForwardedFor: true}),
            metadata: {email: parsed.data.email, subject: parsed.data.subject}
        }
    });
    return {ok: true}
});
