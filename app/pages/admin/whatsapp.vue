<script setup lang="ts">
import {MessageCircleMore, Smartphone} from "lucide-vue-next";

definePageMeta({layout: "admin", middleware: "admin"});
const {formatDate} = useAppPreferences();
const {data, status} = await useFetch<any>("/api/admin/whatsapp");
</script>
<template>
  <div>
    <PageHeader title="مدیریت واتساپ" description="وضعیت اتصال‌ها و میزان استفاده کاربران"/>
    <section class="surface overflow-x-auto">
      <UiLoadingState v-if="status==='pending'"/>
      <div v-else-if="!data?.sessions?.length" class="grid h-52 place-items-center text-center text-slate-400">
        <Smartphone class="mx-auto mb-3" :size="42"/>
        اتصالی ثبت نشده است.
      </div>
      <table v-else class="w-full min-w-[850px] text-sm">
        <thead>
        <tr class="border-b text-slate-400">
          <th class="p-4 text-start">کاربر</th>
          <th class="p-4 text-start">حساب واتساپ</th>
          <th class="p-4 text-start">ارائه‌دهنده</th>
          <th class="p-4">وضعیت</th>
          <th class="p-4">گفتگوها</th>
          <th class="p-4 text-start">آخرین فعالیت</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="s in data.sessions" :key="s.id" class="border-b last:border-0">
          <td class="p-4"><b>{{ s.user.name }}</b><small class="block text-slate-400"
                                                         dir="ltr">{{ s.user.email }}</small></td>
          <td class="p-4"><b>{{ s.displayName || '—' }}</b><small class="block font-mono"
                                                                  dir="ltr">{{
              s.phoneNumber ? `+${s.phoneNumber}` : '—'
            }}</small>
          </td>
          <td class="p-4 uppercase">{{ s.provider }}</td>
          <td class="p-4 text-center"><span class="badge"
                                            :class="s.status==='CONNECTED'?'bg-emerald-50 text-emerald-700':'bg-slate-100 text-slate-600'">{{
              s.status
            }}</span>
          </td>
          <td class="p-4 text-center">
            <MessageCircleMore class="me-1 inline" :size="15"/>
            {{ s._count.conversations }}
          </td>
          <td class="p-4">{{ formatDate(s.lastSeenAt || s.updatedAt, {dateStyle: 'medium', timeStyle: 'short'}) }}</td>
        </tr>
        </tbody>
      </table>
    </section>
  </div>
</template>
