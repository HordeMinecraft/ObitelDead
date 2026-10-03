import {milestoneView} from './campaign.js';
import {stats,playerLevel,WEAPONS,ARMOR} from './balance.js';
import {clanOf,clanState,clanFeats} from './clan-progress.js';
export function playerMedals(save){
 const rows=milestoneView(save).map(m=>({id:m.id,title:m.title,description:m.description,symbol:m.goal===1?'I':m.goal===3?'III':m.goal===8?'VIII':m.goal===2500?'2K':String(m.goal),progress:m.progress,goal:m.goal,earned:m.progress>=m.goal}));
 const wins=save.clanBossKills||0;
 rows.push({id:'clan-victor',title:'Боец отряда',symbol:'I',description:'Получи награду за кланового босса.',progress:Math.min(1,wins),goal:1,earned:wins>=1},{id:'clan-veteran',title:'Ветеран клана',symbol:'X',description:'Получи награды за десять клановых боссов.',progress:Math.min(10,wins),goal:10,earned:wins>=10});
 return rows;
}
export function selectMedals(save,ids){
 const earned=new Set(playerMedals(save).filter(m=>m.earned).map(m=>m.id));
 if(!Array.isArray(ids)||ids.length>3||new Set(ids).size!==ids.length||ids.some(id=>!earned.has(id)))throw Object.assign(new Error('Можно выставить до трёх полученных медалей'),{status:400});
 save.displayMedals=[...ids];
}
export function playerDossier(db,uid){
 const p=db.players[uid],s=p.save,c=clanOf(db,uid),medals=playerMedals(s),earned=medals.filter(m=>m.earned),selected=new Set(s.displayMedals||earned.slice(0,3).map(m=>m.id)),st=stats(s);
 return {code:p.publicId,name:p.name,level:playerLevel(s),xp:s.xp,kills:s.kills,bossKills:s.bossKills,clanBossKills:s.clanBossKills||0,
  stats:{health:Math.round(st.hp),damage:Math.round(st.damage*100)/100,speed:Math.round(st.speed),loot:Math.round(st.loot*100)},weapon:WEAPONS[s.weapon].name,armor:ARMOR[s.armorTier||0].name,
  clan:c?{code:c.code,name:c.name,leader:c.owner===uid,medals:clanFeats(c).filter(m=>m.earned&&clanState(c).display.includes(m.id))}:null,
  medals:earned,display:earned.filter(m=>selected.has(m.id))};
}
