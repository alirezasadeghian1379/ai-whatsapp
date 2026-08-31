import { requireSession } from "../utils/auth";
import { db } from "../utils/db";

export default defineEventHandler(async (event) => {
  const auth = await requireSession(event), userId = String(auth.sub), start = new Date(); start.setHours(0, 0, 0, 0);
  const month = new Date(start.getFullYear(), start.getMonth(), 1);
  const [sessions, today, monthly, conversations, webhooks, ai, subscription, usage, recent] = await Promise.all([
    db.whatsAppSession.findMany({ where: { userId }, orderBy: { updatedAt: "desc" } }),
    db.message.count({ where: { conversation: { userId }, createdAt: { gte: start } } }),
    db.message.count({ where: { conversation: { userId }, createdAt: { gte: month } } }),
    db.conversation.count({ where: { userId, isArchived: false } }),
    db.webhook.count({ where: { userId, status: "ACTIVE" } }),
    db.aIConfiguration.findFirst({ where: { userId } }),
    db.subscription.findFirst({ where: { userId, status: "ACTIVE" }, include: { plan: true }, orderBy: { endsAt: "desc" } }),
    db.usage.findFirst({ where: { userId }, orderBy: { periodStart: "desc" } }),
    db.message.findMany({ where: { conversation: { userId } }, include: { conversation: { include: { contact: true } } }, orderBy: { createdAt: "desc" }, take: 5 }),
  ]);
  return { sessions: { total: sessions.length, connected: sessions.filter(x => x.status === "CONNECTED").length, primary: sessions[0] || null }, messages: { today, monthly }, conversations, webhooks, ai: { enabled: !!ai?.isEnabled, requests: usage?.aiRequests || 0 }, subscription, usage, recent: recent.map(x => ({ id: x.id, body: x.body, direction: x.direction, contact: x.conversation.contact.name || x.conversation.contact.phone, createdAt: x.createdAt })) };
});
