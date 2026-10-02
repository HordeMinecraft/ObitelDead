import {ARENA,arenaContract,arenaContribution} from './boss-arena.js';
import {spendEnergy,ENERGY_MAX,raidProfile,stats} from './balance.js';
import {raidAllowed} from './rare-raids.js';
import {operationState} from './operations.js';

const fail=(message,status=400)=>{throw Object.assign(new Error(message),{status})};
export const pendingArena=(p,now)=>p.arenaTicket&&p.arenaTicket.expires>now?p.arenaTicket:null;
export function arenaAction(p,r,uid,input,newId,now){
 const s=p.save,member=r.members[uid];
 if(input.arena==='finish'){
  if(p.lastArena?.ticket===input.ticket&&p.lastArena.raidId===r.id)return {...p.lastArena.result};
  const t=p.arenaTicket;
  if(!t||t.id!==input.ticket||t.raidId!==r.id||t.expires<=now)fail('Билет арены истёк или недействителен',409);
  if(!member)fail('Участник рейда не найден',409);
  if(!Number.isFinite(input.damage)||input.damage<0)fail('Некорректный результат арены');
  const damage=Math.min(r.hp,arenaContribution(t.contract,input.damage,(now-t.started)/1000));
  const refunded=r.hp<=0;
  if(refunded)s.energy=Math.min(ENERGY_MAX,s.energy+ARENA.cost);
  else{r.hp-=damage;member.damage+=damage;member.nextAttack=Math.max(member.nextAttack||0,now+raidProfile(r.map).cooldown);if(damage>0)operationState(p).attacks++;}
  const result={damage,refunded,arenaResult:true,cap:t.contract.cap};
  p.lastArena={ticket:t.id,raidId:r.id,result};p.arenaTicket=null;
  return result;
 }
 if(input.arena!=='start')fail('Неизвестный режим арены');
 if(!member||!raidAllowed(s,r.map,r.rare))fail('Сначала открой босса и присоединись к рейду');
 if(r.hp<=0)fail('Босс уже повержен');
 const pending=pendingArena(p,now);
 if(pending){if(pending.raidId!==r.id)fail('Заверши начатый бой на арене',409);return {arena:pending};}
 if(member.nextAttack>now)fail('Отряд ещё возвращается');
 if(p.ticket&&now-p.ticket.started<ARENA.expiry)fail('Сначала заверши начатую вылазку',409);
 if(!spendEnergy(s,ARENA.cost,now))fail('Недостаточно энергии');
 const t={id:newId(),raidId:r.id,started:now,expires:now+ARENA.expiry,contract:arenaContract(s,r.map,r.rare),stats:stats(s),weapon:s.weapon};
 p.arenaTicket=t;member.nextAttack=now+raidProfile(r.map).cooldown;
 return {arena:t};
}
