import { requireSession } from "../utils/auth"
import { db } from "../utils/db"

export default defineEventHandler(async (event) => {
  const auth = await requireSession(event)
  const query = String(getQuery(event).q || "").trim()
  if (query.length < 2) return { results: [] }

  const conversations = await db.conversation.findMany({
    where: {
      userId: String(auth.sub),
      contact: { OR: [{ name: { contains: query } }, { phone: { contains: query } }] }
    },
    include: { contact: true, messages: { orderBy: { createdAt: "desc" }, take: 1 } },
    orderBy: { lastMessageAt: "desc" },
    take: 8
  })
  return {
    results: conversations.map(({ messages, contact, ...item }) => ({
      id: item.id,
      name: contact.name || contact.phone,
      phone: contact.phone,
      preview: messages[0]?.body || null,
      updatedAt: item.lastMessageAt
    }))
  }
})
