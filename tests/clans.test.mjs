import test from 'node:test';
import assert from 'node:assert/strict';
import {clanAction} from '../clans-domain.js';
import {freshSave,migrateSave,MAPS} from '../balance.js';
const id=()=>crypto.randomUUID().replaceAll('-','');
function fixture(){const db={players:{},raids:{}};for(const key of ['a','b','c'])db.players[key]={name:key,publicId:key.repeat(12),save:{...freshSave(),xp:240}};return db}
const call=(db,u,action,b={})=>clanAction(db,u,'/api/clans'+(action?'/'+action:''),action?'POST':'GET',b,id);
test('clans require consent; only leader accepts and private session IDs stay hidden',()=>{
 const db=fixture();const created=call(db,'a','create',{name:'Север'});const code=created.clan.code;
 call(db,'b','request',{code});assert.equal(call(db,'a').clan.requests.length,1);
 assert.throws(()=>call(db,'b','accept',{code:'b'.repeat(12)}));
 call(db,'a','accept',{code:'b'.repeat(12)});assert.equal(call(db,'b').clan.members.length,2);
 assert.equal(call(db,'b').clan.requests.length,0);assert.equal(call(db,'b').clan.owner,false);
 assert.deepEqual(Object.keys(call(db,'b').clan.members[0]).sort(),['code','level','name']);
 call(db,'a','leave');assert.equal(call(db,'b').clan.owner,true);
 call(db,'b','leave');assert.equal(Object.keys(db.clans).length,0);
});
test('membership is exclusive; level and capacity enforced; clan sees members active raids',()=>{
 const db=fixture();db.players.c.save.xp=0;assert.throws(()=>call(db,'c','create',{name:'Рубеж'}));
 const one=call(db,'a','create',{name:'Север'}).clan.code;
 const two=call(db,'b','create',{name:'Восток'}).clan.code;
 assert.throws(()=>call(db,'b','request',{code:one}));
 call(db,'c','request',{code:one});call(db,'c','request',{code:two});
 call(db,'a','accept',{code:'c'.repeat(12)});assert.equal(db.clans[two].requests.length,0);
 db.raids.r={id:'r',owner:'c',map:5,hp:300,maxHp:1000};assert.equal(call(db,'a').clan.raids.length,1);
 db.clans[one].members=Array(20).fill('a');assert.throws(()=>call(db,'c','request',{code:one}));
});
test('old five-district saves migrate without losing progress',()=>{
 const s={...freshSave(),districtRuns:[3,4,1,0,2],cleared:[0,1]};migrateSave(s);
 assert.equal(s.districtRuns.length,MAPS.length);assert.deepEqual(s.districtRuns,[3,4,1,0,2,0,0,0]);assert.deepEqual(s.cleared,[0,1]);
});
