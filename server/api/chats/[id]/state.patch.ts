import {z} from "zod";
import {requireSession} from "../../../utils/auth";
import {db} from "../../../utils/db";

const schema = z.object({
    isPinned: z.boolean().optional(),
    isArchived: z.boolean().optional(),
    markRead: z.boolean().optional()
});
export default defineEventHandler(async (event) => {
    const auth = await requireSession(event), id = getRouterParam(event, "id") || "",
        parsed = schema.safeParse(await readBody(event));
    if (!parsed.success) throw createError({statusCode: 422});
    const found = await db.conversation.findFirst({where: {id, userId: String(auth.sub)}});
    if (!found) throw createError({statusCode: 404});
    const {markRead, ...data} = parsed.data;
    return {
        conversation: await db.conversation.update({
            where: {id},
            data: {...data, ...(markRead ? {unreadCount: 0} : {})}
        })
    };
});
