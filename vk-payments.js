import md5 from 'js-md5';
import {RAID_ATTACKS} from './raid-attacks.js';

const goods=RAID_ATTACKS.filter(a=>a.sku);
export const paymentMode=env=>['live','test'].includes(env.VK_PAYMENTS_MODE)&&!!env.VK_APP_SECRET?env.VK_PAYMENTS_MODE:'off';
const error=(msg,critical=true)=>({error:{error_code:100,error_msg:msg,critical}});

// VK payment callbacks use their documented legacy MD5 signature, not the launch HMAC.
export function verifyPayment(raw,secret){
 if(!secret||typeof raw!=='string'||raw.length>8192)throw new Error('Payment signature unavailable');
 const params=new URLSearchParams(raw),seen=new Set();
 for(const [key]of params){if(seen.has(key))throw new Error('Duplicate payment parameter');seen.add(key)}
 const given=params.get('sig');
 const signed=[...params].filter(([key])=>key!=='sig').sort(([a],[b])=>a<b?-1:a>b?1:0).map(([k,v])=>k+'='+v).join('')+secret;
 const expected=md5(signed);let diff=0;
 if(!/^[a-f0-9]{32}$/.test(given||''))throw new Error('Bad payment signature');
 for(let i=0;i<32;i++)diff|=given.charCodeAt(i)^expected.charCodeAt(i);
 if(diff||params.get('app_id')!=='54626490')throw new Error('Bad payment signature');
 return Object.fromEntries(params);
}

export function processPayment(db,input,mode){
 const test=input.notification_type?.endsWith('_test'),type=input.notification_type?.replace(/_test$/,'');
 if(mode==='off'||test!== (mode==='test'))return error('Payments are disabled for this mode');
 const item=goods.find(a=>a.sku===input.item);
 if(!item)return error('Unknown product');
 if(!/^\d{1,20}$/.test(input.user_id||'')||input.user_id!==input.receiver_id)return error('Invalid payment recipient');
 const uid=db.vkAccounts?.[input.receiver_id],p=db.players?.[uid];
 if(!p||p.vkUserId!==input.receiver_id)return error('Open the game through VK before purchasing');
 if(type==='get_item')return {response:{item_id:item.sku,title:item.name+' · '+item.pack+' ударов',photo_url:'https://hordeminecraft.github.io/ObitelDead/assets/raid-kit.png',price:item.votes}};
 const order=Number(input.order_id);
 if(!Number.isSafeInteger(order)||order<=0)return error('Invalid payment order');
 if(type!=='order_status_change'||!['chargeable','refunded'].includes(input.status))return error('Unsupported notification');
 if(Number(input.item_price)!==item.votes||input.item_id!==undefined&&input.item_id!==item.sku)return error('Product price mismatch');
 db.paymentOrders??={};const key=(test?'test:':'live:')+order,old=db.paymentOrders[key];
 if(old&&(old.uid!==uid||old.sku!==item.sku||old.user!==input.user_id))return error('Order mismatch');
 const response=old?.response||{response:{order_id:order,app_order_id:order}};
 if(old?.state==='refunded'||old?.state===input.status)return response;
 // A refund may arrive before a chargeable retry. Record its tombstone so it cannot grant later.
 const inventoryKey=test?'raidTestCharges':'raidCharges';p.save[inventoryKey]??={};
 if(input.status==='chargeable')p.save[inventoryKey][item.id]=(p.save[inventoryKey][item.id]||0)+item.pack;
 else if(old?.state==='chargeable')p.save[inventoryKey][item.id]=(p.save[inventoryKey][item.id]||0)-item.pack;
 // A negative balance after spending refunded charges is a debt offset by the next purchase.
 db.paymentOrders[key]={uid,user:input.user_id,sku:item.sku,state:input.status,response,at:Date.now()};
 return response;
}
