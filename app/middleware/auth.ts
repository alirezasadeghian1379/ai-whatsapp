export default defineNuxtRouteMiddleware(async()=>{if(import.meta.server){try{await $fetch("/api/auth/session",{headers:useRequestHeaders(["cookie"])})}catch{return navigateTo("/login")}}})
