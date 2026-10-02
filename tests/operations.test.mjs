import test from 'node:test';
import assert from 'node:assert/strict';
import {sortiePlan,sortieEnemy,sortiePayout,operationState,operationView,claimOperation,moscowDay} from '../operations.js';
import {freshSave,xpForLevel,expeditionReward} from '../balance.js';
import {createHandler} from '../domain.js';
const veteran=()=>({...freshSave(),xp:xpForLevel(5),cleared:[0,1]});
test('sorties enforce level gates and stable day/map conditions',()=>{
 assert.throws(()=>sortiePlan(freshSave(),0,'siege'),{status:400});assert.throws(()=>sortiePlan(veteran(),0,'invented'),{status:400});
 for(let day=0;day<4;day++)assert.equal(sortiePlan(veteran(),0,'standard',day*86400000).condition.id,'quiet');
 const p=sortiePlan(veteran(),1,'siege',0),next=sortiePlan(veteran(),1,'siege',86400000);assert.notEqual(p.condition.id,next.condition.id);
 assert.equal(sortieEnemy({hp:100,speed:100},'walker',p).hp,140);assert.ok(sortiePayout(p,false).reward<=1);assert.equal(sortiePayout(p,true).reward,1.65);
});
test('daily contract claims are gated, single-use and reset at Moscow midnight',()=>{
 const p={save:veteran()},time=Date.UTC(2026,9,2,20,59,59);const s=operationState(p,time);s.wins=2;s.maps=[0,1];s.attacks=1;
 const scrap=p.save.scrap;claimOperation(p,'supply',time);assert.equal(p.save.scrap,scrap+35);assert.throws(()=>claimOperation(p,'supply',time),{status:400});
 const next=operationView(p,time+1000);assert.ok(next.contracts.every(x=>x.progress===0&&!x.claimed));assert.equal(next.resetsAt,(moscowDay(time+1000)+1)*86400000-10800000);
 const novice={save:freshSave()};operationState(novice,time).wins=10;assert.throws(()=>claimOperation(novice,'supply',time),{status:400});
});
test('server snapshots sortie price and rewards and ignores forged finish mode',async()=>{
 const uid='a'.repeat(32),db={players:{[uid]:{name:'Test',save:veteran()}},raids:{}};const handle=createHandler(db,()=>{},()=>crypto.randomUUID().replaceAll('-',''));
 async function call(path,body){let status,data;const req={method:'POST',headers:{cookie:'obitel_session='+uid},async *[Symbol.asyncIterator](){yield JSON.stringify(body)}};await handle(req,{writeHead(n){status=n},end(v){data=JSON.parse(v)}},new URL('https://test/api/'+path));return {status,data}}
 let reply=await call('run/start',{map:0,mode:'invented'});assert.equal(reply.status,400);assert.equal(db.players[uid].save.energy,60);
 reply=await call('run/start',{map:0,mode:'scout'});assert.equal(reply.status,200);assert.equal(reply.data.save.energy,54);assert.equal(reply.data.plan.id,'scout');
 db.players[uid].ticket.started-=20000;const ticket=reply.data.ticket;
 reply=await call('run/end',{ticket,kills:27,loot:99999,win:true,mode:'siege'});assert.equal(reply.status,200);assert.equal(reply.data.reward,expeditionReward(0,27,99999,true,.65));assert.equal(operationState(db.players[uid]).wins,1);
 const xp=reply.data.save.xp;reply=await call('run/end',{ticket,kills:27,loot:99999,win:true});assert.equal(reply.data.save.xp,xp);assert.equal(operationState(db.players[uid]).wins,1);
});
