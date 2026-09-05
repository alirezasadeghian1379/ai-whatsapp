import {SignJWT, jwtVerify} from "jose"
import type {H3Event} from "h3"
import {db} from "./db"

const key = () => {
    const secret = String(useRuntimeConfig().authSecret || "")
    if (process.env.NODE_ENV === "production" && secret.length < 32) throw createError({
        statusCode: 503,
        statusMessage: "تنظیمات امنیتی سرور کامل نیست."
    })
    return new TextEncoder().encode(secret || "development-only-secret-change-me-32")
}

export async function issueSession(event: H3Event, user: { id: string; role: string }, remember = false) {
    const current = await db.user.findUnique({where: {id: user.id}, select: {sessionVersion: true}})
    if (!current) throw createError({statusCode: 401, statusMessage: "حساب کاربری پیدا نشد."})
    const token = await new SignJWT({role: user.role, ver: current.sessionVersion}).setProtectedHeader({
        alg: "HS256",
        typ: "JWT"
    }).setSubject(user.id).setIssuer("hamrah-chat").setAudience("hamrah-chat-web").setIssuedAt().setExpirationTime(remember ? "30d" : "1d").sign(key())
    setCookie(event, "session", token, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: remember ? 2592000 : 86400
    })
}

export async function requireSession(event: H3Event) {
    const token = getCookie(event, "session")
    if (!token) throw createError({statusCode: 401, statusMessage: "لطفاً وارد حساب خود شوید."})
    try {
        const payload = (await jwtVerify(token, key(), {
            issuer: "hamrah-chat",
            audience: "hamrah-chat-web",
            algorithms: ["HS256"]
        })).payload
        if (!payload.sub) throw new Error("missing subject")
        const user = await db.user.findUnique({where: {id: payload.sub}, select: {id: true, role: true, status: true, sessionVersion: true}})
        if (!user || user.status !== "ACTIVE" || payload.ver !== user.sessionVersion) throw new Error("inactive session")
        return {...payload, sub: user.id, role: user.role}
    } catch {
        deleteCookie(event, "session", {path: "/"})
        throw createError({statusCode: 401, statusMessage: "نشست شما منقضی یا غیرفعال شده است."})
    }
}
