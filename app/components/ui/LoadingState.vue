<script setup lang="ts">import {LoaderCircle} from "lucide-vue-next";

withDefaults(defineProps<{ label?: string; height?: string }>(), {
  label: "در حال بارگذاری...",
  height: "h-52"
});</script>
<template>
  <div class="grid place-items-center text-slate-400" :class="height" role="status">
    <div class="text-center">
      <LoaderCircle class="mx-auto animate-spin text-brand-600" :size="26"/>
      <small class="mt-3 block">{{ label }}</small></div>
  </div>
</template>
