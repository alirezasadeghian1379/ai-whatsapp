export type Result<T> = { ok: true; data: T } | { ok: false; error: string };

export type WhatsAppSessionResult = { sessionId: string; qr: string | null; state: string };

export interface WhatsAppProvider {
    createSession(instanceName: string): Promise<Result<WhatsAppSessionResult>>;

    getQr(instanceName: string): Promise<Result<{ qr: string | null; state: string }>>;

    getState(instanceName: string): Promise<Result<{ state: string }>>;

    disconnect(instanceName: string): Promise<Result<void>>;

    sendMessage(instanceName: string, to: string, body: string): Promise<Result<{ messageId: string }>>;

    sendMedia(instanceName: string, to: string, media: {
        data: Buffer;
        mimeType: string;
        fileName: string;
        caption?: string;
        voiceNote?: boolean
    }): Promise<Result<{ messageId: string }>>;

    markRead(instanceName: string, to: string, messageIds: string[]): Promise<Result<void>>;

    configureWebhook(instanceName: string, url: string, secret: string): Promise<Result<void>>;
}

export class BaileysWhatsAppProvider implements WhatsAppProvider {
    async createSession(instanceName: string): Promise<Result<WhatsAppSessionResult>> {
        try {
            const {waitForBaileysState} = await import("./baileys-manager");
            const data = await waitForBaileysState(instanceName);
            return {ok: true, data: {sessionId: instanceName, ...data}};
        } catch (error) {
            return {ok: false, error: error instanceof Error ? error.message : "اتصال واتساپ ساخته نشد."};
        }
    }

    async getQr(instanceName: string) {
        try {
            const {waitForBaileysState} = await import("./baileys-manager");
            return {ok: true as const, data: await waitForBaileysState(instanceName)};
        } catch (error) {
            return {ok: false as const, error: error instanceof Error ? error.message : "QR واتساپ دریافت نشد."};
        }
    }

    async getState(instanceName: string) {
        try {
            const {waitForBaileysState} = await import("./baileys-manager");
            const data = await waitForBaileysState(instanceName, 500);
            return {ok: true as const, data: {state: data.state}};
        } catch (error) {
            return {ok: false as const, error: error instanceof Error ? error.message : "وضعیت واتساپ دریافت نشد."};
        }
    }

    async disconnect(instanceName: string) {
        try {
            const {logoutBaileysSession} = await import("./baileys-manager");
            await logoutBaileysSession(instanceName);
            return {ok: true as const, data: undefined};
        } catch (error) {
            return {ok: false as const, error: error instanceof Error ? error.message : "قطع اتصال واتساپ انجام نشد."};
        }
    }

    async sendMessage(instanceName: string, to: string, body: string) {
        try {
            const {sendBaileysMessage} = await import("./baileys-manager");
            return {ok: true as const, data: {messageId: await sendBaileysMessage(instanceName, to, body)}};
        } catch (error) {
            return {ok: false as const, error: error instanceof Error ? error.message : "پیام واتساپ ارسال نشد."};
        }
    }

    async sendMedia(instanceName: string, to: string, media: {
        data: Buffer;
        mimeType: string;
        fileName: string;
        caption?: string;
        voiceNote?: boolean
    }) {
        try {
            const {sendBaileysMedia} = await import("./baileys-manager");
            return {ok: true as const, data: {messageId: await sendBaileysMedia(instanceName, to, media)}};
        } catch (error) {
            return {ok: false as const, error: error instanceof Error ? error.message : "فایل واتساپ ارسال نشد."};
        }
    }

    async markRead(instanceName: string, to: string, messageIds: string[]) {
        try {
            const {markBaileysMessagesRead} = await import("./baileys-manager");
            await markBaileysMessagesRead(instanceName, to, messageIds);
            return {ok: true as const, data: undefined};
        } catch (error) {
            return {
                ok: false as const,
                error: error instanceof Error ? error.message : "ثبت خواندن پیام‌ها انجام نشد."
            };
        }
    }

    async configureWebhook() {
        return {ok: true as const, data: undefined};
    }
}

export interface AIProvider {
    complete(input: {
        systemPrompt: string;
        message: string;
        temperature?: number;
        maxTokens?: number
    }): Promise<Result<{ text: string; tokens: number }>>
}

export interface PaymentProvider {
    createPayment(input: { orderId: string; amount: number; callbackUrl: string }): Promise<Result<{
        authority: string;
        redirectUrl: string
    }>>;

    verify(authority: string, amount: number): Promise<Result<{ reference: string }>>
}

type EvolutionResponse = Record<string, any>;

