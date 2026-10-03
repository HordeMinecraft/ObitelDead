import test from 'node:test';
import assert from 'node:assert/strict';
import {freshSave,WEAPONS} from '../balance.js';
import {nearestTarget,combatCue,sortieNextStep} from '../battle-feedback.js';
import {strikeContains} from '../boss-arena.js';

const state=()=>({time:5,x:400,y:400,hp:100,maxHp:110,enemies:[],paused:false,ended:false,exhausted:false});
test('auto target ignores dead enemies, keeps strict range and stable ties without sorting/mutation',()=>{
 const enemies=[{x:450,y:400,hp:0},{x:420,y:400,hp:10},{x:380,y:400,hp:10},{x:600,y:400,hp:20}],before=structuredClone(enemies);
 assert.equal(nearestTarget(enemies,400,400,20),null);assert.equal(nearestTarget(enemies,400,400,21),enemies[1]);
 assert.equal(nearestTarget(enemies,800,400,201),enemies[3]);assert.deepEqual(enemies,before);
});
test('telegraph collision and cue follow the same drawn ellipse including secondary boss zones',()=>{
 const zone={x:400,y:400,radius:60},r=state();r.enemies=[{hp:100,type:'boss',attack:{...zone,t:.8}}];
 assert.equal(combatCue(r,WEAPONS[0]).tone,'danger');assert.equal(combatCue(r,WEAPONS[0]).timer,'0.8 с');
 r.y=440;assert.equal(strikeContains(zone,r.x,r.y),false);assert.notEqual(combatCue(r,WEAPONS[0]).tone,'danger');
 r.enemies[0].attack.zones=[zone,{x:400,y:440,radius:52}];assert.equal(combatCue(r,WEAPONS[0]).tone,'danger');
});
test('danger takes priority over vulnerability; pause/travel/exhaustion/range reflect actual state',()=>{
 const r=state();r.enemies=[{hp:1e9,type:'boss',x:900,y:400,exposedUntil:6}];
 assert.equal(combatCue(r,WEAPONS[0]).tone,'opening');r.enemies[0].attack={x:400,y:400,radius:60,t:.5};assert.equal(combatCue(r,WEAPONS[0]).tone,'danger');
 r.paused=true;assert.equal(combatCue(r,WEAPONS[0]).tone,'quiet');r.paused=false;r.transition={};assert.equal(combatCue(r,WEAPONS[0]).tone,'travel');
 r.transition=null;r.enemies[0].attack=null;r.enemies[0].exposedUntil=0;r.exhausted=true;assert.equal(combatCue(r,WEAPONS[0]).tone,'recover');
 r.exhausted=false;assert.equal(combatCue(r,WEAPONS[0]).tone,'range');
});
test('post-sortie route respects clearance, boss level gate and the completed campaign',()=>{
 const s=freshSave(),before=structuredClone(s);assert.equal(sortieNextStep(s,0).page,'map');assert.deepEqual(s,before);
 s.districtRuns[0]=3;assert.equal(sortieNextStep(s,0).page,'raids');
 s.cleared=[0];assert.equal(sortieNextStep(s,0).map,1);assert.equal(sortieNextStep(s,0).label,'Следующий район');
 s.districtRuns[1]=3;assert.equal(sortieNextStep(s,1).page,'map');s.xp=240;assert.equal(sortieNextStep(s,1).page,'raids');
 s.cleared=[0,1,2,3,4,5,6,7];assert.equal(sortieNextStep(s,7).page,'guide');assert.equal(sortieNextStep(s,0).page,'guide');
});
