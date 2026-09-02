<script setup lang="ts">
const {tr}=useAppPreferences()
const headers=import.meta.server?useRequestHeaders(["cookie"]):undefined
const {data}=await useFetch<{user:{name:string;role:string}}>("/api/auth/session",{headers})
const user=computed(()=>data.value?.user),target=computed(()=>["ADMIN","SUPER_ADMIN"].includes(user.value?.role||"")?"/admin":"/dashboard")
</script>
<template><header class="border-b bg-white/85 backdrop-blur-xl dark:bg-slate-950/85"><div class="mx-auto flex h-20 max-w-7xl items-center gap-3 px-5"><NuxtLink to="/"><AppLogo/></NuxtLink><nav class="mx-auto hidden gap-6 text-sm font-bold text-slate-500 md:flex"><NuxtLink to="/pricing">{{tr('تعرفه‌ها','Pricing')}}</NuxtLink><NuxtLink to="/about">{{tr('درباره ما','About')}}</NuxtLink><NuxtLink to="/contact">{{tr('تماس با ما','Contact')}}</NuxtLink></nav><div class="ms-auto flex items-center gap-2"><ThemeLanguageControls/><template v-if="user"><span class="hidden text-sm text-slate-500 lg:inline">{{user.name}}</span><NuxtLink class="btn btn-primary" :to="target">{{tr('ورود به پنل','Open dashboard')}}</NuxtLink></template><template v-else><NuxtLink class="btn btn-ghost" to="/login">{{tr('ورود','Sign in')}}</NuxtLink><NuxtLink class="btn btn-primary hidden sm:flex" to="/register">{{tr('شروع رایگان','Start free')}}</NuxtLink></template></div></div></header></template>
