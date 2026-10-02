import {playerLevel,MAPS} from './balance.js';
export const SORTIE_MODES=[
 {id:'scout',name:'Разведка',level:1,cost:6,hp:.8,speed:.9,reward:.65,xp:.75,description:'Спокойный темп. Меньше награда, дешевле выход.'},
 {id:'standard',name:'Зачистка',level:1,cost:8,hp:1,speed:1,reward:1,xp:1,description:'Обычная угроза и награда. Основной путь по районам.'},
 {id:'siege',name:'Прорыв',level:5,cost:12,hp:1.4,speed:1.12,reward:1.65,xp:1.4,description:'Живучие заражённые. Больше награда за успешную зачистку.'}
];
const CONDITIONS=[
 {id:'quiet',name:'Тихие улицы',description:'Обычная активность заражённых.'},
 {id:'rush',name:'Бегущая стая',description:'Бегуны двигаются на 20% быстрее.'},
 {id:'iron',name:'Тяжёлый след',description:'Громилы получают на 25% больше здоровья.'},
 {id:'hunt',name:'Охота',description:'В волнах чаще встречаются бегуны.'}
];
export const moscowDay=(time=Date.now())=>Math.floor((time+10800000)/86400000);
export function sortiePlan(save,map,mode='standard',time=Date.now()){
 const option=SORTIE_MODES.find(x=>x.id===mode);if(!option||!MAPS[map]||playerLevel(save)<option.level)throw Object.assign(new Error('Режим недоступен'),{status:400});
 const day=moscowDay(time),condition=CONDITIONS[map===0?0:(day+map)%CONDITIONS.length];
 return {...option,condition:{...condition},day};
}
export function sortieEnemy(base,type,plan){return {...base,hp:base.hp*plan.hp*(type==='tank'&&plan.condition.id==='iron'?1.25:1),speed:base.speed*plan.speed*(type==='runner'&&plan.condition.id==='rush'?1.2:1)}}
export function sortieEnemyType(index,condition){return index%5===4?'tank':index%(condition.id==='hunt'?2:3)===(condition.id==='hunt'?1:2)?'runner':'walker'}
export function sortiePayout(plan,win){return {reward:win?plan.reward:Math.min(1,plan.reward),xp:win?plan.xp:Math.min(1,plan.xp)}}
export const CONTRACTS=[
 {id:'supply',title:'Снабжение убежища',description:'Заверши две вылазки в любом режиме.',goal:2,key:'wins',reward:{scrap:35,xp:40}},
 {id:'route',title:'Разведать маршруты',description:'Зачисти два разных района.',goal:2,key:'maps',reward:{cloth:2,xp:30}},
 {id:'support',title:'Общий удар',description:'Нанеси урон рейд-боссу.',goal:1,key:'attacks',reward:{cores:1,xp:40}}
];
export function operationState(player,time=Date.now()){
 const day=moscowDay(time);if(player.operations?.day!==day)player.operations={day,wins:0,maps:[],attacks:0,claimed:[]};return player.operations;
}
export function operationView(player,time=Date.now()){
 const state=operationState(player,time),open=playerLevel(player.save)>=3;
 return {open,resetsAt:(state.day+1)*86400000-10800000,contracts:CONTRACTS.map(c=>({...c,progress:Math.min(c.goal,c.key==='maps'?state.maps.length:state[c.key]),claimed:state.claimed.includes(c.id)}))};
}
export function claimOperation(player,id,time=Date.now()){
 const view=operationView(player,time),contract=view.contracts.find(x=>x.id===id);
 if(!view.open||!contract||contract.claimed||contract.progress<contract.goal)throw Object.assign(new Error('Условия контракта ещё не выполнены'),{status:400});
 for(const [key,value]of Object.entries(contract.reward))player.save[key]=(player.save[key]||0)+value;
 player.operations.claimed.push(id);return operationView(player,time);
}
