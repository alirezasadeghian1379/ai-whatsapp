<script setup lang="ts">
import {AlertCircle, LoaderCircle, Save} from "lucide-vue-next";

definePageMeta({layout: "admin", middleware: "admin"});
const {data, refresh} = await useFetch<any>("/api/admin/settings");
const form = reactive({name: "همراه‌چت", supportEmail: "", maintenanceMode: false});
const busy = ref(false), notice = ref(""), error = ref("");
watchEffect(() => {
  if (data.value?.settings) Object.assign(form, data.value.settings)
});

async function save() {
  busy.value = true;
  notice.value = "";
  error.value = "";
  try {
    await $fetch("/api/admin/settings", {method: "PUT", body: form});
    notice.value = "تنظیمات سامانه ذخیره شد.";
    await refresh()
  } catch (e: any) {
    error.value = e.data?.statusMessage || "ذخیره تنظیمات ناموفق بود."
  } finally {
    busy.value = false
  }
}
</script>
<template>
  <div>
    <PageHeader title="تنظیمات سامانه" description="مشخصات عمومی و وضعیت سرویس را مدیریت کنید."/>
    <UiFeedback v-if="notice" class="mb-4" type="success" :message="notice"/>
    <UiFeedback v-if="error" class="mb-4" type="error" :message="error"/>
    <form class="surface max-w-3xl space-y-5 p-6" @submit.prevent="save"><label class="block"><span class="label">نام سامانه</span><input
        v-model="form.name" class="input" required minlength="2"></label><label class="block"><span class="label">ایمیل پشتیبانی</span><input
        v-model="form.supportEmail" class="input" type="email" dir="ltr"></label><label
        class="flex items-center justify-between rounded-xl border p-4"><span><b
        class="block">حالت تعمیر و نگهداری</b><small class="text-slate-400">برای آماده‌سازی توقف کنترل‌شده سرویس</small></span><input
        v-model="form.maintenanceMode" class="size-5 accent-brand-600" type="checkbox"></label>
      <button class="btn btn-primary" :disabled="busy">
        <LoaderCircle v-if="busy" class="animate-spin" :size="17"/>
        <Save v-else :size="17"/>
        ذخیره تنظیمات
      </button>
    </form>
  </div>
</template>
