// Stable selection also constrains legacy profiles that joined several live raids.
export function activeRaid(db,uid){
 const p=db.players[uid],current=db.raids[p?.activeRaid];
 if(current?.hp>0&&current.members?.[uid])return current;
 return Object.values(db.raids).filter(r=>r.hp>0&&(r.members?.[uid]||r.owner===uid))
  .sort((a,b)=>Number(!!b.members?.[uid]?.damage)-Number(!!a.members?.[uid]?.damage)||a.created-b.created||a.id.localeCompare(b.id))[0]||null;
}
