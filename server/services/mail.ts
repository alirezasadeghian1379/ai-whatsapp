import nodemailer from "nodemailer";

export async function sendContactEmail(input: { name: string; email: string; subject: string; message: string }) {
    const c = useRuntimeConfig();
    if (!c.smtpHost || !c.smtpUser || !c.smtpPassword) throw createError({
        statusCode: 503,
        statusMessage: "سرویس دریافت پیام هنوز توسط مدیر سامانه تنظیم نشده است."
    });
    const transport = nodemailer.createTransport({
        host: c.smtpHost,
        port: Number(c.smtpPort),
        secure: c.smtpSecure,
        auth: {user: c.smtpUser, pass: c.smtpPassword}
    });
    await transport.sendMail({
        from: c.mailFrom,
        to: c.smtpUser,
        replyTo: input.email,
        subject: `تماس با همراه‌چت: ${input.subject}`,
        text: `نام: ${input.name}\nایمیل: ${input.email}\n\n${input.message}`
    })
}

export async function sendPasswordResetEmail(to: string, name: string, resetUrl: string) {
    const c = useRuntimeConfig();
    if (!c.smtpHost || !c.smtpUser || !c.smtpPassword) throw createError({
        statusCode: 503,
        statusMessage: "سرویس ارسال ایمیل هنوز در سرور تنظیم نشده است."
    });
    const transport = nodemailer.createTransport({
        host: c.smtpHost,
        port: Number(c.smtpPort),
        secure: c.smtpSecure,
        auth: {user: c.smtpUser, pass: c.smtpPassword}
    });
    await transport.sendMail({
        from: c.mailFrom,
        to,
        subject: "بازیابی رمز عبور همراه‌چت",
        text: `${name} عزیز، لینک تغییر رمز: ${resetUrl}\nاین لینک ۳۰ دقیقه اعتبار دارد.`,
        html: `<div dir="rtl" style="font-family:Tahoma,sans-serif;line-height:2"><h2>بازیابی رمز عبور</h2><p>${name} عزیز، درخواست تغییر رمز برای حساب شما ثبت شده است.</p><p><a href="${resetUrl}" style="background:#16a079;color:#fff;padding:12px 20px;border-radius:10px;text-decoration:none">تغییر رمز عبور</a></p><p>این لینک ۳۰ دقیقه اعتبار دارد.</p></div>`
    })
}
