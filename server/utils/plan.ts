import {db} from "./db";

export type PlanLimit = "whatsapp" | "webhooks" | "messages" | "ai" | "contacts";
export type PlanFeature = "whatsapp" | "webhooks" | "messages" | "ai" | "contacts" | "sms";

export async function getPlanAccess(userId:string){
    const user=await db.user.findUnique({where:{id:userId},select:{role:true}});
    if(user&&["ADMIN","SUPER_ADMIN"].includes(user.role))return{isAdmin:true,plan:null,features:{whatsapp:true,webhooks:true,messages:true,ai:true,contacts:true,sms:true}};
    const active=await db.subscription.findFirst({where:{userId,status:"ACTIVE",OR:[{endsAt:null},{endsAt:{gt:new Date()}}]},include:{plan:true},orderBy:{endsAt:"desc"}});
    const plan=active?.plan;
    return{isAdmin:false,plan:plan?{id:plan.id,name:plan.name,slug:plan.slug}:null,features:{whatsapp:!!plan&&plan.maxWhatsAppConnections>0,webhooks:!!plan&&plan.maxWebhooks>0,messages:!!plan&&plan.maxMessages>0,ai:!!plan&&plan.maxAIRequests>0,contacts:!!plan&&plan.maxContacts>0,sms:!!plan&&plan.slug!=="free"}};
}

export async function assertPlanFeature(userId:string,feature:PlanFeature){
    const access=await getPlanAccess(userId);
    if(!access.features[feature])throw createError({statusCode:403,statusMessage:"این قابلیت در اشتراک فعلی شما فعال نیست؛ برای دسترسی پلن خود را ارتقا دهید."});
    return access;
}

export async function assertPlanLimit(userId: string, limit: PlanLimit) {
    const user = await db.user.findUnique({where: {id: userId}, select: {role: true}});
    if (user && ["ADMIN", "SUPER_ADMIN"].includes(user.role)) return;
    const subscription = await db.subscription.findFirst({
        where: {
            userId,
            status: "ACTIVE",
            OR: [{endsAt: null}, {endsAt: {gt: new Date()}}]
        }, include: {plan: true}, orderBy: {endsAt: "desc"}
    });
    if (!subscription) throw createError({
        statusCode: 402,
        statusMessage: "برای استفاده از این قابلیت به اشتراک فعال نیاز دارید."
    });
    let used = 0, max = 0;
    if (limit === "whatsapp") {
        used = await db.whatsAppSession.count({where: {userId}});
        max = subscription.plan.maxWhatsAppConnections
    } else if (limit === "webhooks") {
        used = await db.webhook.count({where: {userId}});
        max = subscription.plan.maxWebhooks
    } else if (limit === "contacts") {
        used = await db.contact.count({where: {userId}});
        max = subscription.plan.maxContacts;
    } else {
        const start = new Date();
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        if (limit === "messages") {
            used = await db.message.count({where: {conversation: {userId}, createdAt: {gte: start}}});
            max = subscription.plan.maxMessages
        } else {
            used = (await db.usage.findFirst({where: {userId, periodStart: {gte: start}}}))?.aiRequests || 0;
            max = subscription.plan.maxAIRequests
        }
    }
    if (used >= max) throw createError({
        statusCode: 429,
        statusMessage: "سقف مجاز پلن شما برای این دوره تکمیل شده است."
    })
}
