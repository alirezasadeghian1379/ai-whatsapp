<script setup lang="ts">
import {BookOpen, ChevronDown, LifeBuoy, Mail, Search, Smartphone} from "lucide-vue-next";

definePageMeta({layout: "dashboard", middleware: "auth"});
const {tr} = useAppPreferences(), query = ref(""), open = ref<string | null>(null);
const faqs = computed(() => [
  {
    id: "whatsapp",
    q: tr("چطور واتساپ را متصل کنم؟", "How do I connect WhatsApp?"),
    a: tr("از بخش اتصال واتساپ، افزودن شماره را بزنید و QR را از دستگاه‌های متصل اسکن کنید.", "Open WhatsApp connections, add a number, and scan the QR from Linked Devices.")
  },
  {
    id: "restore",
    q: tr("بعد از ری‌استارت باید دوباره QR اسکن کنم؟", "Must I scan QR after a restart?"),
    a: tr("خیر؛ نشست ذخیره می‌شود و تا وقتی از واتساپ خارج نشوید خودکار بازیابی خواهد شد.", "No. The session is restored unless WhatsApp logs the device out.")
  },
  {
    id: "ai",
    q: tr("چطور پاسخ خودکار AI را فعال کنم؟", "How do I enable AI auto replies?"),
    a: tr("مدل و API Key را تنظیم کنید، تست بگیرید و سپس پاسخ خودکار را فعال کنید.", "Configure the model and API key, run a test, then enable auto reply.")
  },
  {
    id: "groq",
    q: tr("برای Groq چه مدلی مناسب است؟", "Which Groq model should I use?"),
    a: tr("برای سرعت GPT-OSS 20B و برای کیفیت بالاتر GPT-OSS 120B مناسب است.", "Use GPT-OSS 20B for speed or GPT-OSS 120B for higher quality.")
  }
]);
const filtered = computed(() => {
  const value = query.value.trim().toLocaleLowerCase();
  return value ? faqs.value.filter(item => `${item.q} ${item.a}`.toLocaleLowerCase().includes(value)) : faqs.value
});
</script>
<template>
  <div>
    <PageHeader :title="tr('راهنما و پشتیبانی','Help & support')"
                :description="tr('پاسخ سریع پرسش‌ها و راه‌های ارتباط با تیم همراه‌چت.','Quick answers and ways to contact support.')"/>
    <section class="rounded-3xl bg-gradient-to-l from-brand-800 to-brand-600 p-8 text-center text-white">
      <LifeBuoy class="mx-auto mb-3" :size="34"/>
      <h2 class="text-2xl font-black">{{ tr('چطور می‌توانیم کمک کنیم؟', 'How can we help?') }}</h2>
      <div class="relative mx-auto mt-5 max-w-xl">
        <Search class="absolute start-4 top-1/2 -translate-y-1/2 text-slate-400" :size="18"/>
        <input v-model="query" class="block w-full rounded-xl bg-white py-3 pe-4 ps-11 text-slate-900"
               :placeholder="tr('موضوع موردنظر را جستجو کنید...','Search for a topic...')"></div>
    </section>
    <div class="mt-5 grid gap-5 md:grid-cols-2">
      <NuxtLink to="/dashboard/whatsapp" class="surface card-hover p-6">
        <Smartphone class="text-brand-600"/>
        <h3 class="mt-4 font-black">{{ tr('شروع سریع', 'Quick start') }}</h3>
        <p class="muted mt-2">{{ tr('اتصال اولین شماره در چند دقیقه.', 'Connect your first number in minutes.') }}</p>
      </NuxtLink>
      <NuxtLink to="/contact?subject=پشتیبانی پنل" class="surface card-hover p-6">
        <Mail class="text-sky-500"/>
        <h3 class="mt-4 font-black">{{ tr('تماس با پشتیبانی', 'Contact support') }}</h3>
        <p class="muted mt-2">{{ tr('درخواست خود را برای پشتیبانی بفرستید.', 'Send a request to support.') }}</p>
      </NuxtLink>
    </div>
    <section class="surface mt-5 divide-y overflow-hidden">
      <div v-if="!filtered.length" class="p-10 text-center">
        <BookOpen class="mx-auto text-slate-300" :size="36"/>
        <p class="muted mt-3">{{ tr('پاسخی پیدا نشد.', 'No answer matched your search.') }}</p></div>
      <button v-for="item in filtered" v-else :key="item.id" type="button" class="block w-full p-5 text-start"
              @click="open=open===item.id?null:item.id"><span class="flex items-center justify-between gap-3 font-bold">{{ item.q }}<ChevronDown
          class="shrink-0 text-slate-400 transition" :class="open===item.id?'rotate-180':''" :size="18"/></span>
        <p v-if="open===item.id" class="muted mt-3 animate-fade-up leading-7">{{ item.a }}</p></button>
    </section>
  </div>
</template>
