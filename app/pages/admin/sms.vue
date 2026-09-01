<script setup lang="ts">definePageMeta({layout: 'admin', middleware: 'admin'});
const {formatDate} = useAppPreferences();
const {data} = await useFetch<any>('/api/admin/sms');</script>
<template>
  <div>
    <PageHeader title="مدیریت پیامک" description="پنل‌های متصل و گزارش ارسال پیامک"/>
    <section class="surface overflow-hidden"><h2 class="border-b p-5 font-black">پنل‌های متصل</h2>
      <div v-for="c in data?.configurations" :key="c.id" class="grid gap-2 border-b p-5 md:grid-cols-5">
        <span>{{ c.user.name }}<small class="block text-slate-400">{{ c.user.email }}</small></span><b>{{ c.title }}</b><span>{{ c.provider }}</span><span>{{ c.isEnabled ? 'فعال' : 'غیرفعال' }}</span><span>{{ c.hasApiKey ? 'دارای کلید' : 'بدون کلید' }}</span>
      </div>
    </section>
    <section class="surface mt-5 overflow-hidden"><h2 class="border-b p-5 font-black">گزارش ارسال</h2>
      <div v-for="m in data?.messages" :key="m.id" class="grid gap-2 border-b p-5 md:grid-cols-5">
        <span>{{ m.user.name }}</span><code dir="ltr">+{{ m.to }}</code><span class="truncate">{{ m.body }}</span><span>{{ m.status }}</span><small>{{
          formatDate(m.createdAt, {
            dateStyle: 'medium',
            timeStyle: 'short'
          })
        }}</small></div>
    </section>
  </div>
</template>
