import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: "2026-08-31",
  devtools: { enabled: true },
  css: ["@fontsource-variable/vazirmatn", "~/assets/css/main.css"],
  vite: { plugins: [tailwindcss()] },
  app: { head: { title: "همراه‌چت | مدیریت هوشمند واتساپ", meta: [
    { name: "description", content: "پنل یکپارچه مدیریت گفتگو، وب‌هوک و پاسخ‌گویی هوشمند واتساپ" },
    { name: "viewport", content: "width=device-width, initial-scale=1" },
  ] } },
  nitro: { preset: "node-server", routeRules: { "/api/**": { headers: { "x-content-type-options": "nosniff", "x-frame-options": "DENY" } } } },
  runtimeConfig: {
    authSecret: process.env.AUTH_SECRET,
    whatsappProvider: process.env.WHATSAPP_PROVIDER || "mock",
    whatsappApiUrl: process.env.WHATSAPP_API_URL || "",
    whatsappApiKey: process.env.WHATSAPP_API_KEY || "",
    whatsappWebhookSecret: process.env.WHATSAPP_WEBHOOK_SECRET || "",
    encryptionSecret: process.env.ENCRYPTION_SECRET || process.env.AUTH_SECRET || "",
    appUrl: process.env.APP_URL || "http://localhost:3000",
    aiProvider: process.env.AI_PROVIDER || "mock",
    paymentProvider: process.env.PAYMENT_PROVIDER || "mock",
    public: { appName: "همراه‌چت" },
  },
  typescript: { strict: true, typeCheck: true },
})
