import {requireSession} from "../../utils/auth";
import {db} from "../../utils/db";
import {assertUserModuleEnabled} from "../../utils/user-modules";

export default defineEventHandler(async event => {
    const auth = await requireSession(event), userId = String(auth.sub);
    assertUserModuleEnabled("wallet");
    const wallet = await db.wallet.upsert({
        where: {userId},
        update: {},
        create: {userId},
        include: {transactions: {orderBy: {createdAt: "desc"}, take: 50}}
    });
    return {wallet}
});
