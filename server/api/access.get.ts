import {requireSession} from "../utils/auth"
import {getPlanAccess} from "../utils/plan"
export default defineEventHandler(async event=>{const auth=await requireSession(event);return getPlanAccess(String(auth.sub))})
