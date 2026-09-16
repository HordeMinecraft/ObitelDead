import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createService} from '../raid-service.js';
import {freshSave} from '../balance.js';

test('online counter and leaderboard expose public data only',async t=>{
 const dir=mkdtempSync(join(tmpdir(),'obitel-online-'));t.after(()=>rmSync(dir,{recursive:true,force:true}));
 const a='a'.repeat(32),b='b'.repeat(32);const sa={...freshSave(),xp:900,kills:50,bossKills:2},sb={...freshSave(),xp:100,kills:5};
 writeFileSync(join(dir,'world.json'),JSON.stringify({players:{[a]:{name:'Альфа',save:sa,lastSeen:Date.now()},[b]:{name:'Бета',save:sb,lastSeen:Date.now()-999999}},raids:{}}));
 const service=createService(dir),server=http.createServer((req,res)=>service(req,res,new URL(req.url,'http://localhost')));await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(()=>new Promise(r=>server.close(r)));const base='http://127.0.0.1:'+server.address().port;
 const call=async(player,path,data)=>{const r=await fetch(base+'/api/'+path,{method:data===undefined?'GET':'POST',headers:{cookie:'obitel_session='+player,...(data===undefined?{}:{'Content-Type':'application/json'})},body:data===undefined?undefined:JSON.stringify(data)});return r.json()};
 const online=await call(a,'online');assert.equal(online.online,1);
 const board=await call(a,'leaderboard');assert.equal(board.players[0].name,'Альфа');assert.equal(board.players[0].rank,1);assert.ok(!JSON.stringify(board).includes(a));
 await call(b,'online/ping',{});const after=await call(a,'online');assert.equal(after.online,2);
});
