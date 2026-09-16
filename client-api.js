import {API_BASE} from './config.js';
const tokenKey='obitel-session:'+API_BASE;
const crossOrigin=new URL(API_BASE).origin!==location.origin;
const tokenMode=crossOrigin||window.parent!==window;
let token='';try{token=localStorage.getItem(tokenKey)||''}catch{}

function configured(){return !API_BASE.includes('PASTE-YOUR-WORKER-URL-HERE')}

export async function requestAPI(path,body){
 if(!configured())throw new Error('API ещё не настроен. В config.js укажи адрес Cloudflare Worker.');
 const headers={};if(body!==undefined)headers['Content-Type']='application/json';
 if(tokenMode&&token)headers['X-Obitel-Session']=token;
 const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),15000);
 let response;
 try{
  response=await fetch(new URL(path,API_BASE),{
   method:body===undefined?'GET':'POST',headers,
   credentials:crossOrigin?'omit':'same-origin',
   body:body===undefined?undefined:JSON.stringify(body),signal:controller.signal
  });
 }catch(error){
  if(error?.name==='AbortError')throw new Error('Игровой сервер отвечает слишком долго. Повтори попытку.');
  throw new Error('Не удалось связаться с сервером. Проверь интернет и адрес API.');
 }finally{clearTimeout(timeout)}
 if(!response.headers.get('content-type')?.includes('application/json'))throw new Error('Игровой сервер вернул неверный ответ. Проверь адрес API.');
 const data=await response.json();if(!response.ok)throw new Error(data.error||'Сервер временно недоступен');
 const issued=response.headers.get('X-Obitel-Session');
 if(tokenMode&&issued&&/^[a-f0-9]{32}$/.test(issued)){token=issued;try{localStorage.setItem(tokenKey,issued)}catch{}}
 return data;
}
