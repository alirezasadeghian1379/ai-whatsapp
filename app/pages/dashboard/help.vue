<script setup lang="ts">import {BookOpen, MessageCircle, Mail, ExternalLink} from "lucide-vue-next";

definePageMeta({layout: 'dashboard', middleware: 'auth'});
const query = ref('');
const faqs = [['چطور واتساپ را متصل کنم؟', 'از بخش اتصال واتساپ، افزودن شماره را بزنید و QR را اسکن کنید.'], ['چطور AI را فعال کنم؟', 'در صفحه هوش مصنوعی provider و مدل را انتخاب، prompt را تنظیم و ذخیره کنید.'], ['وب‌هوک چگونه امن می‌شود؟', 'هر درخواست با secret اختصاصی و امضای HMAC ارسال می‌شود.']];
const open = ref(0)</script>
<template>
  <div>
    <PageHeader title="راهنما و پشتیبانی" description="پاسخ سریع پرسش‌ها و راه‌های ارتباط با تیم همراه‌چت."/>
    <section class="rounded-3xl bg-gradient-to-l from-brand-800 to-brand-600 p-8 text-center text-white"><h2
        class="text-2xl font-black">چطور می‌توانیم کمک کنیم؟</h2><input v-model="query"
                                                                        class="mx-auto mt-5 block w-full max-w-xl rounded-xl bg-white px-4 py-3 text-slate-900"
                                                                        placeholder="موضوع موردنظر را جستجو کنید...">
    </section>
    <div class="mt-5 grid gap-5 md:grid-cols-3">
      <NuxtLink to="/dashboard/whatsapp" class="surface card-hover p-6">
        <BookOpen class="text-brand-600"/>
        <h3 class="mt-4 font-black">شروع سریع</h3>
        <p class="muted mt-2">اتصال اولین شماره در چند دقیقه.</p></NuxtLink>
      <a href="mailto:support@example.com" class="surface card-hover p-6">
        <Mail class="text-violet-500"/>
        <h3 class="mt-4 font-black">ایمیل پشتیبانی</h3>
        <p class="muted mt-2">پاسخ در کمتر از یک روز کاری.</p></a>
      <button class="surface card-hover p-6 text-start">
        <MessageCircle class="text-sky-500"/>
        <h3 class="mt-4 font-black">گفتگوی آنلاین</h3>
        <p class="muted mt-2">هر روز از ساعت ۹ تا ۱۸.</p></button>
    </div>
    <section class="surface mt-5 divide-y overflow-hidden">
      <button v-for="(f,i) in faqs" :key="f[0]" class="block w-full p-5 text-start" @click="open=open===i?-1:i"><span
          class="flex items-center justify-between font-bold">{{ f[0] }}<ExternalLink :size="16"
                                                                                      class="text-slate-400"/></span>
        <p v-if="open===i" class="muted mt-3 animate-fade-up">{{ f[1] }}</p></button>
    </section>
  </div>
</template>