function evolutionError(error: unknown) {
    const value = error as {
        data?: { response?: { message?: string | string[] }; message?: string };
        message?: string
    };
    const message = value.data?.response?.message ?? value.data?.message ?? value.message;
    return Array.isArray(message) ? message.join("، ") : message || "ارتباط با سرویس واتساپ برقرار نشد.";
}

function normalizeQr(data: EvolutionResponse): string | null {
    const value = data.base64 ?? data.qrcode?.base64 ?? data.qr?.base64;
    if (!value || typeof value !== "string") return null;
    return value.startsWith("data:image") ? value : `data:image/png;base64,${value}`;
}

function normalizeState(data: EvolutionResponse): string {
    return String(data.instance?.state ?? data.instance?.status ?? data.state ?? data.status ?? "connecting").toLowerCase();
}

export class EvolutionWhatsAppProvider implements WhatsAppProvider {
    constructor(private readonly baseUrl: string, private readonly apiKey: string, private readonly proxy?: {
        host: string;
        port: string;
        protocol: string;
        username?: string;
        password?: string
    }) {
    }

    private async request<T extends EvolutionResponse>(path: string, options: Record<string, any> = {}): Promise<Result<T>> {
        try {
            const response = await fetch(`${this.baseUrl.replace(/\/$/, "")}${path}`, {
                method: options.method || "GET",
                headers: {apikey: this.apiKey, "content-type": "application/json", ...(options.headers || {})},
                body: options.body ? JSON.stringify(options.body) : undefined,
                signal: AbortSignal.timeout(15_000),
            });
            const raw = await response.text();
            const data = (raw ? JSON.parse(raw) : {}) as T;
            if (!response.ok) throw {data};
            return {ok: true, data};
        } catch (error) {
            return {ok: false, error: evolutionError(error)};
        }
    }

    async createSession(instanceName: string): Promise<Result<WhatsAppSessionResult>> {
        const proxy = this.proxy ? {
            proxyHost: this.proxy.host,
            proxyPort: this.proxy.port,
            proxyProtocol: this.proxy.protocol, ...(this.proxy.username ? {proxyUsername: this.proxy.username} : {}), ...(this.proxy.password ? {proxyPassword: this.proxy.password} : {})
        } : {};
        const result = await this.request<EvolutionResponse>("/instance/create", {
            method: "POST",
            body: {instanceName, qrcode: true, integration: "WHATSAPP-BAILEYS", ...proxy}
        });
        if (!result.ok) return result;
        return {
            ok: true,
            data: {sessionId: instanceName, qr: normalizeQr(result.data), state: normalizeState(result.data)}
        };
    }

    async getQr(instanceName: string) {
        const result = await this.request<EvolutionResponse>(`/instance/connect/${encodeURIComponent(instanceName)}`);
        if (!result.ok) return result;
        return {ok: true as const, data: {qr: normalizeQr(result.data), state: normalizeState(result.data)}};
    }

    async getState(instanceName: string) {
        const result = await this.request<EvolutionResponse>(`/instance/connectionState/${encodeURIComponent(instanceName)}`);
        if (!result.ok) return result;
        return {ok: true as const, data: {state: normalizeState(result.data)}};
    }

    async disconnect(instanceName: string) {
        const result = await this.request<EvolutionResponse>(`/instance/logout/${encodeURIComponent(instanceName)}`, {method: "DELETE"});
        return result.ok ? {ok: true as const, data: undefined} : result;
    }

    async sendMessage(instanceName: string, to: string, body: string) {
        const result = await this.request<EvolutionResponse>(`/message/sendText/${encodeURIComponent(instanceName)}`, {
            method: "POST",
            body: {number: to.replace(/\D/g, ""), text: body}
        });
        if (!result.ok) return result;
        return {
            ok: true as const,
            data: {messageId: String(result.data.key?.id ?? result.data.id ?? crypto.randomUUID())}
        };
    }

    async sendMedia() {
        return {ok: false as const, error: "ارسال فایل برای Evolution هنوز تنظیم نشده است."};
    }

    async markRead(instanceName: string, to: string, messageIds: string[]) {
        if (!messageIds.length) return {ok: true as const, data: undefined};
        const result = await this.request<EvolutionResponse>(`/chat/markMessageAsRead/${encodeURIComponent(instanceName)}`, {
            method: "POST",
            body: {
                readMessages: messageIds.map(id => ({
                    remoteJid: `${to.replace(/\D/g, "")}@s.whatsapp.net`,
                    fromMe: false,
                    id
                }))
            }
        });
        return result.ok ? {ok: true as const, data: undefined} : result;
    }

