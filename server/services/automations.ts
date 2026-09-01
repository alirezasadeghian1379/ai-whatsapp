import {createHmac} from "node:crypto";
import {OpenAIProvider, getWhatsAppProvider} from "./providers";
import {decryptSecret} from "../utils/crypto";
import {db} from "../utils/db";

export async function dispatchUserWebhooks(userId: string, event: string, data: unknown) {
    const hooks = await db.webhook.findMany({where: {userId, status: "ACTIVE"}});
    await Promise.all(hooks.filter(h => Array.isArray(h.events) && (h.events as string[]).includes(event)).map(async hook => {
        const body = JSON.stringify({id: crypto.randomUUID(), event, createdAt: new Date().toISOString(), data});
        const signature = `sha256=${createHmac("sha256", decryptSecret(hook.secretEncrypted)).update(body).digest("hex")}`;
        for (let attempt = 1; attempt <= 3; attempt++) {
            const started = Date.now();
            let status: number | null = null, responseBody = "";
            try {
                const response = await fetch(hook.url, {
                    method: "POST",
                    headers: {
                        "content-type": "application/json",
                        "user-agent": "HamrahChat-Webhook/1.0",
                        "x-hamrah-event": event,
                        "x-hamrah-signature": signature
                    },
                    body,
                    signal: AbortSignal.timeout(5_000)
                });
                status = response.status;
                responseBody = (await response.text()).slice(0, 4000);
            } catch (error) {
                responseBody = error instanceof Error ? error.message : "Delivery failed";
            }
            const success = !!status && status >= 200 && status < 300;
            await db.webhookDelivery.create({
                data: {
                    webhookId: hook.id,
                    event,
                    requestBody: JSON.parse(body),
                    responseBody,
                    httpStatus: status,
                    durationMs: Date.now() - started,
                    attempt,
                    deliveredAt: success ? new Date() : null,
                    nextRetryAt: !success && attempt < 3 ? new Date(Date.now() + attempt * 60_000) : null
                }
            });
            if (success) break;
        }
    }));
}

export async function runAutoReply(input: {
    userId: string;
    sessionExternalId: string;
    conversationId: string;
    phone: string;
    message: string
}) {
    const config = await db.aIConfiguration.findFirst({
        where: {
            userId: input.userId,
            isEnabled: true,
            autoReply: true
        }
    });
    if (!config?.apiKeyEncrypted) return;
    if (config.delaySeconds) await new Promise(resolve => setTimeout(resolve, Math.min(config.delaySeconds, 30) * 1000));
    const completion = await new OpenAIProvider(decryptSecret(config.apiKeyEncrypted), config.model).complete({
        systemPrompt: config.systemPrompt,
        message: input.message,
        temperature: config.temperature,
        maxTokens: config.maxTokens
    });
    const body = completion.ok ? completion.data.text : config.fallbackMessage;
    if (!body) return;
    const sent = await getWhatsAppProvider().sendMessage(input.sessionExternalId, input.phone, body);
    if (!sent.ok) return;
    const message = await db.message.create({
        data: {
            conversationId: input.conversationId,
            externalId: sent.data.messageId,
            direction: "OUTBOUND",
            body,
            status: "SENT",
            sentAt: new Date()
        }
    });
    const periodStart = new Date();
    periodStart.setDate(1);
    periodStart.setHours(0, 0, 0, 0);
    const periodEnd = new Date(periodStart.getFullYear(), periodStart.getMonth() + 1, 1);
    await db.usage.upsert({
        where: {userId_periodStart: {userId: input.userId, periodStart}},
        update: {aiRequests: {increment: 1}, messagesSent: {increment: 1}},
        create: {userId: input.userId, periodStart, periodEnd, aiRequests: 1, messagesSent: 1}
    });
    await dispatchUserWebhooks(input.userId, "message.sent", {
        messageId: message.id,
        conversationId: input.conversationId,
        phone: input.phone,
        body,
        automated: true
    });
}
