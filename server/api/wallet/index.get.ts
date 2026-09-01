import {requireSession} from "../../utils/auth";
import {db} from "../../utils/db";

export default defineEventHandler(async event => {
    const auth = await requireSession(event), userId = String(auth.sub);
    const wallet = await db.wallet.upsert({
        where: {userId},
        update: {},
        create: {userId},
        include: {transactions: {orderBy: {createdAt: "desc"}, take: 50}}
    });
    return {wallet}
});
