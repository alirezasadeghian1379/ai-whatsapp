<script setup lang="ts">definePageMeta({layout: "auth", middleware: "auth"});
const route = useRoute(), authority = String(route.query.authority || "");

function finish(status: string) {
  return navigateTo(`/api/payments/callback?authority=${encodeURIComponent(authority)}&status=${status}`, {external: true})
}</script>
<template>
  <div><span class="badge bg-amber-50 text-amber-700">درگاه آزمایشی</span>
    <h1 class="mt-4 text-2xl font-black">تایید پرداخت Sandbox</h1>
    <p class="muted my-5">این صفحه فقط برای تست کامل جریان سفارش و فعال‌سازی اشتراک است و مبلغی جابه‌جا نمی‌شود.</p>
    <code class="block overflow-hidden text-ellipsis rounded-xl bg-slate-100 p-3" dir="ltr">{{ authority }}</code>
    <button class="btn btn-primary mt-5 w-full" @click="finish('OK')">پرداخت موفق آزمایشی</button>
    <button class="btn btn-ghost mt-2 w-full" @click="finish('NOK')">انصراف</button>
  </div>
</template>
