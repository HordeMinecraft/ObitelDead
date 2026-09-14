import {createHandler} from './domain.js';

// A revision-checked world snapshot keeps all beta economy/raid mutations atomic.
// No process memory is authoritative. Contention retries always reload D1 state.
export async function api(request,env){
 const url=new URL(request.url);
 if(!['GET','POST'].includes(request.method))return Response.json({error:'Метод не поддерживается'},{status:405});
 if(request.headers.get('origin')&&request.headers.get('origin')!==url.origin)return Response.json({error:'Недопустимый источник запроса'},{status:403});
 if(Number(request.headers.get('content-length')||0)>4096)return new Response(null,{status:413});
 const raw=await request.text();if(raw.length>4096)return new Response(null,{status:413});
 for(let attempt=0;attempt<8;attempt++){
  const row=await env.DB.prepare('SELECT data, revision FROM game_world WHERE id = ?').bind('beta').first();
  if(!row){await env.DB.prepare('INSERT OR IGNORE INTO game_world (id, data, revision) VALUES (?, ?, 0)').bind('beta',JSON.stringify({players:{},raids:{}})).run();continue}
  const db=JSON.parse(row.data),headers=new Headers();let status=200,body='';
  const req={method:request.method,headers:Object.fromEntries(request.headers),async *[Symbol.asyncIterator](){yield raw}};
  const res={setHeader(k,v){headers.set(k,k.toLowerCase()==='set-cookie'?v.replace('SameSite=Strict','SameSite=None; Secure'):v)},writeHead(s,h){status=s;for(const [k,v]of Object.entries(h))headers.set(k,v)},end(v){body=v}};
  await createHandler(db,()=>{},()=>crypto.randomUUID().replaceAll('-',''))(req,res,url);
  if(status>=400)return new Response(body,{status,headers});
  const committed=await env.DB.prepare('UPDATE game_world SET data = ?, revision = revision + 1 WHERE id = ? AND revision = ?').bind(JSON.stringify(db),'beta',row.revision).run();
  if(committed.meta.changes===1)return new Response(body,{status,headers});
 }
 return Response.json({error:'Сервер занят. Повтори через несколько секунд.'},{status:503,headers:{'Retry-After':'2'}});
}
export default {async fetch(request,env){try{const url=new URL(request.url);if(url.pathname.startsWith('/api/'))return await api(request,env);return await env.ASSETS.fetch(request)}catch{return Response.json({error:'Сервер временно недоступен'},{status:503})}}};
