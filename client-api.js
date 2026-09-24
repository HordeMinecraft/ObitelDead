import {API_BASE} from './config.js';
const tokenKey='obitel-session:'+API_BASE;
const crossOrigin=new URL(API_BASE).origin!==location.origin;
const tokenMode=crossOrigin||window.parent!==window;
let token='';try{token=localStorage.getItem(tokenKey)||''}catch{}
const reads=new Map();
export function requestAPI(path,body){
 if(body===undefined&&reads.has(path))return reads.get(path);
 const promise=performRequest(path,body);
 if(body===undefined){reads.set(path,promise);promise.then(()=>reads.delete(path),()=>reads.delete(path));}
 return promise;
}
async function performRequest(path,body){
 if(API_BASE.includes('PASTE-YOUR-WORKER-URL-HERE'))throw new Error('Игровой сервер ещё не настроен.');
 const authRequest=path==='auth/vk';
 const payload=authRequest?{...body,session:tokenMode?token:''}:body;
 const headers={};if(body!==undefined)headers['Content-Type']=authRequest?'text/plain;charset=UTF-8':'application/json';
 if(tokenMode&&token&&!authRequest)headers['X-Obitel-Session']=token;
 const controller=new AbortController(),started=performance.now();
 const timeout=setTimeout(()=>controller.abort(),15000);
 try{
  const response=await fetch(new URL(path,API_BASE),{method:body===undefined?'GET':'POST',headers,credentials:crossOrigin?'omit':'same-origin',body:body===undefined?undefined:JSON.stringify(payload),signal:controller.signal});
  if(!response.headers.get('content-type')?.includes('application/json'))throw new Error('Сервер вернул неверный ответ. Повтори позже.');
  const data=await response.json();
  if(!response.ok)throw Object.assign(new Error(data.error||'Сервер временно недоступен'),{status:response.status});
  const issued=response.headers.get('X-Obitel-Session');
  if(tokenMode&&issued&&/^[a-f0-9]{32}$/.test(issued)){if(path==='auth/vk'&&token&&token!==issued){try{localStorage.setItem(tokenKey+':previous',token)}catch{}}token=issued;try{localStorage.setItem(tokenKey,issued)}catch{}}
  const ms=Math.round(performance.now()-started);document.querySelector('.connection')?.setAttribute('title','Последний запрос: '+ms+' мс');
  return data;
 }catch(error){
  if(error?.name==='AbortError')throw new Error('Сервер отвечает дольше 15 секунд. Проверь связь и повтори попытку.');
  if(error instanceof TypeError)throw new Error('Не удалось связаться с игровым сервером ('+new URL(API_BASE).hostname+'). Код NETWORK_FETCH. Запрос: '+(path==='auth/vk'?'вход VK':path==='profile'?'профиль':'игровое действие')+'. Источник: '+location.origin+'. Режим: '+(window.parent!==window?'iframe':'страница')+'. Повтори подключение.');
  throw error;
 }finally{clearTimeout(timeout)}
}
