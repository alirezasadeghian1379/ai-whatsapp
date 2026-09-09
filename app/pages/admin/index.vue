<script setup lang="ts">
import {
  Activity,
  ArrowUpRight,
  Bot,
  CheckCircle2,
  CircleAlert,
  Clock3,
  CreditCard,
  LoaderCircle,
  MessageCircle,
  Smartphone,
  UserCheck,
  Users,
  WalletCards
} from "lucide-vue-next";

definePageMeta({layout: "admin", middleware: "admin"});

const {tr, formatDate, formatNumber} = useAppPreferences();
const {success: showSuccess, error: showError} = useAppAlert();
const {data, status, refresh} = await useFetch<any>("/api/admin/overview");
const refreshing = ref(false);

const summary = computed(() => data.value?.summary);
const cards = computed(() => [{
  label: tr("کل کاربران", "Total users"), value: summary.value?.users || 0,
  description: tr(`${formatNumber(summary.value?.newUsersThisMonth || 0)} عضو جدید در این ماه`, `${formatNumber(summary.value?.newUsersThisMonth || 0)} new this month`), icon: Users
}, {
  label: tr("کاربران فعال", "Active users"), value: summary.value?.activeUsers || 0,
  description: tr("حساب‌های فعال سامانه", "Active accounts"), icon: UserCheck
}, {
  label: tr("اشتراک‌های فعال", "Active subscriptions"), value: summary.value?.subscriptions || 0,
  description: tr("پلن‌های معتبر در حال حاضر", "Currently valid plans"), icon: CreditCard
}, {
  label: tr("واتساپ متصل", "Connected WhatsApp"), value: `${summary.value?.connectedSessions || 0} / ${summary.value?.allSessions || 0}`,
  description: tr("اتصال‌های پایدار", "Live connections"), icon: Smartphone
}, {
  label: tr("پیام‌های امروز", "Messages today"), value: summary.value?.messagesToday || 0,
  description: tr(`${formatNumber(summary.value?.messagesThisMonth || 0)} پیام در این ماه`, `${formatNumber(summary.value?.messagesThisMonth || 0)} this month`), icon: MessageCircle
}, {
  label: tr("درآمد این ماه", "Monthly revenue"), value: `${formatNumber(summary.value?.monthlyRevenue || 0)} ${tr("تومان", "Toman")}`,
  description: tr("پرداخت‌های موفق", "Successful payments"), icon: WalletCards
}, {
  label: tr("مصرف AI این ماه", "AI usage this month"), value: summary.value?.aiThisMonth || 0,
  description: tr("درخواست‌های پردازش‌شده", "Processed requests"), icon: Bot
}, {
  label: tr("پرداخت در انتظار", "Pending payments"), value: summary.value?.pendingPayments || 0,
  description: tr("نیازمند پیگیری", "Need attention"), icon: Clock3
}]);

const maxUsers = computed(() => Math.max(1, ...(data.value?.trends || []).map((item: any) => item.users)));
const maxRevenue = computed(() => Math.max(1, ...(data.value?.trends || []).map((item: any) => item.revenue)));

function paymentStatus(status: string) {
  const labels: Record<string, [string, string]> = {
    SUCCESS: ["موفق", "Successful"], PENDING: ["در انتظار", "Pending"],
    FAILED: ["ناموفق", "Failed"], CANCELLED: ["لغوشده", "Cancelled"]
  };
  const label = labels[status] || [status, status];
  return tr(label[0], label[1]);
}

function paymentClass(status: string) {
  return status === "SUCCESS" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300" :
      status === "PENDING" ? "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300" :
          "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300";
}

function activityLabel(action: string) {
  const labels: Record<string, [string, string]> = {
    CONTACT_CREATED: ["مخاطب جدید ایجاد شد", "New contact created"],
    "auth.password.reset": ["رمز عبور بازنشانی شد", "Password reset"],
    "subscription.activated": ["اشتراک فعال شد", "Subscription activated"]
  };
  const label = labels[action] || [action.replaceAll("_", " ").replaceAll(".", " "), action];
  return tr(label[0], label[1]);
}

async function reload() {
  refreshing.value = true;
  try {
    await refresh();
    showSuccess(tr("اطلاعات به‌روز شد.", "Dashboard updated."));
  } catch {
    showError(tr("به‌روزرسانی اطلاعات ناموفق بود.", "Could not refresh dashboard."));
  } finally {
    refreshing.value = false;
  }
}
</script>

