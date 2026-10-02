import test from 'node:test';
import assert from 'node:assert/strict';
import {campaignState,milestoneView,claimMilestone,MILESTONES} from '../campaign.js';
import {operationView,claimOperation} from '../operations.js';
import {freshSave,xpForLevel} from '../balance.js';
import {createHandler} from '../domain.js';
test('campaign distinguishes level gates, three clearances, boss victory and full completion',()=>{
 const s=freshSave();let c=campaignState(s);assert.equal(c.next.index,0);assert.equal(c.action,'sortie');s.districtRuns[0]=3;c=campaignState(s);assert.equal(c.action,'boss');s.cleared=[0,0,99];c=campaignState(s);assert.equal(c.completed,1);assert.equal(c.next.index,1);assert.equal(c.action,'sortie');s.districtRuns[1]=3;assert.equal(campaignState(s).action,'level');s.xp=xpForLevel(2);assert.equal(campaignState(s).action,'boss');s.cleared=[0,1,2,3,4,5,6,7];c=campaignState(s);assert.equal(c.percent,100);assert.equal(c.next,null);assert.equal(c.action,'campaign-complete');
});
test('milestone rewards persist past midnight and cannot be claimed twice or before completion',()=>{
 const p={save:freshSave()},before=p.save.xp;assert.throws(()=>claimOperation(p,'milestone:first-sortie'),{status:400});p.save.districtRuns[0]=1;claimOperation(p,'milestone:first-sortie',0);assert.equal(p.save.cloth,1);assert.equal(p.save.xp,before);assert.equal(operationView(p,86400000).milestones.find(m=>m.id==='first-sortie').claimed,true);assert.throws(()=>claimOperation(p,'milestone:first-sortie',86400000),{status:400});assert.throws(()=>claimMilestone(p.save,'invented'),{status:400});
});
test('duplicate or invalid equipment and districts cannot unlock collection achievements',()=>{
 const s=freshSave();s.owned=[0,0,0,99];s.ownedArmor=[0,0,0,-1];s.cleared=[0,0,0,999];const rows=milestoneView(s);assert.equal(rows.find(m=>m.id==='arsenal-3').progress,1);assert.equal(rows.find(m=>m.id==='armor-3').progress,1);assert.equal(rows.find(m=>m.id==='districts-3').progress,1);
 const budget=MILESTONES.reduce((sum,m)=>{assert.equal(m.reward.xp,undefined);for(const [key,n]of Object.entries(m.reward)){assert.ok(Number.isInteger(n)&&n>0);sum[key]=(sum[key]||0)+n}return sum},{});assert.ok(budget.scrap<=1500&&budget.cloth<=50&&budget.cores<=20);
});
test('parallel requests award a milestone once, ignore forged progress and expose persisted claims to another handler',async()=>{
 const uid='d'.repeat(32),save=freshSave(),db={players:{[uid]:{name:'Test',save}},raids:{}};save.districtRuns[0]=1;const handle=createHandler(db,()=>{},()=>crypto.randomUUID().replaceAll('-',''));
 async function call(handler,method,path,body={}){let status,data;const req={method,headers:{cookie:'obitel_session='+uid},async *[Symbol.asyncIterator](){yield JSON.stringify(body)}};await handler(req,{writeHead(n){status=n},end(v){data=JSON.parse(v)}},new URL('https://test/api/'+path));return {status,data}}
 const results=await Promise.all([call(handle,'POST','operations/claim',{id:'milestone:first-sortie'}),call(handle,'POST','operations/claim',{id:'milestone:first-sortie'})]);assert.deepEqual(results.map(r=>r.status).sort(),[200,400]);assert.equal(save.cloth,1);
 const forged=await call(handle,'POST','operations/claim',{id:'milestone:level-500',level:500,kills:999999,progress:500});assert.equal(forged.status,400);assert.equal(save.cores,0);
 const other=createHandler(db,()=>{},()=>crypto.randomUUID().replaceAll('-',''));const view=await call(other,'GET','operations');assert.equal(view.status,200);assert.equal(view.data.milestones.find(m=>m.id==='first-sortie').claimed,true);assert.equal(view.data.save.cloth,1);
});
