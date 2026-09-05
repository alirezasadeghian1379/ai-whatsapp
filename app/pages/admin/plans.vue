<script setup lang="ts">import {Plus, Save} from "lucide-vue-next";

definePageMeta({layout: "admin", middleware: "admin"});
const {data, refresh} = await useFetch<any>("/api/admin/plans");
const modal = ref(false);
const empty = () => ({
  name: "",
  slug: "",
  description: "",
  price: 0,
  durationDays: 30,
  maxWhatsAppConnections: 1,
  maxMessages: 500,
  maxWebhooks: 0,
  maxAIRequests: 100,
  maxContacts: 250,
  features: "",
  isActive: true,
  sortOrder: 0
});
const form = reactive(empty());

async function create() {
  await $fetch("/api/admin/plans", {
    method: "POST",
    body: {...form, description: form.description || null, features: form.features.split("\n").filter(Boolean)}
  });
  Object.assign(form, empty());
  modal.value = false;
  await refresh()
}

async function save(p: any) {
  await $fetch(`/api/admin/plans/${p.id}`, {
    method: "PUT",
    body: {...p, price: Number(p.price), description: p.description || null, features: p.features}
  });
  await refresh()
}</script>
<template>
  <div>
    <PageHeader title="مدیریت پلن‌ها" description="قیمت و محدودیت‌ها از دیتابیس مدیریت می‌شوند">
      <button class="btn btn-primary" @click="modal=true">
        <Plus :size="17"/>
        پلن جدید
      </button>
    </PageHeader>
    <section class="grid gap-5 xl:grid-cols-3">
      <article v-for="p in data?.plans" :key="p.id" class="surface space-y-3 p-5"><input v-model="p.name"
                                                                                         class="input font-bold"><input
          v-model.number="p.price" class="input" type="number">
        <div class="grid grid-cols-2 gap-2"><label class="text-xs">واتساپ<input
            v-model.number="p.maxWhatsAppConnections" class="input mt-1" type="number"></label><label class="text-xs">پیام<input
            v-model.number="p.maxMessages" class="input mt-1" type="number"></label><label class="text-xs">AI<input
            v-model.number="p.maxAIRequests" class="input mt-1" type="number"></label></div>
        <label class="flex gap-2 text-sm"><input v-model="p.isActive" type="checkbox">فعال</label>
        <button class="btn btn-secondary w-full" @click="save(p)">
          <Save :size="16"/>
          ذخیره
        </button>
      </article>
    </section>
    <AppModal :open="modal" title="پلن جدید" @close="modal=false">
      <form class="grid gap-3 sm:grid-cols-2" @submit.prevent="create"><input v-model="form.name" class="input"
                                                                              placeholder="نام" required><input
          v-model="form.slug" class="input" placeholder="slug" dir="ltr" required><input v-model.number="form.price"
                                                                                         class="input" type="number"
                                                                                         placeholder="قیمت"><input
          v-model.number="form.durationDays" class="input" type="number" placeholder="مدت"><input
          v-model.number="form.maxWhatsAppConnections" class="input" type="number" placeholder="واتساپ"><input
          v-model.number="form.maxMessages" class="input" type="number" placeholder="پیام"><input
          v-model.number="form.maxAIRequests" class="input" type="number" placeholder="AI"><input
          v-model.number="form.maxContacts" class="input" type="number" placeholder="مخاطب"><textarea
          v-model="form.features" class="input sm:col-span-2" placeholder="هر امکان در یک خط"/>
        <button class="btn btn-primary sm:col-span-2">ایجاد</button>
      </form>
    </AppModal>
  </div>
</template>
