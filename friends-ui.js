import {vkPhoto} from './vk-profile.js';
import {AVATARS} from './profile-ui.js';
import {icon} from './ui-icons.js';
import {syncVKFriends,canSyncVKFriendsSilently,inVK} from './platform.js';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const portrait=p=>'<span class="friend-avatar avatar-'+(Number(p.avatar)||0)+'" aria-hidden="true">'+(vkPhoto(p.photo)?'<img src="'+esc(vkPhoto(p.photo))+'" alt="" loading="lazy" referrerpolicy="no-referrer">':(AVATARS[p.avatar]||AVATARS[0]))+'</span>';
let autoSyncAttempted=false;
const pending=new WeakSet();
export function friendsUI(root,api,toast,openRaid){
 async function render(){
  if(pending.has(root))return;pending.add(root);
  try{
   let data=await api('friends');
   if(data.account==='vk'&&canSyncVKFriendsSilently()&&!autoSyncAttempted){autoSyncAttempted=true;try{data=await syncVKFriends(api)}catch(e){toast(e.message)}}
   root.innerHTML=`<div class="settings-card social-heading"><span class="eyebrow orange">ТВОЙ ОТРЯД · ${data.friends.length}</span><h2>Друзья в городе</h2><p>Друзья VK, которые уже вошли в игру, появляются после синхронизации. Выберите одного босса — атаки попадают в общий рейд, даже если вы играете в разное время.</p>${inVK&&data.account==='vk'?`<button class="primary" id="vk-sync">${data.vkSyncedAt?'ОБНОВИТЬ ДРУЗЕЙ VK':'ПОКАЗАТЬ ДРУЗЕЙ VK'}</button><small>VK может запросить разрешение на список друзей. Приглашения не отправляются.</small>`:'<p>Для друзей VK открой игру внутри VK. Других игроков можно добавить из ТОПа.</p>'}</div>
   <div class="section-title"><h3>Входящие заявки · ${data.requests.length}</h3><button class="secondary" id="friends-refresh">ОБНОВИТЬ</button></div>
   <div class="social-list">${data.requests.map(p=>`<article class="friend-person">${portrait(p)}<span class="friend-person-info"><b>${esc(p.name)}</b><small>Уровень ${p.level}</small></span><button class="primary" data-accept="${p.code}">ПРИНЯТЬ</button><button class="secondary" data-decline="${p.code}">ОТКЛОНИТЬ</button></article>`).join('')||'<p class="page-intro">Новых заявок нет.</p>'}</div>
   <div class="section-title"><h3>Мои друзья · ${data.friends.length}</h3></div><div class="social-list">${data.friends.map(p=>`<article class="friend-person">${portrait(p)}<span class="friend-person-info"><b>${esc(p.name)}</b><small>${p.vk?'VK · ':''}${p.online?'В сети':'Не в сети'} · ур. ${p.level}${p.raid?' · босс: '+Math.floor(p.raid.hp).toLocaleString('ru-RU')+' HP':''}</small></span>${p.raid?`<button class="primary" data-raid="${p.raid.id}">К БОССУ</button>`:''}${!p.vk?`<button class="secondary" data-remove="${p.code}">УДАЛИТЬ</button>`:''}</article>`).join('')||'<div class="friends-empty">'+icon('friends')+'<h3>Отряд пока пуст</h3><p>Синхронизируй друзей VK или добавь игроков из вкладки «ТОП игроков». Здесь нет ботов и случайных профилей.</p></div>'}</div>
   <details class="settings-card"><summary>Добавить по игровому коду</summary><p>Твой код: <strong>${esc(data.code)}</strong></p><form id="friend-form" class="friend-form"><input aria-label="Код игрока" maxlength="12" required pattern="[a-fA-F0-9]{12}" placeholder="12 символов"><button class="secondary">ДОБАВИТЬ</button></form></details>`;
   const mutate=async(path,code,button)=>{button.disabled=true;try{await api(path,{code});await render();toast('Список друзей обновлён')}catch(e){toast(e.message);button.disabled=false}};
   root.querySelector('#friends-refresh').onclick=render;
   root.querySelector('#vk-sync')?.addEventListener('click',async e=>{const b=e.currentTarget;b.disabled=true;try{await syncVKFriends(api);await render();toast('Друзья VK обновлены')}catch(err){toast(err.message);b.disabled=false}});
   for(const name of ['accept','decline','remove'])root.querySelectorAll('[data-'+name+']').forEach(b=>b.onclick=()=>mutate('friends/'+name,b.dataset[name],b));
   root.querySelectorAll('[data-raid]').forEach(b=>b.onclick=()=>openRaid(b.dataset.raid));
   root.querySelector('#friend-form').onsubmit=e=>{e.preventDefault();mutate('friends/request',e.target.querySelector('input').value.trim().toLowerCase(),e.target.querySelector('button'))};
  }catch(e){root.innerHTML='<div class="settings-card"><p>'+esc(e.message)+'</p><button class="secondary">ПОВТОРИТЬ</button></div>';root.querySelector('button').onclick=render}finally{pending.delete(root)}
 }
 render();
}
