export default defineNuxtRouteMiddleware(async to=>{
  if(to.path!=="/"&&to.path!=="/login")return;
  try{
    const headers=import.meta.server?useRequestHeaders(["cookie"]):undefined;
    const{user}=await $fetch<any>("/api/auth/session",{headers});
    if(to.path==="/"||to.path==="/login")return navigateTo(["ADMIN","SUPER_ADMIN"].includes(user.role)?"/admin":"/dashboard");
  }catch{
    // Public landing and login remain available to guests.
  }
});
