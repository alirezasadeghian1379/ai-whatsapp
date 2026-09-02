<script setup lang="ts">
import { QrCode, Send, Smartphone, Trash2, Unplug } from "lucide-vue-next"
import type { WhatsAppSession } from "~/types/whatsapp"
import WhatsAppStatusBadge from "./StatusBadge.vue"

defineProps<{ session: WhatsAppSession; busy: boolean; formattedDate: string }>()
defineEmits<{ send: [id: string]; qr: [id: string]; disconnect: [id: string]; remove: [id: string] }>()
const { tr } = useAppPreferences()
</script>

<template>
  <section class="surface p-6 transition hover:-translate-y-0.5 hover:shadow-xl">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div class="flex items-center gap-4">
        <span class="grid size-14 place-items-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-500/10"><Smartphone/></span>
        <div>
          <h2 class="font-black">{{ session.displayName || tr('واتساپ کسب‌وکار','Business WhatsApp') }}</h2>
          <p class="mt-1 font-mono text-sm text-slate-400" dir="ltr">{{ session.phoneNumber ? `+${session.phoneNumber}` : session.externalId }}</p>
        </div>
      </div>
      <WhatsAppStatusBadge :status="session.status"/>
    </div>
    <dl class="mt-6 grid gap-4 rounded-2xl bg-slate-50 p-5 text-sm dark:bg-slate-800 sm:grid-cols-2">
      <div><dt class="text-slate-400">Provider</dt><dd class="mt-2 font-bold">{{ session.provider==='baileys' ? 'Baileys (Node.js)' : session.provider }}</dd></div>
      <div><dt class="text-slate-400">{{ tr('آخرین بروزرسانی','Last update') }}</dt><dd class="mt-2 font-bold">{{ formattedDate }}</dd></div>
    </dl>
    <div class="mt-6 flex flex-wrap gap-2">
      <button v-if="session.status==='CONNECTED'" type="button" class="btn btn-primary" :disabled="busy" @click="$emit('send',session.id)"><Send :size="17"/>{{ tr('ارسال پیام','Send message') }}</button>
      <button v-else type="button" class="btn btn-primary" :disabled="busy" @click="$emit('qr',session.id)"><QrCode :size="17"/>{{ tr('نمایش QR','Show QR') }}</button>
      <button v-if="session.status==='CONNECTED'" type="button" class="btn btn-secondary" :disabled="busy" @click="$emit('disconnect',session.id)"><Unplug :size="17"/>{{ tr('قطع اتصال','Disconnect') }}</button>
      <button type="button" class="btn ms-auto border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 dark:border-red-500/20 dark:bg-red-500/10" :disabled="busy" @click="$emit('remove',session.id)"><Trash2 :size="17"/>{{ tr('حذف اتصال','Delete connection') }}</button>
    </div>
  </section>
</template>
