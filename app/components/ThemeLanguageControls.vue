<script setup lang="ts">import {Moon, Sun, Languages} from "lucide-vue-next";

const {isDark, locale, toggleTheme, toggleLocale} = useAppPreferences()</script>
<template>
  <div class="flex items-center gap-2">
    <button class="icon-btn" :aria-label="isDark?'تم روشن':'تم تاریک'" @click="toggleTheme">
      <Sun v-if="isDark" :size="18"/>
      <Moon v-else :size="18"/>
    </button>
    <button class="btn btn-ghost h-10 px-3" @click="toggleLocale">
      <Languages :size="18"/>
      <span class="uppercase">{{ locale === 'fa' ? 'EN' : 'فا' }}</span></button>
  </div>
</template>
