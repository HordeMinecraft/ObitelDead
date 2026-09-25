import {freshSave,migrateSave,playerLevel} from './balance.js';

export function ensureSocial(player,id){
 player.publicId??=id().slice(0,12);
 player.friends??=[];
 player.friendRequests??=[];
}

export function socialAction(db,uid,path,method,body,id,options={}){
 const player=db.players[uid];ensureSocial(player,id);
 const onlineWindow=Number(options.onlineWindow||90_000),now=Date.now();
 const isOnline=p=>Number(p?.lastSeen||0)>=now-onlineWindow;
 const fail=(message,status=400)=>{throw Object.assign(new Error(message),{status})};
 const target=()=>{
  if(typeof body.code!=='string'||!/^[a-f0-9]{12}$/.test(body.code))fail('Введите код игрока из 12 символов');
  const entry=Object.entries(db.players).find(([,p])=>p.publicId===body.code);
  if(!entry)fail('Игрок не найден',404);
  if(entry[0]===uid)fail('Это твой код');
  ensureSocial(entry[1],id);return entry;
 };
 if(method==='POST'){
  const [otherId,other]=target();
  if(path==='/api/friends/request'){
   if(player.friends.includes(otherId))fail('Вы уже друзья');
   if(other.friendRequests.length>=100)fail('У игрока слишком много заявок');
   if(!other.friendRequests.includes(uid))other.friendRequests.push(uid);
  }
  else if(path==='/api/friends/accept'){
   if(!player.friendRequests.includes(otherId))fail('Нет входящей заявки');
   if(player.friends.length>=100||other.friends.length>=100)fail('В списке уже 100 друзей');
   if(!player.friends.includes(otherId))player.friends.push(otherId);
   if(!other.friends.includes(uid))other.friends.push(uid);
   player.friendRequests=player.friendRequests.filter(x=>x!==otherId);
   other.friendRequests=other.friendRequests.filter(x=>x!==uid);
  }
  else if(path==='/api/friends/decline')player.friendRequests=player.friendRequests.filter(x=>x!==otherId);
  else if(path==='/api/friends/remove'){
   player.friends=player.friends.filter(x=>x!==otherId);
   other.friends=other.friends.filter(x=>x!==uid);
  }
  else fail('Метод не найден',404);
 }else if(method!=='GET'||path!=='/api/friends')fail('Метод не поддерживается',405);
 const view=pid=>{
  const p=db.players[pid];if(!p)return null;ensureSocial(p,id);
  const raid=Object.values(db.raids).find(r=>r.owner===pid&&r.hp>0);
  const save=migrateSave(p.save||freshSave());
  return {code:p.publicId,name:p.name,avatar:Number.isInteger(p.avatar)&&p.avatar>=0&&p.avatar<6?p.avatar:0,online:isOnline(p),level:playerLevel(save),raid:raid?{id:raid.id,map:raid.map,hp:raid.hp}:null};
 };
 return {code:player.publicId,friends:player.friends.map(view).filter(Boolean),requests:player.friendRequests.map(view).filter(Boolean)};
}
