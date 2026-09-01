import {z} from "zod";
import {requireSession} from "../../utils/auth";
import {db} from "../../utils/db";

const schema = z.object({id: z.string().optional(), all: z.boolean().optional()});
export default defineEventHandler(async event => {
    const auth = await requireSession(event), p = schema.safeParse(await readBody(event));
    if (!p.success) throw createError({statusCode: 422});
    await db.notification.updateMany({
        where: {userId: String(auth.sub), ...(p.data.id ? {id: p.data.id} : {})},
        data: {readAt: new Date()}
    });
    return {success: true}
});
