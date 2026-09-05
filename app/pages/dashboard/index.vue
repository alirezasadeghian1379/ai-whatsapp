<script setup lang="ts">
import {Activity, Bot, MessageCircle, Plus, Send, Smartphone, Users} from "lucide-vue-next";

definePageMeta({layout: "dashboard", middleware: "auth"});
const {tr, locale, formatNumber} = useAppPreferences();
const {data, status} = await useFetch<any>("/api/dashboard");
const metrics = computed(() => [{
  label: tr("پیام‌های امروز", "Messages today"),
  value: formatNumber(data.value?.messages.today || 0),
  icon: MessageCircle
}, {
  label: tr("پیام‌های این ماه", "Messages this month"),
  value: formatNumber(data.value?.messages.monthly || 0),
  icon: Send
}, {
  label: tr("گفتگوهای فعال", "Active conversations"),
  value: formatNumber(data.value?.conversations || 0),
  icon: Users
}]);

function time(v: string) {
  const seconds = Math.max(1, Math.floor((Date.now() - new Date(v).getTime()) / 1000));
  const [value, unit] = seconds < 60 ? [seconds, "second"] : seconds < 3600 ? [Math.floor(seconds / 60), "minute"] : seconds < 86400 ? [Math.floor(seconds / 3600), "hour"] : [Math.floor(seconds / 86400), "day"];
  return new Intl.RelativeTimeFormat(locale.value === "fa" ? "fa-IR" : "en-US", {numeric: "always"}).format(-value, unit as Intl.RelativeTimeFormatUnit)
}
</script>
<template>
  <div>
    <PageHeader :title="tr('نمای کلی','Overview')"
                :description="tr('عملکرد واقعی فضای کاری شما در یک نگاه','Your real workspace activity at a glance')">
      <NuxtLink v-if="data?.access?.features?.whatsapp" to="/dashboard/whatsapp" class="btn btn-primary">
        <Plus :size="17"/>
        {{ tr('اتصال شماره جدید', 'Connect new number') }}
      </NuxtLink>
    </PageHeader>
    <UiLoadingState v-if="status==='pending'" class="surface" height="h-60"/>
    <template v-else>
      <section
          class="relative mb-5 overflow-hidden rounded-3xl bg-gradient-to-l from-brand-900 via-brand-800 to-emerald-700 p-6 text-white shadow-xl">
        <div class="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div><span class="badge bg-white/10 text-brand-100"><Activity
              :size="13"/>{{
              data?.sessions.connected ? tr('سیستم فعال', 'System active') : tr('نیاز به اتصال', 'Connection required')
            }}</span>
            <h2 class="mt-4 text-xl font-black">
              {{
                data?.sessions.connected ? tr('واتساپ شما متصل است', 'Your WhatsApp is connected') : tr('واتساپی متصل نیست', 'No WhatsApp connected')
              }}</h2>
            <p class="mt-2 text-sm text-brand-100/70">
              {{
                data?.sessions.connected ? tr('آماده دریافت و ارسال پیام واقعی است.', 'Ready to send and receive real messages.') : tr('برای شروع یک شماره اضافه کنید.', 'Add a number to get started.')
              }}</p>
          </div>
          <div v-if="data?.sessions.primary" class="text-start sm:text-end"><span
              class="badge bg-emerald-400/20 text-emerald-200">● {{
              data.sessions.primary.status === 'CONNECTED' ? tr('متصل', 'Connected') : tr('قطع', 'Disconnected')
            }}</span><b
              class="mt-3 block font-mono"
              dir="ltr">{{
              data.sessions.primary.phoneNumber ? `+${data.sessions.primary.phoneNumber}` : data.sessions.primary.displayName
            }}</b>
          </div>
        </div>
      </section>
      <section class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <UiStatCard v-for="(m,i) in metrics" :key="m.label" class="animate-fade-up" :label="m.label" :value="m.value"
                    :style="{animationDelay:i*70+'ms'}">
          <template #icon>
            <component :is="m.icon" :size="19"/>
          </template>
        </UiStatCard>
      </section>
      <section class="mt-5 grid gap-5 xl:grid-cols-[1.3fr_.7fr]">
        <div class="surface p-6">
          <div class="flex justify-between"><h2 class="font-black">{{ tr('فعالیت‌های اخیر', 'Recent activity') }}</h2>
            <NuxtLink v-if="data?.access?.features?.messages" to="/dashboard/chats" class="text-xs text-brand-600">
              {{ tr('مشاهده همه', 'View all') }}
            </NuxtLink>
          </div>
          <div v-if="!data?.recent.length" class="muted py-12 text-center">
            {{ tr('هنوز پیامی ثبت نشده است.', 'No messages recorded yet.') }}
          </div>
          <div v-for="item in data?.recent" :key="item.id" class="flex gap-3 border-b py-4 last:border-0"><i
              class="mt-1.5 size-2 shrink-0 rounded-full bg-brand-500 ring-4 ring-brand-100"/>
            <div class="min-w-0">
              <p class="text-sm font-bold line-clamp-1" :dir="locale==='fa'?'rtl':'ltr'">{{ item.contact }} ·
                {{ item.body }}</p>
              <small class="block text-slate-400" :dir="locale==='fa'?'rtl':'ltr'">{{ time(item.createdAt) }}</small>
            </div>
          </div>
        </div>
        <div class="surface p-6"><h2 class="font-black">{{ tr('وضعیت سرویس‌ها', 'Services') }}</h2>
          <div class="mt-5 space-y-4">
            <div class="flex justify-between"><span class="flex gap-2"><Smartphone
                :size="18"/>WhatsApp</span><b>{{ formatNumber(data?.sessions.connected || 0) }} /
              {{ formatNumber(data?.sessions.limit || 0) }}</b></div>
            <div class="flex justify-between"><span class="flex gap-2"><Bot
                :size="18"/>AI</span><b>{{ data?.ai.enabled ? tr('فعال', 'Active') : tr('غیرفعال', 'Inactive') }}</b>
            </div>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>
