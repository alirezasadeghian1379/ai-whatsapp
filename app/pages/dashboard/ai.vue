<script setup lang="ts">
import {AlertCircle, Bot, KeyRound, LoaderCircle, Play, Save, Sparkles} from "lucide-vue-next";

definePageMeta({layout: "dashboard", middleware: "auth"});
const {tr} = useAppPreferences();
const {data, status, refresh} = await useFetch<any>("/api/ai/config");
const saved = ref(false), busy = ref(false), result = ref(""), error = ref(""),
    testMessage = ref("سلام، چطور می‌توانم وضعیت سفارشم را ببینم؟");
const form = reactive({
  isEnabled: false,
  provider: "groq",
  model: "openai/gpt-oss-20b",
  apiKey: "",
  systemPrompt: "شما دستیار حرفه‌ای پشتیبانی فروشگاه هستید. پاسخ‌ها را کوتاه، دقیق و محترمانه بنویسید.",
  temperature: .5,
  maxTokens: 500,
  autoReply: false,
  delaySeconds: 2,
  fallbackMessage: "در حال حاضر امکان پاسخ‌گویی خودکار وجود ندارد.",
  voiceReplyEnabled: false,
  voiceModel: "edge-tts/fa-IR-DilaraNeural"
});
const modelOptions = [
  {value: "openai/gpt-oss-20b", label: "GPT-OSS 20B (سریع و اقتصادی)"},
  {value: "openai/gpt-oss-120b", label: "GPT-OSS 120B (قدرتمند)"},
  {value: "groq/compound-mini", label: "Groq Compound Mini"}
];
const hasGroqKey = computed(() => data.value?.config?.provider === "groq" && Boolean(data.value?.config?.hasApiKey));
watchEffect(() => {
  const c = data.value?.config;
  if (c) Object.assign(form, {
    isEnabled: c.isEnabled,
    provider: "groq",
    model: modelOptions.some(item => item.value === c.model) ? c.model : modelOptions[0]!.value,
    systemPrompt: c.systemPrompt,
    temperature: c.temperature,
    maxTokens: c.maxTokens,
    autoReply: c.autoReply,
    delaySeconds: c.delaySeconds,
    fallbackMessage: c.fallbackMessage,
    voiceReplyEnabled: c.voiceReplyEnabled ?? false,
    voiceModel: c.voiceModel || "edge-tts/fa-IR-DilaraNeural",
    apiKey: ""
  })
});

async function save() {
  busy.value = true;
  error.value = "";
  try {
    await $fetch("/api/ai/config", {method: "PUT", body: {...form, apiKey: form.apiKey || undefined}});
    form.apiKey = "";
    saved.value = true;
    await refresh();
    setTimeout(() => saved.value = false, 2500)
  } catch (e: any) {
    error.value = e.data?.statusMessage || tr("ذخیره تنظیمات ناموفق بود.", "Could not save settings.")
  } finally {
    busy.value = false
  }
}

