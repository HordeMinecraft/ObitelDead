import {readFileSync as read,writeFileSync as write} from 'node:fs';
let g=read('game.js','utf8');
g="import {requestAPI} from './client-api.js';\n"+g;
const start=g.indexOf('async function api('),end=g.indexOf('\nasync function action',start);
g=g.slice(0,start)+`async function api(path,body){const data=await requestAPI(path,body);if(data.save){save=data.save;persist()}if(data.serverTime)serverOffset=data.serverTime-Date.now();return data}
async function connect(){const status=$('.connection');status.textContent='ПОДКЛЮЧЕНИЕ…';try{await api('profile');networkReady=true;status.innerHTML='<i></i> СЕРВЕР НА СВЯЗИ';$('#connection-error').hidden=true}catch(e){networkReady=false;status.textContent='НЕТ СВЯЗИ';$('#connection-error').hidden=false;$('#connection-message').textContent=e.message}refresh()}
`+g.slice(end);
g=g.replace("if(busy)return;busy=true;", "if(busy)return;if(!networkReady){toast('Сначала подключись к игровому серверу');return}busy=true;");
g=g.replace("await loadArt();try{await api('profile');networkReady=true}catch(e){toast('Нет связи с игровым сервером. Перезапусти сервер.')}refresh();", "$('#retry-connection').onclick=connect;await loadArt();await connect();");
g=g.replace("location.origin+'/?raid='+raid.id", "location.origin+location.pathname+'?raid='+raid.id");
write('game.js',g);
let html=read('index.html','utf8');
html=html.replace('<main>','<main><div id="connection-error" class="connection-error" hidden><div><b>Связь с убежищем потеряна</b><p id="connection-message"></p></div><button class="secondary" id="retry-connection">ПОДКЛЮЧИТЬСЯ</button></div>');
write('index.html',html);
for(const f of ['build.mjs','server.mjs']){let s=read(f,'utf8');s=f==='build.mjs'?s.replace("'config.js',","'config.js','client-api.js',"):s.replace('config\\.js|','config\\.js|client-api\\.js|');write(f,s)}
