import type {H3Event} from "h3";
import {requireSession} from "./auth";
import {db} from "./db";
import {databaseAction} from "./errors";

export function whatsappStatus(state: string) {
    const normalized = state.toLowerCase();
    if (["open", "connected"].includes(normalized)) return "CONNECTED";
    if (["close", "closed", "disconnected", "logout"].includes(normalized)) return "DISCONNECTED";
    return "CONNECTING";
}

export async function ownedWhatsAppSession(event: H3Event, id: string) {
    const session = await requireSession(event);
    const record = await databaseAction(() => db.whatsAppSession.findFirst({where: {id, userId: String(session.sub)}}));
    if (!record) throw createError({statusCode: 404, statusMessage: "اتصال واتساپ پیدا نشد."});
    return record;
}

export function publicWhatsAppSession(record: {
    id: string;
    externalId: string;
    phoneNumber: string | null;
    displayName: string | null;
    status: string;
    provider: string;
    connectedAt: Date | null;
    lastSeenAt: Date | null;
    createdAt: Date;
    updatedAt: Date
}) {
    return {
        id: record.id,
        externalId: record.externalId,
        phoneNumber: record.phoneNumber,
        displayName: record.displayName,
        status: record.status,
        provider: record.provider,
        connectedAt: record.connectedAt,
        lastSeenAt: record.lastSeenAt,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt
    };
}
