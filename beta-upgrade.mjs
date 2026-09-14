import {readFileSync as read,writeFileSync as write} from 'node:fs';
let b=read('balance.js','utf8');
b=b.replace('version:1,scrap:180','version:1,armorTier:0,ownedArmor:[0],bossKills:0,cloth:0,scrap:180');
b=b.replace('(110+s.armor*12)','(110+s.armor*8+(ARMOR[s.armorTier||0]?.hp||0))');
b+=`\nexport const ARMOR=[
 {name:'Одежда выжившего',hp:0,level:1,bosses:0,cost:0,cloth:0,cores:0,icon:3,description:'Твоя привычная футболка и брюки. Свобода движения.'},
 {name:'Жилет «Барьер»',hp:28,level:2,bosses:1,cost:320,cloth:8,cores:0,icon:4,description:'Плиты, ремни и подсумки. Первая серьёзная защита.'},
 {name:'Комплект «Дозор»',hp:60,level:4,bosses:3,cost:780,cloth:24,cores:3,icon:4,description:'Полевая куртка, усиленный жилет и защита плеч.'},
 {name:'Броня «Цитадель»',hp:100,level:6,bosses:6,cost:1600,cloth:48,cores:9,icon:5,description:'Тяжёлые пластины. Открытое лицо, знакомый силуэт.'}
];
export const armorUnlocked=(s,i)=>playerLevel(s)>=ARMOR[i].level||(s.bossKills||0)>=ARMOR[i].bosses&&ARMOR[i].bosses>0||i===0;
export function migrateSave(s){s.armorTier??=s.armor>0?1:0;s.ownedArmor??=s.armor>0?[0,1]:[0];s.bossKills??=s.cleared.length;s.cloth??=0;return s}
`;
write('balance.js',b);
let service=read('raid-service.js','utf8');
const imports=service.slice(service.indexOf('import {freshSave'),service.indexOf('export function')) .replace('raidDamage}', 'raidDamage,ARMOR,armorUnlocked,migrateSave}');
let domain=service.slice(service.indexOf(' const err='));
domain=domain.replace('let p=db.players[session],s=p.save;','let p=db.players[session],s=migrateSave(p.save);');
domain=domain.replace('req.headers.origin!==`http://${req.headers.host}`','req.headers.origin!==url.origin');
domain=domain.replace("let b={};if(req.method", "let b={};if(req.method");
domain=domain.replace("'Бронежилет'", "'Бронежилет'");
domain=domain.replace("else if(req.method==='POST'&&path==='/api/weapon')",`else if(req.method==='POST'&&path==='/api/armor'){let i=b.armor;if(!Number.isInteger(i)||!ARMOR[i])err('Нет такой брони');if(!s.ownedArmor.includes(i)){let a=ARMOR[i];if(!armorUnlocked(s,i))err('Нужен уровень '+a.level+' или победы над боссами: '+a.bosses);if(s.scrap<a.cost||s.cloth<a.cloth||s.cores<a.cores)err('Недостаточно материалов');s.scrap-=a.cost;s.cloth-=a.cloth;s.cores-=a.cores;s.ownedArmor.push(i)}s.armorTier=i}
   else if(req.method==='POST'&&path==='/api/weapon')`);
