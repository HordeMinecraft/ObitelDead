import {inviteVK,inviteVKFriends,inviteLink,launchValue,inVK} from './platform.js';
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function friendsUI(root,api,toast,openRaid){
 let loading=false;
 async function render(){
  if(loading)return;loading=true;
  try{
   const [data,onlineData,leaderData]=await Promise.all([api('friends'),api('online'),api('leaderboard')]);
   const invited=String(launchValue('friend')||'').toLowerCase();
   const leaderboard=(leaderData.players||[]).slice(0,10);
   root.innerHTML=`
    <div class="settings-card">
     <span class="eyebrow orange">СВОИ В ГОРОДЕ · ${Number(onlineData.online||0)} В СЕТИ</span>
     <h2>Выживать вместе.</h2>
     <p>Добавляй игроков по коду или отправляй приглашение через ВК. Когда друг примет заявку, здесь будет виден его статус и открытый рейд.</p>
     <div class="friend-code"><span>ТВОЙ КОД</span><strong>${data.code}</strong><button class="secondary" id="friend-copy">ССЫЛКА ПРИГЛАШЕНИЯ</button>${inVK?'<button class="primary" id="vk-friends">ВЫБРАТЬ ДРУЗЕЙ ВК</button><button class="secondary" id="vk-invite">ПОДЕЛИТЬСЯ ССЫЛКОЙ</button>':''}</div>
     <form id="friend-form"><label for="friend-code-input">Код друга</label><div class="friend-form"><input id="friend-code-input" maxlength="12" required pattern="[a-fA-F0-9]{12}" autocomplete="off" placeholder="12 символов" value="${escape(invited)}"><button class="primary">ДОБАВИТЬ В ДРУЗЬЯ</button></div></form>
    </div>
    <div class="section-title"><h3>Входящие заявки</h3><span>${data.requests.length}</span></div>
    <div class="party-list">${data.requests.map(p=>`<div><span><b>${escape(p.name)}</b><small>${p.online?'● В СЕТИ':'Не в сети'} · уровень ${p.level||1}</small></span><button class="primary" data-accept="${p.code}">ПРИНЯТЬ</button><button class="secondary" data-decline="${p.code}">ОТКЛОНИТЬ</button></div>`).join('')||'<p class="page-intro">Новых заявок пока нет.</p>'}</div>
    <div class="section-title"><h3>Твой отряд</h3><button class="secondary" id="friends-refresh">ОБНОВИТЬ</button></div>
    <div class="party-list">${data.friends.map(p=>`<div><span><b>${escape(p.name)}</b><small>${p.online?'● В СЕТИ':'Не в сети'} · уровень ${p.level||1}${p.raid?' · открытый рейд '+p.raid.hp+' HP':''}</small></span>${p.raid?`<button class="primary" data-friend-raid="${p.raid.id}">К БОССУ →</button>`:''}<button class="secondary" data-remove="${p.code}">УДАЛИТЬ</button></div>`).join('')||'<p class="page-intro">Отправь другу ссылку. После принятия заявки он появится здесь.</p>'}</div>
    <div class="section-title"><h3>Топ выживших</h3><span>ТВОЁ МЕСТО: ${leaderData.meRank||'—'}</span></div>
    <div class="party-list leaderboard-list">${leaderboard.map(p=>`<div><strong>#${p.rank}</strong><span><b>${escape(p.name)}</b><small>${p.online?'● В СЕТИ · ':''}ур. ${p.level} · ${p.xp} XP · боссы ${p.bossKills}</small></span></div>`).join('')||'<p class="page-intro">Рейтинг пока пуст.</p>'}</div>`;

   root.querySelector('#friends-refresh').onclick=render;
   const mutate=async(path,code)=>{try{await api(path,{code});toast(path.endsWith('request')?'Заявка отправлена':'Список друзей обновлён');await render()}catch(e){toast(e.message)}};
   root.querySelector('#friend-form').onsubmit=e=>{e.preventDefault();mutate('friends/request',root.querySelector('input').value.trim().toLowerCase())};
   root.querySelectorAll('[data-accept]').forEach(b=>b.onclick=()=>mutate('friends/accept',b.dataset.accept));
   root.querySelectorAll('[data-decline]').forEach(b=>b.onclick=()=>mutate('friends/decline',b.dataset.decline));
   root.querySelectorAll('[data-remove]').forEach(b=>b.onclick=()=>mutate('friends/remove',b.dataset.remove));
   root.querySelectorAll('[data-friend-raid]').forEach(b=>b.onclick=()=>openRaid(b.dataset.friendRaid));
   root.querySelector('#friend-copy').onclick=async()=>{const link=inviteLink('friend',data.code);try{await navigator.clipboard.writeText(link);toast('Приглашение скопировано')}catch{root.querySelector('input').value=data.code;toast('Передай другу свой код: '+data.code)}};
   if(root.querySelector('#vk-friends'))root.querySelector('#vk-friends').onclick=async()=>{try{const r=await inviteVKFriends(data.code);toast(r.sent?'Приглашения отправлены: '+r.sent:'Никто не выбран')}catch(e){toast(e.message||'Не удалось открыть друзей ВК')}};
   if(root.querySelector('#vk-invite'))root.querySelector('#vk-invite').onclick=()=>inviteVK(inviteLink('friend',data.code)).catch(e=>toast(e.message||'Приглашение закрыто'));

   if(/^[a-f0-9]{12}$/.test(invited)&&invited!==data.code){
    const key='obitel-friend-invite:'+invited;
    if(!sessionStorage.getItem(key)){
     sessionStorage.setItem(key,'1');
     try{await api('friends/request',{code:invited});toast('Заявка отправлена игроку, который пригласил тебя')}catch{}
    }
   }
  }catch(e){
   root.innerHTML='<div class="settings-card"><p>'+escape(e.message)+'</p><button class="secondary" id="friends-retry">ПОВТОРИТЬ</button></div>';
   root.querySelector('button').onclick=render;
  }finally{loading=false}
 }
 render();
}
