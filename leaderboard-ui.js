import {portrait} from './friends-ui.js';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>Math.floor(n||0).toLocaleString('ru-RU');
const pending=new WeakSet();
export function leaderboardUI(root,api,toast){
 async function render(){
  if(pending.has(root))return;pending.add(root);
  try{
   const d=await api('leaderboard');
   root.innerHTML=`<div class="settings-card social-heading"><span class="eyebrow orange">ТОП 100 · ВЫЖИВШИЕ</span><h2>Герои города</h2><p>Рейтинг по опыту. При равенстве — победы над боссами и устранённые заражённые. Играй и развивайся: участие автоматическое после входа через VK. Обновление каждые 4 секунды.</p><div class="leader-summary"><strong>Твоё место: ${d.meRank?'#'+d.meRank:'—'}</strong><span>Игроков VK: ${fmt(d.total)} · В сети: ${fmt(d.online)}</span><button class="secondary" id="top-refresh">ОБНОВИТЬ</button></div></div><div class="social-list leaderboard-list">${d.players.map(p=>`<article class="friend-person rank-${p.rank<=3?p.rank:'other'} ${p.me?'is-me':''}"><strong class="rank-number">#${p.rank}</strong>${portrait(p)}<span class="friend-person-info"><b>${esc(p.name)}${p.me?' · ТЫ':''}</b><small>Ур. ${p.level} · ${fmt(p.xp)} XP · Боссы: ${fmt(p.bossKills)}</small></span>${p.me?'<span class="rank-status">ТВОЙ ПРОФИЛЬ</span>':p.friend?'<span class="rank-status">В ДРУЗЬЯХ</span>':`<button class="secondary" data-add="${p.code}" ${p.requested?'disabled':''}>${p.requested?'ЗАЯВКА ОТПРАВЛЕНА':'ДОБАВИТЬ В ДРУЗЬЯ'}</button>`}</article>`).join('')||'<p class="page-intro">Подтверждённых игроков VK пока нет. Войди через VK, чтобы участвовать в рейтинге.</p>'}</div>`;
   root.querySelector('#top-refresh').onclick=render;
   root.querySelectorAll('[data-add]').forEach(b=>b.onclick=async()=>{b.disabled=true;try{await api('friends/request',{code:b.dataset.add});b.textContent='ЗАЯВКА ОТПРАВЛЕНА';toast('Игровая заявка отправлена')}catch(e){b.disabled=false;toast(e.message)}});
  }catch(e){root.innerHTML='<div class="settings-card"><p>'+esc(e.message)+'</p><button class="secondary">ПОВТОРИТЬ</button></div>';root.querySelector('button').onclick=render}finally{pending.delete(root)}
 }
 render();
}
