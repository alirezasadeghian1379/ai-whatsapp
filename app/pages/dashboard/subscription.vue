<script setup lang="ts">
import {AlertCircle, Check, Crown, LoaderCircle} from "lucide-vue-next";

definePageMeta({layout: "dashboard", middleware: "auth"});
const {tr, formatDate, formatNumber} = useAppPreferences(), route = useRoute();
const {data, status, refresh} = await useFetch<any>("/api/subscription");
const busy = ref(""), error = ref("");
const days = computed(() => data.value?.subscription?.endsAt ? Math.max(0, Math.ceil((new Date(data.value.subscription.endsAt).getTime() - Date.now()) / 86400000)) : 0);
const currentPlan = computed(() => data.value?.subscription?.plan);
const isDowngrade = (plan: any) => currentPlan.value && plan.sortOrder <= currentPlan.value.sortOrder && plan.id !== currentPlan.value.id;
const unavailable = (plan: any) => data.value?.subscription?.planId === plan.id || isDowngrade(plan) || (!Number(plan.price) && data.value?.freeUsed);
const usageItems = computed(() => {
  const plan = data.value?.subscription?.plan, usage = data.value?.usage;
  if (!plan || !usage) return [];
  return [
    {
      key: "whatsapp",
      label: tr("اتصال واتساپ", "WhatsApp connections"),
      used: usage.whatsappConnections,
      limit: plan.maxWhatsAppConnections,
      monthly: false
    },
    {
      key: "messages",
      label: tr("پیام خروجی", "Outgoing messages"),
      used: usage.messagesSent,
      limit: plan.maxMessages,
      monthly: true
    },
    {
      key: "ai",
      label: tr("درخواست هوش مصنوعی", "AI requests"),
      used: usage.aiRequests,
      limit: plan.maxAIRequests,
      monthly: true
    },
    {key: "contacts", label: tr("مخاطب", "Contacts"), used: usage.contacts, limit: plan.maxContacts, monthly: false}
  ];
});
const usagePercent = (used: number, limit: number) => limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
const orderStatusLabel = (status: string) => ({
  PAID: tr("پرداخت‌شده", "Paid"),
  PENDING: tr("در انتظار پرداخت", "Pending"),
  FAILED: tr("ناموفق", "Failed"),
  CANCELLED: tr("لغوشده", "Cancelled"),
  REFUNDED: tr("بازپرداخت‌شده", "Refunded")
}[status] || status);
const orderStatusClass = (status: string) => ({
  PAID: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
  PENDING: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
  FAILED: "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400",
  CANCELLED: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  REFUNDED: "bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400"
}[status] || "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300");

