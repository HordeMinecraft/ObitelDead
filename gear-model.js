import {WEAPONS,ARMOR,stats,weaponUnlocked,armorUnlocked} from './balance.js';

const resourceName=(key,n)=>{if(key==='cloth')return 'ткани';const mod10=n%10,mod100=n%100,form=mod100>=11&&mod100<=14?2:mod10===1?0:mod10>=2&&mod10<=4?1:2;return (key==='scrap'?['деталь','детали','деталей']:['ядро','ядра','ядер'])[form]};

// Preview the exact combat stats, including the active vehicle and workshop.
export function gearPreview(save,kind,index){
 const weapons=kind==='weapons',item=(weapons?WEAPONS:ARMOR)[index];
 if(!item)throw new RangeError('Unknown equipment');
 const active=index===(weapons?save.weapon:save.armorTier||0);
 const owned=(weapons?save.owned:save.ownedArmor||[0]).includes(index);
 const open=weapons?weaponUnlocked(save,index):armorUnlocked(save,index);
 const current=stats(save),next=stats({...save,[weapons?'weapon':'armorTier']:index});
 const currentWeapon=WEAPONS[save.weapon];
 const missing=owned?[]:[['scrap',item.cost,'деталей'],['cloth',weapons?0:item.cloth,'ткани'],['cores',weapons?0:item.cores,'ядер']].filter(([key,cost])=>(save[key]||0)<cost).map(([key,cost,label])=>({key,amount:cost-(save[key]||0),label}));
 const levelReason='Открывается на уровне '+(item.level||1)+(!weapons&&item.bosses?' или после '+item.bosses+' побед над боссами':'');
 const reason=active?'Уже на персонаже':!owned&&item.votes?'Покупка за голоса пока недоступна':(!open&&(weapons||!owned))?levelReason:missing.length?'Не хватает: '+missing.map(m=>m.amount+' '+resourceName(m.key,m.amount)).join(', '):owned?'Можно сменить бесплатно':'Создание сразу экипирует предмет';
 return {item,index,owned,active,open,missing,reason,enabled:!active&&(owned||!item.votes)&&(!weapons&&owned||open)&&!missing.length,
  damage:next.damage,dps:weapons?next.damage*(item.pellets||1)/item.rate:0,
  dpsDelta:weapons?next.damage*(item.pellets||1)/item.rate-current.damage*(currentWeapon.pellets||1)/currentWeapon.rate:0,
  rangeDelta:weapons?item.range-currentWeapon.range:0,hp:next.hp,hpDelta:next.hp-current.hp};
}