<template>
  <div>
    <PageHeader :title="tr('نمای کلی مدیریت', 'Management overview')"
                :description="tr('وضعیت لحظه‌ای کاربران، درآمد، پرداخت‌ها و سلامت عملیاتی سامانه', 'Live view of users, revenue, payments and operational health')">
      <button type="button" class="btn btn-secondary" :disabled="refreshing" @click="reload">
        <LoaderCircle v-if="refreshing" class="animate-spin" :size="16"/>
        <Activity v-else :size="16"/>
        {{ tr('به‌روزرسانی', 'Refresh') }}
      </button>
    </PageHeader>

    <UiLoadingState v-if="status === 'pending'" height="h-96"/>
    <template v-else>
      <section class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <UiStatCard v-for="card in cards" :key="card.label" :label="card.label" :value="card.value" :description="card.description">
          <template #icon><component :is="card.icon" :size="20"/></template>
        </UiStatCard>
      </section>

      <section class="mt-5 grid gap-5 xl:grid-cols-[1.45fr_.85fr]">
        <article class="surface p-5 sm:p-6">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div><h2 class="font-black">{{ tr('روند ۷ روز اخیر', 'Last 7 days') }}</h2>
              <p class="muted mt-1 text-sm">{{ tr('عضویت کاربران و درآمد پرداخت‌های موفق', 'New users and successful payment revenue') }}</p></div>
            <NuxtLink to="/admin/finance" class="btn btn-secondary text-xs"><ArrowUpRight :size="15"/>{{ tr('جزئیات مالی', 'Finance') }}</NuxtLink>
          </div>
          <div class="mt-8 grid h-52 grid-cols-7 items-end gap-2 sm:gap-4">
            <div v-for="day in data?.trends" :key="day.key" class="flex h-full min-w-0 flex-col items-center justify-end gap-2">
              <div class="flex h-full w-full items-end justify-center gap-1 rounded-xl bg-slate-50 px-1 py-2 dark:bg-slate-800/70">
                <span class="w-2 rounded-full bg-brand-500 transition-all duration-500 sm:w-3"
                      :style="{height: `${Math.max(5, day.users / maxUsers * 100)}%`}" :title="`${day.users} users`"/>
                <span class="w-2 rounded-full bg-violet-400 transition-all duration-500 sm:w-3"
                      :style="{height: `${Math.max(5, day.revenue / maxRevenue * 100)}%`}" :title="`${formatNumber(day.revenue)} Toman`"/>
              </div>
              <small class="text-[10px] text-slate-400">{{ formatDate(day.date, {weekday: 'short'}) }}</small>
            </div>
          </div>
          <div class="mt-4 flex flex-wrap gap-4 text-xs text-slate-500"><span class="inline-flex items-center gap-2"><i class="size-2.5 rounded-full bg-brand-500"/>{{ tr('کاربران جدید', 'New users') }}</span>
            <span class="inline-flex items-center gap-2"><i class="size-2.5 rounded-full bg-violet-400"/>{{ tr('درآمد موفق', 'Successful revenue') }}</span></div>
        </article>

        <article class="surface p-5 sm:p-6">
          <h2 class="font-black">{{ tr('نیازمند توجه', 'Needs attention') }}</h2>
          <p class="muted mt-1 text-sm">{{ tr('مواردی که بهتر است امروز بررسی شوند', 'Items worth reviewing today') }}</p>
          <div class="mt-5 space-y-3">
            <NuxtLink to="/admin/finance" class="flex items-center gap-3 rounded-2xl bg-amber-50 p-4 transition hover:scale-[1.01] dark:bg-amber-500/10">
              <Clock3 class="text-amber-600" :size="20"/><span class="min-w-0 flex-1"><b class="block text-sm">{{ tr('پرداخت‌های در انتظار', 'Pending payments') }}</b><small class="text-slate-500">{{ tr('بررسی تراکنش‌های تکمیل‌نشده', 'Review incomplete transactions') }}</small></span><b>{{ formatNumber(summary?.pendingPayments || 0) }}</b>
            </NuxtLink>
            <NuxtLink to="/admin/whatsapp" class="flex items-center gap-3 rounded-2xl bg-brand-50 p-4 transition hover:scale-[1.01] dark:bg-brand-500/10">
              <Smartphone class="text-brand-600" :size="20"/><span class="min-w-0 flex-1"><b class="block text-sm">{{ tr('اتصال‌های واتساپ', 'WhatsApp connections') }}</b><small class="text-slate-500">{{ tr('اتصال‌های فعال از کل اتصال‌ها', 'Live connections out of total') }}</small></span><b>{{ formatNumber(summary?.connectedSessions || 0) }}/{{ formatNumber(summary?.allSessions || 0) }}</b>
            </NuxtLink>
            <NuxtLink to="/admin/logs" class="flex items-center gap-3 rounded-2xl p-4 ring-1 ring-red-100 transition hover:scale-[1.01] dark:ring-red-500/20">
              <CircleAlert class="text-red-500" :size="20"/><span class="min-w-0 flex-1"><b class="block text-sm">{{ tr('پیام ناموفق امروز', 'Failed messages today') }}</b><small class="text-slate-500">{{ tr('خطاهای ارسال قابل پیگیری', 'Delivery errors to investigate') }}</small></span><b>{{ formatNumber(summary?.failedMessagesToday || 0) }}</b>
            </NuxtLink>
          </div>
        </article>
      </section>

      <section class="mt-5 grid gap-5 2xl:grid-cols-2">
        <article class="surface overflow-hidden">
          <div class="flex items-center justify-between border-b p-5"><div><h2 class="font-black">{{ tr('جدیدترین کاربران', 'Newest users') }}</h2><p class="muted mt-1 text-xs">{{ tr('آخرین حساب‌های ایجادشده در سامانه', 'Most recently created accounts') }}</p></div>
            <NuxtLink to="/admin/users" class="btn btn-secondary text-xs">{{ tr('همه کاربران', 'All users') }}<ArrowUpRight :size="15"/></NuxtLink></div>
          <div v-if="data?.recentUsers?.length" class="divide-y">
            <div v-for="user in data.recentUsers" :key="user.id" class="flex items-center gap-3 p-4 sm:p-5">
              <span class="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-sm font-black text-brand-700 dark:bg-brand-500/10">{{ user.name?.slice(0, 2) }}</span>
              <div class="min-w-0 flex-1"><b class="block truncate text-sm">{{ user.name }}</b><small class="block truncate text-slate-400" dir="ltr">{{ user.email }}</small></div>
              <div class="hidden text-end sm:block"><span class="badge bg-slate-100 text-slate-600 dark:bg-slate-800">{{ user.subscription?.planName || tr('بدون پلن', 'No plan') }}</span><small class="mt-1 block text-slate-400">{{ formatDate(user.createdAt, {dateStyle: 'medium'}) }}</small></div>
            </div>
          </div>
          <UiEmptyState v-else class="p-8" :title="tr('هنوز کاربری ثبت‌نام نکرده است.', 'No users have joined yet.')"/>
        </article>

        <article class="surface overflow-hidden">
          <div class="flex items-center justify-between border-b p-5"><div><h2 class="font-black">{{ tr('آخرین پرداخت‌ها', 'Latest payments') }}</h2><p class="muted mt-1 text-xs">{{ tr('بدون نمایش شماره پیگیری یا اطلاعات حساس', 'No authority or sensitive payment data shown') }}</p></div>
            <NuxtLink to="/admin/finance" class="btn btn-secondary text-xs">{{ tr('گزارش مالی', 'Finance report') }}<ArrowUpRight :size="15"/></NuxtLink></div>
          <div v-if="data?.recentPayments?.length" class="divide-y">
            <div v-for="payment in data.recentPayments" :key="payment.id" class="flex items-center gap-3 p-4 sm:p-5">
              <span class="grid size-10 shrink-0 place-items-center rounded-xl bg-violet-50 text-violet-700 dark:bg-violet-500/10"><WalletCards :size="18"/></span>
              <div class="min-w-0 flex-1"><b class="block truncate text-sm">{{ payment.user?.name || tr('کاربر حذف‌شده', 'Deleted user') }}</b><small class="block truncate text-slate-400">{{ payment.planName || (payment.kind === 'wallet' ? tr('شارژ کیف پول', 'Wallet top-up') : tr('اشتراک', 'Subscription')) }}</small></div>
              <div class="text-end"><b class="block text-sm">{{ formatNumber(payment.amount) }} {{ tr('تومان', 'Toman') }}</b><span class="mt-1 badge" :class="paymentClass(payment.status)">{{ paymentStatus(payment.status) }}</span></div>
            </div>
          </div>
          <UiEmptyState v-else class="p-8" :title="tr('پرداختی ثبت نشده است.', 'No payments yet.')"/>
        </article>
      </section>

      <section class="surface mt-5 overflow-hidden">
        <div class="border-b p-5"><h2 class="font-black">{{ tr('فعالیت‌های اخیر سامانه', 'Recent system activity') }}</h2>
          <p class="muted mt-1 text-xs">{{ tr('خلاصه رویدادها بدون نمایش داده‌های حساس لاگ', 'Event summaries without exposing sensitive log metadata') }}</p></div>
        <div v-if="data?.recentActivity?.length" class="grid divide-y lg:grid-cols-2 lg:divide-x lg:rtl:divide-x-reverse lg:divide-y-0">
          <div v-for="activity in data.recentActivity" :key="activity.id" class="flex items-center gap-3 p-4">
            <CheckCircle2 class="shrink-0 text-emerald-500" :size="18"/><div class="min-w-0 flex-1"><b class="block truncate text-sm">{{ activityLabel(activity.action) }}</b><small class="block truncate text-slate-400">{{ activity.user?.name || tr('سیستم', 'System') }} · {{ formatDate(activity.createdAt, {dateStyle: 'medium', timeStyle: 'short'}) }}</small></div>
          </div>
        </div>
        <UiEmptyState v-else class="p-8" :title="tr('رویدادی برای نمایش وجود ندارد.', 'No activity to show yet.')"/>
      </section>
    </template>
  </div>
</template>
