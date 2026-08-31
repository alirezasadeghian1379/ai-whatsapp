import { z } from "zod";
import { getWhatsAppProvider } from "../../../services/providers";
import { requireSession } from "../../../utils/auth";
import { db } from "../../../utils/db";
import { dispatchUserWebhooks } from "../../../services/automations";
import { assertPlanLimit } from "../../../utils/plan";

const schema = z.object({ body: z.string().trim().min(1).max(4096) });
export default defineEventHandler(async (event) => {
  const auth = await requireSession(event), id = getRouterParam(event, "id") || "", parsed = schema.safeParse(await readBody(event));
  await assertPlanLimit(String(auth.sub), "messages");
  if (!parsed.success) throw createError({ statusCode: 422, statusMessage: "متن پیام معتبر نیست." });
  const conversation = await db.conversation.findFirst({ where: { id, userId: String(auth.sub) }, include: { contact: true, session: true } });
  if (!conversation) throw createError({ statusCode: 404, statusMessage: "گفتگو پیدا نشد." });
  if (conversation.session.status !== "CONNECTED") throw createError({ statusCode: 409, statusMessage: "واتساپ این گفتگو متصل نیست." });
  const sent = await getWhatsAppProvider().sendMessage(conversation.session.externalId, conversation.contact.phone, parsed.data.body);
  if (!sent.ok) throw createError({ statusCode: 502, statusMessage: sent.error });
  const message = await db.message.create({ data: { conversationId: id, externalId: sent.data.messageId, direction: "OUTBOUND", body: parsed.data.body, status: "SENT", sentAt: new Date() } });
  await db.conversation.update({ where: { id }, data: { lastMessageAt: new Date() } });
  void dispatchUserWebhooks(String(auth.sub), "message.sent", { messageId: message.id, conversationId: id, phone: conversation.contact.phone, body: message.body });
  return { message };
});
