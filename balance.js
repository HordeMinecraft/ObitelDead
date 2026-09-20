export const MAPS=[
 {name:'Тихий квартал',desc:'В окнах ещё горит свет. На улицах уже никого живого.',goal:'Зачистить жилой квартал',boss:'Смотритель',level:1,palette:['#6c7660','#485340','#8b8870','#a4a080'],reward:85,kind:'town'},
 {name:'АЗС «Последняя»',desc:'Запах бензина. Пустые баки. И кто-то за колонкой.',goal:'Вернуть запас топлива',boss:'Поджигатель',level:2,palette:['#786953','#514b3a','#a38d65','#c5a271'],reward:110,kind:'gas'},
 {name:'Грузовой двор',desc:'Контейнеры заперты изнутри. Стук не прекращается.',goal:'Вскрыть склад снабжения',boss:'Крановщик',level:3,palette:['#627272','#3e5150','#738886','#98a5a0'],reward:140,kind:'yard'},
 {name:'Больница № 6',desc:'Карантин снят. Пациенты остались.',goal:'Найти медицинский модуль',boss:'Главврач',level:4,palette:['#687468','#465b4f','#8c9a84','#b0b49b'],reward:175,kind:'hospital'},
 {name:'Чёрный лес',desc:'Последний сигнал пришёл отсюда. Дальше — тишина.',goal:'Найти источник сигнала',boss:'Корневой',level:5,palette:['#525f4a','#354736','#71825b','#94a071'],reward:220,kind:'forest'},
 {name:'Затопленное метро',desc:'Вода скрывает рельсы. В тоннеле слышен последний поезд.',goal:'Запустить аварийные насосы',boss:'Машинист',level:6,palette:['#334c50','#23373c','#75908b','#b4bca2'],reward:260,kind:'metro'},
 {name:'Промзона «Пепел»',desc:'Печи продолжают работать без людей.',goal:'Остановить заражённый конвейер',boss:'Плавильщик',level:7,palette:['#624535','#382c26','#a7794f','#d9b47e'],reward:305,kind:'factory'},
 {name:'Порт «Северный»',desc:'Последний корабль не покинул причал.',goal:'Захватить узел дальней связи',boss:'Адмирал',level:8,palette:['#354a5c','#253647','#728b9b','#b2c2c3'],reward:355,kind:'port'}
];
export const WEAPONS=[{name:'Пистолет «Сигнал»',damage:22,rate:.48,range:370,cost:0,description:'Точный и надёжный. Хорош для первых вылазок.'},{name:'Карабин «Рубеж»',damage:15,rate:.28,range:430,cost:360,description:'Высокая скорострельность. Держи дистанцию.'},{name:'Дробовик «Гром»',damage:13,rate:.82,range:240,pellets:5,cost:440,description:'Пять дробин. Подпускай ближе и отходи бегом.'}];
export const ENERGY_MAX=60;
export const raidProfile=map=>map===5?{hp:3900,cooldown:35000,armor:.1,trait:'Быстрый ритм: повторная атака через 35 секунд. Броня снижает урон на 10%.'}:map===6?{hp:4700,cooldown:45000,armor:.2,trait:'Стальная кожа: входящий урон снижен на 20%.'}:map===7?{hp:6200,cooldown:50000,armor:.05,trait:'Осада: большой запас здоровья, повторная атака через 50 секунд.'}:{hp:750*(1+map*.7),cooldown:45000,armor:0,trait:'Повторная атака через 45 секунд.'};
export const ENERGY_INTERVAL=5*60*1000;
export const RAID_COST=8;
export const BOSS_COST=12;
export const freshSave=()=>({version:1,armorTier:0,ownedArmor:[0],bossKills:0,cloth:0,scrap:180,cores:0,xp:0,cleared:[],districtRuns:Array(MAPS.length).fill(0),energy:60,energyAt:Date.now(),weapon:0,owned:[0],weaponLevel:0,armor:0,engine:0,body:0,trunk:0,kills:0,daily:{date:'',kills:0,claimed:false}});
export function restoreEnergy(s,now=Date.now()){s.energy=Math.min(ENERGY_MAX,Math.max(0,s.energy??ENERGY_MAX));s.energyAt=Math.min(now,s.energyAt??now);if(s.energy>=ENERGY_MAX){s.energyAt=now;return s.energy}const recovered=Math.floor((now-s.energyAt)/ENERGY_INTERVAL);s.energy=Math.min(ENERGY_MAX,s.energy+recovered);if(s.energy===ENERGY_MAX)s.energyAt=now;else s.energyAt+=recovered*ENERGY_INTERVAL;return s.energy}
export function spendEnergy(s,amount,now=Date.now()){restoreEnergy(s,now);if(s.energy<amount)return false;if(s.energy===ENERGY_MAX)s.energyAt=now;s.energy-=amount;return true}
export const bossUnlocked=(s,i)=>unlocked(s,i)&&(s.districtRuns?.[i]||0)>=3&&playerLevel(s)>=MAPS[i].level;
export const xpForLevel=level=>Math.round(240*(level-1)+90*(level-1)*(level-2));
export const playerLevel=s=>{let level=1;while(level<100&&s.xp>=xpForLevel(level+1))level++;return level};
export const levelProgress=s=>{const level=playerLevel(s),start=xpForLevel(level),next=xpForLevel(level+1);return {level,current:Math.max(0,s.xp-start),required:next-start,percent:Math.min(100,(s.xp-start)/(next-start)*100)}};
export const runXP=(kills,win,map=0)=>Math.floor(kills*1.5)+(win?24+map*8:0);
export const raidDamage=s=>Math.round(stats(s).damage*(WEAPONS[s.weapon].pellets||1)/WEAPONS[s.weapon].rate*5*(s.weapon===2?.72:1));
export function sprintStep(stamina,exhausted,wantsRun,moving,dt){if(exhausted&&stamina>=30)exhausted=false;const running=wantsRun&&moving&&!exhausted&&stamina>0;stamina=Math.max(0,Math.min(100,stamina+(running?-24:17)*dt));if(stamina===0)exhausted=true;return {stamina,exhausted,running:running&&stamina>0,multiplier:running?1.65:1}}
export const stats=s=>({hp:Math.round((110+s.armor*8+(ARMOR[s.armorTier||0]?.hp||0))*(1+s.body*.04)),damage:WEAPONS[s.weapon].damage*(1+s.weaponLevel*.08)*(1+s.engine*.04),loot:1+s.trunk*.05,speed:148});
export const upgradeCost=(level)=>Math.round(80*Math.pow(1.42,level));
export const unlocked=(s,i)=>i===0||s.cleared.includes(i-1);
export const enemyStats=(map,wave,type)=>({hp:(type==='boss'?230:type==='tank'?86:type==='runner'?28:40)*(1+map*.32)*(1+(wave-1)*.15),speed:type==='boss'?34:type==='runner'?95:type==='tank'?28:47,damage:(type==='boss'?23:type==='tank'?17:10)*(1+map*.16)});

