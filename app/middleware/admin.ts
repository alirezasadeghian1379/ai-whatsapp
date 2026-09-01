export default defineNuxtRouteMiddleware(async (to) => {
    try {
        const headers = import.meta.server ? useRequestHeaders(["cookie"]) : undefined;
        const {user} = await $fetch<any>("/api/auth/session", {headers});
        if (!["ADMIN", "SUPER_ADMIN"].includes(user.role)) return navigateTo("/dashboard")
    } catch {
        return navigateTo(`/login?redirect=${encodeURIComponent(to.fullPath)}`)
    }
})
