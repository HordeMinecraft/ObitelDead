import {MAPS,WEAPONS,ARMOR,playerLevel,unlocked} from './balance.js';
const count=n=>Number.isFinite(Number(n))?Math.max(0,Math.floor(Number(n))):0;
const unique=(values,max)=>new Set((Array.isArray(values)?values:[]).filter(n=>Number.isInteger(n)&&n>=0&&n<max)).size;
export const DISTRICT_ROLES=['Жилой сектор','Топливный узел','Склад снабжения','Медицинский сектор','Зона сигнала','Подземный транспорт','Производственный узел','Дальняя связь'];
export function campaignState(save){
 const completed=new Set((save.cleared||[]).filter(i=>Number.isInteger(i)&&MAPS[i]));
 const districts=MAPS.map((map,index)=>{const runs=Math.min(3,count(save.districtRuns?.[index])),done=completed.has(index),open=unlocked(save,index),level=playerLevel(save);return {index,name:map.name,role:DISTRICT_ROLES[index],level:map.level,boss:map.boss,runs,done,open,status:done?'ОСВОЕН':!open?'ЗАКРЫТ':runs<3?'ЗАЧИСТКА':level<map.level?'НУЖЕН УРОВЕНЬ':'БОСС ДОСТУПЕН'}});
 const next=districts.find(d=>!d.done)||null;
 const action=!next?'campaign-complete':next.runs<3?'sortie':playerLevel(save)<next.level?'level':'boss';
 return {districts,completed:completed.size,total:MAPS.length,percent:Math.round(completed.size/MAPS.length*100),next,action,title:!next?'Все восемь районов освоены':action==='level'?'Подготовься к следующему району':action==='boss'?'Победи босса района':next.runs?'Продолжи зачистку':'Открой путь в район',description:!next?'Продолжай рейды, помогай друзьям и выполняй приказы убежища.':action==='level'?'Нужен уровень '+next.level+'. Повторяй доступные вылазки для получения опыта.':action==='boss'?next.boss+' охраняет район. Победа и получение награды откроют следующий.':next.name+' · осталось победных вылазок: '+(3-next.runs)};
}
export const MILESTONES=[
 {id:'first-sortie',title:'Первое возвращение',description:'Заверши одну победную вылазку.',metric:'runs',goal:1,icon:'map',reward:{cloth:1}},
 {id:'hunter-100',title:'Безопасный периметр',description:'Устрани 100 заражённых.',metric:'kills',goal:100,icon:'raids',reward:{scrap:35}},
 {id:'sorties-10',title:'Полевой опыт',description:'Заверши 10 победных вылазок.',metric:'runs',goal:10,icon:'map',reward:{scrap:45,cloth:2}},
 {id:'first-boss',title:'Первая общая победа',description:'Получи награду за победу над боссом.',metric:'bosses',goal:1,icon:'raids',reward:{cores:1,cloth:2}},
 {id:'arsenal-3',title:'На все дистанции',description:'Собери три разные модели оружия.',metric:'weapons',goal:3,icon:'gear',reward:{cloth:2}},
 {id:'districts-3',title:'Город отвечает',description:'Освой три разных района.',metric:'districts',goal:3,icon:'guide',reward:{cores:2}},
 {id:'hunter-500',title:'Зачистка сектора',description:'Устрани 500 заражённых.',metric:'kills',goal:500,icon:'raids',reward:{scrap:90,cloth:3}},
 {id:'armor-3',title:'Подготовка решает',description:'Собери три комплекта брони.',metric:'armor',goal:3,icon:'clans',reward:{cloth:3}},
 {id:'level-25',title:'Опытный выживший',description:'Достигни 25 уровня.',metric:'level',goal:25,icon:'leaderboard',reward:{scrap:250,cloth:4}},
 {id:'sorties-50',title:'Надёжный маршрут',description:'Заверши 50 победных вылазок.',metric:'runs',goal:50,icon:'map',reward:{scrap:120,cloth:4}},
 {id:'districts-8',title:'Вернуть город живым',description:'Освой все восемь районов.',metric:'districts',goal:8,icon:'guide',reward:{cores:3,cloth:12}},
 {id:'hunter-2500',title:'Последняя линия',description:'Устрани 2500 заражённых.',metric:'kills',goal:2500,icon:'conflict',reward:{scrap:180,cloth:5}},
 {id:'level-100',title:'Опора убежища',description:'Достигни 100 уровня.',metric:'level',goal:100,icon:'leaderboard',reward:{scrap:500,cloth:6}},
 {id:'level-500',title:'Легенда Обители',description:'Достигни 500 уровня.',metric:'level',goal:500,icon:'leaderboard',reward:{cores:10}}
];
function claims(save){const ids=new Set(MILESTONES.map(m=>m.id));save.chronicleClaims=[...new Set((Array.isArray(save.chronicleClaims)?save.chronicleClaims:[]).filter(id=>ids.has(id)))];return save.chronicleClaims}
export function milestoneView(save){
 const claimed=claims(save),metrics={runs:MAPS.reduce((n,_,i)=>n+count(save.districtRuns?.[i]),0),kills:count(save.kills),bosses:count(save.bossKills),districts:unique(save.cleared,MAPS.length),weapons:unique(save.owned,WEAPONS.length),armor:unique(save.ownedArmor,ARMOR.length),level:playerLevel(save)};
 return MILESTONES.map(m=>({...m,progress:Math.min(m.goal,metrics[m.metric]),claimed:claimed.includes(m.id)}));
}
export function claimMilestone(save,id){
 const milestone=milestoneView(save).find(m=>m.id===id);
 if(!milestone||milestone.claimed||milestone.progress<milestone.goal)throw Object.assign(new Error('Достижение ещё не выполнено или награда уже получена'),{status:400});
 for(const [key,value]of Object.entries(milestone.reward))save[key]=(save[key]||0)+value;
 save.chronicleClaims.push(id);return milestone;
}
