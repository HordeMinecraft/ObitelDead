import {freshSave} from './balance.js';
const fail=(message,status)=>{throw Object.assign(new Error(message),{status})};
export async function verifyVKLaunch(raw,secret,now=Date.now()){
 if(!secret)fail('Синхронизация VK ещё не настроена на сервере',503);
 if(typeof raw!=='string'||raw.length>6000)fail('Неверные параметры VK',401);
 const params=new URLSearchParams(raw),seen=new Set();
 for(const [k] of params){if(seen.has(k))fail('Повторяющиеся параметры VK',401);seen.add(k);}
 const user=params.get('vk_user_id'),sign=params.get('sign'),ts=Number(params.get('vk_ts'));
 if(params.get('vk_app_id')!=='54626490'||!/^\d{1,20}$/.test(user||'')||BigInt(user)<=0n||!sign||!Number.isSafeInteger(ts)||ts<=0||Math.abs(now/1000-ts)>86400)fail('Открой игру заново через VK для подтверждения аккаунта',401);
 const signed=new URLSearchParams([...params].filter(([k])=>k.startsWith('vk_')).sort(([a],[b])=>a<b?-1:a>b?1:0)).toString();
 const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['verify']);
 let bytes;try{bytes=Uint8Array.from(atob(sign.replace(/-/g,'+').replace(/_/g,'/')+'='.repeat((4-sign.length%4)%4)),c=>c.charCodeAt(0));}catch{fail('Подпись VK недействительна',401);}
 if(!await crypto.subtle.verify('HMAC',key,bytes,new TextEncoder().encode(signed)))fail('Подпись VK недействительна',401);
 return user;
}
export function bindVKAccount(db,user,guest,id){
 db.vkAccounts??={};db.players??={};const existing=db.vkAccounts[user];
 if(existing&&db.players[existing]?.vkUserId===user)return existing;
 const candidate=db.players[guest];
 const session=candidate&&!candidate.vkUserId?guest:id();
 if(!db.players[session])db.players[session]={name:'Выживший',save:freshSave(),createdAt:Date.now()};
 db.players[session].vkUserId=user;db.vkAccounts[user]=session;return session;
}
