export function vkPhoto(value){
 try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&(!u.port||u.port==='443')&&['userapi.com','vkuserphoto.ru','vkuserlive.ru','vk.com','vk.ru','vk.me'].some(d=>u.hostname===d||u.hostname.endsWith('.'+d))?u.href:''}catch{return ''}
}
export function rankedPlayers(db){return Object.keys(db.players).filter(id=>{const p=db.players[id];return p.vkUserId&&db.vkAccounts?.[p.vkUserId]===id})}
