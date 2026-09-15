import bridge from '@vkontakte/vk-bridge';
export const VK_APP_ID=54626490;
const launch=new URLSearchParams(location.search);
export const inVK=launch.has('vk_app_id')||launch.has('api_id')||window.parent!==window;
// Signal readiness independently of game assets or the game API.
if(inVK){
 bridge.send('VKWebAppInit').catch(()=>{});
 if(launch.has('api_id')&&launch.has('viewer_id')){
  const sdk=document.createElement('script');sdk.src='https://vk.com/js/api/xd_connection.js?2';sdk.async=true;
  sdk.onload=()=>window.VK?.init(()=>{},()=>{},'5.199');
  document.head.append(sdk);
 }
}
export async function inviteVK(){if(!inVK)throw new Error('Приглашения ВК доступны при запуске игры внутри ВК.');return Promise.race([bridge.send('VKWebAppShowInviteBox',{}),new Promise((_,reject)=>setTimeout(()=>reject(new Error('ВК не ответил. Скопируй ссылку приглашения.')),10000))])}
export function inviteLink(kind,code){const value=kind+'='+encodeURIComponent(code);return inVK?'https://vk.ru/app'+VK_APP_ID+'#'+value:location.origin+location.pathname+'?'+value}
export function launchValue(key){const hash=new URLSearchParams(location.hash.slice(1)),request=new URLSearchParams(launch.get('request_key')||'');return launch.get(key)||hash.get(key)||request.get(key)}
