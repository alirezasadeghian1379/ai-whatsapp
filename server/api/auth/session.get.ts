import {db} from "../../utils/db";
import {requireSession} from "../../utils/auth";

export default defineEventHandler(async event => {
    const session = await requireSession(event);
    const user = await db.user.findUnique({
        where: {id: session.sub},
        select: {id: true, name: true, email: true, role: true, status: true}
    });
    if (!user || user.status !== "ACTIVE") throw createError({statusCode: 401, statusMessage: "نشست معتبر نیست."});
    return {user}
})
