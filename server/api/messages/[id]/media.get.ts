import {readFile} from "node:fs/promises"
import {extname, join} from "node:path"
import {requireSession} from "../../../utils/auth"
import {db} from "../../../utils/db"

const contentTypes: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".pdf": "application/pdf",
    ".txt": "text/plain; charset=utf-8",
    ".ogg": "audio/ogg",
    ".mp3": "audio/mpeg"
}
export default defineEventHandler(async event => {
    const auth = await requireSession(event), id = getRouterParam(event, "id") || ""
    const message = await db.message.findFirst({where: {id, conversation: {userId: String(auth.sub)}}})
    if (!message?.mediaUrl || !message.mediaUrl.match(/^[a-f0-9-]+\.[a-z0-9]+$/i)) throw createError({
        statusCode: 404,
        statusMessage: "فایل پیدا نشد."
    })
    const extension = extname(message.mediaUrl).toLowerCase(),
        data = await readFile(join(process.cwd(), "storage", "chat-media", message.mediaUrl)).catch(() => null)
    if (!data) throw createError({statusCode: 404, statusMessage: "فایل پیدا نشد."})
    setHeader(event, "Content-Type", contentTypes[extension] || "application/octet-stream");
    setHeader(event, "Cache-Control", "private, max-age=3600");
    setHeader(event, "Content-Disposition", `${message.type === "image" || message.type === "audio" ? "inline" : "attachment"}; filename="attachment${extension}"`)
    return data
})
