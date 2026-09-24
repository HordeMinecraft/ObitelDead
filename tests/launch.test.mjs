import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {build} from 'esbuild';
import {readFileSync} from 'node:fs';

const code=(await build({entryPoints:['platform-entry.js'],bundle:true,format:'iife',target:'es2018',write:false})).outputFiles[0].text;
test('native VK without query parameters still receives initialization',()=>{
 const calls=[];
 const window={addEventListener(){},AndroidBridge:{VKWebAppInit(value){calls.push(JSON.parse(value))}}};window.parent=window;
 vm.runInNewContext(code,{window,location:{search:''},URLSearchParams,console});
 assert.equal(calls.length,1);assert.ok(calls[0].request_id);
});
test('iframe receives VK initialization only once; standalone sends nothing',()=>{
 const calls=[];const parent={postMessage(value){calls.push(value)}};
 const window={addEventListener(){},parent};const context=vm.createContext({window,parent,location:{search:''},URLSearchParams,console});
 vm.runInContext(code,context);vm.runInContext(code,context);
 assert.equal(calls.length,1);assert.equal(calls[0].handler,'VKWebAppInit');
 calls.length=0;const standalone={addEventListener(){}};standalone.parent=standalone;
 vm.runInNewContext(code,{window:standalone,parent:standalone,location:{search:''},URLSearchParams,console});
 assert.equal(calls.length,0);
});
test('shipped game is a classic script without module syntax',()=>{
 const html=readFileSync('dist/client/index.html','utf8');
 assert.match(html,/<script defer src="game-boot\.js(?:\?v=[a-zA-Z0-9_-]+)?"><\/script>/);
 assert.doesNotMatch(html,/<script type="module"/);
 new vm.Script(readFileSync('dist/client/game-boot.js','utf8'));
});
