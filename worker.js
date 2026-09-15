import {createHandler} from './domain.js';

// A revision-checked world snapshot keeps all beta economy/raid mutations atomic.
// No process memory is authoritative. Contention retries always reload D1 state.
export async function api(request,env){
 const url=new URL(request.url);
 const origin=request.headers.get('origin');
 const allowed=origin===url.origin||origin==='https://obitel.sourcecraft.site';
 if(origin&&!allowed)return Response.json({error:'Недопустимый источник запроса'},{status:403});
 const cors=new Headers({'Vary':'Origin','Access-Control-Allow-Methods':'GET, POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type, X-Obitel-Session','Access-Control-Expose-Headers':'X-Obitel-Session','Cache-Control':'no-store'});
 if(origin)cors.set('Access-Control-Allow-Origin',origin);
 if(request.method==='OPTIONS')return new Response(null,{status:204,headers:cors});
 if(!['GET','POST'].includes(request.method))return Response.json({error:'Метод не поддерживается'},{status:405});
 if(Number(request.headers.get('content-length')||0)>4096)return new Response(null,{status:413});
 const raw=await request.text();if(raw.length>4096)return new Response(null,{status:413});
 for(let attempt=0;attempt<8;attempt++){
  const row=await env.DB.prepare('SELECT data, revision FROM game_world WHERE id = ?').bind('beta').first();
  if(!row){await env.DB.prepare('INSERT OR IGNORE INTO game_world (id, data, revision) VALUES (?, ?, 0)').bind('beta',JSON.stringify({players:{},raids:{}})).run();continue}
  const db=JSON.parse(row.data),headers=new Headers(cors);let status=200,body='';
  const inbound=Object.fromEntries(request.headers);delete inbound.origin;
  const session=request.headers.get('x-obitel-session');
  if(session&&/^[a-f0-9]{32}$/.test(session))inbound.cookie='obitel_session='+session;
  const req={method:request.method,headers:inbound,async *[Symbol.asyncIterator](){yield raw}};
  const res={setHeader(k,v){if(k.toLowerCase()==='set-cookie'){headers.set('X-Obitel-Session',v.match(/session=([a-f0-9]{32})/)[1]);v=v.replace('SameSite=Strict','SameSite=None; Secure')}headers.set(k,v)},writeHead(s,h){status=s;for(const [k,v]of Object.entries(h))headers.set(k,v)},end(v){body=v}};
  await createHandler(db,()=>{},()=>crypto.randomUUID().replaceAll('-',''))(req,res,url);
  if(status>=400)return new Response(body,{status,headers});
  const committed=await env.DB.prepare('UPDATE game_world SET data = ?, revision = revision + 1 WHERE id = ? AND revision = ?').bind(JSON.stringify(db),'beta',row.revision).run();
  if(committed.meta.changes===1)return new Response(body,{status,headers});
 }
 return Response.json({error:'Сервер занят. Повтори через несколько секунд.'},{status:503,headers:{'Retry-After':'2'}});
}
export default {async fetch(request,env){try{const url=new URL(request.url);if(url.pathname.startsWith('/api/'))return await api(request,env);return await env.ASSETS.fetch(request)}catch{return Response.json({error:'Сервер временно недоступен'},{status:503})}}};
