import {MAPS,BOSS_COST,raidProfile} from './balance.js';
import {RARE_RAIDS,RAID_CAPACITY,raidAllowed,raidHit} from './rare-raids.js';
export const BOSS_ART=['watcher','arsonist','crane','doctor','root','driver','smelter','admiral'];
const roles=['Хранитель пустых домов','Огонь последней заправки','Хозяин грузового двора','Карантин не окончен','Сердце заражённого леса','Последний рейс','Жар мёртвых печей','Командир затонувшего флота'];
const fmt=n=>Math.floor(n||0).toLocaleString('ru-RU');
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const rewards=r=>Object.entries({scrap:'Детали',xp:'Опыт',cores:'Ядра',cloth:'Ткань'}).map(([k,name])=>'<div><strong>'+fmt(r[k])+'</strong><span>'+name+'</span></div>').join('');
export function tickRaid(root,raid,save,offset){
 const button=root.querySelector('#raid-attack');if(!button||!raid)return;
 const seconds=Math.max(0,Math.ceil((raid.nextAttack-Date.now()-offset)/1000));
 button.disabled=!raid.joined||!raidAllowed(save,raid.map,raid.rare)||raid.hp<=0||seconds>0||save.energy<BOSS_COST;
 button.textContent=raid.hp<=0?'БОСС ПОВЕРЖЕН':seconds?'ПОВТОР ЧЕРЕЗ '+seconds+' СЕК':save.energy<BOSS_COST?'НУЖНО 12 ЭНЕРГИИ':'АТАКОВАТЬ · 12 ЭНЕРГИИ';
}
export function renderRaidView(root,{raid,save,selected,rareMode,offset,onMode,onMap,onCreate,onAttack,onJoin,onClaim,onClose,onCopy}){
 const map=raid?raid.map:selected,rare=raid?!!raid.rare:rareMode,m=MAPS[map],profile=RARE_RAIDS[map],allowed=raidAllowed(save,map,rare),mine=raid?.members.find(p=>p.me);
 const reward=raid?.reward||{scrap:m.reward*2,xp:45,cores:3,cloth:6};
 const capacity=raid?.capacity||RAID_CAPACITY;
 const hit=raid?.estimatedDamage??raidHit(save,map,rare);
 const hp=raid?.hp??(rare?profile.hp:raidProfile(map).hp),maxHp=raid?.maxHp??hp;
 const party=raid?.members||[];
 const oldDetails=root.querySelector('.raid-rules')?.open,oldPage=Number(root.dataset.partyPage||0);
 const same=root.dataset.encounter===(raid?.id||'catalog');
 root.dataset.encounter=raid?.id||'catalog';root.dataset.partyPage=String(same?oldPage:0);
 root.innerHTML=`<div class="raid-tabs" role="group" aria-label="Тип босса"><button class="secondary" data-mode="normal" aria-pressed="${!rare}">Обычные</button><button class="secondary" data-mode="rare" aria-pressed="${rare}">Редкие</button></div>
 ${!raid?`<label class="raid-select" for="raid-map">Выбрать босса</label><select id="raid-map" class="boss-select">${MAPS.map((v,i)=>`<option value="${i}" ${map===i?'selected':''}>${v.boss}${rare?' · ур. '+RARE_RAIDS[i].level:''}</option>`).join('')}</select>`:''}
 <article class="boss-encounter ${rare?'is-rare':''}">
 <div class="boss-stage" style="--boss-scene:url('assets/district-${map}.png')"><span class="boss-rarity">${rare?'РЕДКИЙ':'БОСС РАЙОНА'} · ${escape(m.name)}</span><img class="boss-character" src="assets/boss-${BOSS_ART[map]}.png" alt="${escape(m.boss)} — ${roles[map]}" width="512" height="512" decoding="async"><span class="boss-stage-caption">${roles[map]}</span></div>
 <div class="boss-brief"><span class="eyebrow">${raid?'ОБЩИЙ РЕЙД':'ДОСЬЕ ПРОТИВНИКА'}</span><h2>${m.boss}</h2><div class="boss-hp-label"><b>${fmt(hp)}</b><span>/ ${fmt(maxHp)} HP</span></div><div class="raid-health" role="progressbar" aria-label="Здоровье босса" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(hp/maxHp*10000)/100}" aria-valuetext="${fmt(hp)} из ${fmt(maxHp)} HP"><i style="width:${hp/maxHp*100}%"></i></div>
 <div class="boss-facts"><div><span>Твоя атака</span><b>${fmt(hit)}</b></div><div><span>Участники</span><b>${party.length} / ${capacity}</b></div><div><span>Повтор</span><b>${raidProfile(map).cooldown/1000} сек</b></div></div>
 ${!raid?`<p class="boss-access">Уровень ${rare?profile.level:m.level} · 3 зачистки${rare?' · победа над обычной версией':''}<br><span>${allowed?'Доступ открыт':'Условия ещё не выполнены'}</span></p><button class="primary boss-action" id="create-raid" ${!allowed?'disabled':''}>СОЗДАТЬ РЕЙД</button>`:`<button class="primary boss-action" id="raid-attack">АТАКОВАТЬ</button>${!raid.joined&&hp>0?`<button class="secondary boss-action" id="join-raid" ${!allowed||party.length>=capacity?'disabled':''}>${!allowed?'НУЖЕН ПРОГРЕСС':party.length>=capacity?'ОТРЯД ЗАПОЛНЕН':'ПРИСОЕДИНИТЬСЯ'}</button>`:''}`}
 </div></article>
 <section class="raid-loot"><div class="section-title"><h3>${raid?'Твоя награда после победы':rare?'Общий фонд рейда':'Награда за победу'}</h3></div><div class="raid-rewards">${rewards(raid?reward:rare?profile.pool:reward)}</div>${rare?'<p>Фонд делится по нанесённому урону. Без участия в атаке награды нет.</p>':''}${raid&&hp===0&&mine?.damage&&!mine.claimed?'<button class="primary" id="raid-claim">ЗАБРАТЬ НАГРАДУ</button>':''}</section>
 <details class="raid-rules" ${oldDetails&&same?'open':''}><summary>Правила и условия рейда</summary><p>Атаки в удобное время, общее здоровье сохраняется. Цена — 12 энергии. ${rare?'Осадное усиление ×'+profile.multiplier.toLocaleString('ru-RU',{maximumFractionDigits:2})+'. Оно действует только на редких боссов. Награды округляются вниз и выдаются один раз после победы. Рейд без срока истечения.':raidProfile(map).trait}</p><p>Приглашение по ссылке. Гостевой профиль привязан к браузеру; список друзей VK не подключён.</p></details>
 ${raid?'<div class="raid-controls"><button class="secondary" id="copy-raid">ПРИГЛАСИТЬ ПО ССЫЛКЕ</button><button class="secondary" id="close-raid">К СПИСКУ БОССОВ</button></div><section class="raid-party"><h3>Участники · '+party.length+'</h3><div class="party-list"></div><div class="party-pagination"></div></section>':''}`;
 root.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>onMode(b.dataset.mode==='rare'));
 const bind=(id,fn)=>{const el=root.querySelector('#'+id);if(el)el.onclick=fn};
 const select=root.querySelector('#raid-map');if(select)select.onchange=e=>onMap(Number(e.target.value));
 bind('create-raid',onCreate);bind('raid-attack',onAttack);bind('join-raid',onJoin);bind('raid-claim',onClaim);bind('close-raid',onClose);bind('copy-raid',onCopy);
 if(raid){const sorted=[...party].sort((a,b)=>Number(b.me)-Number(a.me)||b.damage-a.damage),pages=Math.ceil(sorted.length/20);
 const paint=()=>{const page=Math.min(Number(root.dataset.partyPage),Math.max(0,pages-1));root.dataset.partyPage=page;root.querySelector('.party-list').innerHTML=sorted.slice(page*20,page*20+20).map(p=>`<div><span>${escape(p.name)}${p.me?' · ТЫ':''}</span><b>${fmt(p.damage)} урона</b>${p.claimed?'<small>Награда получена</small>':''}</div>`).join('');const nav=root.querySelector('.party-pagination');nav.innerHTML=pages>1?`<button class="secondary" ${page===0?'disabled':''}>←</button><span>${page+1} / ${pages}</span><button class="secondary" ${page===pages-1?'disabled':''}>→</button>`:'';const buttons=nav.querySelectorAll('button');if(buttons.length){buttons[0].ariaLabel='Предыдущие участники';buttons[1].ariaLabel='Следующие участники';buttons[0].onclick=()=>{root.dataset.partyPage=page-1;paint()};buttons[1].onclick=()=>{root.dataset.partyPage=page+1;paint()};}};paint();tickRaid(root,raid,save,offset);
 }
}
