import test from 'node:test';
import assert from 'node:assert/strict';
import {freshSave,stats,WEAPONS,ARMOR} from '../balance.js';
import {gearPreview} from '../gear-model.js';

test('weapon comparison includes the active vehicle, generator and workshop without changing save',()=>{
 const s={...freshSave(),vehicle:'interceptor',engine:3,weaponLevel:2},before=structuredClone(s);
 const p=gearPreview(s,'weapons',1),real=stats({...s,weapon:1});
 assert.equal(p.damage,real.damage);assert.equal(p.dps,real.damage/WEAPONS[1].rate);
 assert.ok(p.damage>WEAPONS[1].damage);assert.deepEqual(s,before);
 assert.equal(gearPreview(s,'weapons',0).dpsDelta,0);
});
test('armor comparison uses total HP with body and vehicle bonuses',()=>{
 const s={...freshSave(),vehicle:'medic',body:4};
 const p=gearPreview(s,'armor',1);
 assert.equal(p.hp,stats({...s,armorTier:1}).hp);assert.equal(p.hpDelta,p.hp-stats(s).hp);
 assert.ok(p.hpDelta>ARMOR[1].hp);
});
test('preview distinguishes missing materials, unlock gates and owned equipment',()=>{
 const s=freshSave();
 assert.equal(gearPreview(s,'weapons',1).enabled,false);
 assert.equal(gearPreview(s,'weapons',1).missing[0].amount,180);
 s.scrap=1000;assert.equal(gearPreview(s,'weapons',1).enabled,true);
 assert.equal(gearPreview(s,'armor',1).open,false);
 s.bossKills=1;s.cloth=8;assert.equal(gearPreview(s,'armor',1).enabled,true);
 s.ownedArmor=[0,1];s.scrap=0;s.cloth=0;assert.equal(gearPreview(s,'armor',1).enabled,true);
 assert.equal(gearPreview(s,'weapons',0).enabled,false);
});
test('vote equipment remains disabled until payments support it; no zero cost free purchase',()=>{
 const s={...freshSave(),xp:1e9,scrap:1e9,cloth:1e9,cores:1e9};
 for(const kind of ['weapons','armor'])for(const [i,item] of (kind==='weapons'?WEAPONS:ARMOR).entries())if(item.votes){const p=gearPreview(s,kind,i);assert.equal(p.enabled,false);assert.match(p.reason,/недоступна/)}
});
