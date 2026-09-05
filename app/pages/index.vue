<script setup lang="ts">
import {
  ArrowLeft,
  Bot,
  MessageCircleMore,
  Zap,
  ShieldCheck,
  Check,
  Play,
  Smartphone,
  MessagesSquare,
  Sparkles
} from "lucide-vue-next"

const {tr, formatNumber} = useAppPreferences()
const headers = import.meta.server ? useRequestHeaders(["cookie"]) : undefined
const [{data: home}, {data: plansData}, {data: session}] = await Promise.all([
  useFetch<any>("/api/public/home"), useFetch<any>("/api/plans"), useFetch<any>("/api/auth/session", {
    headers,
    key: "home-session"
  })
])
const signedIn = computed(() => !!session.value?.user),
    panelTarget = computed(() => ["ADMIN", "SUPER_ADMIN"].includes(session.value?.user?.role) ? "/admin" : "/dashboard")
const ctaTarget = computed(() => signedIn.value ? panelTarget.value : "/register")
const stats = computed(() => [
  {value: home.value?.stats?.activeTeams || 0, label: tr("تیم فعال", "Active teams")},
  {value: home.value?.stats?.connectedNumbers || 0, label: tr("شماره متصل", "Connected numbers")},
  {value: home.value?.stats?.messages || 0, label: tr("پیام پردازش‌شده", "Processed messages")}
])
const features = [
  {
    icon: MessageCircleMore,
    fa: "صندوق ورودی یکپارچه",
    en: "Unified inbox",
    faText: "گفتگوهای تمام شماره‌ها را در یک محیط سریع و منظم مدیریت کنید.",
    enText: "Manage every connected number from one fast, organized inbox."
  },
  {
    icon: Bot,
    fa: "پاسخ‌گویی هوشمند",
    en: "AI replies",
    faText: "دستیار هوش مصنوعی را با دانش و لحن برند خودتان تنظیم کنید.",
    enText: "Configure an AI assistant with your own brand voice and knowledge."
  },
  {
    icon: Zap,
    fa: "اتوماسیون سریع",
    en: "Fast automation",
    faText: "کارهای تکراری را حذف کنید و زمان پاسخ‌گویی را کاهش دهید.",
    enText: "Remove repetitive work and reduce customer response time."
  }
]
const steps = [
  {
    icon: Smartphone,
    fa: "واتساپ را متصل کنید",
    en: "Connect WhatsApp",
    faText: "QR را اسکن کنید؛ نشست امن شما برای دفعات بعد حفظ می‌شود.",
    enText: "Scan the QR once; your secure session remains available."
  },
  {
    icon: MessagesSquare,
    fa: "گفتگوها را مدیریت کنید",
    en: "Manage conversations",
    faText: "پیام‌ها، مخاطبان و فایل‌ها را از یک پنل پاسخ دهید.",
    enText: "Handle messages, contacts and attachments from one workspace."
  },
  {
    icon: Sparkles,
    fa: "هوشمند و خودکار شوید",
    en: "Automate with AI",
    faText: "پاسخ خودکار هوشمند را متناسب با کسب‌وکارتان فعال کنید.",
    enText: "Enable smart automatic replies tailored to your business."
  }
]
const plans = computed(() => (plansData.value?.plans || []).map((plan: any) => ({
  ...plan,
  popular: plan.slug === "pro"
})))
</script>
<template>
  <div class="overflow-hidden">
    <PublicHeader landing/>
    <main>
      <section class="relative pt-36 sm:pt-44">
        <div
            class="absolute inset-x-0 top-0 -z-10 h-[720px] bg-[radial-gradient(circle_at_20%_30%,rgba(30,170,126,.15),transparent_35%),radial-gradient(circle_at_80%_20%,rgba(139,92,246,.13),transparent_30%)]"/>
        <div class="mx-auto grid max-w-7xl items-center gap-16 px-5 pb-24 lg:grid-cols-2">
          <div class="animate-fade-up"><span
              class="badge bg-brand-100 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300"><ShieldCheck
              :size="14"/>{{ tr('زیرساخت امن برای رشد', 'Secure infrastructure for growth') }}</span>
            <h1 class="mt-6 text-4xl font-black leading-[1.45] tracking-tight sm:text-6xl">
              {{ tr('واتساپ کسب‌وکارتان،', 'Your business WhatsApp,') }}<br><span
                class="bg-gradient-to-l from-brand-600 to-emerald-400 bg-clip-text text-transparent">{{ tr('هوشمندتر از همیشه', 'smarter than ever') }}</span>
            </h1>
            <p class="mt-6 max-w-2xl text-base leading-8 text-slate-500 dark:text-slate-400 sm:text-lg">
              {{ tr('گفتگوها، اتوماسیون، وب‌هوک و هوش مصنوعی را در یک پنل حرفه‌ای مدیریت کنید و سریع‌تر پاسخ دهید.', 'Manage conversations, automation, webhooks and AI from one professional workspace and respond faster.') }}</p>
            <div class="mt-8 flex flex-wrap gap-3">
              <NuxtLink class="btn btn-primary px-6 py-3.5" :to="ctaTarget">
                {{ signedIn ? tr('ورود به پنل', 'Open dashboard') : tr('رایگان شروع کنید', 'Start for free') }}
                <ArrowLeft :size="18"/>
              </NuxtLink>
              <a class="btn btn-secondary px-6 py-3.5" href="#how">
                <Play :size="17"/>
                {{ tr('نحوه کار', 'How it works') }}</a></div>
            <div class="mt-10 grid max-w-xl grid-cols-3 gap-3 border-t pt-6">
              <div v-for="stat in stats" :key="stat.label"><b
                  class="block text-xl font-black">{{ formatNumber(stat.value) }}</b><small
                  class="text-slate-400">{{ stat.label }}</small></div>
            </div>
          </div>
          <div class="relative animate-float">
            <div class="surface overflow-hidden p-3 shadow-2xl shadow-brand-900/10">
              <div class="rounded-xl bg-slate-50 p-5 dark:bg-slate-950">
                <div class="flex items-center justify-between">
                  <div><p class="font-black">{{ tr('عملکرد واقعی سامانه', 'Live platform activity') }}</p><small
                      class="text-slate-400">{{ tr('برگرفته از داده‌های جاری', 'Based on current data') }}</small></div>
                  <span class="badge bg-brand-100 text-brand-700">● {{ tr('آنلاین', 'Online') }}</span></div>
                <div class="mt-6 grid grid-cols-3 gap-3">
                  <div v-for="stat in stats" :key="stat.label" class="surface p-4"><small
                      class="text-slate-400">{{ stat.label }}</small><b
                      class="mt-2 block text-xl">{{ formatNumber(stat.value) }}</b></div>
                </div>
                <div class="surface mt-3 h-48 p-5">
                  <div class="flex h-full items-end gap-3"><i v-for="height in [35,62,48,80,57,95,73,88]" :key="height"
                                                              class="flex-1 rounded-t-lg bg-gradient-to-t from-brand-600 to-brand-300"
                                                              :style="{height:height+'%'}"/></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section id="features" class="scroll-mt-20 border-y bg-white py-24 dark:bg-slate-900/40">
        <div class="mx-auto max-w-7xl px-5">
          <div class="mx-auto max-w-2xl text-center"><span
              class="badge bg-brand-50 text-brand-700">{{ tr('امکانات کامل', 'Complete features') }}</span>
            <h2 class="mt-4 text-3xl font-black sm:text-4xl">
              {{ tr('همه ابزارهای ارتباط با مشتری، یک‌جا', 'Every customer communication tool in one place') }}</h2>
          </div>
          <div class="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <article v-for="(feature,index) in features" :key="feature.en" class="surface card-hover p-6"
                     :style="{animationDelay:index*100+'ms'}"><span
                class="grid size-12 place-items-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-500/10"><component
                :is="feature.icon"/></span>
              <h3 class="mt-5 font-black">{{ tr(feature.fa, feature.en) }}</h3>
              <p class="muted mt-3">{{ tr(feature.faText, feature.enText) }}</p></article>
          </div>
        </div>
      </section>
      <section id="how" class="scroll-mt-20 py-24">
        <div class="mx-auto max-w-6xl px-5">
          <div class="text-center"><span
              class="badge bg-violet-50 text-violet-700">{{ tr('راه‌اندازی ساده', 'Simple setup') }}</span>
            <h2 class="mt-4 text-3xl font-black sm:text-4xl">
              {{ tr('در سه مرحله شروع کنید', 'Get started in three steps') }}</h2></div>
          <div class="relative mt-14 grid gap-5 md:grid-cols-3">
            <div
                class="absolute left-[16%] right-[16%] top-8 hidden border-t-2 border-dashed border-brand-200 md:block"/>
            <article v-for="(step,index) in steps" :key="step.en" class="surface relative p-7 text-center"><span
                class="absolute end-4 top-4 text-5xl font-black text-slate-100 dark:text-slate-800">0{{ index + 1 }}</span><span
                class="relative mx-auto grid size-16 place-items-center rounded-2xl bg-brand-600 text-white shadow-lg shadow-brand-600/20"><component
                :is="step.icon"/></span>
              <h3 class="mt-5 font-black">{{ tr(step.fa, step.en) }}</h3>
              <p class="muted mt-3">{{ tr(step.faText, step.enText) }}</p></article>
          </div>
        </div>
      </section>
      <section id="pricing" class="scroll-mt-20 border-t bg-slate-50 py-24 dark:bg-slate-900/30">
        <div class="mx-auto max-w-7xl px-5">
          <div class="text-center"><h2 class="text-3xl font-black">
            {{ tr('پلنی برای هر مرحله از رشد', 'A plan for every stage of growth') }}</h2>
            <p class="muted mt-3">
              {{ tr('بدون هزینه پنهان؛ هر زمان خواستید ارتقا دهید.', 'No hidden fees. Upgrade whenever you need.') }}</p>
          </div>
          <div class="mx-auto mt-12 grid max-w-5xl gap-5 md:grid-cols-3">
            <article v-for="plan in plans" :key="plan.id" class="surface relative flex flex-col p-7"
                     :class="plan.popular?'border-brand-500 ring-4 ring-brand-500/10':''"><span v-if="plan.popular"
                                                                                                class="badge absolute -top-3 start-5 bg-brand-600 text-white">{{ tr('محبوب‌ترین', 'Most popular') }}</span>
              <h3 class="text-lg font-black">{{ plan.name }}</h3>
              <p class="mt-4 text-2xl font-black text-brand-600">
                {{ Number(plan.price) ? formatNumber(plan.price) + ' ' + tr('تومان', 'Toman') : tr('رایگان', 'Free') }}</p>
              <ul class="my-7 flex-1 space-y-3">
                <li v-for="feature in plan.features" :key="feature"
                    class="flex items-center gap-2 text-sm text-slate-500">
                  <Check class="text-brand-600" :size="17"/>
                  {{ feature }}
                </li>
              </ul>
              <NuxtLink :to="signedIn?'/dashboard/subscription':'/register'" class="btn w-full"
                        :class="plan.popular?'btn-primary':'btn-secondary'">
                {{ signedIn ? tr('مدیریت اشتراک', 'Manage plan') : tr('انتخاب پلن', 'Choose plan') }}
              </NuxtLink>
            </article>
          </div>
        </div>
      </section>
    </main>
    <PublicFooter :settings="home?.settings"/>
  </div>
</template>
