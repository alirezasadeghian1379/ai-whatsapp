<script setup lang="ts">
import {LoaderCircle, MessageCircleMore, Search, X} from "lucide-vue-next"

const {tr} = useAppPreferences()
const route = useRoute()
const query = ref(""), open = ref(false), pending = ref(false)
const results = ref<Array<{ id: string; name: string; phone: string; preview: string | null }>>([])
let timer: ReturnType<typeof setTimeout> | undefined

watch(query, value => {
  clearTimeout(timer)
  if (value.trim().length < 2) {
    results.value = [];
    pending.value = false;
    return
  }
  pending.value = true
  timer = setTimeout(async () => {
    try {
      results.value = (await $fetch<{ results: typeof results.value }>("/api/search", {query: {q: value}})).results;
      open.value = true
    } finally {
      pending.value = false
    }
  }, 300)
})
watch(() => route.fullPath, () => {
  open.value = false;
  query.value = ""
})
onBeforeUnmount(() => clearTimeout(timer))
</script>
<template>
  <div class="relative w-full" @focusin="open=true">
    <Search class="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" :size="17"/>
    <input v-model="query" class="input py-2.5 ps-10 pe-10"
           :placeholder="tr('جستجوی مخاطب یا شماره...','Search contact or phone...')">
    <LoaderCircle v-if="pending" class="absolute end-3 top-1/2 -translate-y-1/2 animate-spin text-brand-500"
                  :size="16"/>
    <button v-else-if="query" type="button" class="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400"
            @click="query='';open=false">
      <X :size="16"/>
    </button>
    <div v-if="open&&query.trim().length>=2"
         class="surface absolute inset-x-0 top-12 z-50 max-h-80 overflow-auto p-2 shadow-2xl">
      <p v-if="!pending&&!results.length" class="p-4 text-center text-sm text-slate-400">
        {{ tr('نتیجه‌ای پیدا نشد.', 'No results found.') }}</p>
      <NuxtLink v-for="item in results" :key="item.id" :to="`/dashboard/chats?conversation=${item.id}`"
                class="flex gap-3 rounded-xl p-3 hover:bg-slate-50 dark:hover:bg-slate-800">
        <span class="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600"><MessageCircleMore
            :size="18"/></span>
        <span class="min-w-0"><b class="block truncate text-sm">{{ item.name }}</b><small
            class="block truncate text-slate-400" dir="ltr">{{ item.phone }}</small><small v-if="item.preview"
                                                                                           class="block truncate text-slate-400">{{ item.preview }}</small></span>
      </NuxtLink>
    </div>
  </div>
</template>
