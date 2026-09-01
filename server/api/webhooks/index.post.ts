import {z} from "zod";
import {requireSession} from "../../utils/auth";
import {encryptSecret} from "../../utils/crypto";
import {db} from "../../utils/db";

const events = ["message.received", "message.sent", "message.failed", "whatsapp.connected", "whatsapp.disconnected", "contact.created", "contact.updated"] as const;
const schema = z.object({
    name: z.string().trim().min(2).max(80),
    url: z.string().url().refine(v => ["http:", "https:"].includes(new URL(v).protocol)),
    events: z.array(z.enum(events)).min(1)
});
export default defineEventHandler(async (event) => {
    const auth = await requireSession(event), parsed = schema.safeParse(await readBody(event));
    if (!parsed.success) throw createError({statusCode: 422, statusMessage: "اطلاعات وب‌هوک معتبر نیست."});
    const secret = `whsec_${crypto.randomUUID().replace(/-/g, "")}`;
    const hook = await db.webhook.create({
        data: {
            userId: String(auth.sub), ...parsed.data,
            secretEncrypted: encryptSecret(secret)
        }
    });
    return {webhook: {...hook, secretEncrypted: undefined}, secret};
});
