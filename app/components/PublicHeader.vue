<script setup lang="ts">
import {Menu, X} from "lucide-vue-next";

const props = withDefaults(defineProps<{ landing?: boolean }>(), {landing: false});
const {tr} = useAppPreferences(), mobileOpen = ref(false), route = useRoute();
const headers = import.meta.server ? useRequestHeaders(["cookie"]) : undefined;
const {data} = await useFetch<{ user: { name: string; role: string } }>("/api/auth/session", {
  headers,
  key: "public-header-session"
});
const user = computed(() => data.value?.user);
const target = computed(() => ["ADMIN", "SUPER_ADMIN"].includes(user.value?.role || "") ? "/admin" : "/dashboard");
watch(() => route.fullPath, () => mobileOpen.value = false);
</script>

<template>
  <header
      :class="props.landing?'fixed inset-x-0 top-0 z-30 border-white/30 bg-white/80 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/80':'border-b bg-white/85 backdrop-blur-xl dark:bg-slate-950/85'"
      class="border-b">
    <div class="mx-auto flex h-20 max-w-7xl items-center gap-3 px-5">
      <NuxtLink to="/">
        <AppLogo/>
      </NuxtLink>
      <nav class="mx-auto hidden gap-7 text-sm font-bold text-slate-500 lg:flex">
        <NuxtLink to="/">{{ tr('خانه', 'Home') }}</NuxtLink>
        <template v-if="props.landing">
          <a href="#features">{{ tr('امکانات', 'Features') }}</a><a href="#how">{{ tr('نحوه کار', 'How it works') }}</a><a
            href="#pricing">{{ tr('تعرفه‌ها', 'Pricing') }}</a>
        </template>
        <template v-else>
          <NuxtLink to="/pricing">{{ tr('تعرفه‌ها', 'Pricing') }}</NuxtLink>
        </template>
        <NuxtLink to="/about">{{ tr('درباره ما', 'About') }}</NuxtLink>
        <NuxtLink to="/contact">{{ tr('تماس با ما', 'Contact') }}</NuxtLink>
      </nav>
      <div class="ms-auto flex items-center gap-2">
        <ThemeLanguageControls/>
        <NuxtLink v-if="user" class="btn btn-primary hidden sm:flex" :to="target">{{
            tr('ورود به پنل', 'Dashboard')
          }}
        </NuxtLink>
        <template v-else>
          <NuxtLink class="btn btn-ghost hidden sm:flex" to="/login">{{ tr('ورود', 'Sign in') }}</NuxtLink>
          <NuxtLink class="btn btn-primary hidden sm:flex" to="/register">{{
              tr('شروع رایگان', 'Start free')
            }}
          </NuxtLink>
        </template>
        <button type="button" class="icon-btn lg:hidden" :aria-label="tr('منو','Menu')" @click="mobileOpen=!mobileOpen">
          <X v-if="mobileOpen" :size="20"/>
          <Menu v-else :size="20"/>
        </button>
      </div>
    </div>
    <nav v-if="mobileOpen" class="border-t bg-white p-4 text-sm font-bold dark:bg-slate-950 lg:hidden">
      <div class="mx-auto grid max-w-7xl gap-2">
        <NuxtLink class="rounded-xl p-3 hover:bg-slate-100 dark:hover:bg-slate-900" to="/">{{
            tr('خانه', 'Home')
          }}
        </NuxtLink>
        <NuxtLink class="rounded-xl p-3 hover:bg-slate-100 dark:hover:bg-slate-900" to="/pricing">
          {{ tr('تعرفه‌ها', 'Pricing') }}
        </NuxtLink>
        <NuxtLink class="rounded-xl p-3 hover:bg-slate-100 dark:hover:bg-slate-900" to="/about">
          {{ tr('درباره ما', 'About') }}
        </NuxtLink>
        <NuxtLink class="rounded-xl p-3 hover:bg-slate-100 dark:hover:bg-slate-900" to="/contact">
          {{ tr('تماس با ما', 'Contact') }}
        </NuxtLink>
        <NuxtLink class="btn btn-primary mt-2" :to="user?target:'/login'">
          {{ user ? tr('ورود به پنل', 'Dashboard') : tr('ورود', 'Sign in') }}
        </NuxtLink>
        <NuxtLink v-if="!user" class="btn btn-secondary" to="/register">{{ tr('ثبت‌نام', 'Sign up') }}</NuxtLink>
      </div>
    </nav>
  </header>
</template>
