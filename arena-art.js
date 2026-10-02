import {loadArtImage} from './art.js';
import {BOSS_ART} from './raid-view.js';
let floorPromise;const portraits=new Map();
export async function loadArenaArt(map){
 floorPromise??=loadArtImage('assets/arena-zero.png').catch(e=>{floorPromise=null;throw e;});
 if(!portraits.has(map))portraits.set(map,loadArtImage('assets/boss-'+BOSS_ART[map]+'.png').catch(e=>{portraits.delete(map);throw e;}));
 const [floor,boss]=await Promise.all([floorPromise,portraits.get(map)]);return {floor,boss};
}
export function drawArenaBoss(ctx,image,boss,time,face){
 ctx.save();ctx.translate(Math.round(boss.x),Math.round(boss.y));
 ctx.fillStyle='#07151488';ctx.beginPath();ctx.ellipse(0,0,45,10,0,0,Math.PI*2);ctx.fill();
 ctx.scale(face,1);ctx.imageSmoothingEnabled=false;if(boss.flash)ctx.globalAlpha=.6;
 ctx.drawImage(image,-100,-195-Math.sin(time*3)*2,200,200);ctx.restore();
}
export function drawArenaStrike(ctx,attack){
 const progress=1-Math.max(0,attack.t)/attack.total;
 for(const z of attack.zones){
  ctx.save();ctx.fillStyle='#ad513850';ctx.strokeStyle='#f2c783';ctx.lineWidth=2;
  ctx.beginPath();ctx.ellipse(z.x,z.y,z.radius,z.radius*.6,0,0,Math.PI*2);ctx.fill();ctx.stroke();
  ctx.globalAlpha=.65;ctx.fillStyle='#d8794b';ctx.beginPath();ctx.ellipse(z.x,z.y,z.radius*progress,z.radius*.6*progress,0,0,Math.PI*2);ctx.fill();
  ctx.globalAlpha=1;ctx.font='bold 12px monospace';ctx.textAlign='center';ctx.fillStyle='#ffdfaa';ctx.fillText('УДАР',z.x,z.y+4);ctx.restore();
 }
}
