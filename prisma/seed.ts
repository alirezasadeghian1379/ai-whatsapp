import {PrismaClient} from "@prisma/client";
import {hash} from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
    const passwordHash = await hash(process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe123!", 12);
    const admin = await prisma.user.upsert({
        where: {email: "admin@example.com"},
        update: {},
        create: {name: "مدیر سیستم", email: "admin@example.com", passwordHash, role: "SUPER_ADMIN"},
    });

    const plans = [
        {
            name: "رایگان",
            slug: "free",
            price: 0,
            durationDays: 30,
            maxWhatsAppConnections: 1,
            maxMessages: 500,
            maxWebhooks: 1,
            maxAIRequests: 100,
            maxContacts: 250,
            features: ["صندوق ورودی", "پشتیبانی پایه"]
        },
        {
            name: "حرفه‌ای",
            slug: "pro",
            price: 890000,
            durationDays: 30,
            maxWhatsAppConnections: 3,
            maxMessages: 10000,
            maxWebhooks: 10,
            maxAIRequests: 5000,
            maxContacts: 10000,
            features: ["هوش مصنوعی", "وب‌هوک", "پشتیبانی اولویت‌دار"]
        },
        {
            name: "سازمانی",
            slug: "enterprise",
            price: 3490000,
            durationDays: 30,
            maxWhatsAppConnections: 10,
            maxMessages: 100000,
            maxWebhooks: 100,
            maxAIRequests: 50000,
            maxContacts: 100000,
            features: ["دسترسی کامل", "SLA اختصاصی", "گزارش پیشرفته"]
        },
    ];
    for (const [sortOrder, plan] of plans.entries()) {
        await prisma.plan.upsert({where: {slug: plan.slug}, update: plan, create: {...plan, sortOrder}});
    }
    const pro = await prisma.plan.findUnique({where: {slug: "pro"}});
    if (pro && !await prisma.subscription.findFirst({where: {userId: admin.id, status: "ACTIVE"}})) {
        await prisma.subscription.create({
            data: {
                userId: admin.id,
                planId: pro.id,
                status: "ACTIVE",
                startsAt: new Date(),
                endsAt: new Date(Date.now() + 365 * 86400000)
            }
        });
    }
    await prisma.systemSetting.upsert({
        where: {key: "site"},
        update: {},
        create: {key: "site", value: {name: "همراه‌چت", locale: "fa-IR"}},
    });
}

main().finally(() => prisma.$disconnect());
