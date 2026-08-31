<script setup lang="ts">
import { AlertCircle, CheckCircle2, LoaderCircle, MessageSquareText, Plus, QrCode, RefreshCw, Send, Smartphone, Unplug, Wifi, WifiOff } from "lucide-vue-next";

definePageMeta({ layout: "dashboard", middleware: "auth" });
const { tr } = useAppPreferences();
type Session = { id: string; externalId: string; phoneNumber: string | null; displayName: string | null; status: string; provider: string; connectedAt: string | null; lastSeenAt: string | null };
const { data, error: loadError, status, refresh } = await useFetch<{ sessions: Session[] }>("/api/whatsapp/sessions");
const sessions = computed(() => data.value?.sessions ?? []);
const showCreate = ref(false), showQr = ref(false), showSend = ref(false), busy = ref(false);
const connectionName = ref("واتساپ فروش"), qrImage = ref<string | null>(null), activeId = ref<string | null>(null);
const destination = ref(""), messageBody = ref(""), notice = ref(""), actionError = ref("");
let refreshTimer: ReturnType<typeof setInterval> | undefined;

function apiError(error: any) { return error?.data?.statusMessage || error?.data?.message || error?.message || tr("عملیات انجام نشد.", "The operation failed."); }
function date(value: string | null) { return value ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "—"; }
function resetFeedback() { notice.value = ""; actionError.value = ""; }

async function createConnection() {
  resetFeedback(); busy.value = true;
  try {
    const result = await $fetch<{ session: Session; qr: string | null; webhookWarning: string | null }>("/api/whatsapp/sessions", { method: "POST", body: { displayName: connectionName.value } });
    showCreate.value = false; activeId.value = result.session.id; qrImage.value = result.qr; showQr.value = true;
    notice.value = result.webhookWarning || tr("اتصال ساخته شد؛ کد را با واتساپ اسکن کنید.", "Connection created. Scan the code with WhatsApp.");
    await refresh();
  } catch (error) { actionError.value = apiError(error); } finally { busy.value = false; }
}

async function openQr(id: string) {
  resetFeedback(); busy.value = true; activeId.value = id; showQr.value = true; qrImage.value = null;
  try {
    const result = await $fetch<{ qr: string | null; status: string }>(`/api/whatsapp/sessions/${id}/qr`);
    qrImage.value = result.qr;
    if (!result.qr && result.status === "CONNECTED") notice.value = tr("این شماره هم‌اکنون متصل است.", "This number is already connected.");
    else if (!result.qr) actionError.value = tr("هنوز QR تولید نشده؛ چند ثانیه دیگر دوباره تلاش کنید.", "QR is not ready yet. Try again in a few seconds.");
    await refresh();
  } catch (error) { actionError.value = apiError(error); } finally { busy.value = false; }
}

async function disconnect(id: string) {
  resetFeedback(); busy.value = true;
  try {
    await $fetch(`/api/whatsapp/sessions/${id}/disconnect`, { method: "POST" });
    notice.value = tr("اتصال با موفقیت قطع شد.", "Connection disconnected successfully."); await refresh();
  } catch (error) { actionError.value = apiError(error); } finally { busy.value = false; }
}

function openSend(id: string) { resetFeedback(); activeId.value = id; destination.value = ""; messageBody.value = ""; showSend.value = true; }
async function sendTest() {
  if (!activeId.value) return; resetFeedback(); busy.value = true;
  try {
    await $fetch("/api/whatsapp/send", { method: "POST", body: { sessionId: activeId.value, to: destination.value, body: messageBody.value } });
    showSend.value = false; notice.value = tr("پیام واقعاً از واتساپ شما ارسال شد.", "The message was sent from your WhatsApp.");
  } catch (error) { actionError.value = apiError(error); } finally { busy.value = false; }
}

onMounted(() => { refreshTimer = setInterval(() => refresh(), 12_000); });
onBeforeUnmount(() => clearInterval(refreshTimer));
</script>

