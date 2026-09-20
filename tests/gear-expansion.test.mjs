import test from 'node:test';
import assert from 'node:assert/strict';
import {freshSave,WEAPONS,ARMOR,xpForLevel,playerLevel,levelProgress,weaponUnlocked,enemyStats,expeditionRank,runXP} from '../balance.js';
test('all 500 level boundaries are monotonic; maximum has no fake next level',()=>{
 for(let level=1;level<=500;level++){const xp=xpForLevel(level);assert.equal(playerLevel({...freshSave(),xp}),level);if(level>1){assert.ok(xp>xpForLevel(level-1));assert.equal(playerLevel({...freshSave(),xp:xp-1}),level-1)}}
 assert.deepEqual(levelProgress({...freshSave(),xp:xpForLevel(500)+999999}),{level:500,current:0,required:0,percent:100,max:true});
});
test('new weapons have bounded DPS and paid variants match free counterparts',()=>{
 assert.equal(WEAPONS.length,10);assert.equal(ARMOR.length,9);
 for(const w of WEAPONS)assert.ok(w.damage*(w.pellets||1)/w.rate<=100);
 assert.equal(WEAPONS[9].damage/WEAPONS[9].rate,WEAPONS[8].damage/WEAPONS[8].rate);
 assert.equal(ARMOR[8].hp,ARMOR[7].hp);
 for(let i=3;i<WEAPONS.length;i++){assert.equal(weaponUnlocked(freshSave(),i),false);assert.equal(weaponUnlocked({...freshSave(),xp:xpForLevel(WEAPONS[i].level)},i),true)}
});
test('veteran expeditions increase threat and XP, without changing early game',()=>{
 const rank=expeditionRank({...freshSave(),xp:xpForLevel(500)});assert.equal(rank,19);
 assert.ok(enemyStats(7,3,'tank',rank).hp>enemyStats(7,3,'tank').hp);
 assert.ok(runXP(48,true,7,500)>runXP(48,true,7,1));
});
