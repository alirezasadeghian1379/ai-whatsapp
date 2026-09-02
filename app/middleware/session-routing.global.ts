export default defineNuxtRouteMiddleware(async to => {
    // Marketing pages remain public, while authenticated users should not
    // return to account-entry or password-recovery screens.
    if (!["/login", "/register", "/forgot-password", "/reset-password"].includes(to.path)) return;
    try {
        const headers = import.meta.server ? useRequestHeaders(["cookie"]) : undefined;
        const {user} = await $fetch<any>("/api/auth/session", {headers});
        return navigateTo(["ADMIN", "SUPER_ADMIN"].includes(user.role) ? "/admin" : "/dashboard");
    } catch {
        // Public landing and login remain available to guests.
    }
});
