<script setup lang="ts">
import {Search, LoaderCircle, ShieldCheck, WalletCards} from "lucide-vue-next"

definePageMeta({layout: "admin", middleware: "admin"})
const {tr, formatDate, formatNumber} = useAppPreferences(), search = ref(""), busy = ref(""), error = ref("")
const {data: session} = await useFetch<any>("/api/auth/session")
const {
  data,
  refresh,
  status
} = await useFetch<any>("/api/admin/users", {query: computed(() => ({search: search.value}))})
const me = computed(() => session.value?.user), isSuper = computed(() => me.value?.role === "SUPER_ADMIN")

async function update(user: any, values: any) {
  if (values.status === "DISABLED" && !confirm(tr(`حساب ${user.name} غیرفعال شود؟`, `Disable ${user.name}'s account?`))) return
  busy.value = user.id;
  error.value = ""
  try {
    await $fetch(`/api/admin/users/${user.id}`, {method: "PATCH", body: values});
    await refresh()
  } catch (e: any) {
    error.value = e.data?.statusMessage || tr("تغییر کاربر انجام نشد.", "Could not update user.")
  } finally {
    busy.value = ""
  }
}
</script>
<template>
  <div>
    <PageHeader :title="tr('مدیریت کاربران','User management')"
                :description="tr('کنترل امن نقش، وضعیت حساب، اشتراک و میزان استفاده کاربران','Securely manage roles, account status, subscriptions and usage')"/>
    <UiFeedback v-if="error" class="mb-4" type="error" :message="error"/>
    <div class="surface mb-4 flex flex-wrap items-center gap-4 p-4">
      <div class="relative min-w-64 flex-1">
        <Search class="absolute start-3 top-3 text-slate-400" :size="17"/>
        <input v-model="search" class="input ps-10" :placeholder="tr('نام، ایمیل یا موبایل','Name, email or phone')">
      </div>
      <span class="badge bg-violet-50 text-violet-700"><ShieldCheck :size="14"/>{{ me?.role }}</span></div>
    <section class="surface overflow-x-auto">
      <UiLoadingState v-if="status==='pending'" height="h-52"/>
      <table v-else class="w-full min-w-[1100px] text-sm">
        <thead>
        <tr class="border-b text-slate-400">
          <th class="p-4 text-start">{{ tr('کاربر', 'User') }}</th>
          <th class="p-4 text-start">{{ tr('اشتراک', 'Plan') }}</th>
          <th class="p-4 text-start">{{ tr('نقش', 'Role') }}</th>
          <th class="p-4">{{ tr('وضعیت', 'Status') }}</th>
          <th class="p-4">{{ tr('فعالیت', 'Activity') }}</th>
          <th class="p-4">{{ tr('کیف پول', 'Wallet') }}</th>
          <th class="p-4 text-start">{{ tr('عضویت', 'Joined') }}</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="u in data?.users" :key="u.id" class="border-b last:border-0">
          <td class="p-4">
            <div class="flex items-center gap-3"><span
                class="grid size-10 place-items-center rounded-xl bg-brand-50 font-black text-brand-700">{{ u.name?.slice(0, 2) }}</span>
              <div><b>{{ u.name }}</b><small class="block text-slate-400" dir="ltr">{{ u.email }}</small><small
                  v-if="u.phone" class="block text-slate-400" dir="ltr">{{ u.phone }}</small></div>
            </div>
          </td>
          <td class="p-4"><b>{{ u.subscriptions?.[0]?.plan?.name || tr('بدون اشتراک', 'No plan') }}</b><small
              class="block text-slate-400">{{ u.subscriptions?.[0]?.plan?.slug || '—' }}</small></td>
          <td class="p-4"><select :value="u.role" class="input py-2" :disabled="busy===u.id||!isSuper||u.id===me?.id"
                                  @change="update(u,{role:($event.target as HTMLSelectElement).value})">
            <option>USER</option>
            <option>ADMIN</option>
            <option>SUPER_ADMIN</option>
          </select></td>
          <td class="p-4 text-center">
            <button class="badge" :disabled="busy===u.id||u.id===me?.id||(!isSuper&&u.role!=='USER')"
                    :class="u.status==='ACTIVE'?'bg-emerald-50 text-emerald-600':'bg-red-50 text-red-600'"
                    @click="update(u,{status:u.status==='ACTIVE'?'DISABLED':'ACTIVE'})">
              <LoaderCircle v-if="busy===u.id" class="animate-spin" :size="13"/>
              {{ u.status }}
            </button>
          </td>
          <td class="p-4 text-center"><b>{{ u._count.conversations }}</b> {{ tr('گفتگو', 'chats') }}<small
              class="block text-slate-400">{{ u._count.whatsappSessions }} WhatsApp</small></td>
          <td class="p-4 text-center"><span class="inline-flex items-center gap-1"><WalletCards
              :size="15"/>{{ formatNumber(Number(u.wallet?.balance || 0)) }}</span><small class="block text-slate-400">{{ tr('تومان', 'Toman') }}</small>
          </td>
          <td class="p-4 text-start">{{ formatDate(u.createdAt, {dateStyle: 'medium'}) }}<small
              class="block text-slate-400">{{ u._count.orders }} {{ tr('سفارش', 'orders') }}</small></td>
        </tr>
        </tbody>
      </table>
    </section>
  </div>
</template>
