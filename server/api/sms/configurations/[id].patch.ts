import {z} from "zod";
import {requireSession} from "../../../utils/auth";
import {db} from "../../../utils/db";

const schema = z.object({isEnabled: z.boolean().optional(), isDefault: z.boolean().optional()});
export default defineEventHandler(async event => {
    const auth = await requireSession(event), userId = String(auth.sub), id = getRouterParam(event, "id") || "",
        p = schema.safeParse(await readBody(event));
    if (!p.success) throw createError({statusCode: 422, statusMessage: "وضعیت انتخاب‌شده معتبر نیست."});
    const found = await db.smsConfiguration.findFirst({where: {id, userId}});
    if (!found) throw createError({statusCode: 404, statusMessage: "پنل پیامکی پیدا نشد."});
    if (p.data.isDefault) await db.smsConfiguration.updateMany({
        where: {userId, id: {not: id}},
        data: {isDefault: false}
    });
    const configuration = await db.smsConfiguration.update({where: {id}, data: p.data});
    return {configuration}
});
