import makeWASocket, {
    Browsers,
    DisconnectReason,
    downloadMediaMessage,
    useMultiFileAuthState,
    WAMessageStatus,
    type WASocket,
    type WAMessage
} from "@whiskeysockets/baileys";
import {existsSync} from "node:fs";
import {mkdir, readFile, rename, rm, writeFile} from "node:fs/promises";
import {join, resolve} from "node:path";
import QRCode from "qrcode";
import pino from "pino";
import {SocksProxyAgent} from "socks-proxy-agent";
import {HttpsProxyAgent} from "https-proxy-agent";
import {db} from "../utils/db";

type Runtime = {
    socket?: WASocket;
    state: string;
    qr: string | null;
    starting?: Promise<void>;
    reconnectTimer?: ReturnType<typeof setTimeout>;
    reconnectAttempts: number;
    recoveringLoggedOut?: boolean
};
const globalBaileys = globalThis as typeof globalThis & { __hamrahBaileysRuntimes?: Map<string, Runtime> };
const runtimes = globalBaileys.__hamrahBaileysRuntimes ?? new Map<string, Runtime>();
globalBaileys.__hamrahBaileysRuntimes = runtimes;
const storageRoot = resolve(process.cwd(), "storage", "whatsapp");

function safeName(value: string) {
    if (!/^[a-zA-Z0-9_-]+$/.test(value)) throw new Error("شناسه اتصال واتساپ نامعتبر است.");
    return value;
}

function proxyAgent() {
    const config = useRuntimeConfig();
    if (!config.whatsappProxyHost || !config.whatsappProxyPort) return undefined;
    const credentials = config.whatsappProxyUsername ? `${encodeURIComponent(config.whatsappProxyUsername)}:${encodeURIComponent(config.whatsappProxyPassword || "")}@` : "";
    const protocol = String(config.whatsappProxyProtocol || "http").toLowerCase();
    const url = `${protocol}://${credentials}${config.whatsappProxyHost}:${config.whatsappProxyPort}`;
    return protocol.startsWith("socks") ? new SocksProxyAgent(url) : new HttpsProxyAgent(url);
}

function unwrapMessage(msg: WAMessage["message"]): any {
    if (!msg) return null;
    let current: any = msg;
    while (
        current?.ephemeralMessage?.message ||
        current?.viewOnceMessage?.message ||
        current?.viewOnceMessageV2?.message ||
        current?.viewOnceMessageV2Extension?.message ||
        current?.documentWithCaptionMessage?.message
    ) {
        current =
            current.ephemeralMessage?.message ||
            current.viewOnceMessage?.message ||
            current.viewOnceMessageV2?.message ||
            current.viewOnceMessageV2Extension?.message ||
            current.documentWithCaptionMessage?.message;
    }
    return current;
}

function textOf(rawMessage: WAMessage["message"]): string | null {
    const msg = unwrapMessage(rawMessage);
    if (!msg) return null;
    return (
        msg.conversation ??
        msg.extendedTextMessage?.text ??
        msg.imageMessage?.caption ??
        msg.videoMessage?.caption ??
        msg.documentMessage?.caption ??
        msg.buttonsResponseMessage?.selectedDisplayText ??
        msg.templateButtonReplyMessage?.selectedDisplayText ??
        msg.listResponseMessage?.title ??
        (msg.audioMessage ? "پیام صوتی" : null) ??
        (msg.stickerMessage ? "استیکر" : null) ??
        (msg.locationMessage ? "موقعیت مکانی" : null) ??
        (msg.contactMessage ? "مخاطب" : null) ??
        null
    );
}

