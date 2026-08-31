import { z } from "zod";
import { requireSession } from "../../utils/auth";
import { db } from "../../utils/db";
const schema = z.object({ status: z.enum(["ACTIVE", "DISABLED"]) });
export default defineEventHandler(async (event) => { const auth = await requireSession(event), id = getRouterParam(event, "id") || "", parsed = schema.safeParse(await readBody(event)); if (!parsed.success) throw createError({ statusCode: 422 }); const hook = await db.webhook.findFirst({ where: { id, userId: String(auth.sub) } }); if (!hook) throw createError({ statusCode: 404 }); return { webhook: await db.webhook.update({ where: { id }, data: parsed.data }) }; });
