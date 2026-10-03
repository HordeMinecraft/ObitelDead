import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {VEHICLE_FRAMES,vehicleSilhouette} from '../vehicle-art.js';
import {VEHICLES} from '../vehicles.js';

test('every vehicle has explicit bounds inside the original atlas, including the touching trucks',()=>{
 const png=readFileSync(new URL('../assets/vehicle-collection.png',import.meta.url));
 const width=png.readUInt32BE(16),height=png.readUInt32BE(20);
 assert.deepEqual([width,height],[1448,1086]);assert.equal(VEHICLE_FRAMES.length,VEHICLES.length);
 for(const [x,y,w,h]of VEHICLE_FRAMES){assert.ok(x>=0&&y>=0&&w>0&&h>0&&x+w<=width&&y+h<=height);}
 const ark=VEHICLE_FRAMES[13],arctic=VEHICLE_FRAMES[17];assert.ok(ark[1]+ark[3]<=arctic[1]);
});
test('a neighbouring roof is removed without erasing a purple car or diagonal body pixels',()=>{
 const width=10,height=6,pixels=new Uint8ClampedArray(width*height*4);
 const paint=(x,y)=>pixels.set([190,40,200,255],(y*width+x)*4);
 for(let y=1;y<=3;y++)for(let x=1;x<=5;x++)paint(x,y);
 paint(6,4);paint(8,0);paint(9,0);
 vehicleSilhouette(pixels,width,height);
 assert.deepEqual([...pixels.slice((4*width+6)*4,(4*width+6)*4+4)],[190,40,200,255]);
 assert.equal(pixels[(0*width+8)*4+3],0);assert.equal(pixels[(0*width+9)*4+3],0);
 assert.equal(pixels[(2*width+3)*4+3],255);
});
