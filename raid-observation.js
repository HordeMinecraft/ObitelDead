// Observed changes, not a reconstructed attack history. Opening a raid sets a baseline.
export function observeRaid(previous,raid,at){
 const mine=raid.members.find(p=>p.me)?.damage||0;
 const state={id:raid.id,hp:raid.hp,mine,entries:previous?.id===raid.id?[...previous.entries]:[]};
 if(previous?.id===raid.id&&raid.hp<previous.hp){
  const damage=previous.hp-raid.hp;
  state.entries.unshift({at,damage,mine:Math.min(damage,Math.max(0,mine-previous.mine)),hp:raid.hp});
  state.entries=state.entries.slice(0,6);
 }
 return state;
}
export const raidRanking=members=>members.filter(p=>p.damage>0).slice().sort((a,b)=>b.damage-a.damage);
