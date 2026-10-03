import {WEAPONS,ARMOR} from './balance.js';
import {gearPreview} from './gear-model.js';

const selection={weapons:null,armor:null};
const filters={weapons:'all',armor:'all'};
const scrollPositions={weapons:0,armor:0};
const fmt=n=>Math.round(n).toLocaleString('ru-RU');
const delta=n=>Math.round(n)===0?'': '<em class="'+(n>0?'gain':n<0?'loss':'neutral')+'">'+(Math.round(n)>0?'+':'')+fmt(n)+'</em>';
const art=(kind,i,item)=>kind==='weapons'?'<canvas data-catalogue-weapon="'+i+'" width="240" height="240" aria-hidden="true"></canvas>':'<canvas data-catalogue-item="'+item.icon+'" width="180" height="180" aria-hidden="true"></canvas>';
const state=p=>p.active?'На персонаже':p.owned?'В инвентаре':p.item.votes?'За голоса':p.open?'Чертёж открыт':'Ур. '+p.item.level;

export function mountGearCatalogue(root,save,kind,{drawWeapon,drawItem,equip}){
 const models=kind==='weapons'?WEAPONS:ARMOR;
 if(selection[kind]===null)selection[kind]=kind==='weapons'?save.weapon:save.armorTier||0;
 const draw=node=>{node.querySelectorAll('[data-catalogue-weapon]').forEach(c=>drawWeapon(c,+c.dataset.catalogueWeapon));node.querySelectorAll('[data-catalogue-item]').forEach(c=>drawItem(c,+c.dataset.catalogueItem))};
 const renderDetail=()=>{
  const p=gearPreview(save,kind,selection[kind]),w=p.item;
  const recipe=p.owned?'Предмет сохранён':w.votes?w.votes+' голосов · планируемая цена':fmt(w.cost)+' деталей'+(kind==='armor'?' · '+w.cloth+' ткани'+(w.cores?' · '+w.cores+' ядер':''):'');
  const statRows=kind==='weapons'?'<div><dt>Урон / выстрел</dt><dd>'+fmt(p.damage)+(w.pellets?' × '+w.pellets:'')+'</dd></div><div><dt>Урон / сек.</dt><dd>'+fmt(p.dps)+delta(p.dpsDelta)+'</dd></div><div><dt>Дальность</dt><dd>'+w.range+delta(p.rangeDelta)+'</dd></div><div><dt>Интервал огня</dt><dd>'+w.rate+' с</dd></div>':'<div><dt>Здоровье героя</dt><dd>'+fmt(p.hp)+' HP'+delta(p.hpDelta)+'</dd></div><div><dt>Защита комплекта</dt><dd>+'+w.hp+' HP</dd></div>';
  const detail=root.querySelector('.catalogue-detail');
  detail.innerHTML='<div class="catalogue-detail-head">'+art(kind,p.index,w)+'<div><small>'+state(p)+'</small><h3>'+w.name+'</h3></div></div><div class="catalogue-detail-body"><p>'+w.description+'</p><dl class="catalogue-stats">'+statRows+'</dl><small class="catalogue-compare">Изменение относительно надетого снаряжения. Бонусы машины и мастерской учтены.'+(w.pellets?' Урон в секунду — при попадании всех дробин.':'')+'</small>'+(!p.owned?'<p class="catalogue-unlock">Уровень '+(w.level||1)+(kind==='armor'&&w.bosses?' или '+w.bosses+' побед над боссами':'')+'</p>':'')+'</div><div class="catalogue-action"><div><strong>'+recipe+'</strong><small>'+p.reason+'</small></div><button class="'+(p.active?'secondary':'primary')+'" data-catalogue-equip '+(!p.enabled?'disabled':'')+'>'+(p.active?'Надето':p.owned?'Экипировать':w.votes?'Скоро':'Создать')+'</button></div>';
  detail.querySelector('[data-catalogue-equip]').onclick=()=>equip(p.index);
  root.querySelectorAll('[data-catalogue-select]').forEach(b=>b.setAttribute('aria-pressed',String(+b.dataset.catalogueSelect===p.index)));
  draw(detail);
 };
 const render=()=>{
  const list=models.map((w,i)=>gearPreview(save,kind,i)).filter(p=>filters[kind]==='all'||p.owned);
  if(!list.some(p=>p.index===selection[kind]))selection[kind]=list[0].index;
  root.innerHTML='<div class="gear-catalogue"><div class="catalogue-master"><div class="catalogue-tools"><span>'+models.length+' '+(kind==='weapons'?'моделей':'комплектов')+'</span><div role="group" aria-label="Фильтр снаряжения">'+[['all','Все'],['owned','Мои']].map(([id,label])=>'<button data-catalogue-filter="'+id+'" aria-pressed="'+(filters[kind]===id)+'">'+label+'</button>').join('')+'</div></div><div class="catalogue-list" role="group" aria-label="'+(kind==='weapons'?'Модели оружия':'Комплекты брони')+'">'+list.map(p=>'<button class="catalogue-row" data-catalogue-select="'+p.index+'" aria-pressed="'+(selection[kind]===p.index)+'">'+art(kind,p.index,p.item)+'<span class="catalogue-row-copy"><b>'+p.item.name+'</b><small>'+state(p)+' · '+(kind==='weapons'?fmt(p.dps)+' урон/с':fmt(p.hp)+' HP героя')+'</small></span><span class="catalogue-row-arrow" aria-hidden="true">›</span></button>').join('')+'</div></div><section class="catalogue-detail" aria-label="Выбранное снаряжение"></section></div>';
  root.querySelectorAll('[data-catalogue-filter]').forEach(b=>b.onclick=()=>{filters[kind]=b.dataset.catalogueFilter;scrollPositions[kind]=0;render();root.querySelector('[data-catalogue-filter="'+filters[kind]+'"]').focus({preventScroll:true})});
  const listNode=root.querySelector('.catalogue-list');listNode.scrollTop=scrollPositions[kind];listNode.onscroll=()=>scrollPositions[kind]=listNode.scrollTop;
  root.querySelectorAll('[data-catalogue-select]').forEach(b=>b.onclick=()=>{selection[kind]=+b.dataset.catalogueSelect;renderDetail()});
  root.querySelector('.catalogue-list').onkeydown=e=>{const buttons=[...root.querySelectorAll('[data-catalogue-select]')],i=buttons.indexOf(e.target);if(i<0)return;let next;if(e.key==='ArrowDown')next=(i+1)%buttons.length;else if(e.key==='ArrowUp')next=(i+buttons.length-1)%buttons.length;else if(e.key==='Home')next=0;else if(e.key==='End')next=buttons.length-1;else return;e.preventDefault();buttons[next].click();buttons[next].focus({preventScroll:true});const row=buttons[next],top=row.offsetTop-listNode.offsetTop;if(top<listNode.scrollTop)listNode.scrollTop=top;else if(top+row.offsetHeight>listNode.scrollTop+listNode.clientHeight)listNode.scrollTop=top+row.offsetHeight-listNode.clientHeight};
  renderDetail();draw(root);
 };
 render();
}
