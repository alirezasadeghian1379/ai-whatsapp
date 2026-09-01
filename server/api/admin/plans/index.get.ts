import {requireAdmin} from "../../../utils/admin";
import {db} from "../../../utils/db";

export default defineEventHandler(async event => {
    await requireAdmin(event);
    return {plans: await db.plan.findMany({orderBy: {sortOrder: "asc"}})}
});
