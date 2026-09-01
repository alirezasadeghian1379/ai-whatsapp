import {requireSession} from "../../../utils/auth";
import {db} from "../../../utils/db";

export default defineEventHandler(async event => {
    const auth = await requireSession(event), id = getRouterParam(event, "id") || "";
    const found = await db.smsConfiguration.findFirst({where: {id, userId: String(auth.sub)}});
    if (!found) throw createError({statusCode: 404, statusMessage: "پنل پیامکی پیدا نشد."});
    await db.smsConfiguration.delete({where: {id}});
    return {deleted: true}
});
