import test from 'node:test';
import assert from 'node:assert/strict';
import {observeRaid,raidRanking} from '../raid-observation.js';

test('raid opening and unchanged polls never fabricate earlier attacks',()=>{
 const raid={id:'a',hp:521,members:[{me:true,damage:229}]};
 const first=observeRaid(null,raid,100);assert.deepEqual(first.entries,[]);
 assert.deepEqual(observeRaid(first,raid,200).entries,[]);
});
test('observed shared damage groups concurrent contributions and distinguishes personal contribution',()=>{
 const a=observeRaid(null,{id:'a',hp:750,members:[{me:true,damage:0}]},100);
 const before=structuredClone(a),b=observeRaid(a,{id:'a',hp:250,members:[{me:true,damage:200},{damage:300}]},200);
 assert.deepEqual(b.entries,[{at:200,damage:500,mine:200,hp:250}]);assert.deepEqual(a,before);
 assert.equal(observeRaid(b,{id:'b',hp:1000000,members:[]},300).entries.length,0);
});
test('raid ranking uses only real positive contributions and preserves duplicate names and source order',()=>{
 const members=[{name:'Игрок',damage:40},{name:'Игрок',damage:80},{name:'Новичок',damage:0}],before=structuredClone(members);
 assert.deepEqual(raidRanking(members),[members[1],members[0]]);assert.deepEqual(members,before);
});
