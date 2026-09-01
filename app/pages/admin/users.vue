<script setup lang="ts">import {Search} from "lucide-vue-next";

definePageMeta({layout: "admin", middleware: "admin"});
const search = ref("");
const {data, refresh} = await useFetch<any>("/api/admin/users", {query: computed(() => ({search: search.value}))});

async function update(id: string, values: any) {
  await $fetch(`/api/admin/users/${id}`, {method: "PATCH", body: values});
  await refresh()
}</script>
<template>
  <div>
    <PageHeader title="مدیریت کاربران" description="جستجو، نقش و وضعیت کاربران"/>
    <div class="surface mb-4 p-4">
      <div class="relative max-w-md">
        <Search class="absolute start-3 top-3 text-slate-400" :size="17"/>
        <input v-model="search" class="input ps-10" placeholder="نام، ایمیل یا موبایل"></div>
    </div>
    <section class="surface overflow-x-auto">
      <table class="w-full min-w-[800px] text-sm">
        <thead>
        <tr class="border-b text-start text-slate-400">
          <th class="p-4 text-start">کاربر</th>
          <th class="p-4 text-start">نقش</th>
          <th class="p-4 text-start">وضعیت</th>
          <th class="p-4">واتساپ</th>
          <th class="p-4">گفتگو</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="u in data?.users" :key="u.id" class="border-b">
          <td class="p-4"><b>{{ u.name }}</b><small class="block text-slate-400" dir="ltr">{{ u.email }}</small></td>
          <td class="p-4"><select :value="u.role" class="input py-2"
                                  @change="update(u.id,{role:($event.target as HTMLSelectElement).value})">
            <option>USER</option>
            <option>ADMIN</option>
            <option>SUPER_ADMIN</option>
          </select></td>
          <td class="p-4">
            <button class="badge" :class="u.status==='ACTIVE'?'bg-emerald-50 text-emerald-600':'bg-red-50 text-red-600'"
                    @click="update(u.id,{status:u.status==='ACTIVE'?'DISABLED':'ACTIVE'})">{{ u.status }}
            </button>
          </td>
          <td class="p-4 text-center">{{ u._count.whatsappSessions }}</td>
          <td class="p-4 text-center">{{ u._count.conversations }}</td>
        </tr>
        </tbody>
      </table>
    </section>
  </div>
</template>
