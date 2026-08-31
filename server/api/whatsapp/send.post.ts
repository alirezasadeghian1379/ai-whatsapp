import { z } from "zod";
import { getWhatsAppProvider } from "../../services/providers";
import { ownedWhatsAppSession } from "../../utils/whatsapp";

const schema = z.object({ sessionId: z.string().min(1), to: z.string().transform((value) => value.replace(/\D/g, "")).pipe(z.string().min(8).max(16)), body: z.string().trim().min(1).max(4096) });

export default defineEventHandler(async (event) => {
  const parsed = schema.safeParse(await readBody(event));
  if (!parsed.success) throw createError({ statusCode: 422, statusMessage: "شماره مقصد یا متن پیام معتبر نیست." });
  const session = await ownedWhatsAppSession(event, parsed.data.sessionId);
  if (session.status !== "CONNECTED") throw createError({ statusCode: 409, statusMessage: "ابتدا واتساپ را متصل کنید." });
  const result = await getWhatsAppProvider().sendMessage(session.externalId, parsed.data.to, parsed.data.body);
  if (!result.ok) throw createError({ statusCode: 502, statusMessage: result.error });
  return { success: true, messageId: result.data.messageId };
});
