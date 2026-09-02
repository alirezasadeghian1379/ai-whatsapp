import {requireSession} from "../../utils/auth";
import {db} from "../../utils/db";
import {assertPlanFeature} from "../../utils/plan";

export default defineEventHandler(async (event) => {
    const auth = await requireSession(event);
    await assertPlanFeature(String(auth.sub), "ai");
    const config = await db.aIConfiguration.findFirst({where: {userId: String(auth.sub)}});
    return {config: config ? {...config, apiKeyEncrypted: undefined, hasApiKey: !!config.apiKeyEncrypted} : null};
});
