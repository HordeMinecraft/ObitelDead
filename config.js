// Публичный адрес API. После первого деплоя Cloudflare Worker замени только эту строку.
// Пример: https://obitel-dead-api.<твой-subdomain>.workers.dev/api/
const CLOUD_API='https://obiteldead.deniswww127.workers.dev/';

const isRemoteFrontend=
 location.hostname==='hordeminecraft.github.io'||
 location.hostname==='obitel.sourcecraft.site'||
 location.hostname.endsWith('.pages.dev');

const normalize=value=>value.endsWith('/')?value:value+'/';
const override=globalThis.OBITEL_API_BASE;
export const API_BASE=normalize(override||(
 isRemoteFrontend
  ? CLOUD_API
  : new URL('api/',location.href).href
));
