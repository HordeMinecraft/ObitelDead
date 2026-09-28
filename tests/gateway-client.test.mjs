import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const base='https://api.hordeminecraft.ru/obitel-gateway.php/';
const old='obitel-session:https://obiteldead.deniswww127.workers.dev/api/';
const key='obitel-session:'+base;
function setup(entries={},storageFails=false){
 const store=new Map(Object.entries(entries)),calls=[];
 const context=vm.createContext({URL,Map,AbortController,setTimeout,clearTimeout,performance,location:{origin:'https://hordeminecraft.github.io'},window:{},document:{querySelector(){return null}},localStorage:{getItem(k){if(storageFails)throw Error('denied');return store.get(k)||null},setItem(k,v){store.set(k,v)}},fetch:async(url,init)=>{calls.push({url:String(url),...init});return new Response('{"ok":true}',{headers:{'Content-Type':'application/json'}})}});
 const source=readFileSync(new URL('../client-api.js',import.meta.url),'utf8').replace("import {API_BASE} from './config.js';",`const API_BASE=${JSON.stringify(base)};`).replace('export function requestAPI','function requestAPI');
 vm.runInContext(source,context);return {request:context.requestAPI,calls,store};
}
test('gateway migration preserves old session and sends route query without exposing token in URL',async()=>{
 const token='a'.repeat(32),s=setup({[old]:token});await s.request('auth/vk',{launch:'signed-launch'});await s.request('profile');
 assert.equal(s.store.get(key),token);assert.equal(s.store.get(old),token);
 assert.equal(s.calls[0].url,base.slice(0,-1)+'?route=auth%2Fvk');
 assert.equal(JSON.parse(s.calls[0].body).session,token);
 assert.equal(s.calls[1].headers['X-Obitel-Session'],token);
 assert.equal(s.calls[1].credentials,'omit');
});
test('gateway keeps newer session and rejects malformed legacy token',async()=>{
 const s=setup({[old]:'a'.repeat(32),[key]:'b'.repeat(32)});await s.request('profile');assert.equal(s.calls[0].headers['X-Obitel-Session'],'b'.repeat(32));
 const bad=setup({[old]:'invalid'});await bad.request('profile');assert.equal(bad.calls[0].headers['X-Obitel-Session'],undefined);
});
test('blocked local storage does not prevent gateway requests',async()=>{const s=setup({},true);await s.request('profile');assert.equal(s.calls.length,1)});
