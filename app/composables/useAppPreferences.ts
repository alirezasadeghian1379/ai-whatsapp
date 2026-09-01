export type AppLocale = "fa" | "en";

const messages = {
  fa: { dashboard:"داشبورد", overview:"نمای کلی", whatsapp:"اتصال واتساپ", chats:"گفتگوها", webhooks:"وب‌هوک‌ها", ai:"هوش مصنوعی", subscription:"اشتراک و پرداخت", settings:"تنظیمات", help:"راهنما و پشتیبانی", search:"جستجو", notifications:"اعلان‌ها", welcome:"خوش آمدید", logout:"خروج", connected:"متصل", save:"ذخیره تغییرات", create:"ایجاد", cancel:"انصراف" },
  en: { dashboard:"Dashboard", overview:"Overview", whatsapp:"WhatsApp connection", chats:"Conversations", webhooks:"Webhooks", ai:"Artificial intelligence", subscription:"Subscription & billing", settings:"Settings", help:"Help & support", search:"Search", notifications:"Notifications", welcome:"Welcome", logout:"Logout", connected:"Connected", save:"Save changes", create:"Create", cancel:"Cancel" },
} as const;

export function useAppPreferences(){
  const locale=useCookie<AppLocale>("locale",{default:()=>"fa"});
  const theme=useCookie<"light"|"dark">("theme",{default:()=>"light"});
  const isDark=computed(()=>theme.value==="dark");
  const isRtl=computed(()=>locale.value==="fa");
  const t=(key:keyof typeof messages.fa)=>messages[locale.value][key];
  const tr=(fa:string,en:string)=>locale.value==="fa"?fa:en;
  const formatDate=(value:string|Date|null|undefined,options:Intl.DateTimeFormatOptions={})=>value?new Intl.DateTimeFormat(locale.value==="fa"?"fa-IR-u-ca-persian":"en-US-u-ca-gregory",options).format(new Date(value)):"—";
  const formatNumber=(value:number|string)=>new Intl.NumberFormat(locale.value==="fa"?"fa-IR":"en-US").format(Number(value||0));
  function toggleTheme(){theme.value=isDark.value?"light":"dark"}
  function toggleLocale(){locale.value=locale.value==="fa"?"en":"fa"}
  return{locale,theme,isDark,isRtl,t,tr,formatDate,formatNumber,toggleTheme,toggleLocale};
}
