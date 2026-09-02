export default defineNuxtRouteMiddleware(async to=>{
 const routes:Record<string,string>={"/dashboard/whatsapp":"whatsapp","/dashboard/contacts":"contacts","/dashboard/webhooks":"webhooks","/dashboard/ai":"ai","/dashboard/sms":"sms"}
 const feature=routes[to.path]
 if(!feature)return
 try{
  const headers=import.meta.server?useRequestHeaders(["cookie"]):undefined
  const access=await $fetch<any>("/api/access",{headers})
  if(!access.features?.[feature])return navigateTo(`/dashboard/subscription?required=${feature}`)
 }catch{
  // Authentication middleware owns unauthenticated redirects.
 }
})