<template>
  <div>
    <PageHeader :title="tr('اتصال واتساپ', 'WhatsApp connections')" :description="tr('شماره واقعی واتساپ را با QR متصل کنید، وضعیت را زنده ببینید و پیام آزمایشی بفرستید.', 'Connect a real WhatsApp number using QR, monitor its live state, and send a test message.')">
      <button class="btn btn-primary" @click="resetFeedback(); showCreate = true"><Plus :size="17" />{{ tr('افزودن شماره', 'Add number') }}</button>
    </PageHeader>

    <div v-if="notice" class="mb-5 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"><CheckCircle2 class="mt-0.5 shrink-0" :size="19" />{{ notice }}</div>
    <div v-if="actionError || loadError" class="mb-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"><AlertCircle class="mt-0.5 shrink-0" :size="19" /><span>{{ actionError || apiError(loadError) }}<small class="mt-1 block font-normal">{{ tr('تنظیمات WHATSAPP_API_URL و WHATSAPP_API_KEY را در .env بررسی کنید.', 'Check WHATSAPP_API_URL and WHATSAPP_API_KEY in .env.') }}</small></span></div>

    <div v-if="status === 'pending'" class="surface grid min-h-56 place-items-center"><LoaderCircle class="animate-spin text-brand-500" /></div>
    <div v-else-if="!sessions.length" class="surface grid min-h-72 place-items-center p-8 text-center">
      <div><span class="mx-auto grid size-16 place-items-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-500/10"><Smartphone /></span><h2 class="mt-5 text-lg font-black">{{ tr('هنوز شماره‌ای متصل نیست', 'No number connected yet') }}</h2><p class="muted mt-2 max-w-md">{{ tr('یک اتصال بسازید و QR واقعی را از بخش دستگاه‌های متصل واتساپ اسکن کنید.', 'Create a connection and scan the real QR from WhatsApp Linked Devices.') }}</p><button class="btn btn-primary mt-5" @click="showCreate = true"><Plus :size="17" />{{ tr('ساخت اولین اتصال', 'Create first connection') }}</button></div>
    </div>

    <div v-else class="grid gap-5 lg:grid-cols-2">
      <section v-for="session in sessions" :key="session.id" class="surface p-6 transition hover:-translate-y-0.5 hover:shadow-xl">
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div class="flex items-center gap-4"><span class="grid size-14 place-items-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-500/10"><Smartphone /></span><div><h2 class="font-black">{{ session.displayName || tr('واتساپ کسب‌وکار', 'Business WhatsApp') }}</h2><p class="mt-1 font-mono text-sm text-slate-400" dir="ltr">{{ session.phoneNumber ? `+${session.phoneNumber}` : session.externalId }}</p></div></div>
          <span class="badge" :class="session.status === 'CONNECTED' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10' : session.status === 'CONNECTING' ? 'bg-amber-50 text-amber-600 dark:bg-amber-500/10' : 'bg-red-50 text-red-600 dark:bg-red-500/10'">
            <Wifi v-if="session.status === 'CONNECTED'" :size="14" /><RefreshCw v-else-if="session.status === 'CONNECTING'" :size="14" class="animate-spin" /><WifiOff v-else :size="14" />
            {{ session.status === 'CONNECTED' ? tr('متصل', 'Connected') : session.status === 'CONNECTING' ? tr('در انتظار QR', 'Waiting for QR') : tr('قطع', 'Disconnected') }}
          </span>
        </div>
        <dl class="mt-6 grid gap-4 rounded-2xl bg-slate-50 p-5 text-sm dark:bg-slate-800 sm:grid-cols-2"><div><dt class="text-slate-400">Provider</dt><dd class="mt-2 font-bold">Evolution API</dd></div><div><dt class="text-slate-400">{{ tr('آخرین بروزرسانی', 'Last update') }}</dt><dd class="mt-2 font-bold">{{ date(session.lastSeenAt) }}</dd></div></dl>
        <div class="mt-6 flex flex-wrap gap-2"><button v-if="session.status === 'CONNECTED'" class="btn btn-primary" :disabled="busy" @click="openSend(session.id)"><Send :size="17" />{{ tr('ارسال پیام', 'Send message') }}</button><button v-else class="btn btn-primary" :disabled="busy" @click="openQr(session.id)"><QrCode :size="17" />{{ tr('نمایش QR', 'Show QR') }}</button><button v-if="session.status === 'CONNECTED'" class="btn btn-secondary" :disabled="busy" @click="disconnect(session.id)"><Unplug :size="17" />{{ tr('قطع اتصال', 'Disconnect') }}</button></div>
      </section>
    </div>

    <AppModal :open="showCreate" :title="tr('اتصال شماره جدید', 'Connect a new number')" @close="showCreate = false">
      <form class="space-y-4" @submit.prevent="createConnection"><label class="block text-sm font-bold">{{ tr('نام اتصال', 'Connection name') }}<input v-model="connectionName" class="input mt-2" required minlength="2" maxlength="60" /></label><p class="muted text-sm">{{ tr('بعد از ساخت، QR واقعی نمایش داده می‌شود. در واتساپ به دستگاه‌های متصل بروید و آن را اسکن کنید.', 'A real QR appears after creation. Open Linked Devices in WhatsApp and scan it.') }}</p><button class="btn btn-primary w-full" :disabled="busy"><LoaderCircle v-if="busy" :size="17" class="animate-spin" /><Plus v-else :size="17" />{{ tr('ساخت اتصال و دریافت QR', 'Create and get QR') }}</button></form>
    </AppModal>

    <AppModal :open="showQr" :title="tr('اسکن کد QR واقعی', 'Scan real QR code')" @close="showQr = false">
      <div class="grid min-h-72 place-items-center rounded-2xl bg-white p-6"><img v-if="qrImage" :src="qrImage" :alt="tr('کد اتصال واتساپ', 'WhatsApp connection QR')" class="size-64 object-contain" /><LoaderCircle v-else-if="busy" class="animate-spin text-brand-500" :size="38" /><QrCode v-else class="text-slate-300" :size="150" /></div><p class="muted mt-4 text-center">{{ tr('واتساپ ← تنظیمات ← دستگاه‌های متصل ← اتصال دستگاه', 'WhatsApp → Settings → Linked Devices → Link a Device') }}</p><button v-if="activeId" class="btn btn-secondary mt-4 w-full" :disabled="busy" @click="openQr(activeId)"><RefreshCw :size="17" />{{ tr('دریافت QR جدید', 'Get a new QR') }}</button>
    </AppModal>

    <AppModal :open="showSend" :title="tr('ارسال پیام واقعی', 'Send a real message')" @close="showSend = false">
      <form class="space-y-4" @submit.prevent="sendTest"><label class="block text-sm font-bold">{{ tr('شماره مقصد با کد کشور', 'Recipient with country code') }}<input v-model="destination" dir="ltr" class="input mt-2 text-left" placeholder="989121234567" inputmode="tel" required /></label><label class="block text-sm font-bold">{{ tr('متن پیام', 'Message') }}<textarea v-model="messageBody" class="input mt-2 min-h-28 resize-y" maxlength="4096" required /></label><button class="btn btn-primary w-full" :disabled="busy"><LoaderCircle v-if="busy" :size="17" class="animate-spin" /><MessageSquareText v-else :size="17" />{{ tr('ارسال از واتساپ متصل', 'Send from connected WhatsApp') }}</button></form>
    </AppModal>
  </div>
</template>
