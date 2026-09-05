<script setup lang="ts">
import {Bell, CheckCheck, LoaderCircle} from "lucide-vue-next"

type NotificationItem = {
  id: string;
  title: string;
  body: string | null;
  href: string | null;
  readAt: string | null;
  createdAt: string
}
const {tr, formatDate} = useAppPreferences()
const open = ref(false), busy = ref(false)
const {data, refresh, status} = await useFetch<{
  notifications: NotificationItem[];
  unread: number
}>("/api/notifications", {lazy: true})
let timer: ReturnType<typeof setInterval> | undefined
const date = (value: string) => formatDate(value, {dateStyle: "medium", timeStyle: "short"})

async function read(id?: string) {
  if (busy.value) return
  busy.value = true
  try {
    await $fetch("/api/notifications/read", {method: "PATCH", body: id ? {id} : {all: true}});
    await refresh()
  } finally {
    busy.value = false
  }
}

async function go(item: NotificationItem) {
  if (!item.readAt) await read(item.id);
  open.value = false;
  if (item.href) await navigateTo(item.href)
}

function closeOnEscape(event: KeyboardEvent) {
  if (event.key === "Escape") open.value = false
}

onMounted(() => {
  window.addEventListener("keydown", closeOnEscape)
  timer = setInterval(() => {
    if (!document.hidden) void refresh()
  }, 30000)
})
onBeforeUnmount(() => {
  window.removeEventListener("keydown", closeOnEscape);
  clearInterval(timer)
})
</script>

<template>
  <div class="relative">
    <button type="button" class="icon-btn relative" :aria-label="tr('اعلان‌ها','Notifications')" :aria-expanded="open"
            @click="open=!open">
      <Bell :size="18"/>
      <i v-if="data?.unread"
         class="absolute -end-1 -top-1 grid min-w-5 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-black leading-5 text-white ring-2 ring-white dark:ring-slate-900">{{ data.unread > 99 ? '99+' : data.unread }}</i>
    </button>
    <div v-if="open"
         class="surface absolute end-0 top-12 z-50 w-[min(22rem,calc(100vw-2rem))] overflow-hidden shadow-2xl">
      <header class="flex items-center justify-between border-b p-4">
        <b>{{ tr('اعلان‌ها', 'Notifications') }}</b>
        <button type="button" class="flex items-center gap-1 text-xs text-brand-600 disabled:opacity-50"
                :disabled="busy||!data?.unread" @click="read()">
          <LoaderCircle v-if="busy" class="animate-spin" :size="15"/>
          <CheckCheck v-else :size="15"/>
          {{ tr('خواندن همه', 'Mark all read') }}
        </button>
      </header>
      <div class="max-h-96 overflow-auto">
        <div v-if="status==='pending'" class="grid h-32 place-items-center">
          <LoaderCircle class="animate-spin text-brand-500"/>
        </div>
        <p v-else-if="!data?.notifications.length" class="muted p-8 text-center">
          {{ tr('اعلانی ندارید.', 'No notifications.') }}</p>
        <button v-for="item in data?.notifications" v-else :key="item.id" type="button"
                class="block w-full border-b p-4 text-start hover:bg-slate-50 dark:hover:bg-slate-800"
                :class="!item.readAt?'bg-brand-50/50 dark:bg-brand-500/5':''" @click="go(item)">
          <span class="flex items-start gap-2"><i v-if="!item.readAt"
                                                  class="mt-1.5 size-2 shrink-0 rounded-full bg-brand-500"/><b
              class="text-sm">{{ item.title }}</b></span>
          <p v-if="item.body" class="muted mt-1 text-xs">{{ item.body }}</p>
          <small class="mt-2 block text-slate-400">{{ date(item.createdAt) }}</small>
        </button>
      </div>
    </div>
  </div>
</template>