async function saveIncomingMedia(message: WAMessage) {
    const content = unwrapMessage(message.message);
    const image = content?.imageMessage;
    const document = content?.documentMessage;
    const audio = content?.audioMessage;
    const media = image || document || audio;
    if (!media) return null;
    const size = Number(media.fileLength || 0);
    if (size > 10 * 1024 * 1024) return null;
    const mime = media.mimetype || (image ? "image/jpeg" : audio ? "audio/ogg" : "application/octet-stream");
    const extensions: Record<string, string> = {
        "image/jpeg": ".jpg",
        "image/png": ".png",
        "image/webp": ".webp",
        "application/pdf": ".pdf",
        "text/plain": ".txt",
        "audio/ogg": ".ogg",
        "audio/ogg; codecs=opus": ".ogg",
        "audio/mp4": ".m4a"
    };
    const extension = extensions[mime] || (image ? ".jpg" : audio ? ".ogg" : ".bin");
    const data = await downloadMediaMessage(message, "buffer", {});
    if (data.length > 10 * 1024 * 1024) return null;
    const storedName = `${crypto.randomUUID()}${extension}`;
    const directory = join(process.cwd(), "storage", "chat-media");
    await mkdir(directory, {recursive: true});
    await writeFile(join(directory, storedName), data);
    return {
        type: image ? "image" as const : "document" as const,
        mediaUrl: storedName,
        body: image?.caption || document?.caption || document?.fileName || (image ? "تصویر" : audio ? "پیام صوتی" : "فایل پیوست")
    };
}

async function updateConnection(instanceName: string, state: string, phone?: string, loggedOut = false) {
    const session = await db.whatsAppSession.findUnique({where: {externalId: instanceName}});
    if (!session) return;
    // Network/proxy restarts are temporary. Only a real WhatsApp logout or an
    // explicit user disconnect should make the persisted session disconnected.
    const status = state === "open" ? "CONNECTED" : loggedOut ? "DISCONNECTED" : "CONNECTING";
    await db.whatsAppSession.update({
        where: {id: session.id},
        data: {
            status,
            phoneNumber: phone || session.phoneNumber,
            ...(status === "CONNECTED" ? {
                metadata: {
                    ...(session.metadata as object || {}),
                    explicitDisconnected: false
                }
            } : {}),
            connectedAt: status === "CONNECTED" ? (session.connectedAt || new Date()) : session.connectedAt,
            lastSeenAt: new Date()
        }
    });
    if (status !== session.status && (status === "CONNECTED" || status === "DISCONNECTED")) {
        await db.notification.create({
            data: {
                userId: session.userId,
                type: status === "CONNECTED" ? "whatsapp.connected" : "whatsapp.disconnected",
                title: status === "CONNECTED" ? "واتساپ متصل شد" : "اتصال واتساپ قطع شد",
                body: session.displayName || phone || "واتساپ",
                href: "/dashboard/whatsapp"
            }
        });
        const {dispatchUserWebhooks} = await import("./automations");
        void dispatchUserWebhooks(session.userId, status === "CONNECTED" ? "whatsapp.connected" : "whatsapp.disconnected", {
            sessionId: session.id,
            status
        });
    }
}

async function cleanStaleAuthDirectory(targetDir: string) {
    try {
        const credsPath = join(targetDir, "creds.json");
        if (existsSync(credsPath)) {
            const raw = await readFile(credsPath, "utf8");
            const parsed = JSON.parse(raw);
            if (parsed.registered === false && parsed.me) {
                await rm(targetDir, {recursive: true, force: true});
            }
        }
    } catch {
        // ignore cleanup error
    }
}

