import {getWhatsAppProvider} from "../../../services/providers";
import {requireSession} from "../../../utils/auth";
import {db} from "../../../utils/db";
import {databaseAction} from "../../../utils/errors";
import {publicWhatsAppSession, whatsappStatus} from "../../../utils/whatsapp";

export default defineEventHandler(async (event) => {
    const auth = await requireSession(event);
    const provider = getWhatsAppProvider();
    const sessions = await databaseAction(() => db.whatsAppSession.findMany({
        where: {userId: String(auth.sub)},
        orderBy: {createdAt: "desc"}
    }));
    const synced = await Promise.all(sessions.map(async (session) => {
        if ((session.metadata as Record<string, unknown> | null)?.explicitDisconnected === true) return session;
        const state = await provider.getState(session.externalId);
        if (!state.ok) return session;
        const status = whatsappStatus(state.data.state);
        if (status === session.status) return session;
        return databaseAction(() => db.whatsAppSession.update({
            where: {id: session.id},
            data: {
                status,
                connectedAt: status === "CONNECTED" ? (session.connectedAt ?? new Date()) : session.connectedAt,
                lastSeenAt: new Date()
            }
        }));
    }));
    return {sessions: synced.map(publicWhatsAppSession)};
});
