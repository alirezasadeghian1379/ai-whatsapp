import type { H3Event } from "h3";
import { requireSession } from "./auth";
export async function requireAdmin(event:H3Event){const auth=await requireSession(event);if(!["ADMIN","SUPER_ADMIN"].includes(String(auth.role)))throw createError({statusCode:403,statusMessage:"دسترسی مدیریتی ندارید."});return auth}
