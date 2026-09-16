import {readFileSync,writeFileSync} from 'node:fs';
let s=readFileSync('art.js','utf8'),begin=s.indexOf('const environments='),end=s.indexOf('export function scene',begin);
s=s.slice(0,begin)+`const environments=[];let spriteAtlas=null,equipmentAtlas=null,appearance={weapon:0,armor:0};
export function setAppearance(save){appearance={weapon:save.weapon||0,armor:save.armor||0}}
async function loadSprite(path){return new Promise(resolve=>{const img=new Image();img.onload=()=>{const c=document.createElement('canvas');c.width=img.width;c.height=img.height;const ctx=c.getContext('2d');ctx.drawImage(img,0,0);const pixels=ctx.getImageData(0,0,c.width,c.height);for(let i=0;i<pixels.data.length;i+=4){let r=pixels.data[i],g=pixels.data[i+1],b=pixels.data[i+2];if(r>120&&b>120&&g<135&&Math.min(r,b)-g>55)pixels.data[i+3]=0}ctx.putImageData(pixels,0,0);resolve(c)};img.onerror=()=>resolve(null);img.src=path})}
export async function loadArt(){await Promise.all([Promise.all(Array.from({length:5},(_,i)=>new Promise(resolve=>{const img=new Image();img.onload=()=>{environments[i]=img;resolve()};img.onerror=()=>resolve();img.src='assets/district-'+i+'.png'}))),loadSprite('assets/characters.png').then(c=>spriteAtlas=c),loadSprite('assets/equipment.png').then(c=>equipmentAtlas=c)])}
function drawRig(g,atlas,index,size,time,moving,running,type){const sw=atlas.width/3,sh=atlas.height/2,sx=index%3*sw,sy=Math.floor(index/3)*sh,k=size/sw,hip=sh*(type==='runner'?.53:.59),knee=sh*.77,phase=time*8,swing=moving?Math.sin(phase)*(running?.25:.13):0,bob=moving?Math.abs(Math.sin(phase))*2:0,originX=-size*.5,originY=-size*.94-bob;
g.imageSmoothingEnabled=false;
for(let leg=0;leg<2;leg++){const lx=leg*sw/2,pivot=sw*(leg?.57:.43),angle=swing*(leg?1:-1),bend=moving?Math.max(0,-Math.sin(phase+(leg?Math.PI:0)))*(running?.38:.17):0;g.save();g.translate(originX+pivot*k,originY+hip*k);g.rotate(angle);g.drawImage(atlas,sx+lx,sy+hip,sw/2,knee-hip,(lx-pivot)*k,0,size/2,(knee-hip)*k);g.translate(0,(knee-hip)*k);g.rotate(bend);g.drawImage(atlas,sx+lx,sy+knee,sw/2,sh-knee,(lx-pivot)*k,0,size/2,(sh-knee)*k);g.restore()}
g.drawImage(atlas,sx,sy,sw,hip+5,originX,originY,size,(hip+5)*k);
}
`+s.slice(end);
const signature="export function person(g,x,y,type='walker',scale=1,t=0,face=1,flash=0){";
s=s.replace(signature,"export function person(g,x,y,type='walker',scale=1,t=0,face=1,flash=0,moving=false,running=false){");
begin=s.indexOf('if(spriteAtlas){',s.indexOf('export function person'));end=s.indexOf('return;}',begin)+8;
s=s.slice(0,begin)+`if(spriteAtlas){const atlas=type==='hero'&&equipmentAtlas?equipmentAtlas:spriteAtlas;let index=type==='hero'?(equipmentAtlas?appearance.weapon+(appearance.armor>0?3:0):0):type==='walker'?2:type==='runner'?3:type==='tank'?4:5;const size=110*scale;g.save();g.translate(Math.round(x),Math.round(y));g.fillStyle='#0b140d55';g.beginPath();g.ellipse(0,0,size*.2,size*.06,0,0,Math.PI*2);g.fill();g.scale(face,1);if(flash)g.globalAlpha=.65;drawRig(g,atlas,index,size,t,moving,running,type);g.restore();return;}`+s.slice(end);
writeFileSync('art.js',s);
