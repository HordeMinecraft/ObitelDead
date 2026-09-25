import {AVATARS} from './profile-ui.js';
import {icon} from './ui-icons.js';
import {inviteVK,inviteVKFriends,inviteLink,launchValue,inVK} from './platform.js';
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function friendsUI(root,api,toast,openRaid){
 let loading=false;
 async function render(){
  if(loading)return;loading=true;
  try{
   const data=await api('friends');
   const invited=String(launchValue('friend')||'').toLowerCase();
   const portrait=p=>'<span class="friend-avatar avatar-'+(Number(p.avatar)||0)+'" aria-hidden="true">'+(AVATARS[p.avatar]||AVATARS[0])+'</span>'; 
   root.innerHTML=`
    <div class="settings-card">
     <span class="eyebrow orange">СВОИ В ГОРОДЕ · ${data.friends.length} ДРУЗЕЙ</span>
     <h2>Твои друзья.</h2>
     <p>1. Отправь ссылку другу или введи его код. 2. Дождись принятия заявки. 3. Присоединяйся к его рейдам. Здесь показаны только добавленные тобой друзья.</p>
     <div class="friend-code"><span>ТВОЙ КОД</span><strong>${data.code}</strong><button class="secondary" id="friend-copy">ССЫЛКА ПРИГЛАШЕНИЯ</button>${inVK?'<button class="primary" id="vk-friends">ВЫБРАТЬ ДРУЗЕЙ ВК</button><button class="secondary" id="vk-invite">ПОДЕЛИТЬСЯ ССЫЛКОЙ</button>':''}</div>
     <form id="friend-form"><label for="friend-code-input">Код друга</label><div class="friend-form"><input id="friend-code-input" maxlength="12" required pattern="[a-fA-F0-9]{12}" autocomplete="off" placeholder="12 символов" value="${escape(invited)}"><button class="primary">ДОБАВИТЬ В ДРУЗЬЯ</button></div></form>
    </div>
    <div class="section-title"><h3>Входящие заявки</h3><span>${data.requests.length}</span></div>
    <div class="party-list">${data.requests.map(p=>`<div class="friend-person">${portrait(p)}<span class="friend-person-info"><b>${escape(p.name)}</b><small>${p.online?'● В СЕТИ':'Не в сети'} · уровень ${p.level||1}</small></span><button class="primary" data-accept="${p.code}">ПРИНЯТЬ</button><button class="secondary" data-decline="${p.code}">ОТКЛОНИТЬ</button></div>`).join('')||'<p class="page-intro">Новых заявок пока нет.</p>'}</div>
    <div class="section-title"><h3>Мои друзья · ${data.friends.length}</h3><button class="secondary" id="friends-refresh">ОБНОВИТЬ</button></div>
    <div class="party-list">${data.friends.map(p=>`<div class="friend-person">${portrait(p)}<span class="friend-person-info"><b>${escape(p.name)}</b><small>${p.online?'● В СЕТИ':'Не в сети'} · уровень ${p.level||1}${p.raid?' · открытый рейд '+p.raid.hp+' HP':''}</small></span>${p.raid?`<button class="primary" data-friend-raid="${p.raid.id}">К БОССУ →</button>`:''}<button class="secondary" data-remove="${p.code}">УДАЛИТЬ</button></div>`).join('')||'<div class="friends-empty">'+icon('friends')+'<h3>Начни с одного друга</h3><p>Скопируй ссылку приглашения выше и отправь знакомому. После принятия заявки здесь появятся его аватар, уровень и рейд.</p></div>'}</div>
`;

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
