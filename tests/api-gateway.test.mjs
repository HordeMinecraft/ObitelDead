import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {gateway} from '../api-gateway.mjs';

test('gateway preserves VK login and sessions without cookies, redirects or arbitrary upstreams',async()=>{
 const calls=[];const token='a'.repeat(32);
 const server=http.createServer(gateway(async(url,init)=>{
  calls.push({url,init});
  return Response.json({authenticated:true},{headers:{'X-Obitel-Session':token,'Set-Cookie':'ignored=1'}});
 }));
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const base='http://127.0.0.1:'+server.address().port;
 try{
  const r=await fetch(base+'/api/auth/vk',{method:'POST',headers:{Origin:'https://hordeminecraft.github.io','Content-Type':'text/plain','X-Obitel-Session':token},body:'{"launch":"test-signature"}'});
  assert.equal(r.status,200);assert.equal(r.headers.get('x-obitel-session'),token);assert.equal(r.headers.get('set-cookie'),null);
  assert.equal(r.headers.get('access-control-allow-origin'),'https://hordeminecraft.github.io');
  assert.equal(calls[0].url,'https://obiteldead.deniswww127.workers.dev/api/auth/vk');
  assert.equal(calls[0].init.body.toString(),'{"launch":"test-signature"}');assert.equal(calls[0].init.redirect,'error');
  assert.equal(calls[0].init.headers['X-Obitel-Session'],token);
  assert.equal((await fetch(base+'/api/profile',{headers:{Origin:'https://evil.example'}})).status,403);
  assert.equal((await fetch(base+'/api/profile?url=https://evil.example')).status,404);
  assert.equal((await fetch(base+'/api/profile',{method:'OPTIONS'})).status,204);
  assert.equal((await fetch(base+'/api/auth/vk',{method:'POST',body:'x'.repeat(8193)})).status,413);
  assert.equal(calls.length,1);
 }finally{server.closeAllConnections();await new Promise(r=>server.close(r))}
});

test('gateway exposes upstream failures as readable CORS JSON',async()=>{
 const server=http.createServer(gateway(async()=>{throw new TypeError('network')}));
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 try{
  const r=await fetch('http://127.0.0.1:'+server.address().port+'/api/health',{headers:{Origin:'https://hordeminecraft.github.io'}});
  assert.equal(r.status,502);assert.equal(r.headers.get('access-control-allow-origin'),'https://hordeminecraft.github.io');assert.ok((await r.json()).error);
 }finally{server.closeAllConnections();await new Promise(r=>server.close(r))}
});
