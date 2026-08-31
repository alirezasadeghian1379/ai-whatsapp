export type Result<T> = { ok: true; data: T } | { ok: false; error: string };

export type WhatsAppSessionResult = { sessionId: string; qr: string | null; state: string };

export interface WhatsAppProvider {
  createSession(instanceName: string): Promise<Result<WhatsAppSessionResult>>;
  getQr(instanceName: string): Promise<Result<{ qr: string | null; state: string }>>;
  getState(instanceName: string): Promise<Result<{ state: string }>>;
  disconnect(instanceName: string): Promise<Result<void>>;
  sendMessage(instanceName: string, to: string, body: string): Promise<Result<{ messageId: string }>>;
  configureWebhook(instanceName: string, url: string, secret: string): Promise<Result<void>>;
}

export interface AIProvider { complete(input: { systemPrompt: string; message: string; temperature?: number; maxTokens?: number }): Promise<Result<{ text: string; tokens: number }>> }
export interface PaymentProvider { createPayment(input: { orderId: string; amount: number; callbackUrl: string }): Promise<Result<{ authority: string; redirectUrl: string }>>; verify(authority: string, amount: number): Promise<Result<{ reference: string }>> }

type EvolutionResponse = Record<string, any>;

function evolutionError(error: unknown) {
  const value = error as { data?: { response?: { message?: string | string[] }; message?: string }; message?: string };
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
  constructor(private readonly baseUrl: string, private readonly apiKey: string) {}

  private async request<T extends EvolutionResponse>(path: string, options: Record<string, any> = {}): Promise<Result<T>> {
    try {
      const response = await fetch(`${this.baseUrl.replace(/\/$/, "")}${path}`, {
        method: options.method || "GET",
        headers: { apikey: this.apiKey, "content-type": "application/json", ...(options.headers || {}) },
        body: options.body ? JSON.stringify(options.body) : undefined,
        signal: AbortSignal.timeout(15_000),
      });
      const raw = await response.text();
      const data = (raw ? JSON.parse(raw) : {}) as T;
      if (!response.ok) throw { data };
      return { ok: true, data };
    } catch (error) {
      return { ok: false, error: evolutionError(error) };
    }
  }

  async createSession(instanceName: string): Promise<Result<WhatsAppSessionResult>> {
    const result = await this.request<EvolutionResponse>("/instance/create", { method: "POST", body: { instanceName, qrcode: true, integration: "WHATSAPP-BAILEYS" } });
    if (!result.ok) return result;
    return { ok: true, data: { sessionId: instanceName, qr: normalizeQr(result.data), state: normalizeState(result.data) } };
  }

  async getQr(instanceName: string) {
    const result = await this.request<EvolutionResponse>(`/instance/connect/${encodeURIComponent(instanceName)}`);
    if (!result.ok) return result;
    return { ok: true as const, data: { qr: normalizeQr(result.data), state: normalizeState(result.data) } };
  }

  async getState(instanceName: string) {
    const result = await this.request<EvolutionResponse>(`/instance/connectionState/${encodeURIComponent(instanceName)}`);
    if (!result.ok) return result;
    return { ok: true as const, data: { state: normalizeState(result.data) } };
  }

  async disconnect(instanceName: string) {
    const result = await this.request<EvolutionResponse>(`/instance/logout/${encodeURIComponent(instanceName)}`, { method: "DELETE" });
    return result.ok ? { ok: true as const, data: undefined } : result;
  }

  async sendMessage(instanceName: string, to: string, body: string) {
    const result = await this.request<EvolutionResponse>(`/message/sendText/${encodeURIComponent(instanceName)}`, { method: "POST", body: { number: to.replace(/\D/g, ""), text: body } });
    if (!result.ok) return result;
    return { ok: true as const, data: { messageId: String(result.data.key?.id ?? result.data.id ?? crypto.randomUUID()) } };
  }

  async configureWebhook(instanceName: string, url: string, secret: string) {
    const result = await this.request<EvolutionResponse>(`/webhook/set/${encodeURIComponent(instanceName)}`, {
      method: "POST",
      body: { webhook: { enabled: true, url, webhookByEvents: false, webhookBase64: false, headers: { "x-webhook-secret": secret }, events: ["CONNECTION_UPDATE", "MESSAGES_UPSERT", "MESSAGES_UPDATE"] } },
    });
    return result.ok ? { ok: true as const, data: undefined } : result;
  }
}

export function getWhatsAppProvider(): WhatsAppProvider {
  const config = useRuntimeConfig();
  if (config.whatsappProvider !== "evolution") throw createError({ statusCode: 503, statusMessage: "اتصال واقعی واتساپ فعال نیست. WHATSAPP_PROVIDER را روی evolution تنظیم کنید." });
  if (!config.whatsappApiUrl || !config.whatsappApiKey) throw createError({ statusCode: 503, statusMessage: "آدرس یا کلید Evolution API در فایل .env تنظیم نشده است." });
  return new EvolutionWhatsAppProvider(config.whatsappApiUrl, config.whatsappApiKey);
}

export class OpenAIProvider implements AIProvider {
  constructor(private readonly apiKey: string, private readonly model: string) {}
  async complete(input: { systemPrompt: string; message: string; temperature?: number; maxTokens?: number }) {
    try {
      const response = await fetch("https://api.openai.com/v1/responses", { method: "POST", headers: { authorization: `Bearer ${this.apiKey}`, "content-type": "application/json" }, body: JSON.stringify({ model: this.model, instructions: input.systemPrompt, input: input.message, temperature: input.temperature, max_output_tokens: input.maxTokens || 500, store: false }), signal: AbortSignal.timeout(30_000) });
      const data = await response.json() as any;
      if (!response.ok) return { ok: false as const, error: data.error?.message || "سرویس هوش مصنوعی پاسخ نداد." };
      const text = data.output_text ?? data.output?.flatMap((item: any) => item.content || []).find((item: any) => item.type === "output_text")?.text;
      if (!text) return { ok: false as const, error: "پاسخ متنی از سرویس AI دریافت نشد." };
      return { ok: true as const, data: { text: String(text), tokens: Number(data.usage?.total_tokens || 0) } };
    } catch { return { ok: false as const, error: "ارتباط با سرویس هوش مصنوعی برقرار نشد." }; }
  }
}
