import { requireSession } from "../../utils/auth";
import { db } from "../../utils/db";
export default defineEventHandler(async (event) => { const auth = await requireSession(event); const config = await db.aIConfiguration.findFirst({ where: { userId: String(auth.sub) } }); return { config: config ? { ...config, apiKeyEncrypted: undefined, hasApiKey: !!config.apiKeyEncrypted } : null }; });
