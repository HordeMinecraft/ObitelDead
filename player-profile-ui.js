const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>Number(n||0).toLocaleString('ru-RU');
export const medalMarkup=m=>'<span class="medal-seal" aria-hidden="true"><span>'+(m.symbol?esc(m.symbol):'★')+'</span></span><span><b>'+esc(m.title)+'</b><small>'+esc(m.description||'Клановое достижение')+'</small></span>';
export function bindPlayerProfiles(root,api,toast){root.querySelectorAll('[data-player]').forEach(b=>b.onclick=()=>openPlayerProfile(b.dataset.player,api,toast));}
export async function openPlayerProfile(code,api,toast){
 let dialog;try{
  const {player:p}=await api('players/'+code);document.querySelector('#player-dossier')?.remove();
  dialog=document.createElement('dialog');dialog.id='player-dossier';dialog.className='player-dossier';dialog.setAttribute('aria-labelledby','dossier-name');
  dialog.innerHTML='<div class="dossier-head"><div><span class="eyebrow">ЛИЧНОЕ ДЕЛО · '+esc(p.code)+'</span><h2 id="dossier-name">'+esc(p.name)+'</h2><p>Уровень '+p.level+' · '+fmt(p.xp)+' XP</p></div><button class="secondary" aria-label="Закрыть профиль">Закрыть</button></div><div class="dossier-columns"><section><h3>Боевой комплект</h3><dl class="dossier-stats">'+[['Здоровье',fmt(p.stats.health)],['Урон оружия',fmt(p.stats.damage)],['Оружие',esc(p.weapon)],['Броня',esc(p.armor)],['Устранено',fmt(p.kills)],['Победы над боссами',fmt(p.bossKills)],['Клановые победы',fmt(p.clanBossKills)]].map(([a,b])=>'<div><dt>'+a+'</dt><dd>'+b+'</dd></div>').join('')+'</dl></section><section><h3>'+(p.clan?'Клан «'+esc(p.clan.name)+'»':'Без клана')+'</h3>'+(p.clan?'<p>'+(p.clan.leader?'Глава':'Участник')+' · '+esc(p.clan.code)+'</p>':'<p>Вступление в клан добровольное.</p>')+'<div class="medal-board">'+(p.clan?.medals?.map(m=>'<article>'+medalMarkup(m)+'</article>').join('')||'')+'</div><h3>Доска трофеев</h3><div class="medal-board">'+(p.display.map(m=>'<article>'+medalMarkup(m)+'</article>').join('')||'<p>Медали пока не выставлены.</p>')+'</div><small>Всего получено: '+p.medals.length+'</small></section></div>';
  document.body.append(dialog);dialog.querySelector('button').onclick=()=>dialog.close();dialog.addEventListener('close',()=>dialog.remove(),{once:true});dialog.showModal();
 }catch(e){dialog?.remove();toast(e.message);}
}
