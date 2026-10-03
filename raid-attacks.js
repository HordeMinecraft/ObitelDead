import {playerLevel,raidProfile} from './balance.js';
import {raidHit} from './rare-raids.js';

// Purchased strikes supplement the equipped firearm; a common clock prevents instant chains.
export const RAID_ATTACKS=Object.freeze([
 {id:'gun',name:'Выстрел',cost:12,bonus:0,level:1,art:null,sound:'shot'},
 {id:'bat',name:'Удар битой',cost:12,bonus:.2,level:1,art:0,sound:'wood',sku:'raid_bat_10',votes:3,pack:10},
 {id:'pipe',name:'Стальная труба',cost:12,bonus:.4,level:1,art:1,sound:'metal',sku:'raid_pipe_10',votes:5,pack:10},
 {id:'fire',name:'Коктейль Молотова',cost:12,bonus:.7,level:5,art:2,sound:'fire',sku:'raid_fire_10',votes:8,pack:10}
].map(Object.freeze));
export function raidAttackPlan(save,map,rare=false,style='gun',hp=Infinity,testMode=false){
 const attack=RAID_ATTACKS.find(a=>a.id===style);if(!attack)return null;
 const base=raidHit(save,map,rare),damage=Math.max(1,Math.round(base*(1+attack.bonus)));
 const inventory=testMode?save.raidTestCharges:save.raidCharges;
 const charges=attack.sku?Math.max(0,Math.floor(inventory?.[attack.id]||0)):null;
 return {...attack,damage,extra:damage-base,expected:Math.min(Math.max(0,hp),damage),charges,cooldown:raidProfile(map).cooldown,locked:playerLevel(save)<attack.level};
}
