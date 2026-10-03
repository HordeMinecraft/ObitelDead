import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash,createHmac} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {api} from '../worker.js';
import {freshSave,WEAPONS,raidProfile} from '../balance.js';
import {raidHit} from '../rare-raids.js';
import {RAID_ATTACKS,raidAttackPlan} from '../raid-attacks.js';
import {verifyPayment} from '../vk-payments.js';
const a='a'.repeat(32),b='b'.repeat(32),rid='f'.repeat(12),secret='fixture-payment-key';
function fixture(){
 const sql=new DatabaseSync(':memory:');sql.exec(readFileSync(new URL('../drizzle/0000_noisy_old_lace.sql',import.meta.url),'utf8'));
 const player=user=>({name:'Тест оплаты',vkUserId:user,save:{...freshSave(),districtRuns:[3,0,0,0,0,0,0,0]},activeRaid:rid});
 const world={vkAccounts:{1001:a,1002:b},players:{[a]:player('1001'),[b]:player('1002')},raids:{[rid]:{id:rid,map:0,hp:750,maxHp:750,owner:a,created:1,members:{[a]:{damage:0,nextAttack:0},[b]:{damage:0,nextAttack:0}}}}};
 sql.prepare('INSERT INTO game_world VALUES (?,?,0)').run('beta',JSON.stringify(world));
 const DB={prepare(text){return {bind(...values){return {async first(){return sql.prepare(text).get(...values)||null},async run(){return {meta:{changes:Number(sql.prepare(text).run(...values).changes)}}}}}}}};
 return {sql,env:{DB,VK_APP_SECRET:secret,VK_PAYMENTS_MODE:'live'},read:()=>JSON.parse(sql.prepare('SELECT data FROM game_world').get().data),edit(fn){const w=this.read();fn(w);sql.prepare('UPDATE game_world SET data=?').run(JSON.stringify(w));}};
}
const input=(order=1,extra={})=>({app_id:'54626490',user_id:'1001',receiver_id:'1001',order_id:String(order),notification_type:'order_status_change',status:'chargeable',item:'raid_bat_10',item_id:'raid_bat_10',item_price:'3',...extra});
function sign(input){const data={...input};const value=Object.keys(data).sort().map(k=>k+'='+data[k]).join('')+secret;data.sig=createHash('md5').update(value).digest('hex');return new URLSearchParams(data).toString()}
async function callback(f,data){const response=await api(new Request('https://beta.example/api/payments/vk',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:sign(data)}),f.env);return response.json()}
async function attack(f,uid=a,body={},route='raids/'+rid+'/attack'){const response=await api(new Request('https://beta.example/api/'+route,{method:'POST',headers:{cookie:'obitel_session='+uid,origin:'https://beta.example'},body:JSON.stringify(body)}),f.env);return {status:response.status,...await response.json()}}

