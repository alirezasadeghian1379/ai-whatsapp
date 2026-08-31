import { requireSession } from "../../utils/auth";
import { db } from "../../utils/db";
export default defineEventHandler(async (event) => { const auth = await requireSession(event), userId = String(auth.sub); const [user, setting] = await Promise.all([db.user.findUnique({ where: { id: userId }, select: { id: true, name: true, email: true, phone: true, role: true } }), db.systemSetting.findUnique({ where: { key: `user:${userId}:preferences` } })]); return { user, preferences: setting?.value || {} }; });
