<script setup lang="ts">
import {AlertCircle, Bell, LoaderCircle, Palette, Save, Shield, User} from "lucide-vue-next";

definePageMeta({layout: "dashboard", middleware: "auth"});
const {tr} = useAppPreferences();
const {data, status, refresh} = await useFetch<any>("/api/settings/profile");
const tab = ref("profile"), busy = ref(false), notice = ref(""), error = ref("");
const profile = reactive({
  name: "",
  email: "",
  phone: "",
  company: "",
  currentPassword: "",
  notifications: {message: true, disconnect: true, subscription: true}
});
const password = reactive({currentPassword: "", newPassword: "", confirmPassword: ""});
const tabs = computed(() => [{id: "profile", label: tr("پروفایل", "Profile"), icon: User}, {
  id: "security",
  label: tr("امنیت", "Security"),
  icon: Shield
}, {id: "appearance", label: tr("ظاهر و زبان", "Appearance & language"), icon: Palette}, {
  id: "notifications",
  label: tr("اعلان‌ها", "Notifications"),
  icon: Bell
}]);
watchEffect(() => {
  if (data.value?.user) Object.assign(profile, {
    ...data.value.user,
    company: data.value.preferences?.company || "",
    notifications: {...profile.notifications, ...(data.value.preferences?.notifications || {})}
  })
});

function fail(e: any) {
  error.value = e.data?.statusMessage || tr("ذخیره تغییرات ناموفق بود.", "Could not save changes.");
  notice.value = ""
}

async function save() {
  busy.value = true;
  error.value = "";
  try {
    if (tab.value === "security") {
      await $fetch("/api/settings/password", {method: "PUT", body: password});
      Object.assign(password, {currentPassword: "", newPassword: "", confirmPassword: ""})
    } else await $fetch("/api/settings/profile", {
      method: "PUT",
      body: {...profile, phone: profile.phone || null, company: profile.company || null}
    });
    notice.value = tr("تغییرات ذخیره شد.", "Changes saved.");
    await refresh()
  } catch (e) {
    fail(e)
  } finally {
    busy.value = false
  }
}
</script>
<template>
  <div>
    <PageHeader :title="tr('تنظیمات','Settings')"
                :description="tr('حساب کاربری و ترجیحات فضای کاری خود را مدیریت کنید.','Manage your account and workspace preferences.')"/>
    <UiFeedback v-if="notice" class="mb-4" type="success" :message="notice"/>
    <UiFeedback v-if="error" class="mb-4" type="error" :message="error"/>
    <UiLoadingState v-if="status==='pending'" class="surface" height="h-60"/>
    <div v-else class="grid gap-5 lg:grid-cols-[240px_1fr]">
      <nav class="surface h-fit p-2">
        <button v-for="item in tabs" :key="item.id"
                class="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold"
                :class="tab===item.id?'bg-brand-50 text-brand-700 dark:bg-brand-500/10':'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'"
                @click="tab=item.id">
          <component :is="item.icon" :size="18"/>
          {{ item.label }}
        </button>
      </nav>
      <form class="surface p-6" @submit.prevent="save">
        <template v-if="tab==='profile'"><h2 class="font-black">{{ tr('اطلاعات پروفایل', 'Profile information') }}</h2>
          <div class="mt-6 grid gap-4 sm:grid-cols-2"><label><span
              class="label">{{ tr('نام و نام خانوادگی', 'Full name') }}</span><input v-model="profile.name"
                                                                                     class="input"
                                                                                     required></label><label><span
              class="label">{{ tr('نام کسب‌وکار', 'Business name') }}</span><input v-model="profile.company"
                                                                                   class="input"></label><label><span
              class="label">{{ tr('ایمیل', 'Email') }}</span><input v-model="profile.email" class="input" dir="ltr"
                                                                    type="email" required></label><label><span
              class="label">{{ tr('موبایل', 'Phone') }}</span><input v-model="profile.phone" class="input"
                                                                     dir="ltr"></label><label class="sm:col-span-2"><span
              class="label">{{ tr('رمز فعلی (فقط برای تغییر ایمیل)', 'Current password (only to change email)') }}</span><input
              v-model="profile.currentPassword" class="input" type="password" autocomplete="current-password"></label></div>
        </template>
        <template v-else-if="tab==='security'"><h2 class="font-black">{{ tr('تغییر رمز عبور', 'Change password') }}</h2>
          <div class="mt-6 max-w-lg space-y-4"><input v-model="password.currentPassword" class="input" type="password"
                                                      :placeholder="tr('رمز فعلی','Current password')" required
                                                      minlength="8"><input v-model="password.newPassword" class="input"
                                                                           type="password"
                                                                           :placeholder="tr('رمز جدید','New password')"
                                                                           required minlength="10"><input
              v-model="password.confirmPassword" class="input" type="password"
              :placeholder="tr('تکرار رمز جدید','Confirm new password')" required minlength="10"></div>
        </template>
        <template v-else-if="tab==='appearance'"><h2 class="font-black">
          {{ tr('ظاهر و زبان', 'Appearance & language') }}</h2>
          <p class="muted my-4">
            {{
              tr('تم و زبان انتخاب‌شده در مرورگر شما ذخیره می‌شود.', 'Your theme and language are saved in the browser.')
            }}</p>
          <ThemeLanguageControls/>
        </template>
        <template v-else><h2 class="font-black">{{ tr('تنظیمات اعلان', 'Notification settings') }}</h2>
          <div class="mt-6 space-y-4"><label
              v-for="item in [{k:'message',fa:'پیام جدید',en:'New message'},{k:'disconnect',fa:'قطع اتصال واتساپ',en:'WhatsApp disconnected'},{k:'subscription',fa:'نزدیک شدن پایان اشتراک',en:'Subscription expiry'}]"
              :key="item.k"
              class="flex items-center justify-between rounded-xl border p-4 text-sm"><span>{{
              tr(item.fa, item.en)
            }}</span><input
              v-model="profile.notifications[item.k as keyof typeof profile.notifications]" type="checkbox"
              class="size-4 accent-brand-600"></label></div>
        </template>
        <button v-if="tab!=='appearance'" class="btn btn-primary mt-7" :disabled="busy">
          <LoaderCircle v-if="busy" class="animate-spin" :size="17"/>
          <Save v-else :size="17"/>
          {{ tr('ذخیره تغییرات', 'Save changes') }}
        </button>
      </form>
    </div>
  </div>
</template>
