import test from 'node:test';
import assert from 'node:assert/strict';
import {tickRaid} from '../raid-view.js';
import {freshSave} from '../balance.js';
test('clan strike uses server clan access instead of unrelated campaign map clearances',()=>{
 const button={},root={querySelector:s=>s==='[data-raid-attack="gun"]'?button:null},save=freshSave(),raid={map:5,hp:12000,maxHp:12000,rare:false,allowed:true,joined:true,nextAttack:0,attackVersion:2};
 tickRaid(root,raid,save,0);assert.equal(button.disabled,false);assert.equal(button.textContent,'Выстрелить');
 for(const state of [{allowed:false},{joined:false},{blockedBy:'other'},{hp:0},{nextAttack:Date.now()+35000}]){tickRaid(root,{...raid,...state},save,0);assert.equal(button.disabled,true);}
 delete raid.allowed;tickRaid(root,raid,save,0);assert.equal(button.disabled,true,'older ordinary raid still requires campaign progress');
});
