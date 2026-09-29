// The token is used transiently, never persisted or logged.
export async function verifiedVKFriends(token,fetcher=fetch){
 const fail=(message,status=502)=>{throw Object.assign(new Error(message),{status})};
 if(typeof token!=='string'||token.length<10||token.length>4096)fail('Нужно разрешение VK на список друзей',400);
 async function call(method,params={}){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),3500);
  try{
   const r=await fetcher('https://api.vk.ru/method/'+method,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({access_token:token,v:'5.199',...params}).toString(),signal:controller.signal,redirect:'error'});
   if(!r.ok)fail('VK временно не отвечает. Повтори обновление друзей.');
   const data=await r.json();if(data.error)fail('VK не предоставил список друзей. Проверь разрешение и повтори.',403);
   return data.response;
  }catch(e){if(e.status)throw e;fail('Не удалось получить друзей из VK. Повтори позже.')}finally{clearTimeout(timer)}
 }
 const user=await call('users.get');
 if(!Array.isArray(user)||user.length!==1||!Number.isSafeInteger(user[0].id)||user[0].id<=0)fail('VK не подтвердил владельца профиля',403);
 const friends=[];
 for(let offset=0;offset<20000;){
  const page=await call('friends.get',{count:5000,offset});
  if(!page||!Number.isSafeInteger(page.count)||page.count<0||page.count>20000||!Array.isArray(page.items)||page.items.some(id=>!Number.isSafeInteger(id)||id<=0))fail('VK вернул некорректный список друзей');
  friends.push(...page.items);offset+=page.items.length;
  if(offset>=page.count)break;
  if(!page.items.length||offset>=20000)fail('VK вернул неполный список друзей');
 }
 return {user:String(user[0].id),friends:[...new Set(friends.map(String))]};
}
