import{db}from"../utils/db";export default defineEventHandler(async()=>({plans:await db.plan.findMany({where:{isActive:true},orderBy:{sortOrder:"asc"}})}));
