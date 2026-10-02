import test from 'node:test';
import assert from 'node:assert/strict';
import {repel,repulseStatus,battleReport,REPULSE} from '../combat-tactics.js';
const state=()=>({time:5,x:430,y:410,face:1,stamina:100,paused:false,ended:false,transition:null,kills:7,plan:{cost:8},enemies:[{x:450,y:410,hp:20,cd:0,attack:{x:430,y:410},type:'walker'},{x:700,y:410,hp:80,cd:0,attack:null,type:'tank'}]});
test('repulse interrupts a nearby strike without damaging enemies; repeated input costs nothing',()=>{
 const run=state();assert.equal(repel(run),true);assert.equal(run.stamina,65);assert.equal(run.enemies[0].x,540);assert.equal(run.enemies[0].hp,20);assert.equal(run.enemies[0].attack,null);assert.equal(run.enemies[1].x,700);assert.equal(repel(run),false);assert.equal(run.stamina,65);run.time+=REPULSE.cooldown;assert.equal(repulseStatus(run).ready,true);
});
test('paused, completed, travelling or exhausted runs cannot use repulse',()=>{
 for(const patch of [{paused:true},{ended:true},{transition:{}},{stamina:34}]){const run=Object.assign(state(),patch);assert.equal(repel(run),false);assert.equal(run.repulseAt,undefined)}
});
test('knockback keeps enemies in bounds and handles coincident positions and boss resistance',()=>{
 const run=state();run.x=930;run.enemies=[{x:930,y:410,hp:20,cd:0,type:'walker',attack:{}},{x:900,y:410,hp:300,cd:0,type:'boss',attack:{}}];repel(run);assert.equal(run.enemies[0].x,935);assert.equal(run.enemies[1].x,873);assert.equal(run.enemies[1].hp,300);assert.ok(Number.isFinite(run.enemies[0].y));assert.deepEqual(battleReport(run),{duration:'0:05',kills:7,hits:0,repulses:1,energy:8});
});
