import type {H3Event} from "h3"

type Entry = { count: number; resetAt: number }
const buckets = new Map<string, Entry>()

export function assertRateLimit(event: H3Event, scope: string, options: {
    limit: number;
    windowMs: number;
    identity?: string
    bindIp?: boolean
}) {
    const now = Date.now(), ip = getRequestIP(event, {xForwardedFor: true}) || "unknown",
        key = `${scope}:${options.bindIp === false ? "all" : ip}:${(options.identity || "").toLowerCase()}`, current = buckets.get(key)
    if (!current || current.resetAt <= now) {
        buckets.set(key, {count: 1, resetAt: now + options.windowMs});
        return
    }
    if (current.count >= options.limit) {
        setHeader(event, "Retry-After", Math.ceil((current.resetAt - now) / 1000));
        throw createError({
            statusCode: 429,
            statusMessage: "تعداد درخواست‌ها بیش از حد مجاز است؛ کمی بعد دوباره تلاش کنید."
        })
    }
    current.count++
    if (buckets.size > 10000) for (const [bucket, value] of buckets) if (value.resetAt <= now) buckets.delete(bucket)
}
