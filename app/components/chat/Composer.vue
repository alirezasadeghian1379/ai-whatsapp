<script setup lang="ts">
import {FileText, LoaderCircle, Paperclip, Send, X} from "lucide-vue-next"

const text = defineModel<string>({required: true}), props = defineProps<{ busy: boolean; disabled: boolean }>(),
    emit = defineEmits<{ send: [file?: File] }>(), file = ref<File | null>(null),
    input = ref<HTMLInputElement | null>(null)
const {tr} = useAppPreferences()

function choose(event: Event) {
  const selected = (event.target as HTMLInputElement).files?.[0];
  if (!selected) return;
  if (selected.size > 5 * 1024 * 1024) {
    alert(tr("حجم فایل نباید بیشتر از ۵ مگابایت باشد.", "File must be 5 MB or smaller."));
    return
  }
  file.value = selected
}

function submit() {
  if (props.busy || props.disabled || (!text.value.trim() && !file.value)) return;
  emit("send", file.value || undefined);
  file.value = null;
  if (input.value) input.value.value = ""
}
</script>
<template>
  <form class="border-t p-4" @submit.prevent="submit">
    <div v-if="file" class="mb-2 flex items-center gap-2 rounded-xl bg-slate-100 p-2 text-xs dark:bg-slate-800">
      <FileText :size="16"/>
      <span class="min-w-0 flex-1 truncate" dir="ltr">{{ file.name }}</span>
      <button type="button" @click="file=null">
        <X :size="15"/>
      </button>
    </div>
    <div class="flex gap-2"><input ref="input" class="hidden" type="file"
                                   accept="image/jpeg,image/png,image/webp,application/pdf,text/plain" @change="choose">
      <button type="button" class="icon-btn" :disabled="busy||disabled" :title="tr('پیوست فایل','Attach file')"
              @click="input?.click()">
        <Paperclip :size="18"/>
      </button>
      <input v-model="text" class="input" :placeholder="tr('پیام خود را بنویسید...','Write a message...')">
      <button class="btn btn-primary px-4" :disabled="busy||disabled||(!text.trim()&&!file)">
        <LoaderCircle v-if="busy" class="animate-spin" :size="18"/>
        <Send v-else :size="18"/>
      </button>
    </div>
  </form>
</template>
