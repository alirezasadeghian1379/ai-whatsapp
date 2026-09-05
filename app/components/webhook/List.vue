<script setup lang="ts">import {Eye, Play, Trash2, Webhook} from "lucide-vue-next";
import type {WebhookItem} from "~/types/webhook";

defineProps<{ items: WebhookItem[]; pending: boolean; busy: boolean }>();
defineEmits<{ toggle: [item: WebhookItem]; history: [id: string]; test: [id: string]; remove: [id: string] }>();
const {tr} = useAppPreferences();</script>
<template>
  <section class="surface overflow-hidden">
    <UiLoadingState v-if="pending" height="h-48"/>
    <UiEmptyState v-else-if="!items.length" :title="tr('وب‌هوکی ساخته نشده است.','No webhooks created yet.')">
      <template #icon>
        <Webhook :size="30"/>
      </template>
    </UiEmptyState>
    <template v-else>
      <div
          class="hidden grid-cols-[1fr_1.5fr_1fr_.7fr_auto] gap-4 border-b bg-slate-50 px-5 py-3 text-xs font-bold text-slate-400 md:grid dark:bg-slate-800">
        <span>{{ tr('نام', 'Name') }}</span><span>Endpoint</span><span>{{ tr('رویدادها', 'Events') }}</span><span>{{ tr('وضعیت', 'Status') }}</span><span>{{ tr('عملیات', 'Actions') }}</span>
      </div>
      <article v-for="item in items" :key="item.id"
               class="grid gap-3 border-b p-5 last:border-0 md:grid-cols-[1fr_1.5fr_1fr_.7fr_auto] md:items-center">
        <div class="flex items-center gap-2 font-bold">
          <Webhook class="text-brand-600" :size="17"/>
          {{ item.name }}
        </div>
        <code class="truncate text-xs text-slate-400" dir="ltr">{{ item.url }}</code><span
          class="truncate text-xs">{{ item.events.join(', ') }}</span>
        <button class="badge w-fit"
                :class="item.status==='ACTIVE'?'bg-emerald-50 text-emerald-600':'bg-slate-100 text-slate-500'"
                @click="$emit('toggle',item)">{{ item.status }}
        </button>
        <div class="flex gap-1">
          <button class="icon-btn" :title="tr('تاریخچه','History')" @click="$emit('history',item.id)">
            <Eye :size="16"/>
          </button>
          <button class="icon-btn" :disabled="busy" :title="tr('ارسال تست','Send test')" @click="$emit('test',item.id)">
            <Play :size="16"/>
          </button>
          <button class="icon-btn hover:text-red-500" :title="tr('حذف','Delete')" @click="$emit('remove',item.id)">
            <Trash2 :size="16"/>
          </button>
        </div>
      </article>
    </template>
  </section>
</template>
