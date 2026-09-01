<script setup lang="ts">import {MessageCircleMore} from "lucide-vue-next";

withDefaults(defineProps<{ compact?: boolean }>(), {compact: false})</script>
<template>
  <NuxtLink to="/" class="group inline-flex items-center gap-3"><span
      class="grid size-10 place-items-center rounded-2xl bg-gradient-to-br from-brand-400 to-brand-700 text-white shadow-lg shadow-brand-600/25 transition group-hover:rotate-6 group-hover:scale-105"><MessageCircleMore
      :size="22"/></span><span v-if="!compact" class="text-xl font-black tracking-tight">همراه<span
      class="text-brand-600">‌چت</span></span></NuxtLink>
</template>
