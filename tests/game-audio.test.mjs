import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createGameAudio,SFX} from '../game-audio.js';
class Context {
 state='suspended';currentTime=0;destination={};sources=[];
 createGain(){return {gain:{value:0},connect(){},disconnect(){}}}
 createBufferSource(){const source={playbackRate:{value:1},connect(){},disconnect(){},start(){this.started=true},stop(){this.stopped=true}};this.sources.push(source);return source}
 async resume(){this.state='running'}async suspend(){this.state='suspended'}async decodeAudioData(){return {duration:.2}}
}
test('audio remains gesture locked and muting/hidden views stop every voice',async()=>{
 const context=new Context();let requests=0,visible=true;
 const audio=createGameAudio({Context:class{constructor(){return context}},visible:()=>visible,fetcher:async()=>{requests++;return {ok:true,arrayBuffer:async()=>new ArrayBuffer(1)}}});
 assert.equal(audio.play('shot'),false);assert.equal(requests,0);await audio.unlock();assert.equal(requests,Object.keys(SFX).length);assert.equal(audio.play('shot'),true);assert.equal(audio.play('shot'),false,'rapid duplicates are throttled');audio.set({sound:false,soundVolume:.2});assert.equal(context.sources[0].stopped,true);assert.equal(audio.play('step'),false);audio.set({sound:true,soundVolume:2});assert.equal(audio.state().volume,1);
 audio.hold(true);assert.equal(audio.play('wood'),false);audio.hold(false);assert.equal(audio.play('wood'),false,'resume requires another gesture');await audio.unlock();assert.equal(audio.play('wood'),true);visible=false;assert.equal(audio.play('fire'),false);audio.stop();assert.equal(audio.state().voices,0);
});
test('failed or unavailable audio does not throw or affect gameplay; failed downloads retry',async()=>{
 let fail=true;const audio=createGameAudio({Context,fetcher:async()=>{if(fail)throw new Error('offline');return {ok:true,arrayBuffer:async()=>new ArrayBuffer(1)}}});await audio.unlock();assert.equal(audio.play('shot'),false);fail=false;await audio.unlock();assert.equal(audio.play('shot'),true);
 const unsupported=createGameAudio({Context:null});await unsupported.unlock();assert.equal(unsupported.play('shot'),false);
});
test('downloaded WAV clips contain audio, support PCM decoding and fit a mobile byte budget',()=>{
 let total=0;for(const name of Object.keys(SFX)){const b=readFileSync(new URL('../assets/sfx-'+name+'.wav',import.meta.url));assert.equal(b.toString('ascii',0,4),'RIFF');assert.equal(b.toString('ascii',8,12),'WAVE');assert.equal(b.readUInt16LE(20),1,'PCM WAV');assert.equal(b.readUInt16LE(22),1,'mono');assert.equal(b.readUInt32LE(24),22050);assert.ok(b.subarray(78).some(n=>n!==0));total+=b.length;}assert.ok(total<230000,'ten short effects stay below 230 KB');
});
