<script setup lang="ts">const {tr} = useAppPreferences(), {data} = await useFetch<any>("/api/public/home")</script>
<template>
  <div>
    <PublicHeader/>
    <main class="mx-auto max-w-4xl px-5 py-16"><span
        class="badge bg-brand-50 text-brand-700">{{ tr('توافق استفاده', 'Usage agreement') }}</span>
      <h1 class="mt-5 text-4xl font-black">{{ tr('قوانین استفاده', 'Terms of service') }}</h1>
      <div class="surface prose mt-8 max-w-none space-y-6 p-7 leading-8 dark:prose-invert"><p>
        {{ tr('استفاده از سامانه باید مطابق قوانین، سیاست‌های واتساپ و حقوق مخاطبان انجام شود.', 'The service must be used in accordance with applicable laws, WhatsApp policies and contact rights.') }}</p>
        <p>
          {{ tr('ارسال پیام ناخواسته، سوءاستفاده از اطلاعات کاربران و تلاش برای اختلال در سرویس مجاز نیست.', 'Spam, misuse of user data and attempts to disrupt the service are prohibited.') }}</p>
        <p>
          {{ tr('ظرفیت هر قابلیت براساس اشتراک فعال محاسبه می‌شود و ممکن است پس از پایان اشتراک محدود شود.', 'Feature capacity is determined by the active subscription and may be restricted after it expires.') }}</p>
      </div>
    </main>
    <PublicFooter :settings="data?.settings"/>
  </div>
</template>
