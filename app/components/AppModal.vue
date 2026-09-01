<script setup lang="ts">import {X} from "lucide-vue-next";

defineProps<{ open: boolean; title: string }>();
defineEmits<{ close: [] }>()</script>
<template>
  <Teleport to="body">
    <Transition enter-active-class="duration-200" enter-from-class="opacity-0" leave-active-class="duration-150"
                leave-to-class="opacity-0">
      <div v-if="open" class="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-4 backdrop-blur-sm"
           @click.self="$emit('close')">
        <div class="surface w-full max-w-lg animate-fade-up p-5">
          <header class="mb-5 flex items-center justify-between"><h2 class="text-lg font-black">{{ title }}</h2>
            <button class="icon-btn" @click="$emit('close')">
              <X :size="18"/>
            </button>
          </header>
          <slot/>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
