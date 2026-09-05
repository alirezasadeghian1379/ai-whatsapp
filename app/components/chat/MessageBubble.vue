<script setup lang="ts">
import {FileText, Download} from "lucide-vue-next"
import type {ChatMessage} from "~/types/chat"

const props = defineProps<{ message: ChatMessage; formattedTime: string }>(), {tr} = useAppPreferences()
const status = computed(() => ({
  RECEIVED: tr("دریافت‌شده", "Received"),
  SENT: tr("ارسال‌شده", "Sent"),
  DELIVERED: tr("تحویل‌شده", "Delivered"),
  READ: tr("خوانده‌شده", "Read"),
  PENDING: tr("در انتظار ارسال", "Pending"),
  FAILED: tr("ناموفق", "Failed")
}[props.message.status] || props.message.status))
const source = computed(() => ({
  ADMIN: tr("ارسال توسط ادمین", "Sent by admin"),
  AI: tr("ارسال توسط هوش مصنوعی", "Sent by AI"),
  WHATSAPP: tr("ارسال از واتساپ", "Sent from WhatsApp"),
  CONTACT: tr("مخاطب", "Contact")
}[props.message.source] || (props.message.direction === "INBOUND" ? tr("مخاطب", "Contact") : tr("واتساپ", "WhatsApp"))))
const mediaLink = computed(() => props.message.mediaUrl ? `/api/messages/${props.message.id}/media` : null)
</script>
<template>
  <div class="flex" :class="message.direction==='OUTBOUND'?'justify-start':'justify-end'">
    <div class="max-w-[80%] overflow-hidden rounded-2xl px-4 py-3 text-sm leading-7 shadow-sm"
         :class="message.direction==='OUTBOUND'?'rounded-es-sm bg-brand-600 text-white':'rounded-ee-sm bg-white dark:bg-slate-800'">
      <span class="mb-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold"
            :class="message.direction==='OUTBOUND'?'bg-white/20 text-white':'bg-slate-100 text-slate-500 dark:bg-slate-700'">{{ source }}</span>
      <a v-if="message.type==='image'&&mediaLink" :href="mediaLink" target="_blank"
         class="mb-2 block overflow-hidden rounded-xl bg-black/10"><img :src="mediaLink"
                                                                        :alt="message.body||tr('تصویر پیوست','Attached image')"
                                                                        class="max-h-72 w-full object-contain"
                                                                        loading="lazy"></a>
      <a v-else-if="message.type==='document'&&mediaLink" :href="mediaLink"
         class="mb-2 flex items-center gap-3 rounded-xl bg-black/10 p-3" download>
        <FileText :size="22"/>
        <span class="min-w-0 flex-1 truncate">{{ message.body || tr('فایل پیوست', 'Attached file') }}</span>
        <Download :size="17"/>
      </a>
      <audio v-else-if="message.type==='audio'&&mediaLink" :src="mediaLink" controls preload="metadata"
             class="mb-2 w-full max-w-72"/>
      <p v-if="message.body&&message.type!=='document'">{{ message.body }}</p><small
        class="mt-1 block opacity-60">{{ formattedTime }} · {{ status }}</small>
    </div>
  </div>
</template>
