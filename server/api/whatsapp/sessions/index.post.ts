import { z } from "zod";
import { getWhatsAppProvider } from "../../../services/providers";
import { requireSession } from "../../../utils/auth";
import { db } from "../../../utils/db";
import { databaseAction } from "../../../utils/errors";
import { publicWhatsAppSession, whatsappStatus } from "../../../utils/whatsapp";
import { assertPlanLimit } from "../../../utils/plan";

const schema = z.object({ displayName: z.string().trim().min(2).max(60).default("واتساپ فروش") });

export default defineEventHandler(async (event) => {
  const auth = await requireSession(event);
  await assertPlanLimit(String(auth.sub), "whatsapp");
  const parsed = schema.safeParse(await readBody(event).catch(() => ({})));
  if (!parsed.success) throw createError({ statusCode: 422, statusMessage: "نام اتصال معتبر نیست." });
  const provider = getWhatsAppProvider();
  const instanceName = `hamrah-${String(auth.sub).slice(-8)}-${crypto.randomUUID().slice(0, 8)}`;
  const created = await provider.createSession(instanceName);
  if (!created.ok) throw createError({ statusCode: 502, statusMessage: created.error });
  const record = await databaseAction(() => db.whatsAppSession.create({ data: { userId: String(auth.sub), externalId: instanceName, displayName: parsed.data.displayName, status: whatsappStatus(created.data.state), provider: "evolution", metadata: { instanceName } } }));
  const config = useRuntimeConfig();
  let webhookWarning: string | null = null;
  if (config.whatsappWebhookSecret) {
    const webhook = await provider.configureWebhook(instanceName, `${config.appUrl.replace(/\/$/, "")}/api/whatsapp/webhook`, config.whatsappWebhookSecret);
    if (!webhook.ok) webhookWarning = webhook.error;
  } else webhookWarning = "WHATSAPP_WEBHOOK_SECRET تنظیم نشده و دریافت پیام غیرفعال است.";
  return { session: publicWhatsAppSession(record), qr: created.data.qr, webhookWarning };
});
