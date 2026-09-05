<script setup lang="ts">const {tr} = useAppPreferences(), {data} = await useFetch<any>("/api/public/home")</script>
<template>
  <div>
    <PublicHeader/>
    <main class="mx-auto max-w-4xl px-5 py-16"><span
        class="badge bg-brand-50 text-brand-700">{{ tr('حقوق کاربران', 'User rights') }}</span>
      <h1 class="mt-5 text-4xl font-black">{{ tr('حریم خصوصی', 'Privacy policy') }}</h1>
      <div class="surface prose mt-8 max-w-none space-y-6 p-7 leading-8 dark:prose-invert"><p>
        {{ tr('اطلاعات حساب فقط برای ارائه و ایمن‌سازی خدمات همراه‌چت پردازش می‌شود.', 'Account information is processed only to provide and secure Hamrah Chat services.') }}</p>
        <p>
          {{ tr('محتوای گفتگوها و اطلاعات اتصال بدون اجازه شما به اشخاص ثالث فروخته نمی‌شود. کلیدهای سرویس‌ها به‌صورت رمزنگاری‌شده نگهداری می‌شوند.', 'Conversation content and connection data are not sold to third parties. Service keys are stored encrypted.') }}</p>
        <p>
          {{ tr('برای درخواست حذف یا دریافت اطلاعات حساب، از صفحه تماس با ما یا ایمیل پشتیبانی استفاده کنید.', 'Use the contact page or support email to request account data or deletion.') }}</p>
      </div>
    </main>
    <PublicFooter :settings="data?.settings"/>
  </div>
</template>
