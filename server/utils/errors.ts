export async function databaseAction<T>(action:()=>Promise<T>):Promise<T>{
  try{return await action()}
  catch(error){console.error("Database operation failed",error);throw createError({statusCode:503,statusMessage:"ارتباط با پایگاه داده برقرار نشد. لطفاً کمی بعد دوباره تلاش کنید."})}
}
