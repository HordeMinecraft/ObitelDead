import {vkPhoto,rankedPlayers} from './vk-profile.js';
import {RARE_RAIDS,RAID_CAPACITY,raidAllowed,raidHit,raidReward} from './rare-raids.js';
import {purchaseVehicle} from './vehicles.js';
import {adAction} from './ads-domain.js';
import {conflictAction} from './conflict-domain.js';
import {clanAction} from './clans-domain.js';
import {socialAction,ensureSocial,friendIds} from './friends-domain.js';
import {activeRaid} from './raid-state.js';
import {expeditionReward,freshSave,restoreEnergy,spendEnergy,RAID_COST,BOSS_COST,MAPS,WEAPONS,stats,unlocked,bossUnlocked,upgradeCost,runXP,raidDamage,ARMOR,armorUnlocked,migrateSave,playerLevel,raidProfile,weaponUnlocked} from './balance.js';

const ONLINE_WINDOW=90_000;
const MAX_NAME=32;

export function createHandler(db,commit,id,services={}){
 const err=(text,status=400)=>{throw Object.assign(new Error(text),{status})};
 const now=()=>Date.now();
 const online=(p,t=now())=>Number(p?.lastSeen||0)>=t-ONLINE_WINDOW;
 function daily(s){
  const date=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Moscow',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  if(s.daily.date!==date)s.daily={date,kills:0,claimed:false};
  restoreEnergy(s);
 }
 function publicPlayer(pid,t=now()){
  const q=db.players[pid];
  if(!q)return null;
  ensureSocial(q,id);
  const qs=migrateSave(q.save||freshSave());
  return {code:q.publicId,name:q.name,avatar:q.avatar||0,photo:vkPhoto(q.vkPhoto),level:playerLevel(qs),xp:Number(qs.xp||0),kills:Number(qs.kills||0),bossKills:Number(qs.bossKills||0),online:online(q,t)};
 }
 function onlineCount(t=now()){return rankedPlayers(db).filter(id=>online(db.players[id],t)).length}
 function leaderboard(uid,t=now()){
  const rows=rankedPlayers(db).map(pid=>({pid,...publicPlayer(pid,t)})).filter(x=>x.code).sort((a,b)=>b.xp-a.xp||b.bossKills-a.bossKills||b.kills-a.kills||a.name.localeCompare(b.name,'ru'));
  const mine=rows.findIndex(x=>x.pid===uid),friends=new Set(friendIds(db,uid));
  return {updatedAt:t,total:rows.length,online:rows.filter(x=>x.online).length,meRank:mine<0?null:mine+1,players:rows.slice(0,100).map((x,i)=>({rank:i+1,code:x.code,name:x.name,avatar:x.avatar,photo:x.photo,level:x.level,xp:x.xp,kills:x.kills,bossKills:x.bossKills,online:x.online,me:x.pid===uid,friend:friends.has(x.pid),requested:db.players[x.pid].friendRequests.includes(uid)}))};
 }
 function viewRaid(r,uid){const active=activeRaid(db,uid);return {blockedBy:active&&active.id!==r.id?active.id:null,totalDamage:r.maxHp-r.hp,id:r.id,map:r.map,rare:!!r.rare,capacity:RAID_CAPACITY,reward:raidReward(r,r.members[uid]?.damage||0),estimatedDamage:raidHit(db.players[uid].save,r.map,r.rare),hp:r.hp,maxHp:r.maxHp,created:r.created,owner:r.owner===uid,members:Object.entries(r.members).map(([pid,v])=>({name:db.players[pid]?.name||'Выживший',damage:v.damage,me:pid===uid,claimed:!!v.claimed,online:online(db.players[pid])})),nextAttack:r.members[uid]?.nextAttack||0,joined:!!r.members[uid]}}
 return async function handle(req,res,url){
  if(!url.pathname.startsWith('/api/'))return false;
  const send=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data))};
  try{
   if(req.method==='POST'&&req.headers.origin&&req.headers.origin!==url.origin)err('Недопустимый источник запроса',403);
   db.players??={};db.raids??={};
   let session=(req.headers.cookie||'').match(/(?:^|;\s*)obitel_session=([a-f0-9]{32})(?:;|$)/)?.[1];
   if(!session||!db.players[session]){
    session=id();
    db.players[session]={name:'Странник '+session.slice(0,4).toUpperCase(),save:freshSave(),ticket:null,createdAt:now(),lastSeen:now()};
    ensureSocial(db.players[session],id);
    res.setHeader('Set-Cookie',`obitel_session=${session}; HttpOnly; SameSite=Strict; Path=/; Max-Age=31536000`);
    commit();
   }
   const p=db.players[session];
   ensureSocial(p,id);
   p.lastSeen=now();
   p.createdAt??=p.lastSeen;
   const s=migrateSave(p.save||freshSave());p.save=s;daily(s);
   let b={};
   if(req.method==='POST'){
    let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>8192)err('Слишком большой запрос',413)}
    try{b=raw?JSON.parse(raw):{}}catch{err('Некорректный JSON')}
   }
   let result={};const path=url.pathname;
   if(req.method==='GET'&&path==='/api/profile')result={name:p.name,avatar:p.avatar||0,photo:vkPhoto(p.vkPhoto),code:p.publicId,online:true,account:p.vkUserId?'vk':'guest'};
   else if(req.method==='POST'&&path==='/api/profile/vk'){
    if(!p.vkUserId||String(b.id)!==p.vkUserId)err('Профиль VK не подтверждён',403);
    const photo=vkPhoto(b.photo);if(!photo)err('Некорректная фотография VK');
    p.vkPhoto=photo;result={name:p.name,avatar:p.avatar||0,photo,account:'vk'};
   }
   else if(req.method==='POST'&&path==='/api/profile'){
    const name=String(b.name||'').replace(/\s+/g,' ').trim();
    if(b.name!==undefined&&(name.length<2||name.length>MAX_NAME||/[<>\x00-\x1f]/.test(name)))err('Ник: 2–32 символа, без угловых скобок');
    if(b.avatar!==undefined&&(!Number.isInteger(b.avatar)||b.avatar<0||b.avatar>5))err('Аватар не найден');
    if(b.name!==undefined)p.name=name;if(b.avatar!==undefined)p.avatar=b.avatar;
    result={name:p.name,avatar:p.avatar||0,photo:vkPhoto(p.vkPhoto),code:p.publicId,online:true};
   }
   else if(req.method==='GET'&&path==='/api/online')result={online:onlineCount(),windowSeconds:Math.round(ONLINE_WINDOW/1000)};
   else if(req.method==='POST'&&path==='/api/online/ping')result={online:onlineCount(),windowSeconds:Math.round(ONLINE_WINDOW/1000)};
   else if(req.method==='GET'&&path==='/api/leaderboard')result=leaderboard(session);
   else if(req.method==='POST'&&/^\/api\/ads\/(start|claim|cancel|status)$/.test(path))result=adAction(p,path.split('/').pop(),b,id);
   else if(path.startsWith('/api/conflict'))result=conflictAction(db,session,path,req.method,b);
   else if(path.startsWith('/api/clans'))result=clanAction(db,session,path,req.method,b,id);
   else if(req.method==='POST'&&path==='/api/friends/vk-sync'){
    if(!p.vkUserId)err('Открой игру через VK для синхронизации друзей',401);
    if(!services.resolveVKFriends)err('Синхронизация друзей VK недоступна на этом сервере',503);
    if(!p.vkFriendsAt||now()-p.vkFriendsAt>=60000){
     const verified=await services.resolveVKFriends(b.accessToken);
     if(verified.user!==p.vkUserId)err('Аккаунт VK не совпадает с игровым профилем',403);
     p.vkFriendIds=verified.friends;p.vkFriendsAt=now();
     if(vkPhoto(verified.photo))p.vkPhoto=vkPhoto(verified.photo);
     for(const user of verified.friends){const friend=db.players[db.vkAccounts?.[user]];const photo=vkPhoto(verified.photos?.[user]);if(friend?.vkUserId===user&&photo)friend.vkPhoto=photo;}
    }
    result=socialAction(db,session,'/api/friends','GET',{},id,{onlineWindow:ONLINE_WINDOW});
   }
   else if(path.startsWith('/api/friends'))result=socialAction(db,session,path,req.method,b,id,{onlineWindow:ONLINE_WINDOW});
   else if(req.method==='POST'&&path==='/api/vehicle')result=purchaseVehicle(s,b.vehicle,playerLevel(s));
   else if(req.method==='POST'&&path==='/api/upgrade'){
    const f=b.field;if(!['weaponLevel','armor','engine','body','trunk'].includes(f))err('Нет такого улучшения');
    const price=upgradeCost(s[f]);if(s[f]>=10||s.scrap<price)err('Не хватает деталей');s.scrap-=price;s[f]++;
   }
   else if(req.method==='POST'&&path==='/api/armor'){
    const i=b.armor;if(!Number.isInteger(i)||!ARMOR[i])err('Нет такой брони');
    if(!s.ownedArmor.includes(i)){const a=ARMOR[i];if(a.votes)err('Покупки за голоса ещё не подключены',503);if(!armorUnlocked(s,i))err('Нужен уровень '+a.level+' или победы над боссами: '+a.bosses);if(s.scrap<a.cost||s.cloth<a.cloth||s.cores<a.cores)err('Недостаточно материалов');s.scrap-=a.cost;s.cloth-=a.cloth;s.cores-=a.cores;s.ownedArmor.push(i)}s.armorTier=i;
   }
   else if(req.method==='POST'&&path==='/api/weapon'){
    const i=b.weapon;if(!Number.isInteger(i)||!WEAPONS[i])err('Нет такого оружия');if(!weaponUnlocked(s,i))err('Нужен уровень '+WEAPONS[i].level);if(!s.owned.includes(i)){if(WEAPONS[i].votes)err('Покупки за голоса ещё не подключены',503);if(s.scrap<WEAPONS[i].cost)err('Не хватает деталей');s.scrap-=WEAPONS[i].cost;s.owned.push(i)}s.weapon=i;
   }
   else if(req.method==='POST'&&path==='/api/daily'){
    if(s.daily.kills<20||s.daily.claimed)err('Награда недоступна');s.scrap+=120;s.cores++;s.daily.claimed=true;
   }
   else if(req.method==='POST'&&path==='/api/run/start'){
    const m=b.map;if(!Number.isInteger(m)||!MAPS[m]||!unlocked(s,m))err('Район закрыт');if(!spendEnergy(s,RAID_COST))err('Недостаточно энергии');p.ticket={id:id(),map:m,started:now(),level:playerLevel(s)};result.ticket=p.ticket.id;
   }
   else if(req.method==='POST'&&path==='/api/run/end'){
    if(p.lastResult?.ticket===b.ticket){send(200,{...p.lastResult.result,save:s,serverTime:now()});return true}
    const t=p.ticket;if(!t||t.id!==b.ticket)err('Вылазка уже завершена или недействительна',409);
    const maxKills=27+t.map*3,kills=Math.max(0,Math.min(maxKills,Math.floor(Number(b.kills)||0)));
    const win=b.win===true&&kills===maxKills&&now()-t.started>18000;
    const loot=Math.max(0,Math.min(kills*8,Math.floor(Number(b.loot)||0)));
    const reward=expeditionReward(t.map,kills,loot,win,stats(s).loot),xp=runXP(kills,win,t.map,t.level||1);
    s.scrap+=reward;s.cloth+=win?3+t.map:0;s.xp+=xp;s.kills+=kills;s.daily.kills+=kills;if(win)s.districtRuns[t.map]++;
    p.ticket=null;result={reward,xp,win};p.lastResult={ticket:t.id,result};
   }
   else if(req.method==='GET'&&path==='/api/raids'){
    const active=activeRaid(db,session);
    result={active:active?viewRaid(active,session):null,completed:Object.values(db.raids).filter(r=>r.hp<=0&&r.members[session]?.damage&&!r.members[session].claimed).map(r=>viewRaid(r,session))};
   }
   else if(req.method==='POST'&&path==='/api/raids'){
    const m=b.map,rare=b.rare===true;if(b.rare!==undefined&&typeof b.rare!=='boolean')err('Неизвестный тип рейда');if(!Number.isInteger(m)||!MAPS[m]||!raidAllowed(s,m,rare))err('Нужны зачистки, победа над обычным боссом для редкого рейда и требуемый уровень');
    const active=activeRaid(db,session);
    if(active&&(active.map!==m||!!active.rare!==rare))err('Сначала победи активного босса: '+MAPS[active.map].boss,409);
    const friends=new Set(friendIds(db,session));
    const existing=active||Object.values(db.raids).filter(r=>r.map===m&&!!r.rare===rare&&r.hp>0&&Object.keys(r.members).length<RAID_CAPACITY).sort((a,b)=>Number(Object.keys(b.members).some(x=>friends.has(x)))-Number(Object.keys(a.members).some(x=>friends.has(x)))||a.created-b.created||a.id.localeCompare(b.id))[0];
    if(existing){existing.members[session]??={damage:0,nextAttack:0,claimed:false};p.activeRaid=existing.id;result.raid=viewRaid(existing,session)}else{const rid=id().slice(0,12),hp=rare?RARE_RAIDS[m].hp:raidProfile(m).hp;const r={id:rid,map:m,rare,owner:session,hp,maxHp:hp,created:now(),members:{[session]:{damage:0,nextAttack:0,claimed:false}}};db.raids[rid]=r;p.activeRaid=rid;result.raid=viewRaid(r,session)}
   }
   else if(/^\/api\/raids\/[a-f0-9]{12}(\/join|\/attack|\/claim)?$/.test(path)){
    const parts=path.split('/'),r=db.raids[parts[3]];if(!r)err('Рейд не найден',404);const action=parts[4];
    const active=activeRaid(db,session);
    if(req.method==='POST'&&['join','attack'].includes(action)&&active&&active.id!==r.id)err('Сначала победи активного босса: '+MAPS[active.map].boss,409);
    if(req.method==='POST'&&action==='join'){
     if(r.hp<=0)err('Босс уже повержен');if(!r.members[session]){if(!raidAllowed(s,r.map,r.rare))err('Недостаточно прогресса для этого босса');if(Object.keys(r.members).length>=RAID_CAPACITY)err('В рейде уже 300 игроков');r.members[session]={damage:0,nextAttack:0,claimed:false}}p.activeRaid=r.id;
    }else if(req.method==='POST'&&action==='attack'){
     const member=r.members[session];if(!member)err('Сначала присоединись к рейду');if(!raidAllowed(s,r.map,r.rare))err('Недостаточно прогресса для этого босса');if(r.hp<=0)err('Босс уже повержен');if(member.nextAttack>now())err('Отряд ещё возвращается');if(!spendEnergy(s,BOSS_COST))err('Недостаточно энергии');const damage=Math.min(r.hp,raidHit(s,r.map,r.rare));r.hp-=damage;member.damage+=damage;member.nextAttack=now()+raidProfile(r.map).cooldown;result.damage=damage;
    }else if(req.method==='POST'&&action==='claim'){
     const member=r.members[session];if(!member||!member.damage||member.claimed||r.hp>0)err('Награда недоступна');member.claimed=true;const reward=raidReward(r,member.damage);for(const [key,value] of Object.entries(reward))s[key]+=value;s.bossKills++;if(!r.rare&&!s.cleared.includes(r.map))s.cleared.push(r.map);
    }else if(req.method!=='GET'||action)err('Метод не поддерживается',405);
    result.raid=viewRaid(r,session);
   }
   else err('Метод не найден',404);
   commit();send(200,{...result,activeRaidId:activeRaid(db,session)?.id||null,save:s,serverTime:now()});
  }catch(e){send(e.status||500,{error:e.status?e.message:'Ошибка сервера'})}
  return true;
 }
}
