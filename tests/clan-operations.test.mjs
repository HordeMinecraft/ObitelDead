import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {api} from '../worker.js';
import {freshSave,xpForLevel,stats} from '../balance.js';
import {CLAN_BOSSES,clanReward,clanVictory} from '../clan-progress.js';
const a='a'.repeat(32),b='b'.repeat(32),out='c'.repeat(32),code='d'.repeat(12);
function fixture(){
 const sql=new DatabaseSync(':memory:');sql.exec(readFileSync(new URL('../drizzle/0000_noisy_old_lace.sql',import.meta.url),'utf8'));
 const player=(u,name)=>({name,publicId:u.slice(0,12),save:{...freshSave(),xp:xpForLevel(25),districtRuns:[3,0,0,0,0,0,0,0]}});
 const world={players:{[a]:player(a,'Глава'),[b]:player(b,'Боец'),[out]:player(out,'Другой клан')},raids:{},clans:{[code]:{code,name:'Север',owner:a,members:[a,b],requests:[],created:1}}};
 sql.prepare('INSERT INTO game_world VALUES (?,?,0)').run('beta',JSON.stringify(world));
 const DB={prepare(text){return {bind(...values){return {async first(){return sql.prepare(text).get(...values)||null},async run(){return {meta:{changes:Number(sql.prepare(text).run(...values).changes)}}}}}}}};
 return {sql,env:{DB},read:()=>JSON.parse(sql.prepare('SELECT data FROM game_world').get().data),edit(fn){const w=this.read();fn(w);sql.prepare('UPDATE game_world SET data=?').run(JSON.stringify(w));}};
}
async function call(f,u,path,body){const r=await api(new Request('https://beta.example/api/'+path,{method:body===undefined?'GET':'POST',headers:{cookie:'obitel_session='+u,origin:'https://beta.example'},body:body===undefined?undefined:JSON.stringify(body)}),f.env);return {status:r.status,...await r.json()};}
async function start(f,boss='depot'){const r=await call(f,a,'clans/boss',{boss});assert.equal(r.status,200);return r.clan.raids.find(r=>r.clan).id;}
async function defeat(f,rid){
 await call(f,b,'raids/'+rid+'/join',{});
 for(let i=0;i<100;i++){
  f.edit(w=>{for(const u of [a,b]){w.players[u].save.energy=60;w.raids[rid].members[u].nextAttack=0;}});
  const replies=await Promise.all([a,b].map(u=>call(f,u,'raids/'+rid+'/attack',{style:'gun'})));
  if(f.read().raids[rid].hp===0)return replies;
 }
 assert.fail('Fixture boss not defeated');
}
test('clan operations are leader-only, gated and exclusive with ordinary and other clan bosses',async t=>{
 const f=fixture();t.after(()=>f.sql.close());
 assert.equal((await call(f,b,'clans/boss',{boss:'depot'})).status,403);
 assert.equal((await call(f,a,'clans/boss',{boss:'ash'})).status,400);
 const results=await Promise.all([call(f,a,'clans/boss',{boss:'depot'}),call(f,a,'clans/boss',{boss:'depot'})]);assert.deepEqual(results.map(r=>r.status).sort(),[200,409]);
 const rid=results.find(r=>r.status===200).clan.raids[0].id;
 assert.equal(Object.keys(f.read().raids).length,1);
 assert.equal((await call(f,a,'raids',{map:0})).status,409);
 for(const route of ['', '/join','/attack','/claim'])assert.equal((await call(f,out,'raids/'+rid+route,route?{}:undefined)).status,403);
 f.edit(w=>w.players[b].save.xp=0);assert.equal((await call(f,b,'raids/'+rid+'/join',{})).status,403);
 assert.equal((await call(f,a,'clans/leave',{})).status,409);
 const publicRaid=(await call(f,a,'raids/'+rid)).raid;assert.equal(publicRaid.capacity,20);assert.equal(publicRaid.arenaVersion,0);assert.equal(publicRaid.clanBoss.name,CLAN_BOSSES[0].name);
 assert.equal((await call(f,a,'raids/'+rid+'/attack',{arena:'start'})).status,400);
});
test('two members preserve all shared damage under concurrent attacks; clan bank pays exactly once',async t=>{
 const f=fixture();t.after(()=>f.sql.close());const rid=await start(f);await call(f,b,'raids/'+rid+'/join',{});
 const first=await Promise.all([a,b].map(u=>call(f,u,'raids/'+rid+'/attack',{})));assert.deepEqual(first.map(r=>r.status),[200,200]);
 let world=f.read(),r=world.raids[rid];assert.equal(r.hp,r.maxHp-first[0].damage-first[1].damage);assert.equal((await call(f,a,'raids/'+rid)).raid.hp,r.hp);
 await defeat(f,rid);world=f.read();r=world.raids[rid];assert.equal(r.hp,0);assert.equal(r.members[a].damage+r.members[b].damage,r.maxHp);
 assert.equal(world.clans[code].progress.marks,40);assert.equal(world.clans[code].progress.wins,1);assert.equal(world.clans[code].progress.damage,12000);
 clanVictory(world,r);clanVictory(world,r);assert.equal(world.clans[code].progress.marks,40);
 const beforeA=world.players[a].save,expectedA=clanReward(r,r.members[a].damage),expectedB=clanReward(r,r.members[b].damage);
 const rewards=await Promise.all([call(f,a,'raids/'+rid+'/claim',{}),call(f,b,'raids/'+rid+'/claim',{})]);assert.deepEqual(rewards.map(r=>r.status),[200,200]);assert.equal(rewards[0].save.scrap,beforeA.scrap+expectedA.scrap);assert.equal(rewards[0].save.clanBossKills,1);assert.deepEqual(rewards[0].save.cleared,[]);
 for(const key of Object.keys(CLAN_BOSSES[0].pool))assert.ok(expectedA[key]+expectedB[key]<=CLAN_BOSSES[0].pool[key]);
 assert.equal((await call(f,a,'raids/'+rid+'/claim',{})).status,400);assert.equal(f.read().clans[code].progress.marks,40);
 assert.ok((await call(f,a,'profile')).medals.find(m=>m.id==='clan-victor').earned);
 const next=await start(f,'ash');assert.equal(f.read().clans[code].progress.marks,0);assert.equal(f.read().raids[next].maxHp,75000);assert.equal((await call(f,a,'clans/boss',{boss:'ash'})).status,409);assert.equal(f.read().clans[code].progress.marks,0);
});
test('clan board accepts earned medals only; public dossier exposes real stats and no private identity',async t=>{
 const f=fixture();t.after(()=>f.sql.close());
 assert.equal((await call(f,a,'clans/display',{medals:['first']})).status,400);
 f.edit(w=>{w.clans[code].progress={marks:40,wins:1,damage:12000,targets:['depot'],roster:5};w.players[b].save.kills=100;w.players[b].save.clanBossKills=1;});
 assert.equal((await call(f,b,'clans/display',{medals:['first']})).status,403);
 assert.equal((await call(f,a,'clans/display',{medals:['squad','first']})).status,200);
 assert.equal((await call(f,b,'profile/medals',{medals:['clan-victor','hunter-100']})).status,200);
 const before=JSON.stringify(f.read().players[b].save);
 const dossier=await call(f,out,'players/'+b.slice(0,12));assert.equal(dossier.status,200);assert.equal(dossier.player.clan.name,'Север');assert.equal(dossier.player.stats.health,stats(f.read().players[b].save).hp);assert.deepEqual(dossier.player.display.map(m=>m.id).sort(),['clan-victor','hunter-100']);assert.equal(dossier.player.clan.medals.length,2);
 assert.ok(!JSON.stringify(dossier.player).includes(b));assert.ok(!('save'in dossier.player));assert.ok(!('vkUserId'in dossier.player));assert.equal(JSON.stringify(f.read().players[b].save),before);
 assert.equal((await call(f,out,'players/'+'f'.repeat(12))).status,404);
 for(const medals of [['level-500'],['clan-victor','clan-victor'],['clan-victor','hunter-100','first-boss','level-25']])assert.equal((await call(f,b,'profile/medals',{medals})).status,400);
 assert.deepEqual(f.read().players[b].save.displayMedals,['clan-victor','hunter-100']);
});
test('ordinary boss remains independent of clan bank and prevents a parallel clan operation',async t=>{
 const f=fixture();t.after(()=>f.sql.close());const normal=await call(f,a,'raids',{map:0});assert.equal(normal.status,200);
 assert.equal((await call(f,a,'clans/boss',{boss:'depot'})).status,409);assert.equal((await call(f,a,'clans')).clan.progress.marks,0);
 f.edit(w=>{w.raids[normal.raid.id].hp=0;});assert.equal((await call(f,a,'clans')).clan.progress.wins,0);
 const rid=await start(f);const ordinary=await call(f,out,'raids',{map:0});assert.equal(ordinary.status,200);assert.notEqual(ordinary.raid.id,rid);assert.equal(ordinary.raid.clanBoss,null);
});
test('earned clan reward survives leaving after victory, and does not grant clan access afterward',async t=>{
 const f=fixture();t.after(()=>f.sql.close());const rid=await start(f);await defeat(f,rid);
 assert.equal((await call(f,b,'clans/leave',{})).status,200);
 assert.equal((await call(f,b,'raids/'+rid)).status,200);assert.equal((await call(f,b,'raids/'+rid+'/claim',{})).status,200);
 assert.equal((await call(f,b,'raids/'+rid+'/claim',{})).status,400);
 const next=await start(f,'ash');assert.equal((await call(f,b,'raids/'+next)).status,403);
});
