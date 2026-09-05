export default defineNuxtRouteMiddleware(async to => {
    if (to.path === "/dashboard/webhooks") return navigateTo("/dashboard")
    if (to.path === "/dashboard/wallet" || to.path === "/dashboard/sms") return navigateTo("/dashboard")
    if (to.path === "/admin/webhooks") return navigateTo("/admin")
    const routes: Record<string, string> = {
        "/dashboard/whatsapp": "whatsapp",
        "/dashboard/chats": "messages",
        "/dashboard/contacts": "contacts",
        "/dashboard/ai": "ai"
    }
    const feature = routes[to.path]
    if (!feature) return
    try {
        const headers = import.meta.server ? useRequestHeaders(["cookie"]) : undefined
        const access = await $fetch<any>("/api/access", {headers})
        if (!access.features?.[feature]) return navigateTo(`/dashboard/subscription?required=${feature}`)
    } catch {
        // Authentication middleware owns unauthenticated redirects.
    }
})
