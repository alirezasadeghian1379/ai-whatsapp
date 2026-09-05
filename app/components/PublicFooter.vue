<script setup lang="ts">
import {Instagram, Send, Linkedin, Twitter, Mail, Phone, MapPin, ShieldCheck} from "lucide-vue-next"

const props = defineProps<{ settings?: any }>(), {tr} = useAppPreferences()
const {data: home} = await useFetch<any>("/api/public/home", {key: "public-footer-settings"})
const settings = computed(() => props.settings || home.value?.settings)
const socialLinks = computed(() => [
  {key: "instagram", label: "Instagram", icon: Instagram, url: settings.value?.socials?.instagram}, {
    key: "telegram",
    label: "Telegram",
    icon: Send,
    url: settings.value?.socials?.telegram
  }, {key: "linkedin", label: "LinkedIn", icon: Linkedin, url: settings.value?.socials?.linkedin}, {
    key: "x",
    label: "X",
    icon: Twitter,
    url: settings.value?.socials?.x
  }
].filter(item => item.url))
</script>
<template>
  <footer class="relative overflow-hidden border-t bg-slate-950 text-slate-300">
    <div class="absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(16,185,129,.12),transparent_35%)]"/>
    <div class="relative mx-auto max-w-7xl px-5 py-14">
      <div class="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.4fr_.7fr_.8fr_1fr]">
        <section>
          <AppLogo/>
          <p class="mt-5 max-w-sm text-sm leading-7 text-slate-400">
            {{ settings?.footerDescription || tr('مدیریت هوشمند ارتباط با مشتری در واتساپ', 'Smart WhatsApp customer communication management') }}</p>
          <div v-if="socialLinks.length" class="mt-6 flex gap-2"><a v-for="item in socialLinks" :key="item.key"
                                                                    :href="item.url" target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    class="grid size-10 place-items-center rounded-xl border border-white/10 text-slate-400 transition hover:-translate-y-1 hover:border-brand-500 hover:text-brand-400"
                                                                    :aria-label="item.label">
            <component :is="item.icon" :size="18"/>
          </a></div>
        </section>
        <section><b class="text-white">{{ tr('دسترسی سریع', 'Quick links') }}</b>
          <nav class="mt-5 grid gap-3 text-sm text-slate-400">
            <NuxtLink to="/#features">{{ tr('امکانات', 'Features') }}</NuxtLink>
            <NuxtLink to="/#how">{{ tr('نحوه کار', 'How it works') }}</NuxtLink>
            <NuxtLink to="/pricing">{{ tr('تعرفه‌ها', 'Pricing') }}</NuxtLink>
            <NuxtLink to="/about">{{ tr('درباره ما', 'About') }}</NuxtLink>
          </nav>
        </section>
        <section><b class="text-white">{{ tr('پشتیبانی', 'Support') }}</b>
          <div class="mt-5 grid gap-3 text-sm text-slate-400"><a v-if="settings?.supportEmail" class="flex gap-2"
                                                                 :href="`mailto:${settings.supportEmail}`">
            <Mail :size="17"/>
            {{ settings.supportEmail }}</a><a v-if="settings?.supportPhone" class="flex gap-2"
                                              :href="`tel:${settings.supportPhone}`">
            <Phone :size="17"/>
            {{ settings.supportPhone }}</a>
            <p v-if="settings?.address" class="flex gap-2">
              <MapPin class="shrink-0" :size="17"/>
              {{ settings.address }}
            </p>
            <NuxtLink to="/contact">{{ tr('تماس با ما', 'Contact us') }}</NuxtLink>
          </div>
        </section>
        <section><b class="text-white">{{ tr('مجوزها و اعتماد', 'Trust & licenses') }}</b>
          <div class="mt-5 flex min-h-24 flex-wrap gap-3"><a v-for="badge in settings?.trustBadges" :key="badge.title"
                                                             :href="badge.linkUrl||undefined" target="_blank"
                                                             rel="noopener noreferrer"
                                                             class="grid size-24 place-items-center rounded-2xl bg-white p-2"><img
              :src="badge.imageUrl" :alt="badge.title" class="max-h-full max-w-full"></a>
            <div v-if="!settings?.trustBadges?.length"
                 class="flex size-24 flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 text-center text-[10px] text-slate-500">
              <ShieldCheck :size="22"/>
              <span class="mt-2">{{ tr('محل نماد اعتماد', 'Trust badge') }}</span></div>
          </div>
        </section>
      </div>
      <div
          class="mt-12 flex flex-col justify-between gap-4 border-t border-white/10 pt-6 text-xs text-slate-500 sm:flex-row">
        <span>© {{ new Date().getFullYear() }} {{ settings?.name || 'همراه‌چت' }} — {{ tr('همه حقوق محفوظ است.', 'All rights reserved.') }}</span>
        <div class="flex gap-4">
          <NuxtLink to="/privacy">{{ tr('حریم خصوصی', 'Privacy') }}</NuxtLink>
          <NuxtLink to="/terms">{{ tr('قوانین استفاده', 'Terms') }}</NuxtLink>
        </div>
      </div>
    </div>
  </footer>
</template>
