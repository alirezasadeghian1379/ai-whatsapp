<script setup lang="ts">
import {MessageSquareText, Plus, Power, Send, Star, Trash2} from "lucide-vue-next";

definePageMeta({layout: "dashboard", middleware: "auth"});
const {tr} = useAppPreferences();
const {data, refresh} = await useFetch<any>("/api/sms/configurations");
const show = ref(false), sendOpen = ref(false), error = ref(""), notice = ref("");
const form = reactive({title: "", provider: "mock", apiKey: "", sender: "", isDefault: true}),
    test = reactive({configurationId: "", to: "", body: "این یک پیام آزمایشی از همراه‌چت است."});
const fail = (e: any, f: string) => error.value = e.data?.statusMessage || tr(f, "Operation failed.");

async function save() {
  error.value = "";
  try {
    await $fetch("/api/sms/configurations", {method: "POST", body: form});
    show.value = false;
    Object.assign(form, {title: "", provider: "mock", apiKey: "", sender: "", isDefault: true});
    await refresh()
  } catch (e: any) {
    fail(e, "ثبت پنل انجام نشد.")
  }
}

async function remove(id: string) {
  try {
    await $fetch(`/api/sms/configurations/${id}`, {method: 'DELETE'});
    await refresh()
  } catch (e: any) {
    fail(e, "حذف پنل انجام نشد.")
  }
}

async function update(item: any, values: any) {
  try {
    await $fetch(`/api/sms/configurations/${item.id}`, {method: 'PATCH', body: values});
    await refresh()
  } catch (e: any) {
    fail(e, "تغییر وضعیت انجام نشد.")
  }
}

function openSend(item: any) {
  test.configurationId = item.id;
  sendOpen.value = true;
  error.value = "";
  notice.value = ""
}

async function send() {
  try {
    await $fetch('/api/sms/send', {method: 'POST', body: test});
    sendOpen.value = false;
    notice.value = tr('پیام آزمایشی با موفقیت ثبت و ارسال شد.', 'Test SMS was sent successfully.')
  } catch (e: any) {
    fail(e, "ارسال پیام انجام نشد.")
  }
}
</script>
<template>
  <div>
    <PageHeader :title="tr('پنل پیامکی','SMS providers')"
                :description="tr('چند پنل پیامکی را متصل، آزمایش و مدیریت کنید.','Connect, test, and manage multiple SMS providers.')">
      <button class="btn btn-primary" @click="show=true">
        <Plus :size="17"/>
        {{ tr('افزودن پنل', 'Add provider') }}
      </button>
    </PageHeader>
    <div v-if="error" class="mb-4 rounded-xl bg-red-50 p-3 text-red-600">{{ error }}</div>
    <div v-if="notice" class="mb-4 rounded-xl bg-emerald-50 p-3 text-emerald-700">{{ notice }}</div>
    <section v-if="!data?.configurations?.length" class="surface grid min-h-64 place-items-center text-center">
      <div>
        <MessageSquareText class="mx-auto text-slate-300" :size="48"/>
        <p class="muted mt-3">{{ tr('هنوز پنل پیامکی متصل نشده است.', 'No SMS provider connected yet.') }}</p></div>
    </section>
    <section v-else class="grid gap-4 md:grid-cols-2">
      <article v-for="item in data.configurations" :key="item.id" class="surface p-5">
        <div class="flex items-center gap-4">
          <MessageSquareText class="text-brand-600"/>
          <div class="min-w-0"><b>{{ item.title }}</b><small class="muted block">{{ item.provider }} ·
            {{ item.sender || tr('بدون خط ارسال', 'No sender') }}</small></div>
          <span class="ms-auto size-2 rounded-full" :class="item.isEnabled?'bg-emerald-500':'bg-slate-300'"/></div>
        <div class="mt-5 flex flex-wrap gap-2">
          <button class="btn btn-secondary px-3" @click="openSend(item)">
            <Send :size="16"/>
            {{ tr('تست ارسال', 'Test') }}
          </button>
          <button class="icon-btn" :class="item.isDefault?'text-amber-500':''" :title="tr('پیش‌فرض','Default')"
                  @click="update(item,{isDefault:true,isEnabled:true})">
            <Star :size="16"/>
          </button>
          <button class="icon-btn" :class="item.isEnabled?'text-emerald-600':'text-slate-400'"
                  @click="update(item,{isEnabled:!item.isEnabled})">
            <Power :size="16"/>
          </button>
          <button class="icon-btn text-red-500" @click="remove(item.id)">
            <Trash2 :size="16"/>
          </button>
        </div>
      </article>
    </section>
    <AppModal :open="show" :title="tr('افزودن پنل پیامکی','Add SMS provider')" @close="show=false">
      <form class="space-y-4" @submit.prevent="save"><input v-model="form.title" class="input" required
                                                            :placeholder="tr('عنوان اتصال','Connection title')"><select
          v-model="form.provider" class="input">
        <option v-for="p in data?.providers" :key="p.id" :value="p.id">{{ p.name }}</option>
      </select><input v-if="form.provider!=='mock'" v-model="form.apiKey" type="password" class="input" required
                      placeholder="API Key"><input v-model="form.sender" class="input"
                                                   :placeholder="tr('شماره یا خط ارسال','Sender number')"><label
          class="flex gap-2"><input v-model="form.isDefault" type="checkbox">{{ tr('پنل پیش‌فرض', 'Default provider') }}</label>
        <button class="btn btn-primary w-full">{{ tr('ذخیره اتصال', 'Save connection') }}</button>
      </form>
    </AppModal>
    <AppModal :open="sendOpen" :title="tr('ارسال پیام آزمایشی','Send test SMS')" @close="sendOpen=false">
      <form class="space-y-4" @submit.prevent="send"><input v-model="test.to" class="input" required dir="ltr"
                                                            placeholder="09123456789"><textarea v-model="test.body"
                                                                                                class="input min-h-28"
                                                                                                required
                                                                                                maxlength="1000"/>
        <button class="btn btn-primary w-full">
          <Send :size="17"/>
          {{ tr('ارسال پیام', 'Send SMS') }}
        </button>
      </form>
    </AppModal>
  </div>
</template>
