import {z} from "zod"
import {requireAdmin} from "../../utils/admin"
import {db} from "../../utils/db"

const optionalUrl = z.union([z.literal(""), z.string().url().refine(value => ["http:", "https:"].includes(new URL(value).protocol))])
const schema = z.object({
    name: z.string().trim().min(2).max(80),
    supportEmail: z.union([z.literal(""), z.string().email()]).default(""),
    supportPhone: z.string().trim().max(30).default(""),
    address: z.string().trim().max(300).default(""),
    footerDescription: z.string().trim().max(300).default(""),
    maintenanceMode: z.boolean().default(false),
    socials: z.object({
        instagram: optionalUrl.default(""),
        telegram: optionalUrl.default(""),
        linkedin: optionalUrl.default(""),
        x: optionalUrl.default("")
    }).default({instagram: "", telegram: "", linkedin: "", x: ""}),
    trustBadges: z.array(z.object({
        title: z.string().trim().min(2).max(50),
        imageUrl: optionalUrl,
        linkUrl: optionalUrl
    })).max(4).default([])
})
export default defineEventHandler(async event => {
    const auth = await requireAdmin(event), parsed = schema.safeParse(await readBody(event))
    if (!parsed.success) throw createError({statusCode: 422, statusMessage: "اطلاعات تنظیمات معتبر نیست."})
    const setting = await db.systemSetting.upsert({
        where: {key: "site"},
        update: {value: parsed.data},
        create: {key: "site", value: parsed.data}
    })
    await db.auditLog.create({
        data: {
            userId: String(auth.sub),
            action: "SYSTEM_SETTINGS_UPDATED",
            entity: "SystemSetting",
            entityId: setting.id,
            metadata: {fields: Object.keys(parsed.data)}
        }
    })
    return {settings: setting.value}
})
