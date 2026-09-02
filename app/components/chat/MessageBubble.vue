<script setup lang="ts">
import type { ChatMessage } from "~/types/chat"

const props = defineProps<{ message: ChatMessage; formattedTime: string }>()
const { tr } = useAppPreferences()
const status = computed(() => ({
  RECEIVED: tr("دریافت‌شده", "Received"),
  SENT: tr("ارسال‌شده", "Sent"),
  DELIVERED: tr("تحویل‌شده", "Delivered"),
  READ: tr("خوانده‌شده", "Read"),
  PENDING: tr("در انتظار ارسال", "Pending"),
  FAILED: tr("ناموفق", "Failed"),
}[props.message.status] || props.message.status))
const source = computed(() => {
 const labels: Record<string,string> = {
  ADMIN: tr("ارسال توسط ادمین", "Sent by admin"),
  AI: tr("ارسال توسط هوش مصنوعی", "Sent by AI"),
  WHATSAPP: tr("ارسال از واتساپ", "Sent from WhatsApp"),
  CONTACT: tr("مخاطب", "Contact"),
 }
 return labels[props.message.source] || (props.message.direction === "INBOUND" ? tr("مخاطب", "Contact") : tr("واتساپ", "WhatsApp"))
})
</script>

<template>
  <div class="flex" :class="message.direction==='OUTBOUND'?'justify-start':'justify-end'">
    <div class="max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-7 shadow-sm" :class="message.direction==='OUTBOUND'?'rounded-es-sm bg-brand-600 text-white':'rounded-ee-sm bg-white dark:bg-slate-800'">
      <span class="mb-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold" :class="message.direction==='OUTBOUND'?'bg-white/20 text-white':'bg-slate-100 text-slate-500 dark:bg-slate-700'">{{ source }}</span>
      <p>{{ message.body }}</p>
      <small class="mt-1 block opacity-60">{{ formattedTime }} · {{ status }}</small>
    </div>
  </div>
</template>
