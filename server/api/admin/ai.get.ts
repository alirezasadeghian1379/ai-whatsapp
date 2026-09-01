import {requireAdmin} from "../../utils/admin";
import {db} from "../../utils/db";

export default defineEventHandler(async event => {
    await requireAdmin(event);
    const configurations = await db.aIConfiguration.findMany({
        select: {
            id: true, provider: true, model: true, isEnabled: true, autoReply: true,
            apiKeyEncrypted: true, updatedAt: true,
            user: {select: {id: true, name: true, email: true}},
        },
        orderBy: {updatedAt: "desc"},
        take: 250,
    });
    return {
        configurations: configurations.map(({apiKeyEncrypted, ...item}) => ({
            ...item,
            hasApiKey: Boolean(apiKeyEncrypted)
        }))
    };
});
