import { requireSession } from "../../utils/auth";
import { db } from "../../utils/db";
export default defineEventHandler(async (event) => { const auth = await requireSession(event), id = getRouterParam(event, "id") || ""; const hook = await db.webhook.findFirst({ where: { id, userId: String(auth.sub) } }); if (!hook) throw createError({ statusCode: 404, statusMessage: "وب‌هوک پیدا نشد." }); await db.webhook.delete({ where: { id } }); return { success: true }; });