export const ARMOR=[
 {name:'Одежда выжившего',hp:0,level:1,bosses:0,cost:0,cloth:0,cores:0,icon:3,description:'Твоя привычная футболка и брюки. Свобода движения.'},
 {name:'Жилет «Барьер»',hp:28,level:2,bosses:1,cost:320,cloth:8,cores:0,icon:4,description:'Плиты, ремни и подсумки. Первая серьёзная защита.'},
 {name:'Комплект «Дозор»',hp:60,level:4,bosses:3,cost:780,cloth:24,cores:3,icon:4,description:'Полевая куртка, усиленный жилет и защита плеч.'},
 {name:'Броня «Цитадель»',hp:100,level:6,bosses:6,cost:1600,cloth:48,cores:9,icon:5,description:'Тяжёлые пластины. Открытое лицо, знакомый силуэт.'}
];
export const armorUnlocked=(s,i)=>playerLevel(s)>=ARMOR[i].level||(s.bossKills||0)>=ARMOR[i].bosses&&ARMOR[i].bosses>0||i===0;
export function migrateSave(s){s.districtRuns=Array.from({length:MAPS.length},(_,i)=>Math.max(0,Number(s.districtRuns?.[i])||0));s.armorTier??=s.armor>0?1:0;s.ownedArmor??=s.armor>0?[0,1]:[0];s.bossKills??=s.cleared.length;s.cloth??=0;return s}
