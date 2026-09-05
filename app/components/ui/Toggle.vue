<script setup lang="ts">const model = defineModel<boolean>({required: true});
withDefaults(defineProps<{ label?: string; description?: string; disabled?: boolean }>(), {disabled: false});</script>
<template><label class="flex cursor-pointer items-center justify-between gap-4 rounded-xl border p-4"
                 :class="disabled?'cursor-not-allowed opacity-60':''"><span v-if="label||description"><b v-if="label"
                                                                                                         class="block text-sm">{{ label }}</b><small
    v-if="description" class="text-slate-400">{{ description }}</small></span>
  <button type="button" class="relative h-7 w-12 shrink-0 rounded-full transition-colors"
          :class="model?'bg-brand-600':'bg-slate-300 dark:bg-slate-700'" :disabled="disabled" role="switch"
          :aria-checked="model" @click="model=!model"><i
      class="absolute top-1 size-5 rounded-full bg-white shadow transition-all" :class="model?'end-1':'start-1'"/>
  </button>
</label></template>
