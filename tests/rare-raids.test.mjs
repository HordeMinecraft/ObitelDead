import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {api} from '../worker.js';
import {freshSave,stats,migrateSave} from '../balance.js';

function database(){const sqlite=new DatabaseSync(':memory:');sqlite.exec(readFileSync(new URL('../drizzle/0000_noisy_old_lace.sql',import.meta.url),'utf8'));return {sqlite,prepare(sql){return {bind(...params){return {async first(){return sqlite.prepare(sql).get(...params)||null},async run(){return {meta:{changes:Number(sqlite.prepare(sql).run(...params).changes)}}}}}}}}}
const request=(cookie,path,data)=>new Request('https://beta.example/api/'+path,{method:data===undefined?'GET':'POST',headers:{cookie:'obitel_session='+cookie,origin:'https://beta.example'},body:data===undefined?undefined:JSON.stringify(data)});

import {RARE_RAIDS,raidReward,raidHit} from '../rare-raids.js';
import {xpForLevel} from '../balance.js';
const veteran=()=>({name:'Участник',save:{...freshSave(),xp:xpForLevel(500),districtRuns:Array(8).fill(3),cleared:[0,1,2,3,4,5,6,7]}});
const seed=(DB,world)=>DB.sqlite.prepare('INSERT INTO game_world VALUES (?,?,0)').run('beta',JSON.stringify(world));
test('rare creation is gated, distinct from normal and supports ten billion HP',async()=>{
 const DB=database(),uid='a'.repeat(32);seed(DB,{players:{[uid]:veteran()},raids:{}});
 const call=async body=>{const r=await api(request(uid,'raids',body),{DB});assert.equal(r.status,200);return (await r.json()).raid;};
 const normal=await call({map:7}),rare=await call({map:7,rare:true});assert.notEqual(normal.id,rare.id);assert.equal(rare.hp,10_000_000_000);assert.equal((await call({map:7,rare:true})).id,rare.id);
 const hit=await api(request(uid,'raids/'+rare.id+'/attack',{}),{DB});const data=await hit.json();assert.equal(data.raid.hp,rare.hp-raidHit(veteran().save,7,true));assert.equal(data.save.energy,48);
 assert.equal((await api(request(uid,'raids/'+rare.id+'/attack',{}),{DB})).status,400);
 assert.equal((await api(request(uid,'raids',{map:0,rare:'yes'}),{DB})).status,400);
 const world=JSON.parse(DB.sqlite.prepare('SELECT data FROM game_world').get().data);world.players[uid].save.xp=0;DB.sqlite.prepare('UPDATE game_world SET data=?').run(JSON.stringify(world));
 assert.equal((await api(request(uid,'raids',{map:0,rare:true}),{DB})).status,400);DB.sqlite.close();
});
test('300 participants allowed, concurrent overflow rejected, membership idempotent',async()=>{
 const DB=database(),rid='f'.repeat(12),players={},members={};for(let i=1;i<=301;i++){const uid=i.toString(16).padStart(32,'0');players[uid]=veteran();if(i<=299)members[uid]={damage:0,nextAttack:0};}
 seed(DB,{players,raids:{[rid]:{id:rid,map:0,rare:true,hp:1e6,maxHp:1e6,owner:Object.keys(players)[0],members}}});
 const ids=Object.keys(players),responses=await Promise.all(ids.slice(299).map(uid=>api(request(uid,'raids/'+rid+'/join',{}),{DB})));
 assert.deepEqual(responses.map(r=>r.status).sort(),[200,400]);
 const again=await api(request(ids[0],'raids/'+rid+'/join',{}),{DB});assert.equal(again.status,200);assert.equal((await again.json()).raid.members.length,300);DB.sqlite.close();
});
test('rare reward uses damage share, cannot be claimed twice and does not unlock campaign',async()=>{
 const DB=database(),uid='a'.repeat(32),rid='b'.repeat(12),p=veteran();p.save.cleared=[0];
 seed(DB,{players:{[uid]:p},raids:{[rid]:{id:rid,map:7,rare:true,hp:0,maxHp:1e10,members:{[uid]:{damage:1e8,claimed:false}}}}});
 const response=await api(request(uid,'raids/'+rid+'/claim',{}),{DB}),data=await response.json();assert.equal(response.status,200);assert.equal(data.save.scrap,p.save.scrap+2000);assert.equal(data.save.xp,p.save.xp+12000);assert.deepEqual(data.save.cleared,[0]);
 assert.equal((await api(request(uid,'raids/'+rid+'/claim',{}),{DB})).status,400);DB.sqlite.close();
});
test('rare pools are bounded across 300 shares and no contribution earns nothing',()=>{
 for(const profile of RARE_RAIDS){const r={map:profile.map,rare:true,maxHp:profile.hp};const amounts=Array(299).fill(Math.floor(profile.hp/300));amounts.push(profile.hp-amounts.reduce((a,b)=>a+b,0));for(const key of Object.keys(profile.pool)){const sum=amounts.reduce((a,d)=>a+raidReward(r,d)[key],0);assert.ok(sum<=profile.pool[key]);assert.ok(sum>=profile.pool[key]-300);}assert.deepEqual(raidReward(r,0),{scrap:0,xp:0,cores:0,cloth:0});}
});
