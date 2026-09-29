import test from 'node:test';
import assert from 'node:assert/strict';
import {verifiedVKFriends} from '../vk-friends.js';
import {friendIds} from '../friends-domain.js';
test('VK verifies token owner and filters installed IDs against registered profiles',async()=>{
 const calls=[];const result=await verifiedVKFriends('temporary-token',async(url,opts)=>{calls.push(url);assert.equal(opts.method,'POST');return Response.json({response:url.endsWith('users.get')?[{id:42}]:{count:3,items:[{id:8},{id:8},{id:9}]}})});
 assert.deepEqual(result,{user:'42',friends:['8','9'],photo:'',photos:{}});assert.equal(calls.length,2);
 const db={vkAccounts:{'42':'a','8':'b','10':'c'},players:{a:{vkUserId:'42',vkFriendIds:result.friends},b:{vkUserId:'8'},c:{vkUserId:'10'}},raids:{}};
 assert.deepEqual(friendIds(db,'a'),['b']);assert.ok(!JSON.stringify(db).includes('temporary-token'));
});
test('VK API errors cannot supply unverified friend identities',async()=>{
 await assert.rejects(verifiedVKFriends('temporary-token',async()=>Response.json({error:{error_code:5}})),{status:403});
 await assert.rejects(verifiedVKFriends('temporary-token',async()=>Response.json({response:[{id:'42'}]})),{status:403});
});
import {createHandler} from '../domain.js';
import {freshSave} from '../balance.js';
test('sync rejects tokens owned by another VK account without replacing friend cache',async()=>{
 const uid='a'.repeat(32),db={players:{[uid]:{name:'Test',vkUserId:'42',vkFriendIds:['8'],save:freshSave()}},raids:{}};
 const req={method:'POST',headers:{cookie:'obitel_session='+uid},async *[Symbol.asyncIterator](){yield JSON.stringify({accessToken:'temporary-token'})}};
 let status;const res={writeHead(n){status=n},end(){},setHeader(){}};
 await createHandler(db,()=>{},()=>crypto.randomUUID().replaceAll('-',''),{resolveVKFriends:async()=>({user:'99',friends:['9']})})(req,res,new URL('https://local.example/api/friends/vk-sync'));
 assert.equal(status,403);assert.deepEqual(db.players[uid].vkFriendIds,['8']);assert.equal(db.players[uid].vkFriendsAt,undefined);
});
