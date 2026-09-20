import {playerLevel,stats,raidDamage,spendEnergy} from './balance.js';
const DAY=86400000,WEEK=7*DAY;
const fail=s=>{throw Object.assign(new Error(s),{status:400})};
const power=s=>Math.round(Math.sqrt(stats(s).hp*raidDamage(s)));
const tactics=['assault','flank','cover'];
export function conflictAction(db,uid,path,method,b={},time=Date.now()){
 const p=db.players[uid],s=p.save,day=Math.floor((time+10800000)/DAY),week=Math.floor((time+3*DAY)/WEEK);
 db.conflict??={week,clans:{},arena:{},bosses:{}};if(db.conflict.week!==week)db.conflict={week,clans:{},arena:{},bosses:{}};
 const world=db.conflict;
 p.combat??={};if(p.combat.day!==day)p.combat={day,arena:0,war:0,targets:[],next:0};
 const c=p.combat,clan=Object.values(db.clans||{}).find(x=>x.members.includes(uid));
 const opponents=Object.entries(db.players).filter(([k,q])=>k!==uid&&Math.abs(playerLevel(q.save)-playerLevel(s))<=Math.max(3,Math.floor(playerLevel(s)*.15)));
 let report=null;
 if(method==='POST'){
  if(playerLevel(s)<2)fail('Сражения открываются со 2 уровня');
  if(c.next>time)fail('Отряд возвращается. Подожди 30 секунд');
  if(path==='/api/conflict/arena'||path==='/api/conflict/war'){
   const war=path.endsWith('/war'),mode=war?'war':'arena';
   if(!tactics.includes(b.tactic))fail('Выбери тактику');
   const target=opponents.find(([,q])=>q.publicId===b.code);if(!target)fail('Противник недоступен в твоём диапазоне уровней');
   const [tid,q]=target,other=Object.values(db.clans||{}).find(x=>x.members.includes(tid));
   if(war&&(!clan||!other||clan.code===other.code))fail('Нужен противник из другого клана');
   if(war&&p.warWeek===week&&p.warClan!==clan.code)fail('В этом сезоне ты уже сражался за другой клан');
   if(c[mode]>=3)fail('Сегодня использованы все 3 попытки');
   if(c.targets.includes(mode+tid))fail('С этим противником уже был бой сегодня');
   const stance=tactics[Number.parseInt(q.publicId.slice(-4),16)%3||0];
   const delta=(tactics.indexOf(b.tactic)-tactics.indexOf(stance)+3)%3;
   const attack=Math.round(power(s)*(delta===1?1.2:delta===2?.8:1)),defence=power(q.save),win=attack>defence;
   c[mode]++;c.targets.push(mode+tid);c.next=time+30000;
   const points=win?10:2,reward=win?40:10;s.scrap+=reward;
   if(war){p.warWeek=week;p.warClan=clan.code;world.clans[clan.code]??={name:clan.name,points:0};world.clans[clan.code].points+=points;}
   else{world.arena[p.publicId]??={name:p.name,points:0};world.arena[p.publicId].name=p.name;world.arena[p.publicId].points+=points;}
   report={win,attack,defence,reward,points,text:win?'Позиция захвачена':'Отряд отступил'};
  }else if(path==='/api/conflict/depth'){
   if(!clan)fail('Для подземного рейда вступи в клан');
   if(p.warWeek===week&&p.warClan!==clan.code)fail('В этом сезоне ты уже сражался за другой клан');
   if(playerLevel(s)<6||!s.cleared.includes(4))fail('Нужен 6 уровень и победа над боссом Чёрного леса');
   let boss=world.bosses[clan.code];if(!boss)boss={stage:0,hp:12000,maxHp:12000,damage:{}};
   if(boss.stage>=3)fail('Реактор восстановлен. Новый поход — в следующем сезоне');
   if(!tactics.includes(b.tactic))fail('Выбери тактику');
   if(!spendEnergy(s,12))fail('Нужно 12 энергии');
   p.warWeek=week;p.warClan=clan.code;
   const weakness=tactics[boss.stage],damage=Math.min(boss.hp,Math.round(raidDamage(s)*(b.tactic===weakness?1.25:.65)));
   boss.hp-=damage;boss.damage[uid]=(boss.damage[uid]||0)+damage;c.next=time+30000;
   report={text:'Нанесено '+damage+' урона',reward:0};
   if(boss.hp===0){for(const pid of Object.keys(boss.damage)){const member=db.players[pid];if(member){member.save.scrap+=300*(boss.stage+1);member.save.cores+=3*(boss.stage+1);}}
    boss.stage++;boss.maxHp=12000*(boss.stage+1);boss.hp=boss.stage===3?0:boss.maxHp;boss.damage={};report.text+=' · Сектор очищен, награды отправлены всем участникам';}
   world.bosses[clan.code]=boss;
  }else fail('Неизвестное сражение');
 }else if(method!=='GET'||path!=='/api/conflict')fail('Метод не поддерживается');
 const boss=clan?world.bosses[clan.code]:null;
 return {report,arenaLeft:3-c.arena,warLeft:3-c.war,next:c.next,endsAt:(week+1)*WEEK-3*DAY,clan:clan?.name||null,
 opponents:opponents.slice(0,40).map(([qid,q])=>({code:q.publicId,name:q.name,level:playerLevel(q.save),power:power(q.save),stance:tactics[Number.parseInt(q.publicId.slice(-4),16)%3||0],clan:Object.values(db.clans||{}).find(x=>x.members.includes(qid))?.name||null})),power:power(s),
 arena:Object.values(world.arena).sort((a,b)=>b.points-a.points).slice(0,10),wars:Object.values(world.clans).sort((a,b)=>b.points-a.points).slice(0,10),
 boss:{stage:boss?.stage||0,hp:boss?.hp??12000,maxHp:boss?.maxHp??12000}};
}
