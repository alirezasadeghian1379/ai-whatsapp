<script setup lang="ts">
import { AlertCircle, CheckCircle2, Info } from "lucide-vue-next";
const props=withDefaults(defineProps<{type?:"success"|"error"|"info";message?:string}>(),{type:"info",message:""});
const icon=computed(()=>props.type==="success"?CheckCircle2:props.type==="error"?AlertCircle:Info);
const tone=computed(()=>props.type==="success"?"bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300":props.type==="error"?"bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300":"bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300");
</script>
<template><div v-if="message||$slots.default" class="flex items-start gap-2 rounded-xl p-3 text-sm font-bold" :class="tone" role="status"><component :is="icon" class="mt-0.5 shrink-0" :size="18"/><span><slot>{{message}}</slot></span></div></template>
