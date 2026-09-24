import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {api} from '../worker.js';
import {freshSave,stats,migrateSave} from '../balance.js';

function database(){const sqlite=new DatabaseSync(':memory:');sqlite.exec(readFileSync(new URL('../drizzle/0000_noisy_old_lace.sql',import.meta.url),'utf8'));return {sqlite,prepare(sql){return {bind(...params){return {async first(){return sqlite.prepare(sql).get(...params)||null},async run(){return {meta:{changes:Number(sqlite.prepare(sql).run(...params).changes)}}}}}}}}}
const request=(cookie,path,data)=>new Request('https://beta.example/api/'+path,{method:data===undefined?'GET':'POST',headers:{cookie:'obitel_session='+cookie,origin:'https://beta.example'},body:data===undefined?undefined:JSON.stringify(data)});

import {createHmac} from 'node:crypto';
const secret='test-only-secret';
function launch(user,extra={}){const p=new URLSearchParams({vk_app_id:'54626490',vk_user_id:user,vk_ts:String(Math.floor(Date.now()/1000)),...extra});p.sort();p.set('sign',createHmac('sha256',secret).update(p.toString()).digest('base64url'));return p.toString();}
const login=(DB,guest,params,configured=true)=>api(request(guest,'auth/vk',{launch:params}),{DB,...(configured?{VK_APP_SECRET:secret}:{})});
test('two devices with the same signed VK account share progress and inventory',async()=>{
 const DB=database(),a='a'.repeat(32),b='b'.repeat(32);DB.sqlite.prepare('INSERT INTO game_world VALUES (?,?,0)').run('beta',JSON.stringify({players:{[a]:{name:'Ветеран',save:{...freshSave(),xp:9000,scrap:777,ownedVehicles:['nomad','spark'],vehicle:'spark'}},[b]:{name:'Другой браузер',save:freshSave()}},raids:{}}));
 const first=await login(DB,a,launch('123'));assert.equal(first.status,200);assert.equal(first.headers.get('x-obitel-session'),a);
 const second=await login(DB,b,launch('123'));assert.equal(second.status,200);const session=second.headers.get('x-obitel-session');assert.equal(session,a);
 const response=await api(request(session,'profile'),{DB}),profile=await response.json();assert.equal(profile.account,'vk');assert.equal(profile.save.xp,9000);assert.equal(profile.save.scrap,777);assert.equal(profile.save.vehicle,'spark');assert.equal(profile.name,'Ветеран');
 const other=await login(DB,a,launch('456'));assert.notEqual(other.headers.get('x-obitel-session'),a);DB.sqlite.close();
});
test('invalid, expired and foreign signatures never bind an account; missing secret is explicit',async()=>{
 const DB=database();for(const params of [launch('123').replace('vk_user_id=123','vk_user_id=999'),launch('123',{vk_ts:'1'}),launch('123',{vk_app_id:'1'}),launch('123')+'&vk_user_id=123'])assert.equal((await login(DB,'',params)).status,401);
 assert.equal((await login(DB,'',launch('123'),false)).status,503);assert.equal(DB.sqlite.prepare('SELECT COUNT(*) AS n FROM game_world').get().n,0);DB.sqlite.close();
});
test('simultaneous first logins resolve to one account without duplicated rewards',async()=>{
 const DB=database();const responses=await Promise.all([login(DB,'',launch('789')),login(DB,'',launch('789'))]);assert.ok(responses.every(r=>r.status===200));assert.equal(responses[0].headers.get('x-obitel-session'),responses[1].headers.get('x-obitel-session'));const world=JSON.parse(DB.sqlite.prepare('SELECT data FROM game_world').get().data);assert.equal(Object.keys(world.players).length,1);DB.sqlite.close();
});

test('safelisted VK login preserves the guest profile and rejects foreign origins',async()=>{
 const DB=database(),guest='c'.repeat(32);
 DB.sqlite.prepare('INSERT INTO game_world VALUES (?,?,0)').run('beta',JSON.stringify({players:{[guest]:{name:'Гость',save:{...freshSave(),xp:700}}},raids:{}}));
 const req=origin=>new Request('https://beta.example/api/auth/vk',{method:'POST',headers:{Origin:origin,'Content-Type':'text/plain;charset=UTF-8'},body:JSON.stringify({launch:launch('987'),session:guest})});
 const env={DB,VK_APP_SECRET:secret};
 assert.equal((await api(req('https://evil.example'),env)).status,403);
 const result=await api(req('https://hordeminecraft.github.io'),env);
 assert.equal(result.status,200);assert.equal(result.headers.get('x-obitel-session'),guest);
 assert.equal(result.headers.get('access-control-allow-origin'),'https://hordeminecraft.github.io');
 const profile=await(await api(request(guest,'profile'),env)).json();assert.equal(profile.save.xp,700);assert.equal(profile.account,'vk');DB.sqlite.close();
});

import worker from '../worker.js';
test('unexpected storage failures retain CORS so WebView can read the server error',async()=>{
 const DB={prepare(){throw new Error('test storage failure')}};
 const make=origin=>new Request('https://beta.example/api/auth/vk',{method:'POST',headers:{Origin:origin,'Content-Type':'text/plain'},body:JSON.stringify({launch:launch('111')})});
 const r=await worker.fetch(make('https://hordeminecraft.github.io'),{DB,VK_APP_SECRET:secret});
 assert.equal(r.status,503);assert.equal(r.headers.get('access-control-allow-origin'),'https://hordeminecraft.github.io');assert.match((await r.json()).error,/SERVER_INTERNAL/);
 const bad=await worker.fetch(make('https://evil.example'),{DB,VK_APP_SECRET:secret});assert.equal(bad.status,403);assert.equal(bad.headers.get('access-control-allow-origin'),null);
});
