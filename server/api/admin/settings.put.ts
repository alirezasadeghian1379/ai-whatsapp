import {z} from "zod";
import {requireAdmin} from "../../utils/admin";
import {db} from "../../utils/db";

const schema = z.object({
    name: z.string().trim().min(2).max(80),
    supportEmail: z.union([z.literal(""), z.string().email()]).default(""),
    maintenanceMode: z.boolean().default(false),
});

export default defineEventHandler(async event => {
    const auth = await requireAdmin(event);
    const parsed = schema.safeParse(await readBody(event));
    if (!parsed.success) throw createError({statusCode: 422, statusMessage: "اطلاعات تنظیمات معتبر نیست."});
    const setting = await db.systemSetting.upsert({
        where: {key: "site"},
        update: {value: parsed.data},
        create: {key: "site", value: parsed.data}
    });
    await db.auditLog.create({
        data: {
            userId: String(auth.sub),
            action: "SYSTEM_SETTINGS_UPDATED",
            entity: "SystemSetting",
            entityId: setting.id
        }
    });
    return {settings: setting.value};
});
