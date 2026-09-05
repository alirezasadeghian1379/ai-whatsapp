<script setup lang="ts">import {Copy} from "lucide-vue-next";

defineProps<{ secret: string }>();
defineEmits<{ copy: []; dismiss: [] }>();
const {tr} = useAppPreferences();</script>
<template>
  <div class="surface mb-5 border border-amber-300 p-5">
    <b>{{ tr('Secret فقط یک‌بار نمایش داده می‌شود', 'Secret is shown only once') }}</b>
    <div class="mt-3 flex gap-2"><code class="input overflow-hidden text-ellipsis" dir="ltr">{{ secret }}</code>
      <button class="icon-btn" @click="$emit('copy')">
        <Copy :size="17"/>
      </button>
    </div>
    <button class="mt-3 text-xs text-slate-400" @click="$emit('dismiss')">{{ tr('متوجه شدم', 'I saved it') }}</button>
  </div>
</template>
