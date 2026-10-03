import {MAPS,unlocked,bossUnlocked} from './balance.js';
import {strikeContains} from './boss-arena.js';

// One pass instead of sorting the enemy array on every frame. Preserve range/tie rules.
export function nearestTarget(enemies,x,y,range){
 let target=null,distance=range;
 for(const enemy of enemies){if(enemy.hp<=0)continue;const d=Math.hypot(enemy.x-x,enemy.y-y);if(d<distance){distance=d;target=enemy}}
 return target;
}

export function combatCue(run,weapon){
 if(run.ended)return {tone:'quiet',title:'Бой завершён',timer:''};
 if(run.paused)return {tone:'quiet',title:'Бой приостановлен',timer:''};
 if(run.transition)return {tone:'travel',title:'Участок зачищен · идём дальше',timer:''};
 const threats=run.enemies.filter(e=>e.hp>0&&e.attack?.t>0&&(e.attack.zones||[e.attack]).some(z=>strikeContains(z,run.x,run.y)));
 if(threats.length){const seconds=Math.min(...threats.map(e=>e.attack.t));return {tone:'danger',title:'Выйди из зоны удара',timer:seconds.toFixed(1)+' с'}}
 const boss=run.enemies.find(e=>e.hp>0&&e.type==='boss');
 if(boss?.exposedUntil>run.time)return {tone:'opening',title:'Босс уязвим · держи дистанцию',timer:(boss.exposedUntil-run.time).toFixed(1)+' с'};
 if(run.exhausted)return {tone:'recover',title:'Бег недоступен · восстанови выносливость',timer:''};
 if(run.hp/run.maxHp<.25)return {tone:'danger',title:'Мало здоровья · уходи от окружения',timer:''};
 if(!nearestTarget(run.enemies,run.x,run.y,weapon.range)&&run.enemies.some(e=>e.hp>0))return {tone:'range',title:'Цель вне дальности · подойди ближе',timer:''};
 return {tone:'quiet',title:'Автоогонь · двигайся и держи дистанцию',timer:''};
}

// This only recommends navigation. It never starts a paid sortie or raid.
export function sortieNextStep(save,map){
 if(MAPS.every((_,i)=>save.cleared.includes(i)))return {page:'guide',map,label:'К достижениям',description:'Все районы освоены. Проверь награды полевого журнала.'};
 if(!save.cleared.includes(map)&&bossUnlocked(save,map))return {page:'raids',map,label:'К боссу района',description:MAPS[map].boss+' доступен. Начни общий рейд.'};
 if(save.cleared.includes(map)&&MAPS[map+1]&&unlocked(save,map+1))return {page:'map',map:map+1,label:'Следующий район',description:MAPS[map+1].name+' открыт для вылазок.'};
 const remaining=Math.max(0,3-(save.districtRuns[map]||0));
 return {page:'map',map,label:'К карте города',description:remaining?'Победных зачисток до босса: '+remaining+'.':'Зачистки выполнены. Проверь требование к уровню босса.'};
}
