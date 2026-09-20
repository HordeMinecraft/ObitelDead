import {playerLevel} from './balance.js';
export function clanAction(db,uid,path,method,b,id){
 db.clans??={};const p=db.players[uid];
 const fail=(message,status=400)=>{throw Object.assign(new Error(message),{status})};
 const mine=()=>Object.values(db.clans).find(c=>c.members.includes(uid));
 const member=pid=>({code:db.players[pid].publicId,name:db.players[pid].name,level:playerLevel(db.players[pid].save)});
 if(method==='POST'){
  const c=mine();
  if(path==='/api/clans/create'){
   if(c)fail('Ты уже состоишь в клане');
   const name=String(b.name||'').trim().replace(/\s+/g,' ');
   if(name.length<3||name.length>28)fail('Название: от 3 до 28 символов');
   if(Object.values(db.clans).some(x=>x.name.toLowerCase()===name.toLowerCase()))fail('Название занято');
   if(playerLevel(p.save)<2)fail('Создание клана доступно со 2 уровня');
   const code=id().slice(0,12);db.clans[code]={code,name,owner:uid,members:[uid],requests:[],created:Date.now()};
  }else if(path==='/api/clans/request'){
   if(c)fail('Ты уже состоишь в клане');const target=db.clans[b.code];if(!target)fail('Клан не найден',404);
   if(target.members.length>=20)fail('В клане уже 20 участников');
   if(!target.requests.includes(uid)){if(target.requests.length>=100)fail('Список заявок заполнен');target.requests.push(uid)}
  }else if(path==='/api/clans/accept'||path==='/api/clans/decline'){
   if(!c||c.owner!==uid)fail('Только глава управляет заявками',403);
   const pid=c.requests.find(x=>db.players[x]?.publicId===b.code);if(!pid)fail('Заявка не найдена');
   if(path.endsWith('/accept')){
    if(Object.values(db.clans).some(x=>x.members.includes(pid)))fail('Игрок уже в клане');
    if(c.members.length>=20)fail('Клан заполнен');c.members.push(pid);
    for(const other of Object.values(db.clans))other.requests=other.requests.filter(x=>x!==pid);
   }else c.requests=c.requests.filter(x=>x!==pid);
  }else if(path==='/api/clans/leave'){
   if(!c)fail('Ты не состоишь в клане');c.members=c.members.filter(x=>x!==uid);
   if(!c.members.length)delete db.clans[c.code];else if(c.owner===uid)c.owner=c.members[0];
  }else fail('Метод не найден',404);
 }else if(method!=='GET'||path!=='/api/clans')fail('Метод не найден',404);
 const c=mine();
 return {clan:c?{code:c.code,name:c.name,owner:c.owner===uid,members:c.members.map(member),requests:c.owner===uid?c.requests.map(member):[],raids:Object.values(db.raids).filter(r=>r.hp>0&&c.members.includes(r.owner)).map(r=>({id:r.id,map:r.map,hp:r.hp,maxHp:r.maxHp}))}:null,clans:Object.values(db.clans).slice(0,100).map(x=>({code:x.code,name:x.name,count:x.members.length,requested:x.requests.includes(uid)}))};
}