    async configureWebhook(instanceName: string, url: string, secret: string) {
        const result = await this.request<EvolutionResponse>(`/webhook/set/${encodeURIComponent(instanceName)}`, {
            method: "POST",
            body: {
                webhook: {
                    enabled: true,
                    url,
                    webhookByEvents: false,
                    webhookBase64: false,
                    headers: {"x-webhook-secret": secret},
                    events: ["CONNECTION_UPDATE", "MESSAGES_UPSERT", "MESSAGES_UPDATE"]
                }
            },
        });
        return result.ok ? {ok: true as const, data: undefined} : result;
    }
}

export function getWhatsAppProvider(): WhatsAppProvider {
    const config = useRuntimeConfig();
    if (config.whatsappProvider === "baileys") return new BaileysWhatsAppProvider();
    if (config.whatsappProvider !== "evolution") throw createError({
        statusCode: 503,
        statusMessage: "سرویس واتساپ موقتاً در دسترس نیست؛ لطفاً با پشتیبانی تماس بگیرید."
    });
    if (!config.whatsappApiUrl || !config.whatsappApiKey) throw createError({
        statusCode: 503,
        statusMessage: "سرویس واتساپ هنوز توسط مدیر سیستم پیکربندی نشده است."
    });
    const proxy = config.whatsappProxyHost && config.whatsappProxyPort ? {
        host: config.whatsappProxyHost,
        port: config.whatsappProxyPort,
        protocol: config.whatsappProxyProtocol,
        username: config.whatsappProxyUsername || undefined,
        password: config.whatsappProxyPassword || undefined
    } : undefined;
    return new EvolutionWhatsAppProvider(config.whatsappApiUrl, config.whatsappApiKey, proxy);
}

export class GroqProvider implements AIProvider {
    constructor(private readonly apiKey: string, private readonly model: string) {
    }

    async complete(input: { systemPrompt: string; message: string; temperature?: number; maxTokens?: number }) {
        try {
            const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: {authorization: `Bearer ${this.apiKey}`, "content-type": "application/json"},
                body: JSON.stringify({
                    model: this.model,
                    messages: [
                        {role: "system", content: input.systemPrompt},
                        {role: "user", content: input.message}
                    ],
                    temperature: input.temperature,
                    max_completion_tokens: input.maxTokens || 500
                }),
                signal: AbortSignal.timeout(30_000)
            });
            const data = await response.json() as any;
            if (!response.ok) return {ok: false as const, error: data.error?.message || "سرویس Groq پاسخ نداد."};
            const text = data.choices?.[0]?.message?.content;
            if (!text) return {ok: false as const, error: "پاسخ متنی از Groq دریافت نشد."};
            return {ok: true as const, data: {text: String(text), tokens: Number(data.usage?.total_tokens || 0)}};
        } catch {
            return {ok: false as const, error: "ارتباط با سرویس Groq برقرار نشد."};
        }
    }
}

export function getAIProvider(provider: string, apiKey: string, model: string): AIProvider {
    if (provider === "groq") return new GroqProvider(apiKey, model);
    throw createError({statusCode: 422, statusMessage: "ارائه‌دهنده هوش مصنوعی پشتیبانی نمی‌شود."});
}

export class MockPaymentProvider implements PaymentProvider {
    async createPayment(input: { orderId: string; amount: number; callbackUrl: string }) {
        const authority = `sandbox_${crypto.randomUUID().replace(/-/g, "")}`;
        return {ok: true as const, data: {authority, redirectUrl: `/payment/mock?authority=${authority}`}}
    }

    async verify(authority: string, amount: number) {
        if (!authority.startsWith("sandbox_")) return {ok: false as const, error: "شناسه پرداخت آزمایشی معتبر نیست."};
        return {ok: true as const, data: {reference: `TEST-${Date.now()}`}}
    }
}

export class ZarinpalSandboxProvider implements PaymentProvider {
    async createPayment(input: { orderId: string; amount: number; callbackUrl: string }) {
        const authority = `zarinpal_test_${crypto.randomUUID().replace(/-/g, "")}`;
        return {
            ok: true as const,
            data: {
                authority,
                redirectUrl: `/payment/mock?provider=zarinpal&authority=${authority}&amount=${input.amount}`
            }
        }
    }

    async verify(authority: string, amount: number) {
        if (!authority.startsWith("zarinpal_test_")) return {ok: false as const, error: "تراکنش آزمایشی معتبر نیست."};
        return {ok: true as const, data: {reference: `ZP-TEST-${Date.now()}`}}
    }
}

export function getPaymentProvider(name?: string): PaymentProvider {
    const provider = name || String(useRuntimeConfig().paymentProvider);
    if (provider === "mock") return new MockPaymentProvider();
    if (provider === "zarinpal") return new ZarinpalSandboxProvider();
    throw createError({statusCode: 503, statusMessage: "درگاه پرداخت در حال حاضر در دسترس نیست."})
}
