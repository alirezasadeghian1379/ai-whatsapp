import {z} from "zod";
import {requireSession} from "../../utils/auth";
import {db} from "../../utils/db";
import {getSmsProvider} from "../../services/sms";

const schema = z.object({
    configurationId: z.string().optional(),
    to: z.string().regex(/^(?:\+98|0098|98|0)?9\d{9}$/),
    body: z.string().trim().min(1).max(1000)
});
export default defineEventHandler(async event => {
    const auth = await requireSession(event), userId = String(auth.sub), p = schema.safeParse(await readBody(event));
    if (!p.success) throw createError({statusCode: 422, statusMessage: "شماره موبایل یا متن پیام معتبر نیست."});
    const configuration = await db.smsConfiguration.findFirst({
        where: {
            userId,
            isEnabled: true, ...(p.data.configurationId ? {id: p.data.configurationId} : {isDefault: true})
        }
    });
    if (!configuration) throw createError({
        statusCode: 409,
        statusMessage: "ابتدا یک پنل پیامکی فعال و پیش‌فرض انتخاب کنید."
    });
    const phone = `98${p.data.to.replace(/\D/g, "").replace(/^(0098|98|0)/, "")}`;
    const queued = await db.smsMessage.create({
        data: {
            userId,
            configurationId: configuration.id,
            to: phone,
            body: p.data.body
        }
    });
    const result = await getSmsProvider(configuration).send({
        to: phone,
        body: p.data.body,
        sender: configuration.sender
    });
    if (!result.ok) {
        await db.smsMessage.update({where: {id: queued.id}, data: {status: "FAILED", error: result.error}});
        throw createError({statusCode: 502, statusMessage: result.error})
    }
    const message = await db.smsMessage.update({
        where: {id: queued.id},
        data: {status: "SENT", externalId: result.messageId, sentAt: new Date()}
    });
    return {message}
});
