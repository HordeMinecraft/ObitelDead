import {createHandler} from './domain.js';

const DEFAULT_ORIGINS=[
 'https://hordeminecraft.github.io',
 'https://obitel.sourcecraft.site',
 'http://127.0.0.1:4173',
 'http://localhost:4173'
];

function allowedOrigins(env){
 const extra=String(env.ALLOWED_ORIGINS||'').split(',').map(x=>x.trim()).filter(Boolean);
 return new Set([...DEFAULT_ORIGINS,...extra]);
}

function corsFor(request,env,url){
 const origin=request.headers.get('origin');
 const allowed=allowedOrigins(env);
 if(origin&&origin!==url.origin&&!allowed.has(origin))return null;
 const headers=new Headers({
  'Vary':'Origin',
  'Access-Control-Allow-Methods':'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers':'Content-Type, X-Obitel-Session',
  'Access-Control-Expose-Headers':'X-Obitel-Session',
  'Cache-Control':'no-store',
  'X-Content-Type-Options':'nosniff'
 });
 if(origin)headers.set('Access-Control-Allow-Origin',origin);
 return headers;
}

function json(data,status=200,headers){
 const h=new Headers(headers||{});h.set('Content-Type','application/json; charset=utf-8');
 return new Response(JSON.stringify(data),{status,headers:h});
}

export async function api(request,env){
 const url=new URL(request.url);
 const cors=corsFor(request,env,url);
 if(!cors)return json({error:'Недопустимый источник запроса'},403,{'Cache-Control':'no-store'});
 if(request.method==='OPTIONS')return new Response(null,{status:204,headers:cors});
 if(!['GET','POST'].includes(request.method))return json({error:'Метод не поддерживается'},405,cors);
 if(!env.DB)return json({error:'D1 не подключена к Worker'},503,cors);
 if(url.pathname==='/api/health'){
  try{await env.DB.prepare('SELECT 1').first();return json({ok:true,service:'obitel-api',time:Date.now()},200,cors)}
  catch(error){console.error('D1 health error',error);return json({ok:false,error:'База данных недоступна'},503,cors)}
 }
 if(Number(request.headers.get('content-length')||0)>8192)return new Response(null,{status:413,headers:cors});
 const raw=await request.text();if(raw.length>8192)return new Response(null,{status:413,headers:cors});
 for(let attempt=0;attempt<8;attempt++){
  const row=await env.DB.prepare('SELECT data, revision FROM game_world WHERE id = ?').bind('beta').first();
  if(!row){
   const initial={version:2,players:{},raids:{}};
   await env.DB.prepare('INSERT OR IGNORE INTO game_world (id, data, revision) VALUES (?, ?, 0)').bind('beta',JSON.stringify(initial)).run();
   continue;
  }
  let db;
  try{db=JSON.parse(row.data)}catch{db={version:2,players:{},raids:{}}}
  db.players??={};db.raids??={};db.version=2;
  const headers=new Headers(cors);let status=200,body='';
  const inbound=Object.fromEntries(request.headers);delete inbound.origin;
  const session=request.headers.get('x-obitel-session');
  if(session&&/^[a-f0-9]{32}$/.test(session))inbound.cookie='obitel_session='+session;
  const req={method:request.method,headers:inbound,async *[Symbol.asyncIterator](){if(raw)yield raw}};
  const res={
   setHeader(k,v){
    if(k.toLowerCase()==='set-cookie'){
     const cookie=String(v).replace('SameSite=Strict','SameSite=None; Secure');
     const token=cookie.match(/obitel_session=([a-f0-9]{32})/)?.[1];
     if(token)headers.set('X-Obitel-Session',token);
     headers.set('Set-Cookie',cookie);
     return;
    }
    headers.set(k,v);
   },
   writeHead(s,h){status=s;for(const [k,v]of Object.entries(h||{}))headers.set(k,v)},
   end(v=''){body=String(v)}
  };
  await createHandler(db,()=>{},()=>crypto.randomUUID().replaceAll('-',''))(req,res,url);
  if(status>=400)return new Response(body,{status,headers});
  const committed=await env.DB.prepare('UPDATE game_world SET data = ?, revision = revision + 1 WHERE id = ? AND revision = ?').bind(JSON.stringify(db),'beta',row.revision).run();
  if(committed.meta.changes===1)return new Response(body,{status,headers});
 }
 return json({error:'Сервер занят. Повтори через несколько секунд.'},503,new Headers([...cors,['Retry-After','2']]));
}

export default {
 async fetch(request,env){
  try{
   const url=new URL(request.url);
   if(url.pathname.startsWith('/api/'))return await api(request,env);
   return json({service:'obitel-api',ok:true,health:'/api/health'},200,{'Cache-Control':'no-store'});
  }catch(error){
   console.error('Worker error',error);
   return json({error:'Сервер временно недоступен'},503,{'Cache-Control':'no-store'});
  }
 }
};
