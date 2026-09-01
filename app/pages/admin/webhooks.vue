<script setup lang="ts">
import {Webhook} from "lucide-vue-next";

definePageMeta({layout: "admin", middleware: "admin"});
const {formatDate} = useAppPreferences();
const {data, status} = await useFetch<any>("/api/admin/webhooks");
</script>
<template>
  <div>
    <PageHeader title="مدیریت وب‌هوک‌ها" description="پایش Endpointها و آخرین نتیجه تحویل"/>
    <section class="surface overflow-x-auto">
      <UiLoadingState v-if="status==='pending'"/>
      <div v-else-if="!data?.webhooks?.length" class="grid h-52 place-items-center text-slate-400">
        <Webhook :size="42"/>
        وب‌هوکی ثبت نشده است.
      </div>
      <table v-else class="w-full min-w-[900px] text-sm">
        <thead>
        <tr class="border-b text-slate-400">
          <th class="p-4 text-start">کاربر</th>
          <th class="p-4 text-start">نام و Endpoint</th>
          <th class="p-4">وضعیت</th>
          <th class="p-4">تحویل‌ها</th>
          <th class="p-4">آخرین پاسخ</th>
          <th class="p-4 text-start">آخرین تغییر</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="h in data.webhooks" :key="h.id" class="border-b last:border-0">
          <td class="p-4"><b>{{ h.user.name }}</b><small class="block" dir="ltr">{{ h.user.email }}</small></td>
          <td class="p-4"><b>{{ h.name }}</b><code class="block max-w-sm truncate text-xs text-slate-400"
                                                   dir="ltr">{{ h.url }}</code></td>
          <td class="p-4 text-center"><span class="badge">{{ h.status }}</span></td>
          <td class="p-4 text-center">{{ h._count.deliveries }}</td>
          <td class="p-4 text-center">HTTP {{ h.deliveries[0]?.httpStatus || '—' }}</td>
          <td class="p-4">{{ formatDate(h.updatedAt, {dateStyle: 'medium', timeStyle: 'short'}) }}</td>
        </tr>
        </tbody>
      </table>
    </section>
  </div>
</template>
