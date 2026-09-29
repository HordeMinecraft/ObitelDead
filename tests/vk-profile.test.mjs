import test from 'node:test';
import assert from 'node:assert/strict';
import {vkPhoto,rankedPlayers} from '../vk-profile.js';
import {createHandler} from '../domain.js';
import {freshSave} from '../balance.js';
test('ranking excludes guests and obsolete duplicate VK profiles, preserving their saves',()=>{
 const db={vkAccounts:{42:'real'},players:{real:{vkUserId:'42'},old:{vkUserId:'42'},guest:{save:{xp:99999}},orphan:{vkUserId:'77'}}};
 assert.deepEqual(rankedPlayers(db),['real']);assert.equal(db.players.guest.save.xp,99999);
});
test('VK avatars allow only HTTPS VK image hosts',()=>{
 assert.equal(vkPhoto('https://sun9.userapi.com/a.jpg'),'https://sun9.userapi.com/a.jpg');
 for(const url of ['javascript:alert(1)','http://sun9.userapi.com/a','https://userapi.com.evil.example/a','https://evil.example/a','https://user:pass@vk.com/a'])assert.equal(vkPhoto(url),'');
});
test('VK avatar update requires the signed account and persists across profile reads',async()=>{
 const uid='a'.repeat(32),db={vkAccounts:{42:uid},players:{[uid]:{vkUserId:'42',name:'Real',save:freshSave()}},raids:{}};
 async function call(method,path,body){let status,data;const req={method,headers:{cookie:'obitel_session='+uid},async *[Symbol.asyncIterator](){yield JSON.stringify(body)}};await createHandler(db,()=>{},()=>crypto.randomUUID().replaceAll('-',''))(req,{writeHead(n){status=n},end(s){data=JSON.parse(s)}},new URL('https://test/api/'+path));return {status,data}}
 assert.equal((await call('POST','profile/vk',{id:99,photo:'https://sun9.userapi.com/a.jpg'})).status,403);
 assert.equal((await call('POST','profile/vk',{id:42,photo:'https://sun9.userapi.com/a.jpg'})).status,200);
 assert.equal((await call('GET','profile')).data.photo,'https://sun9.userapi.com/a.jpg');
 assert.equal((await call('GET','leaderboard')).data.players[0].photo,'https://sun9.userapi.com/a.jpg');
});
