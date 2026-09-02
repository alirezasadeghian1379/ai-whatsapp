import {mkdir,writeFile} from "node:fs/promises"
import {extname,join} from "node:path"
import {getWhatsAppProvider} from "../../../services/providers"
import {requireSession} from "../../../utils/auth"
import {assertPlanLimit} from "../../../utils/plan"
import {db} from "../../../utils/db"

const allowed=new Set(["image/jpeg","image/png","image/webp","application/pdf","text/plain"])
export default defineEventHandler(async event=>{
 const auth=await requireSession(event),id=getRouterParam(event,"id")||""
 await assertPlanLimit(String(auth.sub),"messages")
 const parts=await readMultipartFormData(event)
 const file=parts?.find(part=>part.name==="file"&&part.filename)
 const caption=parts?.find(part=>part.name==="caption")?.data.toString().trim()
 if(!file?.data||!file.filename||!file.type||!allowed.has(file.type))throw createError({statusCode:422,statusMessage:"فقط تصویر، PDF یا فایل متنی مجاز است."})
 if(file.data.length>5*1024*1024)throw createError({statusCode:413,statusMessage:"حجم فایل نباید بیشتر از ۵ مگابایت باشد."})
 const conversation=await db.conversation.findFirst({where:{id,userId:String(auth.sub)},include:{contact:true,session:true}})
 if(!conversation)throw createError({statusCode:404,statusMessage:"گفتگو پیدا نشد."})
 if(conversation.session.status!=="CONNECTED")throw createError({statusCode:409,statusMessage:"واتساپ این گفتگو متصل نیست."})
 const sent=await getWhatsAppProvider().sendMedia(conversation.session.externalId,conversation.contact.phone,{data:file.data,mimeType:file.type,fileName:file.filename,caption})
 if(!sent.ok)throw createError({statusCode:502,statusMessage:sent.error})
 const extension=extname(file.filename).toLowerCase()||({"image/jpeg":".jpg","image/png":".png","image/webp":".webp","application/pdf":".pdf","text/plain":".txt"}[file.type]||"")
 const storedName=`${crypto.randomUUID()}${extension}`,mediaDir=join(process.cwd(),"storage","chat-media")
 await mkdir(mediaDir,{recursive:true});await writeFile(join(mediaDir,storedName),file.data)
 const message=await db.message.create({data:{conversationId:id,externalId:sent.data.messageId,direction:"OUTBOUND",source:"ADMIN",type:file.type.startsWith("image/")?"image":"document",body:caption||file.filename,mediaUrl:storedName,status:"SENT",sentAt:new Date()}})
 await db.conversation.update({where:{id},data:{lastMessageAt:new Date()}})
 return{message}
})
