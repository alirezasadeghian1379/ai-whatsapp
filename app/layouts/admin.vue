<script setup lang="ts">
import {
  ArrowRight,
  ClipboardList,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquareText,
  Settings,
  Users,
  WalletCards,
  X
} from "lucide-vue-next";

const open = ref(false), route = useRoute();
const items = [{to: "/admin", label: "داشبورد", icon: LayoutDashboard}, {
  to: "/admin/users",
  label: "کاربران",
  icon: Users
}, {to: "/admin/plans", label: "پلن‌ها", icon: Settings}, {
  to: "/admin/subscriptions",
  label: "اشتراک‌ها",
  icon: CreditCard
}, {to: "/admin/finance", label: "مالی و کیف پول", icon: WalletCards}, {
  to: "/admin/sms",
  label: "مدیریت پیامک",
  icon: MessageSquareText
}, {to: "/admin/logs", label: "گزارش فعالیت", icon: ClipboardList}];
watch(() => route.path, () => open.value = false);

async function logout() {
  await $fetch('/api/auth/logout', {method: 'POST'});
  return navigateTo('/login')
}

items.splice(5, 0,
    {to: "/admin/whatsapp", label: "مدیریت واتساپ", icon: MessageSquareText},
    {to: "/admin/ai", label: "مدیریت هوش مصنوعی", icon: Settings},
    {to: "/admin/settings", label: "تنظیمات سامانه", icon: Settings},
);
</script>
<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-950">
    <div v-if="open" class="fixed inset-0 z-30 bg-black/50 lg:hidden" @click="open=false"/>
    <aside
        class="fixed inset-y-0 start-0 z-40 flex w-72 flex-col border-e bg-slate-950 p-4 text-white transition-transform"
        :class="open?'translate-x-0':'rtl:translate-x-full ltr:-translate-x-full lg:translate-x-0!'">
      <div class="flex h-16 items-center justify-between">
        <AppLogo/>
        <button class="icon-btn lg:hidden" @click="open=false">
          <X/>
        </button>
      </div>
      <p class="my-5 text-xs text-slate-500">پنل مدیریت سیستم</p>
      <nav class="space-y-1">
        <NuxtLink v-for="x in items" :key="x.to" :to="x.to"
                  class="flex gap-3 rounded-xl px-3 py-3 text-sm text-slate-300 hover:bg-white/10"
                  exact-active-class="bg-brand-600! text-white!">
          <component :is="x.icon" :size="18"/>
          {{ x.label }}
        </NuxtLink>
      </nav>
      <div class="mt-auto space-y-2">
        <NuxtLink to="/dashboard" class="flex gap-2 rounded-xl p-3 text-sm text-slate-400 hover:bg-white/10">
          <ArrowRight :size="18"/>
          بازگشت به پنل کاربر
        </NuxtLink>
        <button class="flex w-full gap-2 rounded-xl p-3 text-sm text-red-300 hover:bg-white/10" @click="logout">
          <LogOut :size="18"/>
          خروج
        </button>
      </div>
    </aside>
    <div class="lg:ps-72">
      <header class="flex h-20 items-center border-b bg-white px-5 dark:bg-slate-900">
        <button class="icon-btn lg:hidden" @click="open=true">
          <Menu/>
        </button>
        <b class="ms-3">مدیریت همراه‌چت</b>
        <div class="ms-auto">
          <ThemeLanguageControls/>
        </div>
      </header>
      <main class="page-wrap pt-7">
        <slot/>
      </main>
    </div>
  </div>
</template>
