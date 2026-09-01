import {requireAdmin} from "../../utils/admin";
import {db} from "../../utils/db";

export default defineEventHandler(async event => {
    await requireAdmin(event);
    const [configurations, messages] = await Promise.all([db.smsConfiguration.findMany({
        include: {
            user: {
                select: {
                    name: true,
                    email: true
                }
            }
        }, orderBy: {createdAt: "desc"}, take: 100
    }), db.smsMessage.findMany({
        include: {
            user: {select: {name: true, email: true}},
            configuration: {select: {title: true, provider: true}}
        }, orderBy: {createdAt: "desc"}, take: 100
    })]);
    return {
        configurations: configurations.map(({apiKeyEncrypted, ...x}) => ({...x, hasApiKey: !!apiKeyEncrypted})),
        messages
    }
});
