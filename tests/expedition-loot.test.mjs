import test from 'node:test';
import assert from 'node:assert/strict';
import {expeditionDrop,expeditionReward,MAPS} from '../balance.js';
test('expedition rewards are capped to a third of the previous maximum on every map',()=>{
 for(let map=0;map<MAPS.length;map++){const kills=27+map*3;assert.equal(expeditionReward(map,kills,999999,true),Math.round(MAPS[map].reward/3+Math.ceil(kills*8/3)));assert.equal(expeditionReward(map,kills,-10,false),0)}
});
test('drop boundaries and two-medkit limit are enforced',()=>{
 assert.deepEqual(expeditionDrop(()=>0,0),{scrap:4,health:true});assert.equal(expeditionDrop(()=>0,2).health,false);assert.deepEqual(expeditionDrop(()=>.9,0),{scrap:0,health:false});
});
