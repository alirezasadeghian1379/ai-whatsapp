export default defineNuxtRouteMiddleware(async to => {
    // Signed-in users may still visit the public landing page.
    if (to.path !== "/login") return;
    try {
        const headers = import.meta.server ? useRequestHeaders(["cookie"]) : undefined;
        const {user} = await $fetch<any>("/api/auth/session", {headers});
        return navigateTo(["ADMIN", "SUPER_ADMIN"].includes(user.role) ? "/admin" : "/dashboard");
    } catch {
        // Public landing and login remain available to guests.
    }
});
