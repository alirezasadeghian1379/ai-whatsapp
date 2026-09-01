import {getWhatsAppProvider} from "../../../../services/providers";
import {db} from "../../../../utils/db";
import {databaseAction} from "../../../../utils/errors";
import {ownedWhatsAppSession, whatsappStatus} from "../../../../utils/whatsapp";

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, "id");
    if (!id) throw createError({statusCode: 400, statusMessage: "شناسه اتصال نامعتبر است."});
    const session = await ownedWhatsAppSession(event, id);
    const result = await getWhatsAppProvider().getQr(session.externalId);
    if (!result.ok) throw createError({statusCode: 502, statusMessage: result.error});
    const status = whatsappStatus(result.data.state);
    await databaseAction(() => db.whatsAppSession.update({where: {id}, data: {status, lastSeenAt: new Date()}}));
    return {qr: result.data.qr, status};
});
