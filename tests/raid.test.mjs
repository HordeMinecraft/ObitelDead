import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {mkdtempSync,readFileSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,dirname,basename} from 'node:path';
import {createService} from '../raid-service.js';
import {freshSave} from '../balance.js';

test('two independent players share boss damage; cooldown, energy, rewards and persistence are enforced',async t=>{
 const dir=mkdtempSync(join(tmpdir(),'obitel-raid-test-'));t.after(()=>{assert.equal(dirname(dir),tmpdir());assert.ok(basename(dir).startsWith('obitel-raid-test-'));rmSync(dir,{recursive:true})});
 const a='a'.repeat(32),b='b'.repeat(32),c='c'.repeat(32);const profile=()=>({name:'Тестовый выживший',save:{...freshSave(),districtRuns:[3,0,0,0,0]},ticket:null});let db={players:{[a]:profile(),[b]:profile(),[c]:{name:'Новичок',save:freshSave()}},raids:{}};writeFileSync(join(dir,'world.json'),JSON.stringify(db));
 let service=createService(dir);const server=http.createServer((req,res)=>service(req,res,new URL(req.url,'http://localhost')));await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));t.after(()=>new Promise(resolve=>server.close(resolve)));let url='http://127.0.0.1:'+server.address().port;
 async function call(player,path,data){let r=await fetch(url+'/api/'+path,{method:data===undefined?'GET':'POST',headers:{cookie:'obitel_session='+player,...(data===undefined?{}:{'Content-Type':'application/json'})},body:data===undefined?undefined:JSON.stringify(data)});return {status:r.status,...await r.json()}}
 assert.equal((await call(c,'raids',{map:0})).status,400);
 const created=await call(a,'raids',{map:0}),rid=created.raid.id;assert.equal(created.raid.hp,750);
 assert.equal((await call(b,'raids/'+rid+'/attack',{})).status,400);
 await call(b,'raids/'+rid+'/join',{});let first=await call(a,'raids/'+rid+'/attack',{});assert.equal(first.damage,229);assert.equal(first.raid.hp,521);assert.equal(first.save.energy,48);
 assert.equal((await call(a,'raids/'+rid+'/attack',{})).status,400);
 let second=await call(b,'raids/'+rid+'/attack',{});assert.equal(second.raid.hp,292);assert.equal((await call(a,'raids/'+rid)).raid.hp,292);
 service=createService(dir);assert.equal((await call(a,'raids/'+rid)).raid.hp,292,'state survives service restart');
 assert.equal((await call(a,'raids/'+rid+'/claim',{})).status,400,'cannot claim while boss alive');
 // Advance only the fixture cooldown, reload the service, and finish the shared fight.
 db=JSON.parse(readFileSync(join(dir,'world.json'),'utf8'));db.raids[rid].members[a].nextAttack=0;db.raids[rid].members[b].nextAttack=0;writeFileSync(join(dir,'world.json'),JSON.stringify(db));service=createService(dir);
 let third=await call(a,'raids/'+rid+'/attack',{});assert.equal(third.raid.hp,63);let final=await call(b,'raids/'+rid+'/attack',{});assert.equal(final.damage,63);assert.equal(final.raid.hp,0);assert.equal((await call(b,'raids/'+rid+'/attack',{})).status,400);
 let rewardA=await call(a,'raids/'+rid+'/claim',{}),rewardB=await call(b,'raids/'+rid+'/claim',{});assert.equal(rewardA.save.cores,3);assert.equal(rewardB.save.cores,3);assert.deepEqual(rewardA.save.cleared,[0]);assert.equal((await call(a,'raids/'+rid+'/claim',{})).status,400);
 // Mission token is single-use and retries return the same result without another grant.
 let start=await call(a,'run/start',{map:0});let end=await call(a,'run/end',{ticket:start.ticket,win:false,kills:3,loot:24});let retry=await call(a,'run/end',{ticket:start.ticket,win:false,kills:3,loot:24});assert.equal(retry.save.scrap,end.save.scrap);assert.equal(retry.reward,end.reward);
});