async function boot(instanceName: string, runtime: Runtime) {
    const authDir = join(storageRoot, safeName(instanceName));
    await cleanStaleAuthDirectory(authDir);
    const {state, saveCreds} = await useMultiFileAuthState(authDir);
    const agent = proxyAgent();
    const socket = makeWASocket({
        auth: state,
        logger: pino({level: "silent"}),
        browser: Browsers.ubuntu("Hamrah Chat"),
        markOnlineOnConnect: false,
        syncFullHistory: false,
        ...(agent ? {agent: agent as any, fetchAgent: agent as any} : {}),
    });
    runtime.socket = socket;
    runtime.state = "connecting";
    socket.ev.on("creds.update", saveCreds);
    socket.ev.on("connection.update", async update => {
        // Events from a replaced socket must never mutate the current runtime
        // or start another reconnect loop.
        if (runtime.socket !== socket) return;
        if (update.qr) runtime.qr = await QRCode.toDataURL(update.qr, {margin: 1, width: 360});
        if (update.connection) runtime.state = update.connection;
        if (update.connection === "open") {
            clearTimeout(runtime.reconnectTimer);
            runtime.reconnectTimer = undefined;
            runtime.reconnectAttempts = 0;
            runtime.recoveringLoggedOut = false;
            runtime.qr = null;
            await updateConnection(instanceName, "open", socket.user?.id?.split(":")[0]);
        }
        if (update.connection === "close") {
            const code = (update.lastDisconnect?.error as any)?.output?.statusCode;
            const isDeadSession = code === DisconnectReason.loggedOut || code === DisconnectReason.connectionReplaced || code === 401 || code === 440;
            await updateConnection(instanceName, "close", undefined, isDeadSession);
            if (runtime.socket !== socket) return;
            if (isDeadSession && !runtime.recoveringLoggedOut) {
                runtime.recoveringLoggedOut = true;
                const authDirectory = resolve(storageRoot, safeName(instanceName));
                const backupDirectory = resolve(storageRoot, `${safeName(instanceName)}-logged-out-${Date.now()}`);
                if (authDirectory.startsWith(`${storageRoot}\\`) || authDirectory.startsWith(`${storageRoot}/`)) {
                    await rename(authDirectory, backupDirectory).catch(() => undefined);
                }
                runtime.reconnectTimer = setTimeout(() => {
                    runtime.reconnectTimer = undefined;
                    if (runtime.socket === socket) {
                        runtime.socket = undefined;
                    }
                }, 1_000);
            } else if (!isDeadSession) {
                clearTimeout(runtime.reconnectTimer);
                runtime.reconnectAttempts += 1;
                const delay = Math.min(60_000, 2_000 * 2 ** Math.min(runtime.reconnectAttempts - 1, 5));
                runtime.reconnectTimer = setTimeout(() => {
                    runtime.reconnectTimer = undefined;
                    if (runtime.socket === socket && runtime.state === "close") void startBaileysSession(instanceName, true);
                }, delay);
            }
        }
    });
    socket.ev.on("messages.upsert", async ({messages}) => {
        const {recordWhatsAppMessage} = await import("./whatsapp-events");
        for (const message of messages) {
            const originalJid = message.key.remoteJid;
            if (!originalJid || originalJid === "status@broadcast" || originalJid.endsWith("@g.us")) continue;
            if (!message.message) continue;

            const content = unwrapMessage(message.message);
            if (content?.protocolMessage || content?.reactionMessage || content?.pollUpdateMessage) continue;

            const media = await saveIncomingMedia(message).catch(() => null);
            const body = textOf(message.message) || media?.body;
            let remoteJid = message.key.remoteJidAlt || originalJid;
            if (remoteJid?.endsWith("@lid") && socket.signalRepository?.lidMapping?.getPNForLID) {
                const pn = await socket.signalRepository.lidMapping.getPNForLID(remoteJid).catch(() => null);
                if (pn) remoteJid = pn;
            }
            if (body && remoteJid) {
                await recordWhatsAppMessage({
                    externalId: instanceName,
                    messageId: message.key.id,
                    remoteJid,
                    originalJid: originalJid || undefined,
                    fromMe: !!message.key.fromMe,
                    pushName: message.pushName,
                    body,
                    type: media?.type || "text",
                    mediaUrl: media?.mediaUrl,
                    timestamp: Number(message.messageTimestamp || 0) || undefined
                }).catch(err => {
                    console.error("[WhatsApp] Error recording message:", err);
                });
            }
        }
    });
    socket.ev.on("messages.update", async updates => {
        for (const {key, update} of updates) {
            if (!key.id || !key.fromMe || typeof update.status !== "number") continue;
            const nextStatus = update.status === WAMessageStatus.ERROR
                ? "FAILED"
                : update.status >= WAMessageStatus.READ
                    ? "READ"
                    : update.status >= WAMessageStatus.DELIVERY_ACK
                        ? "DELIVERED"
                        : update.status >= WAMessageStatus.SERVER_ACK
                            ? "SENT"
                            : "PENDING";
            // Delivery events can arrive out of order. Never replace a more
            // advanced state (READ/DELIVERED) with an older acknowledgement.
            const allowedCurrent = nextStatus === "READ"
                ? ["PENDING", "SENT", "DELIVERED", "READ"]
                : nextStatus === "DELIVERED"
                    ? ["PENDING", "SENT", "DELIVERED"]
                    : nextStatus === "SENT"
                        ? ["PENDING", "SENT"]
                        : nextStatus === "FAILED"
                            ? ["PENDING", "SENT", "FAILED"]
                            : ["PENDING"];
            await db.message.updateMany({
                where: {externalId: key.id, direction: "OUTBOUND", status: {in: allowedCurrent}},
                data: {status: nextStatus}
            });
        }
    });
}

