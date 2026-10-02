import {raidDamage,BOSS_COST} from './balance.js';
import {raidHit} from './rare-raids.js';

export const ARENA={name:'Нулевая платформа',duration:30,cost:BOSS_COST,minSeconds:1,expiry:15*60*1000,maxBonus:1.2,exposure:.9};
export const arenaContract=(save,map,rare=false)=>({duration:ARENA.duration,cost:ARENA.cost,rate:raidDamage(save)/5,target:Math.max(1,Math.round(raidDamage(save)/5*ARENA.duration*ARENA.exposure)),cap:Math.max(1,Math.floor(raidHit(save,map,rare)*ARENA.maxBonus))});
export function arenaContribution(contract,rawDamage,elapsedSeconds){
 if(!Number.isFinite(rawDamage)||rawDamage<0||!Number.isFinite(elapsedSeconds)||elapsedSeconds<ARENA.minSeconds)return 0;
 const bounded=Math.min(rawDamage,contract.rate*Math.min(ARENA.duration,elapsedSeconds)*1.5);
 return Math.max(0,Math.min(contract.cap,Math.floor(contract.cap*bounded/contract.target)));
}
export const arenaPhase=time=>Math.min(2,Math.floor(Math.max(0,time)/10));
export const ARENA_PHASES=['Наблюдение','Подкрепление','Ярость'];
export function strikeContains(zone,x,y){return Math.hypot((x-zone.x)/zone.radius,(y-zone.y)/(zone.radius*.6))<=1;}
export function arenaStrike(time,x,y){
 const phase=arenaPhase(time),radius=phase===2?68:60;
 const zones=[{x,y,radius}];
 if(phase===2)zones.push({x:Math.max(80,Math.min(880,x+(x<480?150:-150))),y:Math.max(325,y-65),radius:52});
 return {x,y,radius,zones,t:phase===2?1.05:1.35,total:phase===2?1.05:1.35};
}
export function updateArenaBoss(run,boss,dt){
 const phase=arenaPhase(run.time);boss.cd-=dt;boss.flash=Math.max(0,boss.flash-dt);
 if(!boss.attack&&boss.cd<=0){boss.attack=arenaStrike(run.time,run.x,run.y);boss.cd=phase===2?3.5:4.8;}
 if(boss.attack){
  boss.attack.t-=dt;
  if(boss.attack.t<=0){
   if(boss.attack.zones.some(z=>strikeContains(z,run.x,run.y))&&run.invulnerable<=0){run.hp-=boss.damage*(phase===2?1.3:1);run.hits++;run.invulnerable=.65;}
   boss.exposedUntil=run.time+1.8;boss.attack=null;
  }
 }else if(run.time>2){
  const length=Math.hypot(run.x-boss.x,run.y-boss.y)||1;
  if(length>70){boss.x=Math.max(40,Math.min(920,boss.x+(run.x-boss.x)/length*35*dt));boss.y=Math.max(310,Math.min(535,boss.y+(run.y-boss.y)/length*28*dt));}
 }
 return phase;
}
export const arenaHitMultiplier=(run,boss)=>boss.exposedUntil>run.time?1.35:.7;
