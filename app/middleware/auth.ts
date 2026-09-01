export default defineNuxtRouteMiddleware(async (to) => {
    try {
        const headers = import.meta.server ? useRequestHeaders(["cookie"]) : undefined;
        await $fetch("/api/auth/session", {headers})
    } catch {
        return navigateTo(`/login?redirect=${encodeURIComponent(to.fullPath)}`)
    }
})
