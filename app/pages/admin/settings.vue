<script setup lang="ts">
import {LoaderCircle, Save, Plus, Trash2} from "lucide-vue-next"

definePageMeta({layout: "admin", middleware: "admin"})
const {tr} = useAppPreferences(), {data, refresh} = await useFetch<any>("/api/admin/settings")
const form = reactive<any>({
  name: "همراه‌چت",
  supportEmail: "",
  supportPhone: "",
  address: "",
  footerDescription: "",
  maintenanceMode: false,
  socials: {instagram: "", telegram: "", linkedin: "", x: ""},
  trustBadges: []
})
const busy = ref(false), notice = ref(""), error = ref("")
watchEffect(() => {
  if (data.value?.settings) Object.assign(form, data.value.settings, {
    socials: {...form.socials, ...data.value.settings.socials},
    trustBadges: data.value.settings.trustBadges || []
  })
})

function addBadge() {
  if (form.trustBadges.length < 4) form.trustBadges.push({title: "", imageUrl: "", linkUrl: ""})
}

async function save() {
  busy.value = true;
  notice.value = "";
  error.value = "";
  try {
    await $fetch("/api/admin/settings", {method: "PUT", body: form});
    notice.value = tr("تنظیمات عمومی و فوتر ذخیره شد.", "Public and footer settings saved.");
    await refresh()
  } catch (e: any) {
    error.value = e.data?.statusMessage || tr("ذخیره تنظیمات ناموفق بود.", "Could not save settings.")
  } finally {
    busy.value = false
  }
}
</script>
<template>
  <div>
    <PageHeader :title="tr('تنظیمات سامانه','System settings')"
                :description="tr('محتوای عمومی، اطلاعات تماس، شبکه‌های اجتماعی و نمادهای اعتماد را مدیریت کنید.','Manage public content, contact details, social links and trust badges.')"/>
    <UiFeedback v-if="notice" class="mb-4" type="success" :message="notice"/>
    <UiFeedback v-if="error" class="mb-4" type="error" :message="error"/>
    <form class="space-y-5" @submit.prevent="save">
      <section class="surface grid gap-5 p-6 md:grid-cols-2"><h2 class="font-black md:col-span-2">
        {{ tr('مشخصات عمومی', 'General information') }}</h2>
        <UiFormField :label="tr('نام سامانه','Site name')" required><input v-model="form.name" class="input" required>
        </UiFormField>
        <UiFormField :label="tr('ایمیل پشتیبانی','Support email')"><input v-model="form.supportEmail" class="input"
                                                                          type="email" dir="ltr"></UiFormField>
        <UiFormField :label="tr('تلفن پشتیبانی','Support phone')"><input v-model="form.supportPhone" class="input"
                                                                         dir="ltr"></UiFormField>
        <UiFormField :label="tr('آدرس','Address')"><input v-model="form.address" class="input"></UiFormField>
        <UiFormField class="md:col-span-2" :label="tr('توضیح کوتاه فوتر','Footer description')"><textarea
            v-model="form.footerDescription" class="input min-h-24" maxlength="300"/></UiFormField>
        <label class="flex items-center justify-between rounded-xl border p-4 md:col-span-2"><span><b
            class="block">{{ tr('حالت تعمیر و نگهداری', 'Maintenance mode') }}</b><small
            class="text-slate-400">{{ tr('برای توقف کنترل‌شده سرویس', 'Controlled service pause') }}</small></span><input
            v-model="form.maintenanceMode" class="size-5 accent-brand-600" type="checkbox"></label></section>
      <section class="surface grid gap-5 p-6 md:grid-cols-2"><h2 class="font-black md:col-span-2">
        {{ tr('شبکه‌های اجتماعی', 'Social networks') }}</h2>
        <UiFormField v-for="key in ['instagram','telegram','linkedin','x']" :key="key" :label="key"><input
            v-model="form.socials[key]" class="input" type="url" dir="ltr" :placeholder="`https://${key}.com/...`">
        </UiFormField>
      </section>
      <section class="surface p-6">
        <div class="flex items-center justify-between">
          <div><h2 class="font-black">{{ tr('نمادها و مجوزها', 'Trust badges') }}</h2>
            <p class="muted mt-1 text-xs">
              {{ tr('تصویر و لینک حداکثر چهار نماد را وارد کنید.', 'Add image and target URLs for up to four badges.') }}</p>
          </div>
          <button type="button" class="btn btn-secondary" :disabled="form.trustBadges.length>=4" @click="addBadge">
            <Plus :size="16"/>
            {{ tr('افزودن نماد', 'Add badge') }}
          </button>
        </div>
        <div class="mt-5 space-y-4">
          <div v-for="(badge,index) in form.trustBadges" :key="index"
               class="grid gap-3 rounded-2xl border p-4 md:grid-cols-[.6fr_1fr_1fr_auto]"><input v-model="badge.title"
                                                                                                 class="input"
                                                                                                 :placeholder="tr('عنوان نماد','Badge title')"
                                                                                                 required><input
              v-model="badge.imageUrl" class="input" type="url" placeholder="Image URL" dir="ltr" required><input
              v-model="badge.linkUrl" class="input" type="url" placeholder="Target URL" dir="ltr">
            <button type="button" class="icon-btn text-red-500" @click="form.trustBadges.splice(index,1)">
              <Trash2 :size="17"/>
            </button>
          </div>
        </div>
      </section>
      <button class="btn btn-primary" :disabled="busy">
        <LoaderCircle v-if="busy" class="animate-spin" :size="17"/>
        <Save v-else :size="17"/>
        {{ tr('ذخیره تنظیمات', 'Save settings') }}
      </button>
    </form>
  </div>
</template>
