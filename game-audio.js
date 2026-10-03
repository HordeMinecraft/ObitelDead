export const SFX=Object.freeze({shot:.27,shotgun:.27,wood:.6,metal:.5,fire:.32,step:.23,hit:.5,click:.35,success:.45,error:.3});
export function createGameAudio({Context=globalThis.AudioContext||globalThis.webkitAudioContext,fetcher=globalThis.fetch,visible=()=>!globalThis.document?.hidden,onState=()=>{}}={}){
 let context,master,loading,activated=false,enabled=true,volume=.45,held=false;
 const buffers=new Map(),voices=new Set(),last=new Map();
 const state=()=>onState(!enabled?'off':!Context?'unavailable':held?'held':context?.state==='running'&&buffers.size?'ready':'waiting');
 const stop=()=>{for(const source of voices){try{source.stop()}catch{}}voices.clear();};
 const unlock=()=>{
  activated=true;if(!enabled||held||!visible()||!Context)return;
  try{
   if(!context){context=new Context();master=context.createGain();master.gain.value=volume;master.connect(context.destination)}
   if(context.state==='suspended')context.resume().then(state).catch(()=>{});
   if(!loading&&buffers.size!==Object.keys(SFX).length)loading=Promise.all(Object.keys(SFX).filter(name=>!buffers.has(name)).map(async name=>{try{const response=await fetcher(new URL('assets/sfx-'+name+'.wav',globalThis.document?.baseURI||'http://localhost/'));if(!response.ok)return;const buffer=await context.decodeAudioData(await response.arrayBuffer());buffers.set(name,buffer)}catch{}})).then(state).finally(()=>{loading=null});
   state();return loading;
  }catch{state()}
 };
 return {
  unlock,
  set({sound=true,soundVolume=.45}){enabled=sound!==false;volume=Math.max(0,Math.min(1,Number(soundVolume)||0));if(master)master.gain.value=volume;if(!enabled)stop();else if(activated)unlock();state()},
  play(name,{gain=1,rate=1}={}){
   if(!enabled||held||!visible()||context?.state!=='running'||!buffers.has(name)||voices.size>=8)return false;
   const time=context.currentTime,interval=name==='step'?.12:name==='shot'||name==='shotgun'?.06:.07;
   if(time-(last.get(name)??-100)<interval)return false;
   last.set(name,time);const source=context.createBufferSource(),level=context.createGain();
   source.buffer=buffers.get(name);source.playbackRate.value=Math.max(.8,Math.min(1.2,rate));level.gain.value=SFX[name]*Math.max(0,Math.min(1,gain));
   source.connect(level);level.connect(master);voices.add(source);source.onended=()=>{voices.delete(source);source.disconnect();level.disconnect()};source.start();return true;
  },
  hold(value){held=!!value;stop();if(held&&context?.state==='running')context.suspend().catch(()=>{});state()},
  stop,
  state:()=>({enabled,volume,activated,loaded:buffers.size,voices:voices.size,status:context?.state||'locked'})
 };
}