async function buy(plan: any) {
  if (unavailable(plan)) return;
  busy.value = plan.id;
  error.value = "";
  try {
    const r = await $fetch<any>("/api/payments/create", {
      method: "POST",
      body: {planId: plan.id}
    });
    if (r.activated) {
      await refresh();
      await navigateTo("/dashboard/subscription?payment=success");
      return
    }
    await navigateTo(r.redirectUrl, {external: r.redirectUrl.startsWith("http")})
  } catch (e: any) {
    error.value = e.data?.statusMessage || tr("شروع پرداخت انجام نشد؛ دوباره تلاش کنید.", "Could not start payment. Please retry.")
  } finally {
    busy.value = ""
  }
}
</script>
<template>
  <div>
    <PageHeader :title="tr('اشتراک و پرداخت','Subscription & billing')"
                :description="tr('پلن فعال، محدودیت‌ها و سوابق پرداخت حساب.','Your active plan, limits, and payment history.')"/>
    <div v-if="route.query.payment==='success'" class="mb-4 rounded-xl bg-emerald-50 p-4 font-bold text-emerald-700">
      {{ tr('اشتراک با موفقیت فعال شد.', 'Subscription activated successfully.') }}
    </div>
    <div v-if="error" class="mb-4 flex gap-2 rounded-xl bg-red-50 p-4 text-red-700">
      <AlertCircle :size="20"/>
      {{ error }}
    </div>
    <UiLoadingState v-if="status==='pending'" class="surface" height="h-60"/>
    <template v-else>
      <section v-if="data?.subscription" class="grid gap-5 lg:grid-cols-[1.2fr_.8fr]">
        <article
            class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 to-indigo-800 p-7 text-white shadow-xl">
          <Crown class="absolute -end-8 -top-8 size-40 text-white/5"/>
          <span class="badge bg-white/10 text-violet-100">{{ tr('فعال', 'Active') }}</span>
          <h2 class="mt-5 text-2xl font-black">{{ data.subscription.plan.name }}</h2>
          <p class="mt-2 text-sm text-violet-200">{{ formatNumber(days) }}
            {{ tr('روز باقی‌مانده', 'days remaining') }}</p><b
            class="mt-8 block text-3xl">{{ formatNumber(data.subscription.plan.price) }} {{ tr('تومان', 'IRR') }}</b>
        </article>
        <article class="surface p-6"><h2 class="font-black">{{ tr('محدودیت‌های پلن', 'Plan limits') }}</h2>
          <ul class="mt-5 space-y-4">
            <li v-for="x in [`${formatNumber(data.subscription.plan.maxWhatsAppConnections)} WhatsApp`,`${formatNumber(data.subscription.plan.maxMessages)} ${tr('پیام','messages')}`,`${formatNumber(data.subscription.plan.maxAIRequests)} AI` ]"
                :key="x" class="flex items-center gap-3 text-sm"><span
                class="grid size-6 place-items-center rounded-full bg-brand-50 text-brand-600"><Check
                :size="14"/></span>{{ x }}
            </li>
          </ul>
        </article>
      </section>
      <section v-if="data?.subscription" class="surface mt-5 p-6">
        <div class="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 class="font-black">{{ tr('میزان مصرف پلن', 'Plan usage') }}</h2>
            <p class="muted mt-1 text-xs">{{
                tr('مصرف پیام و هوش مصنوعی در ابتدای هر ماه صفر می‌شود.', 'Message and AI usage reset at the start of each month.')
              }}</p>
          </div>
        </div>
        <div class="mt-6 grid gap-5 md:grid-cols-2">
          <article v-for="item in usageItems" :key="item.key"
                   class="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
            <div class="flex items-center justify-between gap-3 text-sm">
              <b>{{ item.label }}</b>
              <span class="text-slate-500 dark:text-slate-400">
                {{ formatNumber(item.used) }} / {{ formatNumber(item.limit) }}
              </span>
            </div>
            <div class="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div class="h-full rounded-full bg-gradient-to-r from-brand-500 to-violet-500 transition-all duration-700"
                   :class="usagePercent(item.used,item.limit)>=90?'from-amber-500 to-red-500':''"
                   :style="{width: `${usagePercent(item.used,item.limit)}%`}"/>
            </div>
            <div class="mt-2 flex justify-between text-[11px] text-slate-400">
              <span>{{ formatNumber(usagePercent(item.used, item.limit)) }}٪</span>
              <span>{{ item.monthly ? tr('این ماه', 'This month') : tr('مصرف فعلی', 'Current usage') }}</span>
            </div>
          </article>
        </div>
      </section>
      <section class="mt-5 grid gap-4 md:grid-cols-3">
        <article v-for="plan in data?.plans" :key="plan.id" class="surface p-6"
                 :class="data?.subscription?.planId===plan.id?'border-brand-500 ring-2 ring-brand-500/10':''"><h3
            class="font-black">{{ plan.name }}</h3><b
            class="mt-3 block text-xl text-brand-600">{{ formatNumber(plan.price) }} {{ tr('تومان', 'IRR') }}</b>
          <p class="muted mt-2 text-xs">{{ formatNumber(plan.durationDays) }} {{ tr('روز', 'days') }}</p>
          <ul class="my-5 space-y-2 text-sm">
            <li v-for="f in plan.features.filter((item:string)=>!/(webhook|وب.?هوک|wallet|کیف.?پول|sms|پیامک)/i.test(item))"
                :key="f">✓ {{ f }}
            </li>
          </ul>
          <button class="btn w-full" :class="unavailable(plan)?'btn-secondary':'btn-primary'"
                  :disabled="busy===plan.id||unavailable(plan)"
                  :title="isDowngrade(plan) ? tr('تنزل پلن پس از پایان دوره فعلی امکان‌پذیر است.', 'Downgrade is available after the current period ends.') : ''"
                  @click="buy(plan)">
            <LoaderCircle v-if="busy===plan.id" class="animate-spin" :size="17"/>
            {{
              data?.subscription?.planId === plan.id ? tr('پلن فعلی', 'Current plan') : !Number(plan.price) && data?.freeUsed ? tr('قبلاً استفاده شده', 'Already used') : Number(plan.price) ? tr('خرید پلن', 'Buy plan') : tr('فعال‌سازی رایگان', 'Activate free')
            }}
          </button>
        </article>
      </section>
      <section class="surface mt-5 overflow-hidden">
        <header class="border-b p-5"><h2 class="font-black">{{ tr('تاریخچه سفارش‌ها', 'Order history') }}</h2></header>
        <div v-if="data?.orders.length"
             class="hidden grid-cols-4 border-b bg-slate-50 px-5 py-3 text-center text-xs font-bold text-slate-500 dark:bg-slate-900/60 dark:text-slate-400 sm:grid">
          <span>{{ tr('شناسه سفارش', 'Order ID') }}</span>
          <span>{{ tr('تاریخ پرداخت', 'Payment date') }}</span>
          <span>{{ tr('مبلغ', 'Amount') }}</span>
          <span>{{ tr('وضعیت', 'Status') }}</span>
        </div>
        <div v-if="!data?.orders.length" class="muted p-8 text-center">
          {{ tr('سفارشی ثبت نشده است.', 'No orders yet.') }}
        </div>
        <div v-for="order in data?.orders" :key="order.id"
             class="grid items-center gap-3 border-b p-5 text-center sm:grid-cols-4">
          <code>{{ order.id.slice(-10) }}</code><span>{{ formatDate(order.createdAt, {dateStyle: 'medium'}) }}</span><b>{{
            formatNumber(order.amount)
          }}
          {{ tr('تومان', 'IRR') }}</b><span class="badge mx-auto w-fit"
                                            :class="orderStatusClass(order.status)">{{
            orderStatusLabel(order.status)
          }}</span>
        </div>
      </section>
    </template>
  </div>
</template>
