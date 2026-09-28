import http from 'node:http';
import {fileURLToPath} from 'node:url';

const upstream='https://obiteldead.deniswww127.workers.dev';
const frontend='https://hordeminecraft.github.io';

// Fixed upstream: the public request cannot choose another destination.
export function gateway(fetchUpstream=fetch){
 return async(req,res)=>{
  const origin=req.headers.origin;
  const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','Vary':'Origin','X-Content-Type-Options':'nosniff'};
  const reply=(status,data)=>res.writeHead(status,headers).end(JSON.stringify(data));
  if(origin&&origin!==frontend)return reply(403,{error:'Недопустимый источник запроса'});
  if(origin)headers['Access-Control-Allow-Origin']=origin;
  headers['Access-Control-Allow-Methods']='GET, POST, OPTIONS';
  headers['Access-Control-Allow-Headers']='Content-Type, X-Obitel-Session';
  headers['Access-Control-Expose-Headers']='X-Obitel-Session';
  const path=req.url||'';
  if(path.length>512||!/^\/api\/[a-z0-9/-]+$/i.test(path))return reply(404,{error:'Не найдено'});
  if(req.method==='OPTIONS')return res.writeHead(204,headers).end();
  if(!['GET','POST'].includes(req.method))return reply(405,{error:'Метод не поддерживается'});
  try{
   const chunks=[];let size=0;
   for await(const chunk of req){size+=chunk.length;if(size>8192)return reply(413,{error:'Слишком большой запрос'});chunks.push(chunk)}
   const forwarded={Origin:frontend};
   if(req.headers['content-type'])forwarded['Content-Type']=req.headers['content-type'];
   if(req.headers['x-obitel-session'])forwarded['X-Obitel-Session']=req.headers['x-obitel-session'];
   const response=await fetchUpstream(upstream+path,{method:req.method,headers:forwarded,body:req.method==='POST'?Buffer.concat(chunks):undefined,redirect:'error',signal:AbortSignal.timeout(12000)});
   if(!response.headers.get('content-type')?.includes('application/json'))return reply(502,{error:'Игровой сервер вернул неверный ответ'});
   const body=await response.text();
   const session=response.headers.get('x-obitel-session');
   if(session&&/^[a-f0-9]{32}$/.test(session))headers['X-Obitel-Session']=session;
   // No cookies, launch parameters, IP addresses or tokens are logged.
   res.writeHead(response.status,headers).end(body);
  }catch{
   if(!res.headersSent)reply(502,{error:'Нет связи шлюза с игровым сервером. Повтори подключение.'});
   else res.end();
  }
 };
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 const server=http.createServer(gateway());
 server.requestTimeout=15000;server.headersTimeout=10000;
 server.listen(Number(process.env.PORT||8080),'0.0.0.0');
}
