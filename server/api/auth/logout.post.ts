export default defineEventHandler(event=>{deleteCookie(event,"session",{path:"/"});return{ok:true}})
