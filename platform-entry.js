import {playRewardedAd} from './ads-bridge.js';
import bridge from '@vkontakte/vk-bridge';
export const VK_APP_ID=54626490;
const launch=new URLSearchParams(location.search);
export const inVK=launch.has('vk_app_id')||launch.has('api_id')||bridge.isEmbedded()||Boolean(window.ReactNativeWebView);

if(inVK&&!window.__obitelVKStarted){
 window.__obitelVKStarted=true;
 window.__obitelVKState='waiting';
 bridge.send('VKWebAppInit').then(()=>{window.__obitelVKState='ready'}).catch(()=>{window.__obitelVKState='failed'});
 if(launch.has('api_id')&&launch.has('viewer_id')){
  const sdk=document.createElement('script');sdk.src='https://vk.com/js/api/xd_connection.js?2';sdk.async=true;
  sdk.onload=()=>window.VK?.init(()=>{},()=>{},'5.199');document.head.append(sdk);
 }
}

const withTimeout=(promise,message)=>Promise.race([promise,new Promise((_,reject)=>setTimeout(()=>reject(new Error(message)),10000))]);

export async function currentVKUser(){
 if(!inVK)return null;
 try{return await withTimeout(bridge.send('VKWebAppGetUserInfo',{}),'ВК не ответил на запрос профиля.')}catch{return null}
}

export async function inviteVK(link=''){
 if(!inVK)throw new Error('Приглашения ВК доступны при запуске игры внутри ВК.');
 if(link){
  try{return await withTimeout(bridge.send('VKWebAppShare',{link}),'ВК не ответил. Скопируй ссылку приглашения.')}catch{}
 }
 return withTimeout(bridge.send('VKWebAppShowInviteBox',{}),'ВК не ответил. Скопируй ссылку приглашения.');
}

export async function inviteVKFriends(code){
 if(!inVK)throw new Error('Выбор друзей ВК доступен только внутри приложения ВК.');
 const result=await withTimeout(bridge.send('VKWebAppGetFriends',{multi:true}),'ВК не открыл список друзей.');
 const users=Array.isArray(result?.users)?result.users:[];
 if(!users.length)return {sent:0,users:[]};
 let sent=0;
 for(const user of users.slice(0,20)){
  try{
   await withTimeout(bridge.send('VKWebAppShowRequestBox',{
    uid:user.id,
    message:'Присоединяйся ко мне в «Обители Мёртвых»!',
    requestKey:'friend='+code
   }),'Не удалось отправить приглашение.');
   sent++;
  }catch{}
 }
 if(!sent)await inviteVK(inviteLink('friend',code));
 return {sent,users};
}

export function inviteLink(kind,code){const value=kind+'='+encodeURIComponent(code);return inVK?'https://vk.ru/app'+VK_APP_ID+'#'+value:location.origin+location.pathname+'?'+value}
export function launchValue(key){const hash=new URLSearchParams(location.hash.slice(1)),request=new URLSearchParams(launch.get('request_key')||'');return launch.get(key)||hash.get(key)||request.get(key)}

export async function showRewardedAd(){if(!inVK)throw new Error("Реклама доступна только внутри VK");return playRewardedAd(bridge);}
