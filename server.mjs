import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {createService} from './raid-service.js';
const root=process.cwd();
const api=createService(resolve(root,'.data'));
http.createServer(async(req,res)=>{try{const url=new URL(req.url,'http://'+req.headers.host);if(await api(req,res,url))return;let target=url.pathname==='/'?'/index.html':decodeURIComponent(url.pathname);if(!/^\/(index\.html|style\.css|theme\.css|beta-theme\.css|mobile-clans\.css|visual-theme\.css|conflict-ui\.js|rare-raids\.js|vehicles\.js|garage-ui\.js|clans-ui\.js|profile-ui\.js|game\.js|game-boot\.js|startup\.js|config\.js|client-api\.js|platform\.js|friends-ui\.js|art\.js|balance\.js|assets\/[a-zA-Z0-9._-]+)$/.test(target)){res.writeHead(404).end();return}const path=resolve(root,'.'+target);if(!path.startsWith(root+sep)){res.writeHead(403).end();return;}const body=await readFile(path);res.writeHead(200,{'Content-Type':({'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.png':'image/png'})[extname(path)]||'application/octet-stream','Cache-Control':'no-store'});res.end(body);}catch{res.writeHead(404).end('Not found');}}).listen(Number(process.env.PORT||4173),'127.0.0.1',()=>console.log('Обитель Мёртвых: http://127.0.0.1:4173'));
