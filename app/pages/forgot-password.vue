<script setup lang="ts">definePageMeta({layout: "auth"});
const {tr} = useAppPreferences();
const email = ref(""), sent = ref(false), busy = ref(false), error = ref("");

async function submit() {
  busy.value = true;
  error.value = "";
  try {
    await $fetch("/api/auth/forgot-password", {method: "POST", body: {email: email.value}});
    sent.value = true
  } catch (e: any) {
    error.value = e.data?.statusMessage || tr("ارسال ایمیل ناموفق بود.", "Could not send email.")
  } finally {
    busy.value = false
  }
}</script>
<template>
  <form @submit.prevent="submit"><h1 class="text-3xl font-black">{{ tr('بازیابی رمز عبور', 'Reset password') }}</h1>
    <p class="muted mb-7 mt-3">
      {{ tr('لینک امن تغییر رمز برای ایمیل شما ارسال می‌شود.', 'A secure reset link will be sent to your email.') }}</p>
    <div v-if="error" class="mb-4 rounded-xl bg-red-50 p-4 text-sm font-bold text-red-700">{{ error }}</div>
    <div v-if="sent" class="rounded-xl bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
      {{
        tr('اگر حسابی با این ایمیل وجود داشته باشد، لینک بازیابی ارسال شد.', 'If an account exists, a reset link has been sent.')
      }}
    </div>
    <template v-else><label class="label">{{ tr('ایمیل حساب', 'Account email') }}</label><input v-model="email"
                                                                                                class="input" required
                                                                                                type="email" dir="ltr">
      <button class="btn btn-primary mt-4 w-full" :disabled="busy">
        {{ busy ? tr('در حال ارسال...', 'Sending...') : tr('ارسال لینک بازیابی', 'Send reset link') }}
      </button>
    </template>
    <NuxtLink to="/login" class="btn btn-ghost mt-5 w-full">{{ tr('بازگشت به ورود', 'Back to sign in') }}</NuxtLink>
  </form>
</template>
