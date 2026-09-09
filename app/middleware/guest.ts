/** Redirect signed-in visitors away from authentication-only screens. */
export default defineNuxtRouteMiddleware(async () => {
    try {
        const headers = import.meta.server ? useRequestHeaders(["cookie"]) : undefined;
        const {user} = await $fetch<{user: {role: string}}>("/api/auth/session", {headers});
        return navigateTo(["ADMIN", "SUPER_ADMIN"].includes(user.role) ? "/admin" : "/dashboard");
    } catch {
        // Guests are allowed to view these pages.
    }
});
