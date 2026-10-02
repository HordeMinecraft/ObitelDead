import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {api} from '../worker.js';
import {freshSave,WEAPONS,raidDamage} from '../balance.js';
import {raidHit,raidReward} from '../rare-raids.js';
import {ARENA,arenaContract,arenaContribution,arenaStrike,strikeContains,updateArenaBoss} from '../boss-arena.js';

const a='a'.repeat(32),b='b'.repeat(32),rid='f'.repeat(12);
const player=()=>({name:'Тест',save:{...freshSave(),districtRuns:[3,0,0,0,0,0,0,0]},activeRaid:rid});
function fixture(){
 const sql=new DatabaseSync(':memory:');sql.exec(readFileSync(new URL('../drizzle/0000_noisy_old_lace.sql',import.meta.url),'utf8'));
 const world={players:{[a]:player(),[b]:player()},raids:{[rid]:{id:rid,map:0,hp:750,maxHp:750,owner:a,created:1,members:{[a]:{damage:0,nextAttack:0},[b]:{damage:0,nextAttack:0}}}}};
 sql.prepare('INSERT INTO game_world VALUES (?,?,0)').run('beta',JSON.stringify(world));
 const DB={prepare(text){return {bind(...values){return {async first(){return sql.prepare(text).get(...values)||null},async run(){return {meta:{changes:Number(sql.prepare(text).run(...values).changes)}}}}}}}};
 return {sql,DB,read:()=>JSON.parse(sql.prepare('SELECT data FROM game_world').get().data),edit(fn){const w=this.read();fn(w);sql.prepare('UPDATE game_world SET data=?').run(JSON.stringify(w));}};
}
async function call(f,uid,input,path='raids/'+rid+'/attack'){
 const response=await api(new Request('https://beta.example/api/'+path,{method:'POST',headers:{cookie:'obitel_session='+uid,origin:'https://beta.example'},body:JSON.stringify(input)}),{DB:f.DB});return {status:response.status,...await response.json()};
}
test('arena contribution is capped for every weapon and rare boss, including forged elapsed damage',()=>{
 for(let weapon=0;weapon<WEAPONS.length;weapon++)for(let map=0;map<8;map++)for(const rare of [false,true]){
  const s={...freshSave(),weapon},c=arenaContract(s,map,rare);assert.equal(c.cap,Math.floor(raidHit(s,map,rare)*1.2));
  assert.equal(arenaContribution(c,1e15,30),c.cap);assert.ok(arenaContribution(c,1e15,1)<c.cap);assert.equal(arenaContribution(c,0,30),0);
  assert.equal(arenaContribution(c,NaN,30),0);assert.equal(arenaContribution(c,-1,30),0);assert.equal(arenaContribution(c,100,.1),0);
  assert.equal(c.rate,raidDamage(s)/5);
 }
});
test('danger zones match the drawn ellipse; enrage exposes two zones and recovery opens a damage window',()=>{
 const strike=arenaStrike(22,450,420);assert.equal(strike.zones.length,2);assert.equal(strikeContains(strike.zones[0],450,420),true);assert.equal(strikeContains(strike.zones[0],450,465),false);
 const run={time:5,x:400,y:410,hp:110,maxHp:110,hits:0,invulnerable:0},boss={x:600,y:410,cd:0,flash:0,damage:20,attack:null};
 updateArenaBoss(run,boss,.01);assert.ok(boss.attack);updateArenaBoss(run,boss,1.5);assert.equal(run.hp,90);assert.equal(run.hits,1);assert.ok(boss.exposedUntil>run.time);
 run.hp=110;run.invulnerable=.5;boss.attack=arenaStrike(5,400,410);updateArenaBoss(run,boss,1.5);assert.equal(run.hp,110);
});
test('arena start charges once, reuses the pending ticket, and prevents overlapping paid actions',async t=>{
 const f=fixture();t.after(()=>f.sql.close());
 const first=await call(f,a,{arena:'start'});assert.equal(first.status,200);assert.equal(first.save.energy,48);assert.equal(first.raid.hp,750);
 const again=await call(f,a,{arena:'start'});assert.equal(again.arena.id,first.arena.id);assert.equal(again.save.energy,48);
 assert.equal((await call(f,a,{})).status,409);assert.equal((await call(f,a,{map:0},'run/start')).status,409);
 assert.equal((await call(f,b,{arena:'finish',ticket:first.arena.id,damage:1000})).status,409);
 f.edit(w=>w.players[a].save.weaponLevel=10);assert.equal((await call(f,a,{arena:'start'})).arena.contract.cap,first.arena.contract.cap,'gear changes do not raise the issued cap');
});
test('two simultaneous arena finishes preserve both shared contributions, and replay never pays twice',async t=>{
 const f=fixture();t.after(()=>f.sql.close());const starts=await Promise.all([a,b].map(uid=>call(f,uid,{arena:'start'})));
 f.edit(w=>{for(const uid of [a,b])w.players[uid].arenaTicket.started-=31000;});
 const replies=await Promise.all([a,b].map((uid,i)=>call(f,uid,{arena:'finish',ticket:starts[i].arena.id,damage:starts[i].arena.contract.target})));
 assert.deepEqual(replies.map(r=>r.status),[200,200]);const sum=replies.reduce((n,r)=>n+r.damage,0),w=f.read();assert.equal(w.raids[rid].hp,750-sum);assert.equal(w.raids[rid].members[a].damage+w.raids[rid].members[b].damage,sum);
 const replay=await call(f,a,{arena:'finish',ticket:starts[0].arena.id,damage:1e12});assert.equal(replay.damage,replies[0].damage);assert.equal(f.read().raids[rid].hp,750-sum);assert.equal(replay.save.energy,48);assert.equal(replay.save.xp,0);assert.equal(replay.save.kills,0);assert.equal(replay.save.scrap,180);
});
test('an ally finishing the boss refunds an unfinished arena once, even after another boss activates',async t=>{
 const f=fixture();t.after(()=>f.sql.close());const start=await call(f,a,{arena:'start'});
 f.edit(w=>{w.raids[rid].hp=0;w.players[a].activeRaid='e'.repeat(12);w.raids['e'.repeat(12)]={id:'e'.repeat(12),map:1,hp:100,maxHp:100,owner:a,created:2,members:{[a]:{damage:0,nextAttack:0}}};});
 const finish=await call(f,a,{arena:'finish',ticket:start.arena.id,damage:100});assert.equal(finish.status,200);assert.equal(finish.refunded,true);assert.equal(finish.damage,0);assert.equal(finish.save.energy,60);
 const again=await call(f,a,{arena:'finish',ticket:start.arena.id,damage:100});assert.equal(again.save.energy,60);assert.equal(f.read().raids[rid].members[a].damage,0);
});
test('malformed or expired reports cannot mutate the raid or consume a valid ticket',async t=>{
 const f=fixture();t.after(()=>f.sql.close());const start=await call(f,a,{arena:'start'});
 for(const damage of [-1,'100',null])assert.equal((await call(f,a,{arena:'finish',ticket:start.arena.id,damage})).status,400);
 assert.equal(f.read().raids[rid].hp,750);assert.equal(f.read().players[a].arenaTicket.id,start.arena.id);
 f.edit(w=>w.players[a].arenaTicket.expires=1);assert.equal((await call(f,a,{arena:'finish',ticket:start.arena.id,damage:100})).status,409);
 assert.equal(f.read().raids[rid].hp,750);
});
test('normal boss rewards scale with actual participation and the combined budget stays bounded',()=>{
 for(let map=0;map<8;map++){
  const r={map,maxHp:100000},full=raidReward(r,25000),shares=Array(300).fill(Math.floor(r.maxHp/300));shares[299]+=r.maxHp-shares.reduce((a,b)=>a+b,0);
  assert.deepEqual(raidReward(r,0),{scrap:0,xp:0,cores:0,cloth:0});assert.equal(raidReward(r,1).cores,0);assert.ok(raidReward(r,12500).scrap<=full.scrap/2);
  for(const key of Object.keys(full))assert.ok(shares.reduce((sum,d)=>sum+raidReward(r,d)[key],0)<=full[key]*4);
 }
});

test('reconnecting after an ally victory restores the unused arena energy exactly once',async t=>{
 const f=fixture();t.after(()=>f.sql.close());await call(f,a,{arena:'start'});f.edit(w=>w.raids[rid].hp=0);
 const get=async()=>{const response=await api(new Request('https://beta.example/api/raids',{headers:{cookie:'obitel_session='+a,origin:'https://beta.example'}}),{DB:f.DB});return response.json()};
 const first=await get();assert.equal(first.save.energy,60);assert.equal(first.active,null);assert.equal(f.read().players[a].arenaTicket,null);
 const second=await get();assert.equal(second.save.energy,60);assert.equal(f.read().raids[rid].hp,0);
});
