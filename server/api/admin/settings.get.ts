import {requireAdmin} from "../../utils/admin";
import {db} from "../../utils/db";

export default defineEventHandler(async event => {
    await requireAdmin(event);
    const setting = await db.systemSetting.findUnique({where: {key: "site"}});
    return {settings: setting?.value ?? {name: "همراه‌چت", supportEmail: "", maintenanceMode: false}};
});
