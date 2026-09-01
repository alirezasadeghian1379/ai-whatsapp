<script setup lang="ts">
import {Bot} from "lucide-vue-next";

definePageMeta({layout: "admin", middleware: "admin"});
const {formatDate} = useAppPreferences();
const {data, status} = await useFetch<any>("/api/admin/ai");
</script>
<template>
  <div>
    <PageHeader title="مدیریت هوش مصنوعی" description="تنظیمات فعال کاربران بدون نمایش کلیدهای محرمانه"/>
    <section class="surface overflow-x-auto">
      <UiLoadingState v-if="status==='pending'"/>
      <div v-else-if="!data?.configurations?.length" class="grid h-52 place-items-center text-slate-400">
        <Bot :size="42"/>
        تنظیم AI ثبت نشده است.
      </div>
      <table v-else class="w-full min-w-[800px] text-sm">
        <thead>
        <tr class="border-b text-slate-400">
          <th class="p-4 text-start">کاربر</th>
          <th class="p-4">Provider</th>
          <th class="p-4">Model</th>
          <th class="p-4">AI</th>
          <th class="p-4">پاسخ خودکار</th>
          <th class="p-4">کلید API</th>
          <th class="p-4 text-start">آخرین تغییر</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="c in data.configurations" :key="c.id" class="border-b last:border-0">
          <td class="p-4"><b>{{ c.user.name }}</b><small class="block" dir="ltr">{{ c.user.email }}</small></td>
          <td class="p-4 text-center uppercase">{{ c.provider }}</td>
          <td class="p-4 text-center" dir="ltr">{{ c.model }}</td>
          <td class="p-4 text-center">{{ c.isEnabled ? 'فعال' : 'غیرفعال' }}</td>
          <td class="p-4 text-center">{{ c.autoReply ? 'فعال' : 'غیرفعال' }}</td>
          <td class="p-4 text-center">{{ c.hasApiKey ? 'ثبت شده' : 'ثبت نشده' }}</td>
          <td class="p-4">{{ formatDate(c.updatedAt, {dateStyle: 'medium', timeStyle: 'short'}) }}</td>
        </tr>
        </tbody>
      </table>
    </section>
  </div>
</template>
