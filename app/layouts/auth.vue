<script setup lang="ts">const {tr} = useAppPreferences()</script>
<template>
  <main class="grid min-h-screen bg-white dark:bg-slate-950 lg:grid-cols-2">
    <section
        class="relative hidden overflow-hidden bg-slate-950 p-12 text-white lg:flex lg:flex-col lg:justify-between">
      <div class="absolute -left-24 -top-24 size-80 rounded-full bg-brand-500/20 blur-3xl"/>
      <div class="absolute -bottom-32 -right-20 size-96 rounded-full bg-violet-500/15 blur-3xl"/>
      <AppLogo/>
      <div class="relative z-10 max-w-xl animate-fade-up">
        <div class="mb-7 grid size-14 place-items-center rounded-2xl bg-white/10 text-2xl">✦</div>
        <h2 class="text-4xl font-black leading-[1.6]">{{ tr('ارتباطی سریع‌تر،', 'Faster conversations,') }}<br><span
            class="text-brand-300">{{ tr('تجربه‌ای ماندگارتر', 'lasting experiences') }}</span></h2>
        <p class="mt-5 leading-8 text-slate-300">
          {{
            tr('تمام گفتگوهای واتساپ و پاسخ‌های هوشمند تیم شما، در یک فضای امن و یکپارچه.', 'All your WhatsApp conversations and AI replies in one secure workspace.')
          }}</p>
      </div>
      <p class="relative z-10 text-xs text-slate-500">
        {{ tr('ساخته‌شده برای تیم‌های رو به رشد', 'Built for growing teams') }}</p></section>
    <section class="relative grid place-items-center p-5 sm:p-10">
      <div class="absolute end-5 top-5">
        <ThemeLanguageControls/>
      </div>
      <div class="w-full max-w-md animate-fade-up">
        <div class="mb-10 lg:hidden">
          <AppLogo/>
        </div>
        <slot/>
      </div>
    </section>
  </main>
</template>
