import type {Result} from "./providers";
import {spawn} from "node:child_process";
import {request as httpRequest} from "node:http";
import ffmpegPath from "ffmpeg-static";
import {HttpProxyAgent} from "http-proxy-agent";

const ALLOWED_VOICES = new Set([
    "edge-tts/fa-IR-DilaraNeural",
    "edge-tts/fa-IR-FaridNeural"
]);

function findBase64Audio(value: unknown): string | null {
    if (typeof value === "string") {
        const candidate = value.replace(/^data:audio\/[^;]+;base64,/, "");
        return candidate.length > 100 && /^[A-Za-z0-9+/\r\n]+={0,2}$/.test(candidate) ? candidate : null;
    }
    if (Array.isArray(value)) {
        for (const item of value) {
            const found = findBase64Audio(item);
            if (found) return found;
        }
    }
    if (value && typeof value === "object") {
        const record = value as Record<string, unknown>;
        for (const key of ["audio", "data", "b64_json", "base64", "content"]) {
            const found = findBase64Audio(record[key]);
            if (found) return found;
        }
    }
    return null;
}

function toWhatsAppVoice(data: Buffer): Promise<Buffer> {
    const executable = ffmpegPath;
    if (!executable) return Promise.reject(new Error("مبدل صوتی سرور در دسترس نیست."));
    return new Promise((resolve, reject) => {
        const process = spawn(executable, [
            "-hide_banner", "-loglevel", "error", "-i", "pipe:0", "-vn",
            "-c:a", "libopus", "-b:a", "32k", "-ar", "48000", "-ac", "1",
            "-f", "ogg", "pipe:1"
        ], {stdio: ["pipe", "pipe", "pipe"]});
        const output: Buffer[] = [];
        let errorOutput = "";
        process.stdout.on("data", (chunk: Buffer) => output.push(Buffer.from(chunk)));
        process.stderr.on("data", (chunk: Buffer) => errorOutput += String(chunk).slice(0, 2000));
        process.on("error", reject);
        process.on("close", (code: number | null) => code === 0 && output.length
            ? resolve(Buffer.concat(output))
            : reject(new Error(errorOutput || "تبدیل فرمت صوت ناموفق بود.")));
        process.stdin.end(data);
    });
}

function proxyUrl() {
    const config = useRuntimeConfig();
    if (!config.whatsappProxyHost || !config.whatsappProxyPort) return null;
    const credentials = config.whatsappProxyUsername
        ? `${encodeURIComponent(String(config.whatsappProxyUsername))}:${encodeURIComponent(String(config.whatsappProxyPassword || ""))}@`
        : "";
    return `${config.whatsappProxyProtocol || "http"}://${credentials}${config.whatsappProxyHost}:${config.whatsappProxyPort}`;
}

function requestSpeech(endpoint: URL, apiKey: string, body: string): Promise<{
    status: number;
    contentType: string;
    data: Buffer
}> {
    return new Promise((resolve, reject) => {
        const configuredProxy = proxyUrl();
        const agent = configuredProxy ? new HttpProxyAgent(configuredProxy) : undefined;
        const request = httpRequest(endpoint, {
            method: "POST",
            agent,
            headers: {
                "content-type": "application/json",
                "content-length": Buffer.byteLength(body),
                authorization: `Bearer ${apiKey}`
            }
        }, response => {
            const chunks: Buffer[] = [];
            response.on("data", (chunk: Buffer) => chunks.push(Buffer.from(chunk)));
            response.on("end", () => resolve({
                status: response.statusCode || 500,
                contentType: String(response.headers["content-type"] || ""),
                data: Buffer.concat(chunks)
            }));
        });
        request.setTimeout(30_000, () => request.destroy(new Error("اتصال به سرویس صوتی منقضی شد.")));
        request.on("error", reject);
        request.end(body);
    });
}

export async function synthesizeSpeech(input: string, voice: string): Promise<Result<{
    data: Buffer;
    mimeType: string;
    fileName: string
}>> {
    const config = useRuntimeConfig();
    if (!config.ttsApiKey) return {ok: false, error: "سرویس تبدیل متن به صدا در سرور تنظیم نشده است."};
    if (!ALLOWED_VOICES.has(voice)) return {ok: false, error: "صدای انتخاب‌شده معتبر نیست."};

    try {
        const endpoint = new URL(String(config.ttsApiUrl));
        endpoint.searchParams.set("response_format", "json");
        const response = await requestSpeech(endpoint, String(config.ttsApiKey), JSON.stringify({model: voice, input}));
        if (response.status < 200 || response.status >= 300) return {
            ok: false,
            error: `سرویس صوتی با وضعیت ${response.status} پاسخ داد.`
        };

        const contentType = response.contentType;
        let source: Buffer;
        if (contentType.startsWith("audio/")) source = response.data;
        else {
            const encoded = findBase64Audio(JSON.parse(response.data.toString("utf8")) as unknown);
            if (!encoded) return {ok: false, error: "داده صوتی معتبری از سرویس دریافت نشد."};
            source = Buffer.from(encoded, "base64");
        }
        if (source.length < 100) return {ok: false, error: "فایل صوتی دریافتی خالی یا خراب است."};
        const voiceBuffer = await toWhatsAppVoice(source);
        return {ok: true, data: {data: voiceBuffer, mimeType: "audio/ogg; codecs=opus", fileName: "ai-reply.ogg"}};
    } catch (error) {
        return {ok: false, error: error instanceof Error ? error.message : "تولید پاسخ صوتی ناموفق بود."};
    }
}
