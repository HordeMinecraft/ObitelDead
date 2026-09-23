// Quotas are enforced server-side; completion comes from VK Bridge on the client.
export function adAction(p,action,b,id,now=Date.now()){
 const fail=message=>{throw Object.assign(new Error(message),{status:400})};
 const day=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Moscow',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(now));
 if(p.ads?.day!==day)p.ads={day,count:0,next:0,pending:null,last:null};
 const a=p.ads;
 if(action==='start'){
  if(a.count>=3)fail('На сегодня все 3 награды получены');
  if(a.next>now)fail('Следующий просмотр доступен через несколько минут');
  if(p.save.energy>52)fail('Потрать энергию: для награды нужно 8 свободных единиц');
  if(a.pending&&a.pending.expires>now)fail('Предыдущий просмотр ещё не завершён');
  a.pending={token:id(),expires:now+10*60000};
  return {ticket:a.pending.token,remaining:3-a.count};
 }
 if(action==='claim'){
  if(a.last&&b.ticket===a.last)return {reward:8,alreadyClaimed:true,remaining:3-a.count};
  if(!a.pending||a.pending.token!==b.ticket||a.pending.expires<now||b.completed!==true)fail('Просмотр не подтверждён или истёк');
  p.save.energy=Math.min(60,p.save.energy+8);a.count++;a.next=now+5*60000;a.last=a.pending.token;a.pending=null;
  return {reward:8,remaining:3-a.count};
 }
 if(action==='cancel'){
  if(a.pending?.token===b.ticket)a.pending=null;
 }else if(action!=='status')fail('Неизвестный метод рекламы');
 return {remaining:3-a.count,next:a.next};
}