async function test() {
  busy.value = true;
  result.value = "";
  error.value = "";
  try {
    result.value = (await $fetch<any>("/api/ai/test", {method: "POST", body: {message: testMessage.value}})).text
  } catch (e: any) {
    error.value = e.data?.statusMessage || tr("اجرای تست ناموفق بود.", "AI test failed.")
  } finally {
    busy.value = false
  }
}
</script>
<template>
  <div>
    <PageHeader :title="tr('هوش مصنوعی','Artificial intelligence')"
                :description="tr('Groq را امن به پنل متصل و پاسخ‌گویی را آزمایش کنید.','Securely connect Groq and test responses.')">
      <button class="btn btn-primary" :disabled="busy" @click="save">
        <LoaderCircle v-if="busy" class="animate-spin" :size="17"/>
        <Save v-else :size="17"/>
        {{ tr('ذخیره تغییرات', 'Save changes') }}
      </button>
    </PageHeader>
    <div v-if="saved" class="mb-4 rounded-xl bg-emerald-50 p-3 text-sm font-bold text-emerald-700">
      {{ tr('تنظیمات با موفقیت ذخیره شد.', 'Settings saved successfully.') }}
    </div>
    <UiFeedback v-if="error" class="mb-4" type="error" :message="error"/>
    <UiLoadingState v-if="status==='pending'" class="surface" height="h-60"/>
    <div v-else class="grid gap-5 xl:grid-cols-[1.3fr_.7fr]">
      <section class="surface space-y-6 p-6">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3"><span
              class="grid size-11 place-items-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-500/10"><Bot/></span>
            <div><h2 class="font-black">{{ tr('دستیار هوشمند', 'AI assistant') }}</h2>
              <p class="text-xs text-slate-400">
                {{ tr('پاسخ‌گویی خودکار به پیام‌های جدید', 'Automatic replies to new messages') }}</p></div>
          </div>
          <UiToggle v-model="form.isEnabled" class="border-0 p-0"/>
        </div>
        <div class="grid gap-4 sm:grid-cols-2"><label><span class="label">Provider</span><span
            class="input flex items-center font-bold" dir="ltr">Groq Cloud</span></label><label><span
            class="label">{{ tr('مدل', 'Model') }}</span><select v-model="form.model" class="input" dir="ltr">
          <option v-for="item in modelOptions" :key="item.value" :value="item.value">{{ item.label }} —
            {{ item.value }}
          </option>
        </select></label>
        </div>
        <label class="block"><span class="label flex items-center gap-2"><KeyRound :size="15"/>API Key <small
            v-if="hasGroqKey"
            class="text-emerald-600">({{ tr('ذخیره شده', 'saved') }})</small></span><input v-model="form.apiKey"
                                                                                           class="input" type="password"
                                                                                           dir="ltr"
                                                                                           :placeholder="hasGroqKey?tr('برای حفظ کلید فعلی خالی بگذارید','Leave blank to keep current key'):'gsk_...' "></label><label
          class="block"><span class="label">System Prompt</span><textarea v-model="form.systemPrompt"
                                                                          class="input min-h-36 resize-y"/></label>
        <div class="grid gap-4 sm:grid-cols-3"><label><span
            class="label">Temperature: {{ form.temperature }}</span><input v-model.number="form.temperature"
                                                                           type="range" min="0" max="2" step=".1"
                                                                           class="w-full accent-brand-600"></label><label><span
            class="label">{{ tr('حداکثر توکن', 'Max tokens') }}</span><input v-model.number="form.maxTokens"
                                                                             class="input" type="number" min="50"
                                                                             max="8000"></label><label><span
            class="label">{{ tr('تاخیر پاسخ (ثانیه)', 'Reply delay (seconds)') }}</span><input
            v-model.number="form.delaySeconds" class="input" type="number" min="0" max="300"></label></div>
        <label class="flex items-center gap-3 rounded-xl border p-4"><input v-model="form.autoReply" type="checkbox"
                                                                            class="size-4 accent-brand-600"><span
            class="text-sm font-bold">{{
            tr('ارسال خودکار پاسخ برای پیام جدید', 'Automatically reply to new messages')
          }}</span></label>
        <div
            class="rounded-2xl border border-violet-200 bg-violet-50/60 p-4 dark:border-violet-500/20 dark:bg-violet-500/5">
          <UiToggle v-model="form.voiceReplyEnabled"
                    :label="tr('پاسخ هوش مصنوعی به‌صورت ویس ارسال شود', 'Send AI replies as voice notes')"/>
          <label v-if="form.voiceReplyEnabled" class="mt-4 block"><span class="label">{{
              tr('صدای پاسخ', 'Reply voice')
            }}</span>
            <select v-model="form.voiceModel" class="input">
              <option value="edge-tts/fa-IR-DilaraNeural">{{ tr('صدای زن — دیلارا', 'Female voice — Dilara') }}</option>
              <option value="edge-tts/fa-IR-FaridNeural">{{ tr('صدای مرد — فرید', 'Male voice — Farid') }}</option>
            </select>
          </label>
        </div>
        <label
            class="block"><span class="label">{{ tr('پیام جایگزین هنگام خطا', 'Fallback message') }}</span><input
            v-model="form.fallbackMessage" class="input"></label></section>
      <aside class="surface p-6">
        <div class="flex items-center gap-2">
          <Sparkles class="text-violet-500" :size="19"/>
          <h2 class="font-black">{{ tr('تست دستیار', 'Test assistant') }}</h2></div>
        <textarea v-model="testMessage" class="input mt-5 min-h-24 resize-y"/>
        <div v-if="result" class="mt-3 rounded-2xl rounded-es-sm bg-brand-600 p-4 text-sm leading-7 text-white">
          {{ result }}
        </div>
        <button class="btn btn-secondary mt-5 w-full" :disabled="busy" @click="test">
          <LoaderCircle v-if="busy" class="animate-spin" :size="17"/>
          <Play v-else :size="17"/>
          {{ tr('اجرای تست واقعی', 'Run real test') }}
        </button>
        <p class="muted mt-4 text-xs">
          {{
            tr('کلید API رمزگذاری می‌شود و هرگز دوباره به مرورگر برگردانده نمی‌شود.', 'The API key is encrypted and never returned to the browser.')
          }}</p>
      </aside>
    </div>
  </div>
</template>
