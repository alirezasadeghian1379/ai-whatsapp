import {getWhatsAppProvider} from "../../../../services/providers";
import {db} from "../../../../utils/db";
import {databaseAction} from "../../../../utils/errors";
import {ownedWhatsAppSession, publicWhatsAppSession} from "../../../../utils/whatsapp";

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, "id");
    if (!id) throw createError({statusCode: 400, statusMessage: "شناسه اتصال نامعتبر است."});
    const session = await ownedWhatsAppSession(event, id);
    const result = await getWhatsAppProvider().disconnect(session.externalId);
    if (!result.ok) throw createError({statusCode: 502, statusMessage: result.error});
    const updated = await databaseAction(() => db.whatsAppSession.update({
        where: {id},
        data: {status: "DISCONNECTED", lastSeenAt: new Date(), metadata: {...(session.metadata as object || {}), explicitDisconnected: true}}
    }));
    return {session: publicWhatsAppSession(updated)};
});