test('additional strikes supplement equipped gear and retain one capped raid recovery clock',()=>{
 for(let map=0;map<8;map++)for(let weapon=0;weapon<WEAPONS.length;weapon++)for(const rare of [false,true]){
  const save={...freshSave(),weapon,xp:100000};const base=raidHit(save,map,rare);
  for(const style of RAID_ATTACKS){const p=raidAttackPlan(save,map,rare,style.id,100);assert.equal(p.damage,Math.round(base*(1+style.bonus)));assert.equal(p.expected,Math.min(100,p.damage));assert.equal(p.cost,12);assert.equal(p.cooldown,raidProfile(map).cooldown);assert.ok(p.damage<=base*1.7+.5)}
 }
});
test('unknown, unowned, locked and mixed attacks never charge energy or damage shared HP',async t=>{
 const f=fixture();t.after(()=>f.sql.close());f.edit(w=>w.players[a].save.raidCharges.fire=10);
 for(const body of [{style:'cheat',damage:1e10},{style:'bat'},{style:'fire'},{style:'gun',arena:'start'}])assert.equal((await attack(f,a,body)).status,400);
 const w=f.read();assert.equal(w.players[a].save.energy,60);assert.equal(w.players[a].save.raidCharges.fire,10);assert.equal(w.raids[rid].hp,750);
});
test('payment signatures reject forgery, duplicate parameters and another app',()=>{
 const valid=sign(input());assert.equal(verifyPayment(valid,secret).item,'raid_bat_10');
 assert.throws(()=>verifyPayment(valid.replace('item_price=3','item_price=1'),secret));assert.throws(()=>verifyPayment(valid+'&item_price=3',secret));assert.throws(()=>verifyPayment(sign(input(1,{app_id:'1'})),secret));
});
test('get_item returns fixed catalogue price without granting charges',async t=>{
 const f=fixture();t.after(()=>f.sql.close());const result=await callback(f,input(1,{notification_type:'get_item'}));assert.equal(result.response.price,3);assert.equal(result.response.item_id,'raid_bat_10');assert.deepEqual(f.read().players[a].save.raidCharges,{});
 assert.ok((await callback(f,input(2,{item:'unknown'}))).error);assert.ok((await callback(f,input(2,{receiver_id:'1002'}))).error);
});
test('concurrent duplicate confirmed payments grant exactly one pack and stable replies',async t=>{
 const f=fixture();t.after(()=>f.sql.close());const results=await Promise.all([callback(f,input(42)),callback(f,input(42))]);assert.deepEqual(results[0],results[1]);assert.equal(results[0].response.app_order_id,42);assert.equal(f.read().players[a].save.raidCharges.bat,10);
 assert.deepEqual(await callback(f,input(42)),results[0]);assert.equal(f.read().players[a].save.raidCharges.bat,10);
 assert.ok((await callback(f,input(43,{item_price:'1'}))).error);assert.ok((await callback(f,input(42,{user_id:'1002',receiver_id:'1002'}))).error);assert.equal(f.read().players[b].save.raidCharges.bat,undefined);
});
test('two players share actual extra damage, charges are consumed once and all attacks share recovery',async t=>{
 const f=fixture();t.after(()=>f.sql.close());await callback(f,input(1));await callback(f,input(2,{user_id:'1002',receiver_id:'1002',item:'raid_pipe_10',item_id:'raid_pipe_10',item_price:'5'}));
 const replies=await Promise.all([attack(f,a,{style:'bat'}),attack(f,b,{style:'pipe'})]);assert.deepEqual(replies.map(x=>x.status),[200,200]);const total=replies.reduce((sum,x)=>sum+x.damage,0),w=f.read();assert.equal(w.raids[rid].hp,750-total);assert.equal(w.raids[rid].members[a].damage+w.raids[rid].members[b].damage,total);assert.equal(w.players[a].save.raidCharges.bat,9);assert.equal(w.players[b].save.raidCharges.pipe,9);assert.equal(w.players[a].save.energy,48);
 assert.equal((await attack(f,a,{style:'gun'})).status,400);assert.equal((await attack(f,a,{style:'bat'})).status,400);assert.equal(f.read().players[a].save.raidCharges.bat,9);
});
test('a finishing strike is capped at remaining HP, with no XP or duplicate charge on a replay',async t=>{
 const f=fixture();t.after(()=>f.sql.close());await callback(f,input());f.edit(w=>w.raids[rid].hp=20);const result=await attack(f,a,{style:'bat'});assert.equal(result.damage,20);assert.equal(result.raid.hp,0);assert.equal(result.save.raidCharges.bat,9);assert.equal(result.save.xp,0);assert.equal((await attack(f,a,{style:'bat'})).status,400);assert.equal(f.read().players[a].save.raidCharges.bat,9);
});
test('refunds are idempotent, revoke remaining charges and retain spent-charge debt',async t=>{
 const f=fixture();t.after(()=>f.sql.close());await callback(f,input(1));f.edit(w=>w.players[a].save.raidCharges.bat=7);const refund=input(1,{status:'refunded'});const first=await callback(f,refund);assert.equal(f.read().players[a].save.raidCharges.bat,-3);assert.deepEqual(await callback(f,refund),first);await callback(f,input(1));assert.equal(f.read().players[a].save.raidCharges.bat,-3);assert.equal((await attack(f,a,{style:'bat'})).status,400);await callback(f,input(2));assert.equal(f.read().players[a].save.raidCharges.bat,7);
});
test('test purchases remain separate from live charges and disabled payment modes grant nothing',async t=>{
 const f=fixture();t.after(()=>f.sql.close());const data=input(1,{notification_type:'order_status_change_test'});assert.ok((await callback(f,data)).error);f.env.VK_PAYMENTS_MODE='test';assert.ok((await callback(f,input(2))).error);await callback(f,data);assert.equal(f.read().players[a].save.raidTestCharges.bat,10);assert.deepEqual(f.read().players[a].save.raidCharges,{});f.env.VK_PAYMENTS_MODE='live';assert.equal((await attack(f,a,{style:'bat'})).status,400);f.env.VK_PAYMENTS_MODE='off';assert.ok((await callback(f,input(3))).error);
});
test('a concurrent double tap consumes only one paid charge',async t=>{
 const f=fixture();t.after(()=>f.sql.close());await callback(f,input());
 const results=await Promise.all([attack(f,a,{style:'bat'}),attack(f,a,{style:'bat'})]);assert.deepEqual(results.map(r=>r.status).sort(),[200,400]);const world=f.read();assert.equal(world.players[a].save.raidCharges.bat,9);assert.equal(world.players[a].save.energy,48);assert.equal(world.raids[rid].hp,475);
});
test('purchased charges belong to the signed VK account across two device logins',async t=>{
 const f=fixture();t.after(()=>f.sql.close());await callback(f,input());
 const params=new URLSearchParams({vk_app_id:'54626490',vk_ts:String(Math.floor(Date.now()/1000)),vk_user_id:'1001'});params.set('sign',createHmac('sha256',secret).update(params.toString()).digest('base64url'));
 const login=()=>api(new Request('https://beta.example/api/auth/vk',{method:'POST',body:JSON.stringify({launch:params.toString()})}),f.env);
 const [desktop,phone]=await Promise.all([login(),login()]);assert.equal(desktop.headers.get('x-obitel-session'),a);assert.equal(phone.headers.get('x-obitel-session'),a);
 for(const response of [desktop,phone]){const profile=await api(new Request('https://beta.example/api/profile',{headers:{'X-Obitel-Session':response.headers.get('x-obitel-session')}}),f.env);const data=await profile.json();assert.equal(data.account,'vk');assert.equal(data.save.raidCharges.bat,10);}
});
