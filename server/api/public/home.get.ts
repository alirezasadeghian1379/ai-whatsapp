import {db} from "../../utils/db"

const defaults = {
    name: "همراه‌چت",
    supportEmail: "",
    supportPhone: "",
    address: "",
    footerDescription: "مدیریت هوشمند ارتباط با مشتری در واتساپ",
    socials: {instagram: "", telegram: "", linkedin: "", x: ""},
    trustBadges: []
}
export default defineEventHandler(async event => {
    setHeader(event, "Cache-Control", "public, max-age=60, stale-while-revalidate=300")
    const [setting, activeTeams, connectedNumbers, messages] = await Promise.all([
        db.systemSetting.findUnique({where: {key: "site"}}),
        db.user.count({where: {status: "ACTIVE"}}),
        db.whatsAppSession.count({where: {status: "CONNECTED"}}),
        db.message.count()
    ])
    const saved = (setting?.value && typeof setting.value === "object" && !Array.isArray(setting.value) ? setting.value : {}) as Record<string, unknown>
    return {
        settings: {
            ...defaults, ...saved,
            socials: {...defaults.socials, ...(saved.socials as object || {})},
            trustBadges: Array.isArray(saved.trustBadges) ? saved.trustBadges : []
        }, stats: {activeTeams, connectedNumbers, messages}
    }
})
