<script setup lang="ts">
import {Archive, Inbox, UserRound} from "lucide-vue-next";
import type {ChatConversation, ChatDetail} from "~/types/chat";

definePageMeta({layout: "dashboard", middleware: "auth"});
const {tr, formatDate} = useAppPreferences();
const route = useRoute();
const search = ref(""), archived = ref(false), selectedId = ref<string | null>(null), text = ref(""), busy = ref(false),
    stateBusy = ref(false), error = ref("");
const {data, status, refresh} = await useFetch<{
  conversations: ChatConversation[]
}>("/api/chats", {query: computed(() => ({search: search.value, archived: archived.value}))});
const conversations = computed(() => data.value?.conversations || []), detail = ref<ChatDetail | null>(null);
const messagesEl = ref<HTMLElement | null>(null), syncing = ref(false);
const time = (value: string | null) => formatDate(value, {
  hour: "2-digit",
  minute: "2-digit",
  month: "short",
  day: "numeric"
});

async function select(id: string) {
  selectedId.value = id;
  error.value = "";
  try {
    detail.value = (await $fetch<{ conversation: ChatDetail }>(`/api/chats/${id}`)).conversation;
    await refresh();
    await nextTick();
    messagesEl.value?.scrollTo({top: messagesEl.value.scrollHeight})
  } catch (e: any) {
    error.value = e.data?.statusMessage || tr("بارگذاری گفتگو ناموفق بود.", "Could not load conversation.")
  }
}

async function syncActiveConversation() {
  if (!selectedId.value || syncing.value || busy.value || stateBusy.value || document.hidden) return;
  syncing.value = true;
  try {
    const previousCount = detail.value?.messages.length || 0;
    const result = await $fetch<{conversation: ChatDetail}>(`/api/chats/${selectedId.value}`);
    detail.value = result.conversation;
    if (result.conversation.messages.length !== previousCount) {
      await nextTick();
      messagesEl.value?.scrollTo({top: messagesEl.value.scrollHeight, behavior: "smooth"})
    }
  } catch {
    // A temporary polling failure must not replace the useful page-level state.
  } finally {
    syncing.value = false
  }
}

async function send() {
  if (!selectedId.value || !text.value.trim()) return;
  busy.value = true;
  error.value = "";
  try {
    await $fetch(`/api/chats/${selectedId.value}/send`, {method: "POST", body: {body: text.value}});
    text.value = "";
    await select(selectedId.value)
  } catch (e: any) {
    error.value = e.data?.statusMessage || tr("ارسال پیام ناموفق بود.", "Message failed.")
  } finally {
    busy.value = false
  }
}

async function changeState(values: { isPinned?: boolean; isArchived?: boolean }) {
  if (!detail.value || stateBusy.value) return;
  stateBusy.value = true;
  error.value = "";
  try {
    const result = await $fetch<{
      conversation: ChatConversation
    }>(`/api/chats/${detail.value.id}/state`, {method: "PATCH", body: values});
    detail.value = {...detail.value, ...result.conversation};
    if (values.isArchived !== undefined) {
      detail.value = null;
      selectedId.value = null
    }
    await refresh()
  } catch (e: any) {
    error.value = e.data?.statusMessage || tr("تغییر وضعیت گفتگو انجام نشد.", "Could not update conversation.")
  } finally {
    stateBusy.value = false
  }
}

watch([search, archived], () => {
  selectedId.value = null;
  detail.value = null
});
watch(() => route.query.conversation, id => {
  if (typeof id === "string" && id && id !== selectedId.value) void select(id)
}, {immediate: true});
let timer: ReturnType<typeof setInterval> | undefined;
onMounted(() => {
  timer = setInterval(async () => {
    if (document.hidden) return;
    await refresh();
    await syncActiveConversation()
  }, 5000)
});
onBeforeUnmount(() => clearInterval(timer));
</script>
<template>
  <div>
    <PageHeader :title="tr('گفتگوها','Conversations')" :description="tr('پیام‌های واقعی واتساپ را مدیریت و پاسخ دهید.','Manage and reply to WhatsApp messages.')">
      <button class="btn btn-secondary gap-2" @click="archived=!archived">
        <component :is="archived?Inbox:Archive" :size="17"/>
        {{ archived ? tr('صندوق ورودی', 'Inbox') : tr('بایگانی‌شده‌ها', 'Archived') }}
      </button>
    </PageHeader>
    <UiFeedback v-if="error" class="mb-4" type="error" :message="error"/>
    <section class="surface grid min-h-[680px] overflow-hidden lg:grid-cols-[320px_1fr_260px]">
      <ChatConversationList v-model:search="search" :items="conversations" :selected-id="selectedId" :pending="status==='pending'" :format-time="time" @select="select"/>
      <div v-if="detail" class="flex min-w-0 flex-col">
        <ChatHeader :conversation="detail" :busy="stateBusy" @pin="changeState({isPinned:!detail.isPinned})" @archive="changeState({isArchived:!detail.isArchived})"/>
        <div ref="messagesEl" class="max-h-[530px] flex-1 space-y-4 overflow-auto bg-slate-50/60 p-5 dark:bg-slate-950/50">
          <ChatMessageBubble v-for="m in detail.messages" :key="m.id" :message="m" :formatted-time="time(m.sentAt||m.createdAt)"/>
        </div>
        <ChatComposer v-model="text" :busy="busy" :disabled="detail.session.status!=='CONNECTED'" @send="send"/>
      </div>
      <UiEmptyState v-else class="lg:col-span-2" :title="tr('یک گفتگو را انتخاب کنید.','Select a conversation.')" :description="tr('پیام‌ها و اطلاعات مخاطب اینجا نمایش داده می‌شود.','Messages and contact details will appear here.')">
        <template #icon>
          <UserRound :size="30"/>
        </template>
      </UiEmptyState>
      <ChatContactPanel v-if="detail" :contact="detail.contact"/>
    </section>
  </div>
</template>
