const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export default defineEventHandler(event => {
    setResponseHeaders(event, {
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "Permissions-Policy": "camera=(), microphone=(), geolocation=()"
    });

    const path = getRequestURL(event).pathname;
    if (!path.startsWith("/api/") || SAFE_METHODS.has(event.method)) return;

    // Provider callbacks/webhooks authenticate with their own signatures and
    // are server-to-server requests, so browser-origin checks do not apply.
    if (path === "/api/whatsapp/webhook") return;

    const fetchSite = getHeader(event, "sec-fetch-site");
    if (fetchSite === "cross-site") throw createError({statusCode: 403, statusMessage: "درخواست غیرمجاز است."});

    const origin = getHeader(event, "origin");
    if (!origin) return;
    const requestOrigin = getRequestURL(event).origin;
    let configuredOrigin = "";
    try { configuredOrigin = new URL(String(useRuntimeConfig().appUrl)).origin; } catch {}
    if (origin !== requestOrigin && origin !== configuredOrigin) {
        throw createError({statusCode: 403, statusMessage: "مبدأ درخواست معتبر نیست."});
    }
});
