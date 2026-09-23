import {inVK,showRewardedAd} from './platform.js';
let watching=false,claimTicket=null;
export function adCard(){return '<section class="settings-card ad-card"><span class="eyebrow orange">РЕКЛАМА · ДОБРОВОЛЬНО</span><h3>Запас для вылазки</h3><p>Посмотри видео VK и получи <b>8 энергии</b>. До 3 наград в сутки, перерыв 5 минут. Для получения нужны 8 свободных единиц энергии.</p><button id="reward-ad" class="primary" '+(!inVK||watching?'disabled':'')+'>'+(claimTicket?'ПОЛУЧИТЬ НАГРАДУ':watching?'ОЖИДАНИЕ VK…':'СМОТРЕТЬ РЕКЛАМУ · +8 ЭНЕРГИИ')+'</button><p id="ad-status" role="status">'+(inVK?'Видео выбирает VK. При отмене награда не начисляется.':'Реклама доступна при запуске игры внутри VK.')+'</p></section>';}
export function bindAd(root,api,toast,refresh){
 const button=root.querySelector('#reward-ad');if(!button)return;
 button.onclick=async()=>{
  if(watching)return;watching=true;button.disabled=true;let ticket=claimTicket;
  try{
   if(!claimTicket){const data=await api('ads/start',{});ticket=data.ticket;await showRewardedAd();claimTicket=ticket;}
   await api('ads/claim',{ticket:claimTicket,completed:true});claimTicket=null;toast('Получено 8 энергии');
  }catch(e){if(ticket&&!claimTicket)try{await api('ads/cancel',{ticket})}catch{}toast(e.message||'VK не показал рекламу. Попробуй позже.');}
  finally{watching=false;refresh();}
 };
}
