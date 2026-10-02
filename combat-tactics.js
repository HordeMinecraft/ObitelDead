export const REPULSE={cost:35,cooldown:9,radius:115,distance:90};
export function repulseStatus(run){
 const seconds=Math.max(0,(run?.repulseAt||0)-(run?.time||0));
 return {seconds,ready:!!run&&!run.paused&&!run.ended&&!run.transition&&seconds===0&&run.stamina>=REPULSE.cost};
}
export function repel(run){
 if(!repulseStatus(run).ready)return false;
 run.stamina-=REPULSE.cost;run.repulseAt=run.time+REPULSE.cooldown;run.repulses=(run.repulses||0)+1;
 for(const enemy of run.enemies){
  if(enemy.hp<=0)continue;let dx=enemy.x-run.x,dy=enemy.y-run.y,length=Math.hypot(dx,dy);
  if(length>REPULSE.radius)continue;if(length<.001){dx=run.face||1;dy=0;length=1}
  const distance=enemy.type==='boss'?REPULSE.distance*.3:REPULSE.distance;
  enemy.x=Math.max(25,Math.min(935,enemy.x+dx/length*distance));
  enemy.y=Math.max(260,Math.min(540,enemy.y+dy/length*distance*.8));
  enemy.attack=null;enemy.cd=Math.max(enemy.cd,.8);
 }
 return true;
}
export function battleReport(run){
 const seconds=Math.max(0,Math.floor(run.time));
 return {duration:Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0'),kills:run.kills,hits:run.hits||0,repulses:run.repulses||0,energy:run.plan.cost};
}
