import {db} from "../utils/db";
import {startBaileysSession} from "../services/baileys-manager";

export default defineNitroPlugin(() => {
    const timer = setTimeout(async () => {
        const sessions = await db.whatsAppSession.findMany({
            where: {provider: "baileys"},
            select: {externalId: true, metadata: true}
        }).catch(() => []);

        for (const session of sessions) {
            if ((session.metadata as Record<string, unknown> | null)?.explicitDisconnected === true) continue;
            void startBaileysSession(session.externalId).catch(error => {
                console.error(`[WhatsApp] startup failed for ${session.externalId}:`, error instanceof Error ? error.message : error);
            });
        }
    }, 1_000);
    timer.unref?.();
});
