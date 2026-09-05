<script setup lang="ts">import {LoaderCircle, QrCode, RefreshCw} from "lucide-vue-next";

defineProps<{ open: boolean; image: string | null; busy: boolean; canRefresh: boolean }>();
defineEmits<{ close: []; refresh: [] }>();
const {tr} = useAppPreferences();</script>
<template>
  <AppModal :open="open" :title="tr('اسکن کد QR واقعی','Scan real QR code')" @close="$emit('close')">
    <div class="grid min-h-72 place-items-center rounded-2xl bg-white p-6"><img v-if="image" :src="image"
                                                                                :alt="tr('کد اتصال واتساپ','WhatsApp connection QR')"
                                                                                class="size-64 object-contain">
      <LoaderCircle v-else-if="busy" class="animate-spin text-brand-500" :size="38"/>
      <QrCode v-else class="text-slate-300" :size="150"/>
    </div>
    <p class="muted mt-4 text-center">
      {{ tr('واتساپ ← تنظیمات ← دستگاه‌های متصل ← اتصال دستگاه', 'WhatsApp → Settings → Linked Devices → Link a Device') }}</p>
    <button v-if="canRefresh" class="btn btn-secondary mt-4 w-full" :disabled="busy" @click="$emit('refresh')">
      <RefreshCw :size="17"/>
      {{ tr('دریافت QR جدید', 'Get a new QR') }}
    </button>
  </AppModal>
</template>
