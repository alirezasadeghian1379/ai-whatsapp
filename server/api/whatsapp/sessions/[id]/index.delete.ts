import {getWhatsAppProvider} from "../../../../services/providers"
import {db} from "../../../../utils/db"
import {databaseAction} from "../../../../utils/errors"
import {ownedWhatsAppSession} from "../../../../utils/whatsapp"

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, "id")
    if (!id) throw createError({statusCode: 400, statusMessage: "شناسه اتصال نامعتبر است."})

    const session = await ownedWhatsAppSession(event, id)
    // Cleanup provider credentials first. Database deletion still proceeds when
    // the remote socket is already unavailable.
    await getWhatsAppProvider().disconnect(session.externalId).catch(() => undefined)
    await databaseAction(() => db.whatsAppSession.delete({where: {id}}))
    return {deleted: true}
})
