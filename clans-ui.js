import {MAPS} from './balance.js';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export async function clansUI(root,api,toast,openRaid){
 root.innerHTML='<p class="page-intro">Связываемся с кланами…</p>';
 try{
 const data=await api('clans');if(root.hidden)return;const c=data.clan;
 const row=(title,detail,buttons='')=>'<div class="clan-row"><div><strong>'+title+'</strong><small>'+detail+'</small></div>'+buttons+'</div>';
 root.innerHTML='<div class="clan-banner"><span class="eyebrow orange">СИЛА В ЕДИНСТВЕ</span><h2>'+esc(c?.name||'Найди своих.')+'</h2><p>До 20 выживших. Совместные рейды. Общая цель.</p></div>'+(c?
 '<div class="clan-columns"><section class="settings-card"><h3>Отряд · '+c.members.length+'/20</h3>'+c.members.map(m=>row(esc(m.name),'Уровень '+m.level)).join('')+'<button class="secondary" data-clan-action="leave">ПОКИНУТЬ КЛАН</button></section><section class="settings-card"><h3>Активные рейды</h3>'+(c.raids.map(r=>row(esc(MAPS[r.map].boss),r.hp+' / '+r.maxHp+' HP','<button class="primary" data-raid="'+r.id+'">К БОССУ</button>')).join('')||'<p>Создай рейд на карте. Он появится у всего клана.</p>')+(c.owner?'<h3>Заявки</h3>'+(c.requests.map(m=>row(esc(m.name),'Уровень '+m.level,'<button class="primary" data-clan-action="accept" data-code="'+m.code+'">ПРИНЯТЬ</button><button class="secondary" data-clan-action="decline" data-code="'+m.code+'">ОТКЛОНИТЬ</button>')).join('')||'<p>Новых заявок нет.</p>'):'')+'</section></div>':
 '<div class="clan-columns"><section class="settings-card"><h3>Создать клан</h3><p>Бесплатно со 2 уровня. Принимай заявки и собирай отряд.</p><form id="clan-create" class="friend-form"><input aria-label="Название клана" placeholder="Название клана" minlength="3" maxlength="28" required><button class="primary">СОЗДАТЬ</button></form></section><section class="settings-card"><h3>Открытые кланы</h3>'+(data.clans.map(x=>row(esc(x.name),x.count+'/20 участников','<button class="secondary" data-clan-action="request" data-code="'+x.code+'" '+(x.requested||x.count>=20?'disabled':'')+'>'+(x.requested?'ЗАЯВКА ОТПРАВЛЕНА':'ВСТУПИТЬ')+'</button>')).join('')||'<p>Стань основателем первого клана.</p>')+'</section></div>');
 const act=async(action,body)=>{try{await api('clans/'+action,body);await clansUI(root,api,toast,openRaid)}catch(e){toast(e.message)}};
 root.querySelectorAll('[data-clan-action]').forEach(button=>button.onclick=()=>{button.disabled=true;act(button.dataset.clanAction,{code:button.dataset.code}).finally(()=>button.disabled=false)});
 root.querySelectorAll('[data-raid]').forEach(button=>button.onclick=()=>openRaid(button.dataset.raid));
 const form=root.querySelector('form');if(form)form.onsubmit=e=>{e.preventDefault();act('create',{name:form.querySelector('input').value})};
 }catch(e){root.innerHTML='<p class="page-intro">'+esc(e.message)+'</p><button class="secondary">ПОВТОРИТЬ</button>';root.querySelector('button').onclick=()=>clansUI(root,api,toast,openRaid)}
}
