<script setup lang="ts">definePageMeta({layout: "admin", middleware: "admin"});
const {data, refresh} = await useFetch<any>("/api/admin/subscriptions");

async function save(s: any) {
  await $fetch(`/api/admin/subscriptions/${s.id}`, {
    method: "PATCH",
    body: {status: s.status, planId: s.planId, endsAt: s.endsAt}
  });
  await refresh()
}</script>
<template>
  <div>
    <PageHeader title="مدیریت اشتراک‌ها" description="تغییر پلن، وضعیت و تاریخ انقضا"/>
    <section class="surface overflow-x-auto">
      <table class="w-full min-w-[900px] text-sm">
        <thead>
        <tr class="border-b">
          <th class="p-4 text-start">کاربر</th>
          <th>پلن</th>
          <th>وضعیت</th>
          <th>پایان</th>
          <th>عملیات</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="s in data?.subscriptions" :key="s.id" class="border-b">
          <td class="p-4"><b>{{ s.user.name }}</b><small class="block">{{ s.user.email }}</small></td>
          <td><select v-model="s.planId" class="input">
            <option v-for="p in data.plans" :key="p.id" :value="p.id">{{ p.name }}</option>
          </select></td>
          <td><select v-model="s.status" class="input">
            <option>ACTIVE</option>
            <option>PENDING</option>
            <option>EXPIRED</option>
            <option>CANCELLED</option>
          </select></td>
          <td><input v-model="s.endsAt" class="input" type="datetime-local"></td>
          <td>
            <button class="btn btn-secondary" @click="save(s)">ذخیره</button>
          </td>
        </tr>
        </tbody>
      </table>
    </section>
  </div>
</template>
