<script setup lang="ts">
import {Check} from "lucide-vue-next";
const {tr, formatNumber} = useAppPreferences();
const headers = import.meta.server ? useRequestHeaders(["cookie"]) : undefined;
const [{data, status}, {data: session}] = await Promise.all([
  useFetch<any>("/api/plans"),
  useFetch<any>("/api/auth/session", {headers, key: "pricing-session"})
]);
const signedIn = computed(() => !!session.value?.user);
</script>

<template>
  <div>
    <PublicHeader/>
    <main class="mx-auto max-w-7xl px-5 py-16">
      <div class="mx-auto max-w-2xl text-center">
        <span class="badge bg-brand-50 text-brand-700">{{ tr('تعرفه شفاف','Transparent pricing') }}</span>
        <h1 class="mt-5 text-4xl font-black">{{ tr('پلن مناسب رشد کسب‌وکار شما','A plan that grows with you') }}</h1>
        <p class="muted mt-4">{{ tr('بدون هزینه پنهان؛ هر زمان نیاز داشتید پلن خود را ارتقا دهید.','No hidden fees. Upgrade whenever you need.') }}</p>
      </div>
      <div v-if="status==='pending'" class="mt-12 grid gap-5 md:grid-cols-3">
        <div v-for="i in 3" :key="i" class="surface h-96 animate-pulse bg-slate-100"/>
      </div>
      <div v-else class="mt-12 grid gap-5 md:grid-cols-3">
        <article v-for="p in data?.plans" :key="p.id" class="surface flex flex-col p-7" :class="p.slug==='pro'?'border-brand-500 ring-4 ring-brand-500/10':''">
          <span v-if="p.slug==='pro'" class="badge mb-4 w-fit bg-brand-600 text-white">{{ tr('پیشنهاد ویژه','Popular') }}</span>
          <h2 class="text-xl font-black">{{ p.name }}</h2>
          <p class="mt-3 text-3xl font-black text-brand-600">{{ Number(p.price) ? formatNumber(p.price)+' '+tr('تومان','Toman') : tr('رایگان','Free') }}</p>
          <small class="mt-1 text-slate-400">{{ formatNumber(p.durationDays) }} {{ tr('روز','days') }}</small>
          <ul class="my-7 flex-1 space-y-3 text-sm">
            <li v-for="f in p.features.filter((item:string)=>!/(webhook|وب.?هوک|wallet|کیف.?پول|sms|پیامک)/i.test(item))" :key="f" class="flex gap-2"><Check class="text-brand-600" :size="17"/>{{ f }}</li>
            <li><Check class="me-2 inline text-brand-600" :size="17"/>{{ formatNumber(p.maxWhatsAppConnections) }} {{ tr('اتصال واتساپ','WhatsApp connections') }}</li>
            <li><Check class="me-2 inline text-brand-600" :size="17"/>{{ formatNumber(p.maxMessages) }} {{ tr('پیام خروجی ماهانه','monthly outgoing messages') }}</li>
            <li><Check class="me-2 inline text-brand-600" :size="17"/>{{ formatNumber(p.maxAIRequests) }} {{ tr('درخواست هوش مصنوعی','AI requests') }}</li>
          </ul>
          <NuxtLink class="btn btn-primary w-full" :to="signedIn?'/dashboard/subscription':'/register'">{{ signedIn ? tr('مدیریت اشتراک','Manage subscription') : tr('انتخاب پلن','Choose plan') }}</NuxtLink>
        </article>
      </div>
    </main>
    <PublicFooter/>
  </div>
</template>
