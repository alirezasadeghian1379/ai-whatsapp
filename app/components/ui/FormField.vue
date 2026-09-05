<script setup lang="ts">defineProps<{ label: string; hint?: string; error?: string; required?: boolean }>()</script>
<template><label class="block"><span class="label">{{ label }}<i v-if="required" class="ms-1 text-red-500">*</i></span>
  <slot/>
  <small v-if="error" class="mt-1 block text-red-600">{{ error }}</small><small v-else-if="hint"
                                                                                class="mt-1 block text-slate-400">{{ hint }}</small></label>
</template>
