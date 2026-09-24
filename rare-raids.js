import {MAPS,bossUnlocked,playerLevel,raidDamage,raidProfile} from './balance.js';
export const RAID_CAPACITY=300;
// Siege amplification changes only rare raids; gear still determines relative damage.
export const RARE_RAIDS=[
 [1000000,20,500,10000,15000],
 [5000000,40,700,17500,28000],
 [20000000,75,1000,30000,60000],
 [100000000,120,1400,49000,112000],
 [500000000,180,1900,76000,228000],
 [1000000000,250,2500,112500,400000],
 [5000000000,350,3200,152000,704000],
 [10000000000,450,4000,200000,1200000]
].map(([hp,level,hits,scrap,xp],map)=>({map,hp,level,hits,multiplier:hp/(hits*1000),pool:{scrap,xp,cores:hits,cloth:hits*2}}));
export const raidAllowed=(s,map,rare=false)=>bossUnlocked(s,map)&&(!rare||(s.cleared.includes(map)&&playerLevel(s)>=RARE_RAIDS[map].level));
export const raidHit=(s,map,rare=false)=>Math.max(1,Math.round(raidDamage(s)*(rare?RARE_RAIDS[map].multiplier:1-raidProfile(map).armor)));
export function raidReward(r,damage){
 if(!damage)return {scrap:0,xp:0,cores:0,cloth:0};
 if(!r.rare)return {scrap:MAPS[r.map].reward*2,xp:45,cores:3,cloth:6};
 const share=Math.min(1,Math.max(0,damage/r.maxHp));
 return Object.fromEntries(Object.entries(RARE_RAIDS[r.map].pool).map(([k,v])=>[k,Math.floor(v*share)]));
}
