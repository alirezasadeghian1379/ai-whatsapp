<script setup lang="ts">
import { Plus, Smartphone } from "lucide-vue-next"
import type { WhatsAppSession } from "~/types/whatsapp"
import WhatsAppSessionCard from "~/components/whatsapp/SessionCard.vue"
import WhatsAppConnectionDialog from "~/components/whatsapp/ConnectionDialog.vue"
import WhatsAppQrDialog from "~/components/whatsapp/QrDialog.vue"
import WhatsAppSendDialog from "~/components/whatsapp/SendDialog.vue"
definePageMeta({ layout: "dashboard", middleware: "auth" })
const { tr, formatDate } = useAppPreferences()
const sessions=ref<WhatsAppSession[]>([]),pending=ref(true),showCreate=ref(false),showQr=ref(false),showSend=ref(false),busy=ref(false),connectionName=ref("واتساپ فروش"),qrImage=ref<string|null>(null),activeId=ref<string|null>(null),destination=ref(""),messageBody=ref(""),notice=ref(""),actionError=ref("")
let refreshTimer:ReturnType<typeof setInterval>|undefined
const apiError=(e:any)=>e?.data?.statusMessage||e?.data?.message||e?.message||tr("عملیات انجام نشد.","The operation failed.")
function resetFeedback(){notice.value="";actionError.value=""}
async function loadSessions(loader=false){if(loader)pending.value=true;try{sessions.value=(await $fetch<{sessions:WhatsAppSession[]}>("/api/whatsapp/sessions")).sessions}catch(e){actionError.value=apiError(e)}finally{pending.value=false}}
async function createConnection(){resetFeedback();busy.value=true;try{const r=await $fetch<{session:WhatsAppSession;qr:string|null;webhookWarning:string|null}>("/api/whatsapp/sessions",{method:"POST",body:{displayName:connectionName.value}});showCreate.value=false;activeId.value=r.session.id;qrImage.value=r.qr;showQr.value=true;notice.value=r.webhookWarning||tr("اتصال ساخته شد؛ کد را با واتساپ اسکن کنید.","Connection created. Scan the code with WhatsApp.");await loadSessions()}catch(e){actionError.value=apiError(e)}finally{busy.value=false}}
async function openQr(id:string){resetFeedback();busy.value=true;activeId.value=id;showQr.value=true;qrImage.value=null;try{const r=await $fetch<{qr:string|null;status:string}>(`/api/whatsapp/sessions/${id}/qr`);qrImage.value=r.qr;if(!r.qr&&r.status==="CONNECTED")notice.value=tr("این شماره هم‌اکنون متصل است.","This number is already connected.");else if(!r.qr)actionError.value=tr("هنوز QR تولید نشده؛ چند ثانیه دیگر تلاش کنید.","QR is not ready yet. Try again shortly.");await loadSessions()}catch(e){actionError.value=apiError(e)}finally{busy.value=false}}
async function disconnect(id:string){resetFeedback();busy.value=true;try{await $fetch(`/api/whatsapp/sessions/${id}/disconnect`,{method:"POST"});notice.value=tr("اتصال با موفقیت قطع شد.","Connection disconnected successfully.");await loadSessions()}catch(e){actionError.value=apiError(e)}finally{busy.value=false}}
async function removeConnection(id:string){if(!confirm(tr("این اتصال و تمام گفتگوهای وابسته به آن حذف شود؟ این عملیات قابل بازگشت نیست.","Delete this connection and all its conversations? This cannot be undone.")))return;resetFeedback();busy.value=true;try{await $fetch(`/api/whatsapp/sessions/${id}`,{method:"DELETE"});sessions.value=sessions.value.filter(x=>x.id!==id);notice.value=tr("اتصال با موفقیت حذف شد.","Connection deleted successfully.")}catch(e){actionError.value=apiError(e)}finally{busy.value=false}}
function openSend(id:string){resetFeedback();activeId.value=id;destination.value="";messageBody.value="";showSend.value=true}
async function sendTest(){if(!activeId.value)return;resetFeedback();busy.value=true;try{await $fetch("/api/whatsapp/send",{method:"POST",body:{sessionId:activeId.value,to:destination.value,body:messageBody.value}});showSend.value=false;notice.value=tr("پیام ارسال شد و گفتگو در بخش گفتگوها ساخته شد.","Message sent and the conversation was created.")}catch(e){actionError.value=apiError(e)}finally{busy.value=false}}
onMounted(()=>{void loadSessions(true);refreshTimer=setInterval(()=>void loadSessions(),12000)})
onBeforeUnmount(()=>clearInterval(refreshTimer))
</script>
<template>
  <div>
    <PageHeader :title="tr('اتصال واتساپ','WhatsApp connections')" :description="tr('شماره واقعی واتساپ را با QR متصل کنید، وضعیت را زنده ببینید و پیام آزمایشی بفرستید.','Connect a real WhatsApp number using QR, monitor its live state, and send a test message.')">
      <button type="button" class="btn btn-primary" @click="resetFeedback();showCreate=true"><Plus :size="17"/>{{tr('افزودن شماره','Add number')}}</button>
    </PageHeader>
    <UiFeedback v-if="notice" class="mb-5" type="success" :message="notice"/>
    <UiFeedback v-if="actionError" class="mb-5" type="error" :message="actionError"/>
    <UiLoadingState v-if="pending" class="surface" height="min-h-56"/>
    <UiEmptyState v-else-if="!sessions.length" class="surface" :title="tr('هنوز شماره‌ای متصل نیست','No number connected yet')" :description="tr('یک اتصال بسازید و QR را از بخش دستگاه‌های متصل واتساپ اسکن کنید.','Create a connection and scan the QR from WhatsApp Linked Devices.')">
      <template #icon><Smartphone :size="30"/></template>
      <template #action><button type="button" class="btn btn-primary" @click="resetFeedback();showCreate=true"><Plus :size="17"/>{{tr('ساخت اولین اتصال','Create first connection')}}</button></template>
    </UiEmptyState>
    <div v-else class="grid gap-5 lg:grid-cols-2">
      <WhatsAppSessionCard v-for="session in sessions" :key="session.id" :session="session" :busy="busy" :formatted-date="formatDate(session.lastSeenAt,{dateStyle:'medium',timeStyle:'short'})" @send="openSend" @qr="openQr" @disconnect="disconnect" @remove="removeConnection"/>
    </div>
    <WhatsAppConnectionDialog v-model="connectionName" :open="showCreate" :busy="busy" @close="showCreate=false" @submit="createConnection"/>
    <WhatsAppQrDialog :open="showQr" :image="qrImage" :busy="busy" :can-refresh="Boolean(activeId)" @close="showQr=false" @refresh="activeId&&openQr(activeId)"/>
    <WhatsAppSendDialog v-model:destination="destination" v-model:body="messageBody" :open="showSend" :busy="busy" @close="showSend=false" @submit="sendTest"/>
  </div>
</template>
