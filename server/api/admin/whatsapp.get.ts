import {requireAdmin} from "../../utils/admin";
import {db} from "../../utils/db";

export default defineEventHandler(async event => {
    await requireAdmin(event);
    const sessions = await db.whatsAppSession.findMany({
        include: {
            user: {select: {id: true, name: true, email: true, status: true}},
            _count: {select: {conversations: true}},
        },
        orderBy: {updatedAt: "desc"},
        take: 250,
    });
    return {sessions};
});
