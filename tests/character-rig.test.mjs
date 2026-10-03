import test from 'node:test';
import assert from 'node:assert/strict';
import {drawRig} from '../art.js';
test('moving hero and zombie legs are continuous from the thigh to the original foot',()=>{
 for(const type of ['hero','walker','runner','tank'])for(const running of [false,true])for(const time of [0,.1,.3,.6,1]){
  const draws=[],ctx={save(){},restore(){},translate(){},rotate(){},drawImage(...args){draws.push(args)}};
  const atlas={width:1536,height:1024};drawRig(ctx,atlas,3,110,time,true,running,type);
  assert.equal(draws.length,3);for(const leg of draws.slice(0,2)){assert.equal(leg[3],256);assert.ok(Math.abs(leg[2]+leg[4]-1024)<.001);assert.ok(leg[4]>200);}
 }
});
test('idle characters are drawn as one intact original frame',()=>{
 const draws=[],ctx={drawImage(...args){draws.push(args)}};drawRig(ctx,{width:1536,height:1024},0,110,1,false,false,'hero');
 assert.equal(draws.length,1);assert.equal(draws[0][3],512);assert.equal(draws[0][4],512);
});
