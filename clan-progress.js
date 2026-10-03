import {playerLevel} from './balance.js';
export const CLAN_BOSSES=Object.freeze([
 {id:'depot',name:'Надзиратель депо',art:'driver',map:5,level:2,hp:12000,entry:0,marks:40,requires:null,role:'Клановая операция · затопленное депо',pool:{scrap:600,xp:180,cores:6,cloth:20}},
 {id:'ash',name:'Пепельный титан',art:'smelter',map:6,level:10,hp:75000,entry:40,marks:120,requires:'depot',role:'Клановая операция · раскалённый цех',pool:{scrap:1600,xp:400,cores:16,cloth:40}},
 {id:'beacon',name:'Пожиратель маяка',art:'admiral',map:7,level:25,hp:400000,entry:120,marks:300,requires:'ash',role:'Клановая операция · северный маяк',pool:{scrap:4000,xp:900,cores:40,cloth:80}}
].map(Object.freeze));
export const CLAN_FEATS=Object.freeze([
 {id:'squad',title:'Плечом к плечу',description:'Соберите пять участников одновременно.',goal:5,key:'roster',symbol:'V'},
 {id:'first',title:'Первый рубеж',description:'Победите первого кланового босса.',goal:1,key:'wins',symbol:'I'},
 {id:'ten',title:'Неприступные',description:'Одержите десять клановых побед.',goal:10,key:'wins',symbol:'X'},
 {id:'triad',title:'Три фронта',description:'Победите всех трёх клановых боссов.',goal:3,key:'targets',symbol:'III'},
 {id:'damage',title:'Общий огонь',description:'Устраните боссов с суммарным здоровьем 100 000 HP.',goal:100000,key:'damage',symbol:'100K'},
 {id:'full',title:'Полный состав',description:'Соберите двадцать участников одновременно.',goal:20,key:'roster',symbol:'XX'}
]);
export const clanOf=(db,uid)=>Object.values(db.clans||{}).find(c=>c.members.includes(uid));
export function clanState(c){
 c.progress??={marks:0,wins:0,damage:0,targets:[],roster:0};const s=c.progress;
 s.roster=Math.max(s.roster||0,c.members.length);s.targets??=[];s.display??=[];return s;
}
export function clanFeats(c){const s=clanState(c);return CLAN_FEATS.map(f=>({...f,progress:Math.min(f.goal,f.key==='targets'?new Set(s.targets).size:s[f.key]||0),earned:(f.key==='targets'?new Set(s.targets).size:s[f.key]||0)>=f.goal}));}
export const clanBoss=r=>r.clan?CLAN_BOSSES.find(b=>b.id===r.clanBossId):null;
export const encounterAllowed=(db,uid,r)=>r.clan?clanOf(db,uid)?.code===r.clan&&playerLevel(db.players[uid].save)>=(clanBoss(r)?.level||Infinity):null;
export function clanReward(r,damage){const boss=clanBoss(r),share=Math.min(1,Math.max(0,damage/r.maxHp));return Object.fromEntries(Object.entries(boss.pool).map(([key,value])=>[key,Math.floor(value*share)]));}
export function clanVictory(db,r){
 if(!r.clan||r.hp>0||r.clanRewarded)return;
 const c=db.clans?.[r.clan],boss=clanBoss(r);if(!c||!boss)return;
 const s=clanState(c);s.marks+=boss.marks;s.wins++;s.damage+=r.maxHp;s.targets=[...new Set([...s.targets,boss.id])];r.clanRewarded=true;
}
