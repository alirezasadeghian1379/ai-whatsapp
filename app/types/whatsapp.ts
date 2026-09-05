export type WhatsAppSession = {
    id: string;
    externalId: string;
    phoneNumber: string | null;
    displayName: string | null;
    status: string;
    provider: string;
    connectedAt: string | null;
    lastSeenAt: string | null
};
