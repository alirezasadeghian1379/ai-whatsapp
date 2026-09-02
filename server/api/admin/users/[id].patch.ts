import {z} from "zod"
import {requireAdmin} from "../../../utils/admin"
import {db} from "../../../utils/db"

const schema=z.object({status:z.enum(["ACTIVE","DISABLED"]).optional(),role:z.enum(["USER","ADMIN","SUPER_ADMIN"]).optional()}).refine(value=>value.status!==undefined||value.role!==undefined)
export default defineEventHandler(async event=>{
 const admin=await requireAdmin(event),adminId=String(admin.sub),id=getRouterParam(event,"id")||"",parsed=schema.safeParse(await readBody(event))
 if(!parsed.success)throw createError({statusCode:422,statusMessage:"تغییر درخواستی معتبر نیست."})
 const target=await db.user.findUnique({where:{id},select:{id:true,role:true,status:true}})
 if(!target)throw createError({statusCode:404,statusMessage:"کاربر پیدا نشد."})
 if(id===adminId&&(parsed.data.status==="DISABLED"||parsed.data.role&&parsed.data.role!==target.role))throw createError({statusCode:409,statusMessage:"نمی‌توانید نقش یا وضعیت حساب خودتان را تغییر دهید."})
 if(String(admin.role)!=="SUPER_ADMIN"&&(target.role!=="USER"||parsed.data.role!==undefined))throw createError({statusCode:403,statusMessage:"فقط مدیر ارشد می‌تواند نقش‌ها یا حساب مدیران را تغییر دهد."})
 if(target.role==="SUPER_ADMIN"&&parsed.data.role&&parsed.data.role!=="SUPER_ADMIN"){
  const superAdmins=await db.user.count({where:{role:"SUPER_ADMIN",status:"ACTIVE"}})
  if(superAdmins<=1)throw createError({statusCode:409,statusMessage:"حداقل یک مدیر ارشد فعال باید در سامانه باقی بماند."})
 }
 const user=await db.user.update({where:{id},data:parsed.data,select:{id:true,name:true,email:true,role:true,status:true}})
 await db.auditLog.create({data:{userId:adminId,action:"admin.user.update",entity:"User",entityId:id,ipAddress:getRequestIP(event,{xForwardedFor:true}),metadata:{before:target,after:user}}})
 return{user}
})
