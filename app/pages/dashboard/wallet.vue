<script setup lang="ts">
import {LoaderCircle, Plus, WalletCards} from "lucide-vue-next";

definePageMeta({layout: "dashboard", middleware: "auth"});
const {tr, formatDate, formatNumber} = useAppPreferences();
const {data} = await useFetch<any>("/api/wallet");
const show = ref(false), busy = ref(false), error = ref(""), amount = ref(100000), provider = ref("zarinpal");
const presets = [100000, 250000, 500000, 1000000];

async function deposit() {
  busy.value = true;
  error.value = "";
  try {
    const result = await $fetch<{ redirectUrl: string }>("/api/wallet/deposit", {
      method: "POST",
      body: {amount: amount.value, provider: provider.value}
    });
    await navigateTo(result.redirectUrl, {external: result.redirectUrl.startsWith("http")})
  } catch (e: any) {
    error.value = e.data?.statusMessage || tr("شروع پرداخت انجام نشد.", "Could not start payment.")
  } finally {
    busy.value = false
  }
}
</script>
<template>
  <div>
    <PageHeader :title="tr('کیف پول','Wallet')"
                :description="tr('موجودی و گردش‌های مالی حساب شما.','Your balance and wallet transactions.')">
      <button class="btn btn-primary" @click="show=true">
        <Plus :size="17"/>
        {{ tr('شارژ کیف پول', 'Top up wallet') }}
      </button>
    </PageHeader>
    <div v-if="error" class="mb-4 rounded-xl bg-red-50 p-3 text-red-600">{{ error }}</div>
    <section class="rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-700 p-7 text-white shadow-xl">
      <WalletCards :size="34"/>
      <p class="mt-6 text-sm text-white/70">{{ tr('موجودی قابل استفاده', 'Available balance') }}</p><b
        class="mt-2 block text-3xl">{{ formatNumber(data?.wallet?.balance || 0) }} {{ tr('تومان', 'IRR') }}</b>
    </section>
    <section class="surface mt-5 overflow-hidden"><h2 class="border-b p-5 font-black">
      {{ tr('گردش کیف پول', 'Transactions') }}</h2>
      <p v-if="!data?.wallet?.transactions?.length" class="muted p-8 text-center">
        {{ tr('هنوز تراکنشی ثبت نشده است.', 'No wallet transactions yet.') }}</p>
      <div v-for="item in data?.wallet?.transactions" :key="item.id" class="grid gap-2 border-b p-5 sm:grid-cols-3">
        <span>{{ item.description || item.type }}</span><b
          :class="Number(item.amount)>=0?'text-emerald-600':'text-red-500'">{{ formatNumber(item.amount) }}
        {{ tr('تومان', 'IRR') }}</b><small>{{
          formatDate(item.createdAt, {
            dateStyle: 'medium',
            timeStyle: 'short'
          })
        }}</small></div>
    </section>
    <AppModal :open="show" :title="tr('شارژ کیف پول','Top up wallet')" @close="show=false">
      <form class="space-y-5" @submit.prevent="deposit">
        <div class="grid grid-cols-2 gap-2">
          <button v-for="value in presets" :key="value" type="button" class="rounded-xl border p-3 text-sm font-bold"
                  :class="amount===value?'border-brand-500 bg-brand-50 text-brand-700':''" @click="amount=value">
            {{ formatNumber(value) }} {{ tr('تومان', 'IRR') }}
          </button>
        </div>
        <label class="block"><span class="label">{{ tr('مبلغ دلخواه', 'Custom amount') }}</span><input
            v-model.number="amount" class="input" type="number" min="10000" max="100000000" step="1000"></label><label
          class="block"><span class="label">{{ tr('درگاه پرداخت', 'Payment gateway') }}</span><select v-model="provider"
                                                                                                      class="input">
        <option value="zarinpal">{{ tr('زرین‌پال آزمایشی', 'Zarinpal sandbox') }}</option>
        <option value="mock">{{ tr('درگاه داخلی آزمایشی', 'Internal test gateway') }}</option>
      </select></label>
        <button class="btn btn-primary w-full" :disabled="busy">
          <LoaderCircle v-if="busy" class="animate-spin" :size="17"/>
          {{ tr('رفتن به درگاه', 'Continue to payment') }}
        </button>
      </form>
    </AppModal>
  </div>
</template>
