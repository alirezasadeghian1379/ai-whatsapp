<script setup lang="ts">
import {CheckCircle2, Info, ShieldAlert, X} from "lucide-vue-next";

const {alerts, remove} = useAppAlert();
const icon = {success: CheckCircle2, error: ShieldAlert, info: Info};
</script>

<template>
  <Teleport to="body">
    <div class="pointer-events-none fixed inset-x-4 top-4 z-[100] mx-auto flex max-w-md flex-col gap-3 sm:start-auto sm:end-5 sm:inset-x-auto sm:w-[28rem]" aria-live="polite">
      <TransitionGroup enter-active-class="transition duration-300" enter-from-class="translate-y-[-12px] opacity-0" leave-active-class="transition duration-200" leave-to-class="translate-y-[-8px] opacity-0">
        <article v-for="item in alerts" :key="item.id" class="pointer-events-auto flex items-start gap-3 rounded-2xl border bg-white/95 p-4 shadow-2xl shadow-slate-950/15 backdrop-blur-xl dark:bg-slate-900/95"
                 :class="item.type==='success'?'border-emerald-200 dark:border-emerald-500/30':item.type==='error'?'border-red-200 dark:border-red-500/30':'border-brand-200 dark:border-brand-500/30'">
          <component :is="icon[item.type]" class="mt-0.5 shrink-0" :class="item.type==='success'?'text-emerald-500':item.type==='error'?'text-red-500':'text-brand-500'" :size="21"/>
          <p class="min-w-0 flex-1 text-sm font-bold leading-6 text-slate-700 dark:text-slate-100">{{ item.message }}</p>
          <button type="button" class="-m-1 grid size-8 shrink-0 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white" aria-label="Close" @click="remove(item.id)"><X :size="17"/></button>
        </article>
      </TransitionGroup>
    </div>
  </Teleport>
</template>
