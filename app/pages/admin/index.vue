<script setup lang="ts">import {Bot, CreditCard, MessageCircle, Smartphone, Users} from "lucide-vue-next";

definePageMeta({layout: "admin", middleware: "admin"});
const {data, status} = await useFetch<any>("/api/admin/overview");
const cards = computed(() => [{l: "کل کاربران", v: data.value?.users, i: Users}, {
  l: "کاربران فعال",
  v: data.value?.activeUsers,
  i: Users
}, {l: "اشتراک فعال", v: data.value?.subscriptions, i: CreditCard}, {
  l: "واتساپ متصل",
  v: data.value?.sessions,
  i: Smartphone
}, {l: "کل پیام‌ها", v: data.value?.messages, i: MessageCircle}, {
  l: "مصرف AI",
  v: data.value?.ai,
  i: Bot
}, {
  l: "درآمد",
  v: new Intl.NumberFormat().format(data.value?.revenue || 0) + " تومان",
  i: CreditCard
}]);</script>
<template>
  <div>
    <PageHeader title="داشبورد مدیریت" description="آمار واقعی کل سامانه"/>
    <UiLoadingState v-if="status==='pending'"/>
    <section v-else class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <UiStatCard v-for="x in cards" :key="x.l" :label="x.l" :value="x.v??0">
        <template #icon>
          <component :is="x.i" :size="20"/>
        </template>
      </UiStatCard>
    </section>
  </div>
</template>
