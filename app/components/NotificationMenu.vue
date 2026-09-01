<script setup lang="ts">import {Bell, CheckCheck} from "lucide-vue-next";

const {tr} = useAppPreferences();
const open = ref(false);
const {data, refresh} = await useFetch<any>("/api/notifications", {lazy: true});

async function read(id?: string) {
  await $fetch("/api/notifications/read", {method: "PATCH", body: id ? {id} : {all: true}});
  await refresh()
}

async function go(n: any) {
  if (!n.readAt) await read(n.id);
  open.value = false;
  if (n.href) await navigateTo(n.href)
}

onMounted(() => {
  const timer = setInterval(() => refresh(), 30000);
  onBeforeUnmount(() => clearInterval(timer))
})</script>
<template>
  <div class="relative">
    <button class="icon-btn relative" :aria-label="tr('اعلان‌ها','Notifications')" @click="open=!open">
      <Bell :size="18"/>
      <i v-if="data?.unread"
         class="absolute end-2 top-2 size-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-900"/></button>
    <div v-if="open"
         class="surface absolute end-0 top-12 z-50 w-[min(22rem,calc(100vw-2rem))] overflow-hidden shadow-2xl">
      <header class="flex items-center justify-between border-b p-4"><b>{{ tr('اعلان‌ها', 'Notifications') }}</b>
        <button class="flex gap-1 text-xs text-brand-600" @click="read()">
          <CheckCheck :size="15"/>
          {{ tr('خواندن همه', 'Mark all read') }}
        </button>
      </header>
      <div class="max-h-96 overflow-auto"><p v-if="!data?.notifications?.length" class="muted p-8 text-center">
        {{ tr('اعلانی ندارید.', 'No notifications.') }}</p>
        <button v-for="n in data?.notifications" :key="n.id"
                class="block w-full border-b p-4 text-start hover:bg-slate-50 dark:hover:bg-slate-800"
                :class="!n.readAt?'bg-brand-50/50 dark:bg-brand-500/5':''" @click="go(n)"><b
            class="text-sm">{{ n.title }}</b>
          <p v-if="n.body" class="muted mt-1 text-xs">{{ n.body }}</p><small
              class="mt-2 block text-slate-400">{{ new Date(n.createdAt).toLocaleString() }}</small></button>
      </div>
    </div>
  </div>
</template>
