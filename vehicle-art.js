import {loadArtImage} from './art.js';

// Measured bounds in the original 1448 × 1086 atlas. Its rows are not a uniform grid.
export const VEHICLE_FRAMES=Object.freeze([
 [27,28,283,182],[396,33,255,173],[740,35,315,175],[1121,16,301,194],
 [32,242,293,163],[373,217,309,186],[740,242,319,163],[1103,221,315,186],
 [24,413,293,202],[364,420,326,192],[733,417,327,201],[1101,416,327,209],
 [19,619,326,212],[360,608,358,219],[743,648,307,186],[1098,655,328,169],
 [18,868,313,181],[360,828,358,227],[725,886,355,162],[1107,835,322,224]
].map(Object.freeze));

// Isolate the main silhouette so a nearby roof or antenna cannot leak into its frame.
export function vehicleSilhouette(pixels,width,height){
 const labels=new Int32Array(width*height),stack=new Int32Array(labels.length);
 let id=0,largest=0,size=0;
 for(let start=0;start<labels.length;start++){
  if(labels[start]||pixels[start*4+3]<=12)continue;
  id++;let count=0,head=1;stack[0]=start;labels[start]=id;
  while(head){const p=stack[--head],x=p%width,y=Math.floor(p/width);count++;
   for(let yy=Math.max(0,y-1);yy<=Math.min(height-1,y+1);yy++)for(let xx=Math.max(0,x-1);xx<=Math.min(width-1,x+1);xx++){
    const next=yy*width+xx;if(!labels[next]&&pixels[next*4+3]>12){labels[next]=id;stack[head++]=next;}
   }
  }
  if(count>size){largest=id;size=count;}
 }
 for(let p=0;p<labels.length;p++)if(!largest||labels[p]!==largest)pixels[p*4+3]=0;
 return pixels;
}

let atlasPromise;const frames=new Map();
function loadAtlas(){return atlasPromise??=loadArtImage('assets/vehicle-collection.png').catch(error=>{atlasPromise=null;throw error;});}
function vehicleFrame(image,index){
 if(frames.has(index))return frames.get(index);
 const bounds=VEHICLE_FRAMES[index];if(!bounds)return null;
 const [x,y,w,h]=bounds,frame=document.createElement('canvas');frame.width=w;frame.height=h;
 const ctx=frame.getContext('2d');ctx.drawImage(image,x,y,w,h,0,0,w,h);
 const pixels=ctx.getImageData(0,0,w,h);vehicleSilhouette(pixels.data,w,h);ctx.putImageData(pixels,0,0);
 frames.set(index,frame);return frame;
}
export async function paintVehicleArt(root){
 const canvases=[...root.querySelectorAll('canvas[data-vehicle-art]')];
 try{const image=await loadAtlas();for(const canvas of canvases){
  if(!canvas.isConnected)continue;const frame=vehicleFrame(image,Number(canvas.dataset.vehicleArt));if(!frame)continue;
  const ctx=canvas.getContext('2d'),scale=Math.min(canvas.width*.9/frame.width,canvas.height*.86/frame.height),w=frame.width*scale,h=frame.height*scale;
  ctx.clearRect(0,0,canvas.width,canvas.height);ctx.drawImage(frame,(canvas.width-w)/2,(canvas.height-h)/2,w,h);
 }}catch{console.warn('Vehicle artwork unavailable');}
}
