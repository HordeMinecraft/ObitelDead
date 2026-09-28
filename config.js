// PHP transport forwards to the existing Worker and D1; no new game database.
const CLOUD_API=location.hostname==='hordeminecraft.github.io'
 ? 'https://api.hordeminecraft.ru/obitel-gateway.php/'
 : 'https://obiteldead.deniswww127.workers.dev/api/';

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
