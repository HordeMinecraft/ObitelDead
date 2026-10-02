import {SORTIE_MODES,sortiePlan} from './operations.js';
import {playerLevel,stats,expeditionReward,runXP} from './balance.js';
import {shelterIcon} from './ui-icons.js';
const fmt=n=>Math.round(n).toLocaleString('ru-RU');
export function renderBriefing(root,save,map,mode,onSelect){
 const plan=sortiePlan(save,map,mode),kills=27+map*3,expected=expeditionReward(map,kills,kills*2,true,stats(save).loot*plan.reward);
 root.innerHTML=`<div class="op-heading"><span class="eyebrow">ПЛАН ОПЕРАЦИИ</span><strong>${plan.condition.name}</strong><p>${plan.condition.description} ${map===0?'Первый квартал всегда спокойный.':'Условия меняются в полночь МСК.'}</p></div><div class="sortie-options" role="group" aria-label="Сложность вылазки">${SORTIE_MODES.map(m=>{const locked=playerLevel(save)<m.level;return `<button class="sortie-option ${m.id===mode?'selected':''}" data-mode="${m.id}" aria-pressed="${m.id===mode}" ${locked?'disabled':''}>${shelterIcon(m.id==='scout'?'map':m.id==='siege'?'conflict':'raids')}<span><b>${m.name}</b><small>${locked?'С '+m.level+' уровня':m.cost+' энергии · '+(m.reward===1?'обычная награда':Math.round(m.reward*100)+'% награды')}</small></span></button>`}).join('')}</div><div class="op-forecast"><span>~<b>${fmt(expected)}</b> деталей</span><span><b>${Math.round(runXP(kills,true,map,playerLevel(save))*plan.xp)}</b> XP</span><span><b>3</b> волны</span></div><p class="op-note">${plan.description} Расчёт деталей — средняя оценка, добыча случайна.</p>`;
 root.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>onSelect(b.dataset.mode));return plan;
}
const rewardText=r=>Object.entries(r).map(([key,n])=>'+'+n+' '+({scrap:'дет.',xp:'XP',cloth:'ткани',cores:'ядро'}[key])).join(' · ');
const pending=new WeakSet();
export async function renderOperations(root,api,toast,onUpdate){
 if(pending.has(root))return;pending.add(root);
 try{const view=await api('operations');if(!root.isConnected)return;
 root.innerHTML=`<div class="section-title"><h3>Приказы убежища</h3><span>${view.open?'ДО ПОЛУНОЧИ МСК':'С 3 УРОВНЯ'}</span></div><div class="operation-contracts">${view.contracts.map(c=>`<article class="operation-contract ${c.claimed?'complete':''}"><span class="contract-stamp">${shelterIcon(c.id==='support'?'raids':c.id==='route'?'map':'daily')}</span><div><span class="eyebrow">${c.claimed?'ВЫПОЛНЕНО':'ЕЖЕДНЕВНАЯ ЦЕЛЬ'}</span><h3>${c.title}</h3><p>${c.description}</p><div class="op-progress" role="progressbar" aria-label="${c.title}" aria-valuemin="0" aria-valuemax="${c.goal}" aria-valuenow="${c.progress}"><i style="width:${c.progress/c.goal*100}%"></i></div><small>${c.progress} / ${c.goal} · ${rewardText(c.reward)}</small></div><button class="${c.progress>=c.goal&&!c.claimed&&view.open?'primary':'secondary'}" data-contract="${c.id}" ${!view.open||c.claimed||c.progress<c.goal?'disabled':''}>${c.claimed?'ПОЛУЧЕНО':!view.open?'С 3 УРОВНЯ':c.progress<c.goal?'В ПРОЦЕССЕ':'ЗАБРАТЬ'}</button></article>`).join('')}</div>`;
 root.querySelectorAll('[data-contract]').forEach(b=>b.onclick=async()=>{b.disabled=true;try{await api('operations/claim',{id:b.dataset.contract});toast('Награда получена');onUpdate()}catch(e){b.disabled=false;toast(e.message)}});
 }catch(e){if(root.isConnected){root.textContent='Приказы не загружены: '+e.message;const b=document.createElement('button');b.className='secondary';b.textContent='ПОВТОРИТЬ';b.onclick=()=>renderOperations(root,api,toast,onUpdate);root.append(b)}}finally{pending.delete(root)}
}
