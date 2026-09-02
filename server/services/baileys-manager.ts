import makeWASocket, {
    Browsers,
    DisconnectReason,
    useMultiFileAuthState,
    type WASocket,
    type WAMessage
} from "@whiskeysockets/baileys";
import {rm} from "node:fs/promises";
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
    reconnectTimer?: ReturnType<typeof setTimeout>
};
const runtimes = new Map<string, Runtime>();
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

function textOf(message: WAMessage["message"]): string | null {
    if (!message) return null;
    const inner = message.ephemeralMessage?.message || message.viewOnceMessage?.message || message;
    return inner?.conversation ?? inner?.extendedTextMessage?.text ?? inner?.imageMessage?.caption ?? inner?.videoMessage?.caption ?? null;
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
            ...(status === "CONNECTED" ? {metadata: {...(session.metadata as object || {}), explicitDisconnected: false}} : {}),
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

async function boot(instanceName: string, runtime: Runtime) {
    const {state, saveCreds} = await useMultiFileAuthState(join(storageRoot, safeName(instanceName)));
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
        if (update.qr) runtime.qr = await QRCode.toDataURL(update.qr, {margin: 1, width: 360});
        if (update.connection) runtime.state = update.connection;
        if (update.connection === "open") {
            runtime.qr = null;
            await updateConnection(instanceName, "open", socket.user?.id?.split(":")[0]);
        }
        if (update.connection === "close") {
            const code = (update.lastDisconnect?.error as any)?.output?.statusCode;
            await updateConnection(instanceName, "close", undefined, code === DisconnectReason.loggedOut);
            if (code !== DisconnectReason.loggedOut) {
                clearTimeout(runtime.reconnectTimer);
                runtime.reconnectTimer = setTimeout(() => void startBaileysSession(instanceName, true), 1500);
            }
        }
    });
    socket.ev.on("messages.upsert", async ({messages, type}) => {
        if (type !== "notify") return;
        const {recordWhatsAppMessage} = await import("./whatsapp-events");
        for (const message of messages) {
            const body = textOf(message.message);
            const originalJid = message.key.remoteJid;
            let remoteJid = message.key.remoteJidAlt || originalJid;
            if (remoteJid?.endsWith("@lid")) remoteJid = await socket.signalRepository.lidMapping.getPNForLID(remoteJid) || remoteJid;
            if (body && remoteJid) await recordWhatsAppMessage({
                externalId: instanceName,
                messageId: message.key.id,
                remoteJid,
                originalJid: originalJid || undefined,
                fromMe: !!message.key.fromMe,
                pushName: message.pushName,
                body,
                timestamp: Number(message.messageTimestamp || 0) || undefined
            });
        }
    });
}

export async function startBaileysSession(instanceName: string, force = false) {
    let runtime = runtimes.get(instanceName);
    if (!runtime) {
        runtime = {state: "connecting", qr: null};
        runtimes.set(instanceName, runtime);
    }
    if (runtime.state === "close" && !runtime.starting) force = true;
    if (force) {
        runtime.socket?.end(undefined);
        runtime.socket = undefined;
        runtime.starting = undefined;
    }
    if (!runtime.socket && !runtime.starting) runtime.starting = boot(instanceName, runtime).finally(() => {
        runtime!.starting = undefined;
    });
    await runtime.starting;
    return runtime;
}

export async function waitForBaileysState(instanceName: string, timeout = 12_000) {
    const runtime = await startBaileysSession(instanceName);
    const until = Date.now() + timeout;
    while (!runtime.qr && runtime.state !== "open" && Date.now() < until) await new Promise(resolve => setTimeout(resolve, 200));
    return {qr: runtime.qr, state: runtime.state};
}

export async function sendBaileysMessage(instanceName: string, to: string, body: string) {
    const runtime = await startBaileysSession(instanceName);
    if (runtime.state !== "open" || !runtime.socket) throw new Error("واتساپ هنوز متصل نیست؛ ابتدا QR را اسکن کنید.");
    const phone = to.replace(/\D/g, "");
    const result = await runtime.socket.sendMessage(`${phone}@s.whatsapp.net`, {text: body});
    return result?.key.id || crypto.randomUUID();
}

export async function sendBaileysMedia(instanceName:string,to:string,media:{data:Buffer;mimeType:string;fileName:string;caption?:string}) {
    const runtime=await startBaileysSession(instanceName);
    if(runtime.state!=="open"||!runtime.socket)throw new Error("واتساپ هنوز متصل نیست.");
    const jid=`${to.replace(/\D/g,"")}@s.whatsapp.net`;
    const content=media.mimeType.startsWith("image/")
        ? {image:media.data,caption:media.caption,mimetype:media.mimeType}
        : {document:media.data,fileName:media.fileName,mimetype:media.mimeType,caption:media.caption};
    const result=await runtime.socket.sendMessage(jid,content as any);
    return result?.key.id||crypto.randomUUID();
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
