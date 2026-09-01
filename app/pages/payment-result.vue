<script setup lang="ts">import {CheckCircle2, XCircle} from "lucide-vue-next";

definePageMeta({layout: "auth"});
const route = useRoute(), success = computed(() => route.query.status === "success"),
    wallet = computed(() => route.query.target === "wallet")</script>
<template>
  <div class="text-center">
    <component :is="success?CheckCircle2:XCircle" class="mx-auto" :class="success?'text-emerald-500':'text-red-500'"
               :size="64"/>
    <h1 class="mt-5 text-2xl font-black">{{ success ? 'پرداخت موفق بود' : 'پرداخت تکمیل نشد' }}</h1>
    <p class="muted mt-3">
      {{ success ? (wallet ? 'مبلغ با موفقیت به کیف پول شما اضافه شد.' : 'اشتراک شما فعال شد و آماده استفاده است.') : 'پرداختی انجام نشد و می‌توانید دوباره تلاش کنید.' }}</p>
    <NuxtLink :to="wallet?'/dashboard/wallet':'/dashboard/subscription'" class="btn btn-primary mt-6 w-full">
      {{ wallet ? 'بازگشت به کیف پول' : 'بازگشت به اشتراک' }}
    </NuxtLink>
  </div>
</template>
