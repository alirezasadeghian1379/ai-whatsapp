"use strict";
import makeWASocket, {
  Browsers,
  DisconnectReason,
  downloadMediaMessage,
  useMultiFileAuthState,
  WAMessageStatus
} from "@whiskeysockets/baileys";
import { existsSync } from "node:fs";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import QRCode from "qrcode";
import pino from "pino";
import { SocksProxyAgent } from "socks-proxy-agent";
import { HttpsProxyAgent } from "https-proxy-agent";
import { db } from "../utils/db";
const globalBaileys = globalThis;
const runtimes = globalBaileys.__hamrahBaileysRuntimes ?? /* @__PURE__ */ new Map();
globalBaileys.__hamrahBaileysRuntimes = runtimes;
const storageRoot = resolve(process.cwd(), "storage", "whatsapp");
function safeName(value) {
  if (!/^[a-zA-Z0-9_-]+$/.test(value)) throw new Error("\u0634\u0646\u0627\u0633\u0647 \u0627\u062A\u0635\u0627\u0644 \u0648\u0627\u062A\u0633\u0627\u067E \u0646\u0627\u0645\u0639\u062A\u0628\u0631 \u0627\u0633\u062A.");
  return value;
}
function proxyAgent() {
  const config = useRuntimeConfig();
  if (!config.whatsappProxyHost || !config.whatsappProxyPort) return void 0;
  const credentials = config.whatsappProxyUsername ? `${encodeURIComponent(config.whatsappProxyUsername)}:${encodeURIComponent(config.whatsappProxyPassword || "")}@` : "";
  const protocol = String(config.whatsappProxyProtocol || "http").toLowerCase();
  const url = `${protocol}://${credentials}${config.whatsappProxyHost}:${config.whatsappProxyPort}`;
  return protocol.startsWith("socks") ? new SocksProxyAgent(url) : new HttpsProxyAgent(url);
}
function unwrapMessage(msg) {
  if (!msg) return null;
  let current = msg;
  while (current?.ephemeralMessage?.message || current?.viewOnceMessage?.message || current?.viewOnceMessageV2?.message || current?.viewOnceMessageV2Extension?.message || current?.documentWithCaptionMessage?.message) {
    current = current.ephemeralMessage?.message || current.viewOnceMessage?.message || current.viewOnceMessageV2?.message || current.viewOnceMessageV2Extension?.message || current.documentWithCaptionMessage?.message;
  }
  return current;
}
function textOf(rawMessage) {
  const msg = unwrapMessage(rawMessage);
  if (!msg) return null;
  return msg.conversation ?? msg.extendedTextMessage?.text ?? msg.imageMessage?.caption ?? msg.videoMessage?.caption ?? msg.documentMessage?.caption ?? msg.buttonsResponseMessage?.selectedDisplayText ?? msg.templateButtonReplyMessage?.selectedDisplayText ?? msg.listResponseMessage?.title ?? (msg.audioMessage ? "\u067E\u06CC\u0627\u0645 \u0635\u0648\u062A\u06CC" : null) ?? (msg.stickerMessage ? "\u0627\u0633\u062A\u06CC\u06A9\u0631" : null) ?? (msg.locationMessage ? "\u0645\u0648\u0642\u0639\u06CC\u062A \u0645\u06A9\u0627\u0646\u06CC" : null) ?? (msg.contactMessage ? "\u0645\u062E\u0627\u0637\u0628" : null) ?? null;
}
async function saveIncomingMedia(message) {
  const content = unwrapMessage(message.message);
  const image = content?.imageMessage;
  const document = content?.documentMessage;
  const audio = content?.audioMessage;
  const media = image || document || audio;
  if (!media) return null;
  const size = Number(media.fileLength || 0);
  if (size > 10 * 1024 * 1024) return null;
  const mime = media.mimetype || (image ? "image/jpeg" : audio ? "audio/ogg" : "application/octet-stream");
  const extensions = {
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
  await mkdir(directory, { recursive: true });
  await writeFile(join(directory, storedName), data);
  return {
    type: image ? "image" : "document",
    mediaUrl: storedName,
    body: image?.caption || document?.caption || document?.fileName || (image ? "\u062A\u0635\u0648\u06CC\u0631" : audio ? "\u067E\u06CC\u0627\u0645 \u0635\u0648\u062A\u06CC" : "\u0641\u0627\u06CC\u0644 \u067E\u06CC\u0648\u0633\u062A")
  };
}
async function updateConnection(instanceName, state, phone, loggedOut = false) {
  const session = await db.whatsAppSession.findUnique({ where: { externalId: instanceName } });
  if (!session) return;
  const status = state === "open" ? "CONNECTED" : loggedOut ? "DISCONNECTED" : "CONNECTING";
  await db.whatsAppSession.update({
    where: { id: session.id },
    data: {
      status,
      phoneNumber: phone || session.phoneNumber,
      ...status === "CONNECTED" ? {
        metadata: {
          ...session.metadata || {},
          explicitDisconnected: false
        }
      } : {},
      connectedAt: status === "CONNECTED" ? session.connectedAt || /* @__PURE__ */ new Date() : session.connectedAt,
      lastSeenAt: /* @__PURE__ */ new Date()
    }
  });
  if (status !== session.status && (status === "CONNECTED" || status === "DISCONNECTED")) {
    await db.notification.create({
      data: {
        userId: session.userId,
        type: status === "CONNECTED" ? "whatsapp.connected" : "whatsapp.disconnected",
        title: status === "CONNECTED" ? "\u0648\u0627\u062A\u0633\u0627\u067E \u0645\u062A\u0635\u0644 \u0634\u062F" : "\u0627\u062A\u0635\u0627\u0644 \u0648\u0627\u062A\u0633\u0627\u067E \u0642\u0637\u0639 \u0634\u062F",
        body: session.displayName || phone || "\u0648\u0627\u062A\u0633\u0627\u067E",
        href: "/dashboard/whatsapp"
      }
    });
    const { dispatchUserWebhooks } = await import("./automations");
    void dispatchUserWebhooks(session.userId, status === "CONNECTED" ? "whatsapp.connected" : "whatsapp.disconnected", {
      sessionId: session.id,
      status
    });
  }
}
async function cleanStaleAuthDirectory(targetDir) {
  try {
    const credsPath = join(targetDir, "creds.json");
    if (existsSync(credsPath)) {
      const raw = await readFile(credsPath, "utf8");
      const parsed = JSON.parse(raw);
      if (parsed.registered === false && parsed.me) {
        await rm(targetDir, { recursive: true, force: true });
      }
    }
  } catch {
  }
}
async function boot(instanceName, runtime) {
  const authDir = join(storageRoot, safeName(instanceName));
  await cleanStaleAuthDirectory(authDir);
  const { state, saveCreds } = await useMultiFileAuthState(authDir);
  const agent = proxyAgent();
  const socket = makeWASocket({
    auth: state,
    logger: pino({ level: "silent" }),
    browser: Browsers.ubuntu("Hamrah Chat"),
    markOnlineOnConnect: false,
    syncFullHistory: false,
    ...agent ? { agent, fetchAgent: agent } : {}
  });
  runtime.socket = socket;
  runtime.state = "connecting";
  socket.ev.on("creds.update", saveCreds);
  socket.ev.on("connection.update", async (update) => {
    if (runtime.socket !== socket) return;
    if (update.qr) runtime.qr = await QRCode.toDataURL(update.qr, { margin: 1, width: 360 });
    if (update.connection) runtime.state = update.connection;
    if (update.connection === "open") {
      clearTimeout(runtime.reconnectTimer);
      runtime.reconnectTimer = void 0;
      runtime.reconnectAttempts = 0;
      runtime.recoveringLoggedOut = false;
      runtime.qr = null;
      await updateConnection(instanceName, "open", socket.user?.id?.split(":")[0]);
    }
    if (update.connection === "close") {
      const code = update.lastDisconnect?.error?.output?.statusCode;
      const isDeadSession = code === DisconnectReason.loggedOut || code === DisconnectReason.connectionReplaced || code === 401 || code === 440;
      await updateConnection(instanceName, "close", void 0, isDeadSession);
      if (runtime.socket !== socket) return;
      if (isDeadSession && !runtime.recoveringLoggedOut) {
        runtime.recoveringLoggedOut = true;
        const authDirectory = resolve(storageRoot, safeName(instanceName));
        const backupDirectory = resolve(storageRoot, `${safeName(instanceName)}-logged-out-${Date.now()}`);
        if (authDirectory.startsWith(`${storageRoot}\\`) || authDirectory.startsWith(`${storageRoot}/`)) {
          await rename(authDirectory, backupDirectory).catch(() => void 0);
        }
        runtime.reconnectTimer = setTimeout(() => {
          runtime.reconnectTimer = void 0;
          if (runtime.socket === socket) {
            runtime.socket = void 0;
          }
        }, 1e3);
      } else if (!isDeadSession) {
        clearTimeout(runtime.reconnectTimer);
        runtime.reconnectAttempts += 1;
        const delay = Math.min(6e4, 2e3 * 2 ** Math.min(runtime.reconnectAttempts - 1, 5));
        runtime.reconnectTimer = setTimeout(() => {
          runtime.reconnectTimer = void 0;
          if (runtime.socket === socket && runtime.state === "close") void startBaileysSession(instanceName, true);
        }, delay);
      }
    }
  });
  socket.ev.on("messages.upsert", async ({ messages }) => {
    const { recordWhatsAppMessage } = await import("./whatsapp-events");
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
          originalJid: originalJid || void 0,
          fromMe: !!message.key.fromMe,
          pushName: message.pushName,
          body,
          type: media?.type || "text",
          mediaUrl: media?.mediaUrl,
          timestamp: Number(message.messageTimestamp || 0) || void 0
        }).catch((err) => {
          console.error("[WhatsApp] Error recording message:", err);
        });
      }
    }
  });
  socket.ev.on("messages.update", async (updates) => {
    for (const { key, update } of updates) {
      if (!key.id || !key.fromMe || typeof update.status !== "number") continue;
      const nextStatus = update.status === WAMessageStatus.ERROR ? "FAILED" : update.status >= WAMessageStatus.READ ? "READ" : update.status >= WAMessageStatus.DELIVERY_ACK ? "DELIVERED" : update.status >= WAMessageStatus.SERVER_ACK ? "SENT" : "PENDING";
      const allowedCurrent = nextStatus === "READ" ? ["PENDING", "SENT", "DELIVERED", "READ"] : nextStatus === "DELIVERED" ? ["PENDING", "SENT", "DELIVERED"] : nextStatus === "SENT" ? ["PENDING", "SENT"] : nextStatus === "FAILED" ? ["PENDING", "SENT", "FAILED"] : ["PENDING"];
      await db.message.updateMany({
        where: { externalId: key.id, direction: "OUTBOUND", status: { in: allowedCurrent } },
        data: { status: nextStatus }
      });
    }
  });
}
export async function startBaileysSession(instanceName, force = false) {
  const name = safeName(instanceName);
  let runtime = runtimes.get(name);
  if (!runtime) {
    runtime = { state: "connecting", qr: null, reconnectAttempts: 0 };
    runtimes.set(name, runtime);
  }
  if (runtime.state === "close" && !runtime.starting) force = true;
  if (force) {
    clearTimeout(runtime.reconnectTimer);
    runtime.reconnectTimer = void 0;
    const previousSocket = runtime.socket;
    runtime.socket = void 0;
    runtime.starting = void 0;
    runtime.qr = null;
    previousSocket?.end(void 0);
  }
  if (!runtime.socket && !runtime.starting) {
    runtime.starting = boot(name, runtime).finally(() => {
      runtime.starting = void 0;
    });
  }
  await runtime.starting;
  return runtime;
}
export function getBaileysState(instanceName) {
  const name = safeName(instanceName);
  const runtime = runtimes.get(name);
  if (!runtime) return "close";
  return runtime.state;
}
export async function waitForBaileysState(instanceName, timeout = 12e3, forceStart = false) {
  const name = safeName(instanceName);
  const runtime = await startBaileysSession(name, forceStart);
  const until = Date.now() + timeout;
  while (!runtime.qr && runtime.state !== "open" && Date.now() < until) {
    await new Promise((resolve2) => setTimeout(resolve2, 200));
  }
  return { qr: runtime.qr, state: runtime.state };
}
export async function sendBaileysMessage(instanceName, to, body) {
  const runtime = await startBaileysSession(instanceName);
  if (runtime.state !== "open" || !runtime.socket) throw new Error("\u0648\u0627\u062A\u0633\u0627\u067E \u0647\u0646\u0648\u0632 \u0645\u062A\u0635\u0644 \u0646\u06CC\u0633\u062A\u061B \u0627\u0628\u062A\u062F\u0627 QR \u0631\u0627 \u0627\u0633\u06A9\u0646 \u06A9\u0646\u06CC\u062F.");
  const phone = to.replace(/\D/g, "");
  const result = await runtime.socket.sendMessage(`${phone}@s.whatsapp.net`, { text: body });
  return result?.key.id || crypto.randomUUID();
}
export async function sendBaileysMedia(instanceName, to, media) {
  const runtime = await startBaileysSession(instanceName);
  if (runtime.state !== "open" || !runtime.socket) throw new Error("\u0648\u0627\u062A\u0633\u0627\u067E \u0647\u0646\u0648\u0632 \u0645\u062A\u0635\u0644 \u0646\u06CC\u0633\u062A.");
  const jid = `${to.replace(/\D/g, "")}@s.whatsapp.net`;
  const content = media.voiceNote ? { audio: media.data, mimetype: media.mimeType, ptt: true } : media.mimeType.startsWith("image/") ? { image: media.data, caption: media.caption, mimetype: media.mimeType } : { document: media.data, fileName: media.fileName, mimetype: media.mimeType, caption: media.caption };
  const result = await runtime.socket.sendMessage(jid, content);
  return result?.key.id || crypto.randomUUID();
}
export async function markBaileysMessagesRead(instanceName, to, messageIds) {
  if (!messageIds.length) return;
  const runtime = await startBaileysSession(instanceName);
  if (runtime.state !== "open" || !runtime.socket) return;
  const remoteJid = `${to.replace(/\D/g, "")}@s.whatsapp.net`;
  await runtime.socket.readMessages(messageIds.map((id) => ({ remoteJid, id, fromMe: false })));
}
export async function logoutBaileysSession(instanceName) {
  const name = safeName(instanceName);
  const runtime = runtimes.get(name);
  clearTimeout(runtime?.reconnectTimer);
  try {
    await runtime?.socket?.logout();
  } catch {
    runtime?.socket?.end(void 0);
  }
  runtimes.delete(name);
  const target = resolve(storageRoot, name);
  if (!target.startsWith(`${storageRoot}\\`) && !target.startsWith(`${storageRoot}/`)) throw new Error("\u0645\u0633\u06CC\u0631 \u0633\u0634\u0646 \u0646\u0627\u0645\u0639\u062A\u0628\u0631 \u0627\u0633\u062A.");
  await rm(target, { recursive: true, force: true });
}
