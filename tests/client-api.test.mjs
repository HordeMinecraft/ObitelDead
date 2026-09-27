import test from 'node:test';
import assert from 'node:assert/strict';

test('client distinguishes transport, body, HTTP and processing failures',async()=>{
 const saved=Object.fromEntries(['location','window','localStorage','document','fetch'].map(k=>[k,globalThis[k]]));
 try{
  globalThis.location=new URL('https://hordeminecraft.github.io/ObitelDead/');
  globalThis.window={parent:{}};
  globalThis.localStorage={getItem:()=>null,setItem(){}};
  globalThis.document={querySelector:()=>null};
  const {requestAPI}=await import('../client-api.js');
  globalThis.fetch=async()=>{throw new TypeError('Failed to fetch')};
  await assert.rejects(requestAPI('auth/vk',{launch:'test'}),/NETWORK_FETCH/);
  globalThis.fetch=async()=>({status:200,headers:new Headers({'Content-Type':'application/json'}),json:async()=>{throw new TypeError('decode error')}});
  await assert.rejects(requestAPI('auth/vk',{launch:'test'}),/RESPONSE_BODY.*200/);
  globalThis.fetch=async()=>Response.json({error:'Signature invalid'},{status:401});
  await assert.rejects(requestAPI('auth/vk',{launch:'test'}),e=>e.status===401&&e.message==='Signature invalid');
  globalThis.fetch=async()=>Response.json(null);
  await assert.rejects(requestAPI('auth/vk',{launch:'test'}),/RESPONSE_FORMAT/);
  globalThis.fetch=async(url,init)=>{
   assert.equal(init.credentials,'omit');
   assert.equal(init.headers['Content-Type'],'text/plain;charset=UTF-8');
   assert.equal(init.headers['X-Obitel-Session'],undefined);
   return Response.json({authenticated:true});
  };
  assert.equal((await requestAPI('auth/vk',{launch:'test'})).authenticated,true);
 }finally{for(const [k,v]of Object.entries(saved)){if(v===undefined)delete globalThis[k];else globalThis[k]=v}}
});
