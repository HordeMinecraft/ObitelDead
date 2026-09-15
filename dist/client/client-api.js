import {API_BASE} from './config.js';
const tokenKey='obitel-session:'+API_BASE;
const crossOrigin=new URL(API_BASE).origin!==location.origin;
let token='';try{token=localStorage.getItem(tokenKey)||''}catch{}
export async function requestAPI(path,body){
 const headers={};if(body!==undefined)headers['Content-Type']='application/json';
 if(crossOrigin&&token)headers['X-Obitel-Session']=token;
 let response;try{response=await fetch(new URL(path,API_BASE),{method:body===undefined?'GET':'POST',headers,credentials:crossOrigin?'omit':'same-origin',body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(15000)})}catch{throw new Error('Не удалось связаться с сервером. Проверь интернет и повтори подключение.')}
 if(!response.headers.get('content-type')?.includes('application/json'))throw new Error('Игровой сервер не подключён или требует входа. Прогресс не изменён.');
 const data=await response.json();if(!response.ok)throw new Error(data.error||'Сервер временно недоступен');
 const issued=response.headers.get('X-Obitel-Session');
 if(crossOrigin&&issued&&/^[a-f0-9]{32}$/.test(issued)){token=issued;try{localStorage.setItem(tokenKey,issued)}catch{}}
 return data;
}