export async function startBaileysSession(instanceName: string, force = false) {
    const name = safeName(instanceName);
    let runtime = runtimes.get(name);
    if (!runtime) {
        runtime = {state: "connecting", qr: null, reconnectAttempts: 0};
        runtimes.set(name, runtime);
    }
    if (runtime.state === "close" && !runtime.starting) force = true;
    if (force) {
        clearTimeout(runtime.reconnectTimer);
        runtime.reconnectTimer = undefined;
        const previousSocket = runtime.socket;
        runtime.socket = undefined;
        runtime.starting = undefined;
        runtime.qr = null;
        previousSocket?.end(undefined);
    }
    if (!runtime.socket && !runtime.starting) {
        runtime.starting = boot(name, runtime).finally(() => {
            runtime!.starting = undefined;
        });
    }
    await runtime.starting;
    return runtime;
}

export function getBaileysState(instanceName: string) {
    const name = safeName(instanceName);
    const runtime = runtimes.get(name);
    if (!runtime) return "close";
    return runtime.state;
}

export async function waitForBaileysState(instanceName: string, timeout = 12_000, forceStart = false) {
    const name = safeName(instanceName);
    const runtime = await startBaileysSession(name, forceStart);
    const until = Date.now() + timeout;
    while (!runtime.qr && runtime.state !== "open" && Date.now() < until) {
        await new Promise(resolve => setTimeout(resolve, 200));
    }
    return {qr: runtime.qr, state: runtime.state};
}

export async function sendBaileysMessage(instanceName: string, to: string, body: string) {
    const runtime = await startBaileysSession(instanceName);
    if (runtime.state !== "open" || !runtime.socket) throw new Error("واتساپ هنوز متصل نیست؛ ابتدا QR را اسکن کنید.");
    const phone = to.replace(/\D/g, "");
    const result = await runtime.socket.sendMessage(`${phone}@s.whatsapp.net`, {text: body});
    return result?.key.id || crypto.randomUUID();
}

export async function sendBaileysMedia(instanceName: string, to: string, media: {
    data: Buffer;
    mimeType: string;
    fileName: string;
    caption?: string;
    voiceNote?: boolean
}) {
    const runtime = await startBaileysSession(instanceName);
    if (runtime.state !== "open" || !runtime.socket) throw new Error("واتساپ هنوز متصل نیست.");
    const jid = `${to.replace(/\D/g, "")}@s.whatsapp.net`;
    const content = media.voiceNote
        ? {audio: media.data, mimetype: media.mimeType, ptt: true}
        : media.mimeType.startsWith("image/")
            ? {image: media.data, caption: media.caption, mimetype: media.mimeType}
            : {document: media.data, fileName: media.fileName, mimetype: media.mimeType, caption: media.caption};
    const result = await runtime.socket.sendMessage(jid, content as any);
    return result?.key.id || crypto.randomUUID();
}

export async function markBaileysMessagesRead(instanceName: string, to: string, messageIds: string[]) {
    if (!messageIds.length) return;
    const runtime = await startBaileysSession(instanceName);
    if (runtime.state !== "open" || !runtime.socket) return;
    const remoteJid = `${to.replace(/\D/g, "")}@s.whatsapp.net`;
    await runtime.socket.readMessages(messageIds.map(id => ({remoteJid, id, fromMe: false})));
}

export async function logoutBaileysSession(instanceName: string) {
    const name = safeName(instanceName);
    const runtime = runtimes.get(name);
    clearTimeout(runtime?.reconnectTimer);
    try {
        await runtime?.socket?.logout();
    } catch {
        runtime?.socket?.end(undefined);
    }
    runtimes.delete(name);
    const target = resolve(storageRoot, name);
    if (!target.startsWith(`${storageRoot}\\`) && !target.startsWith(`${storageRoot}/`)) throw new Error("مسیر سشن نامعتبر است.");
    await rm(target, {recursive: true, force: true});
}
