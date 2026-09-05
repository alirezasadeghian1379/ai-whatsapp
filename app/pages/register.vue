<script setup lang="ts">
definePageMeta({layout: "auth"});
const {tr} = useAppPreferences();
const form = reactive({name: "", email: "", phone: "", password: ""});
const pending = ref(false), error = ref("");

async function submit() {
  pending.value = true;
  error.value = "";
  try {
    await $fetch("/api/auth/register", {method: "POST", body: form});
    await navigateTo("/dashboard")
  } catch (e: any) {
    error.value = e?.data?.statusMessage || tr("ثبت‌نام انجام نشد.", "Registration failed.")
  } finally {
    pending.value = false
  }
}
</script>
<template>
  <form @submit.prevent="submit"><span
      class="badge bg-brand-50 text-brand-700">{{ tr('۱۴ روز رایگان', '14 days free') }}</span>
    <h1 class="mt-4 text-3xl font-black">{{ tr('ساخت حساب جدید', 'Create your account') }}</h1>
    <p class="muted mt-2 mb-7">{{ tr('بدون نیاز به کارت بانکی شروع کنید.', 'Start without a credit card.') }}</p>
    <div v-if="error" class="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-600">{{ error }}</div>
    <div class="grid gap-4 sm:grid-cols-2">
      <div><label class="label">{{ tr('نام و نام خانوادگی', 'Full name') }}</label><input v-model="form.name"
                                                                                          class="input" required
                                                                                          minlength="2"></div>
      <div><label class="label">{{ tr('شماره موبایل', 'Phone number') }}</label><input v-model="form.phone"
                                                                                       class="input" dir="ltr"
                                                                                       placeholder="09123456789"></div>
    </div>
    <div class="mt-4"><label class="label">{{ tr('ایمیل کاری', 'Work email') }}</label><input v-model="form.email"
                                                                                              class="input" required
                                                                                              type="email"></div>
    <div class="my-4"><label class="label">{{ tr('رمز عبور', 'Password') }}</label><input v-model="form.password"
                                                                                          class="input" required
                                                                                          minlength="10" type="password">
    </div>
    <button class="btn btn-primary w-full py-3.5" :disabled="pending">
      {{ pending ? tr('در حال ساخت حساب...', 'Creating account...') : tr('ساخت حساب و شروع', 'Create account') }}
    </button>
    <p class="mt-6 text-center text-sm text-slate-500">{{ tr('قبلاً ثبت‌نام کرده‌اید؟', 'Already registered?') }}
      <NuxtLink to="/login" class="font-bold text-brand-600">{{ tr('وارد شوید', 'Sign in') }}</NuxtLink>
    </p>
  </form>
</template>
