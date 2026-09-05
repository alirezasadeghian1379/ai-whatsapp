<script setup lang="ts">import {RefreshCw, Wifi, WifiOff} from "lucide-vue-next";

defineProps<{ status: string }>();
const {tr} = useAppPreferences();</script>
<template><span class="badge"
                :class="status==='CONNECTED'?'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10':status==='CONNECTING'?'bg-amber-50 text-amber-600 dark:bg-amber-500/10':'bg-red-50 text-red-600 dark:bg-red-500/10'"><Wifi
    v-if="status==='CONNECTED'" :size="14"/><RefreshCw v-else-if="status==='CONNECTING'" class="animate-spin"
                                                       :size="14"/><WifiOff v-else
                                                                            :size="14"/>{{ status === 'CONNECTED' ? tr('متصل', 'Connected') : status === 'CONNECTING' ? tr('در انتظار QR', 'Waiting for QR') : tr('قطع', 'Disconnected') }}</span>
</template>