domain=domain.replace('s.scrap+=reward;s.xp+=xp;', 's.scrap+=reward;s.cloth+=win?3+t.map:0;s.xp+=xp;');
domain=domain.replace('s.cores+=3;s.xp+=45;', 's.cores+=3;s.bossKills++;s.cloth+=6;s.xp+=45;');
domain=domain.replace("if(req.method==='POST'&&path==='/api/run/start'){let m=b.map;", "if(req.method==='POST'&&path==='/api/run/start'){if(p.ticket&&Date.now()-p.ticket.started<30*60*1000)err('Предыдущая вылазка ещё активна',409);let m=b.map;");
write('domain.js',imports+'export function createHandler(db,commit,id){\n'+domain);
write('raid-service.js',`import {randomBytes} from 'node:crypto';
import {mkdirSync,readFileSync,writeFileSync,renameSync} from 'node:fs';
import {join} from 'node:path';
import {createHandler} from './domain.js';
export function createService(dir){mkdirSync(dir,{recursive:true});const file=join(dir,'world.json');let db={players:{},raids:{}};try{db=JSON.parse(readFileSync(file,'utf8'))}catch(e){if(e.code!=='ENOENT')throw e}const commit=()=>{writeFileSync(file+'.tmp',JSON.stringify(db));renameSync(file+'.tmp',file)};return createHandler(db,commit,()=>randomBytes(16).toString('hex'))}
`);
let art=read('art.js','utf8').replace('equipmentAtlas=null,appearance','equipmentAtlas=null,armorAtlas=null,itemAtlas=null,appearance').replace('armor:save.armor||0','armor:save.armorTier??(save.armor>0?1:0)');
art=art.replace("loadSprite('assets/equipment.png').then(c=>equipmentAtlas=c)","loadSprite('assets/equipment.png').then(c=>equipmentAtlas=c),loadSprite('assets/armor-tiers.png').then(c=>armorAtlas=c),loadSprite('assets/items.png').then(c=>itemAtlas=c)");
art=art.replace("type==='hero'&&equipmentAtlas?equipmentAtlas:spriteAtlas", "type==='hero'&&equipmentAtlas?(appearance.armor>=2&&armorAtlas?armorAtlas:equipmentAtlas):spriteAtlas");
art=art.replace('appearance.weapon+(appearance.armor>0?3:0)','appearance.weapon+((appearance.armor===1||appearance.armor===3)?3:0)');
art+=`\nexport function drawItem(canvas,index){if(!itemAtlas)return;const ctx=canvas.getContext('2d');ctx.clearRect(0,0,canvas.width,canvas.height);ctx.imageSmoothingEnabled=false;ctx.drawImage(itemAtlas,index%3*itemAtlas.width/3,Math.floor(index/3)*itemAtlas.height/2,itemAtlas.width/3,itemAtlas.height/2,0,0,canvas.width,canvas.height)}\n`;
write('art.js',art);
let game=read('game.js','utf8').replace('levelProgress,sprintStep}', 'levelProgress,sprintStep,ARMOR,armorUnlocked}').replace('loadArt,setAppearance}', 'loadArt,setAppearance,drawItem}');
game=game.replace("${save.armor?'Броня на месте.':'Начни с малого.'}","${ARMOR[save.armorTier||0].name}").replace("${save.armor?'Бронежилет «Барьер», ур. '+save.armor:'Обычная футболка и походные брюки'}", "${ARMOR[save.armorTier||0].description}");
game=game.replace("${upgrade('armor','Бронежилет «Барьер»',`+12 здоровья за уровень. Сейчас +${save.armor*12} HP.`)}", "${upgrade('armor','Усиление подкладки',`+8 здоровья за уровень. Сейчас +${save.armor*8} HP. Работает с любым комплектом.`)}");
const end="${item('✚','Полевой комплект','АВТОМАТИЧЕСКОЕ ЛЕЧЕНИЕ','Аптечки выпадают в бою. Подойди, чтобы восстановить 28 здоровья.','')}</div>`}";
game=game.replace(end,end.slice(0,-2)+"+renderInventory()}");
const marker="function renderPage(){";
game=game.replace(marker,`const itemArt=i=>'<canvas class="loot-art" data-item="'+i+'" width="180" height="180"></canvas>';
function renderInventory(){return '<div class="section-title"><h3>Склад убежища</h3><span>МАТЕРИАЛЫ И БРОНЯ</span></div><div class="supply-grid">'+[[0,'Детали',save.scrap,'Оружие, машина и мастерская'],[1,'Ядра',save.cores,'Рейд-боссы и ежедневные контракты'],[2,'Ткань',save.cloth||0,'3–7 за зачистку · 6 за босса']].map(([i,n,v,d])=>'<article class="supply">'+itemArt(i)+'<div><small>'+n+'</small><strong>'+v+'</strong><p>'+d+'</p></div></article>').join('')+'</div><div class="section-title"><h3>Защита выжившего</h3><span>ПОБЕДЫ НАД БОССАМИ: '+(save.bossKills||0)+'</span></div><div class="armor-grid">'+ARMOR.map((a,i)=>{const owned=(save.ownedArmor||[0]).includes(i),active=(save.armorTier||0)===i,open=armorUnlocked(save,i),afford=save.scrap>=a.cost&&(save.cloth||0)>=a.cloth&&save.cores>=a.cores;return '<article class="armor-card '+(active?'equipped':'')+'">'+itemArt(a.icon)+'<span class="badge">'+(active?'ЭКИПИРОВАНО':owned?'В ИНВЕНТАРЕ':open?'ЧЕРТЁЖ ОТКРЫТ':'ЗАКРЫТО')+'</span><h3>'+a.name+'</h3><strong class="armor-stat">+'+a.hp+' HP</strong><p>'+a.description+'</p><small>'+(!owned?'Уровень '+a.level+' или '+a.bosses+' побед над боссами':'Комплект сохранён навсегда')+'</small>'+(!owned?'<div class="recipe">'+a.cost+' деталей · '+a.cloth+' ткани'+(a.cores?' · '+a.cores+' ядер':'')+'</div>':'')+'<button class="'+(active?'secondary':'primary')+'" data-armor="'+i+'" '+(active||!owned&&(!open||!afford)?'disabled':'')+'>'+(active?'НАДЕТО':owned?'НАДЕТЬ':open?'СОЗДАТЬ':'НУЖЕН ОПЫТ')+'</button></article>'}).join('')+'</div>'}
`+marker);
game=game.replace("function refresh(){setAppearance(save);", "function refresh(){setAppearance(save);");
game=game.replace('renderPage()}\nfunction selectMap',"renderPage();document.querySelectorAll('[data-item]').forEach(c=>drawItem(c,Number(c.dataset.item)));document.querySelectorAll('[data-armor]').forEach(b=>b.onclick=()=>action(()=>api('armor',{armor:Number(b.dataset.armor)})))}\nfunction selectMap");
// Rendering can also happen on navigation without refreshing the profile.
game=game.replace("if(page==='garage')", "if(page==='gear'){document.querySelectorAll('[data-item]').forEach(c=>drawItem(c,Number(c.dataset.item)));document.querySelectorAll('[data-armor]').forEach(b=>b.onclick=()=>action(()=>api('armor',{armor:Number(b.dataset.armor)})))}\nif(page==='garage')");
game=game.replace('Локальный сервер · гостевые профили. Ссылка работает на этом компьютере. Для друзей через интернет нужны размещение сервера и вход через ВК. Список друзей ВК ещё не подключён.', 'Бета · гостевой профиль привязан к этому браузеру. Приглашай друзей по ссылке: здоровье босса общее. Вход и список друзей ВК подключаются отдельно.');
write('game.js',game);
write('index.html',read('index.html','utf8').replace('assets/brand.png','assets/brand-beta.png').replace('АЛЬФА / 0.3','БЕТА / 0.4').replace('ЛОКАЛЬНЫЙ СЕРВЕР','ОБЩИЙ СЕРВЕР').replace('<i>⬡</i>','<canvas data-item="0" width="64" height="64"></canvas>').replace('<i>◇</i>','<canvas data-item="1" width="64" height="64"></canvas>'));
