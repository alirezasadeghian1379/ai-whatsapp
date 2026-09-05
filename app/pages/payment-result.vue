<script setup lang="ts">import {CheckCircle2, XCircle} from "lucide-vue-next";

definePageMeta({layout: "auth"});
const {tr} = useAppPreferences();
const route = useRoute(), success = computed(() => route.query.status === "success"),
    wallet = computed(() => route.query.target === "wallet")</script>
<template>
  <div class="text-center">
    <component :is="success?CheckCircle2:XCircle" class="mx-auto" :class="success?'text-emerald-500':'text-red-500'"
               :size="64"/>
    <h1 class="mt-5 text-2xl font-black">
      {{ success ? tr('پرداخت موفق بود', 'Payment successful') : tr('پرداخت تکمیل نشد', 'Payment incomplete') }}</h1>
    <p class="muted mt-3">
      {{
        success ? (wallet ? tr('مبلغ با موفقیت به کیف پول شما اضافه شد.', 'The amount was added to your wallet.') : tr('اشتراک شما فعال شد و آماده استفاده است.', 'Your subscription is active and ready.')) : tr('پرداختی انجام نشد و می‌توانید دوباره تلاش کنید.', 'No payment was completed. You can try again.')
      }}</p>
    <NuxtLink :to="wallet?'/dashboard/wallet':'/dashboard/subscription'" class="btn btn-primary mt-6 w-full">
      {{ wallet ? tr('بازگشت به کیف پول', 'Back to wallet') : tr('بازگشت به اشتراک', 'Back to subscription') }}
    </NuxtLink>
  </div>
</template>
