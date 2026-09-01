import type {SmsConfiguration} from "@prisma/client";
import {decryptSecret} from "../utils/crypto";

export type SmsResult = { ok: true; messageId: string } | { ok: false; error: string };

export interface SmsProvider {
    send(input: { to: string; body: string; sender?: string | null }): Promise<SmsResult>
}

class MockSmsProvider implements SmsProvider {
    async send() {
        return {ok: true as const, messageId: `sms_test_${crypto.randomUUID()}`}
    }
}

class UnconfiguredSmsProvider implements SmsProvider {
    constructor(private name: string) {
    }

    async send() {
        return {ok: false as const, error: `اتصال عملی ${this.name} هنوز توسط مدیر سیستم پیکربندی نشده است.`}
    }
}

export function getSmsProvider(configuration: SmsConfiguration): SmsProvider {
    if (configuration.provider === "mock") return new MockSmsProvider();
    if (!configuration.apiKeyEncrypted) return new UnconfiguredSmsProvider(configuration.provider);
    // Decrypt here so every concrete adapter can receive credentials without exposing them to the client.
    decryptSecret(configuration.apiKeyEncrypted);
    return new UnconfiguredSmsProvider(configuration.provider);
}
