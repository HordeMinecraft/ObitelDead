// Only public endpoint addresses belong here. Never add access keys.
const staticHosts=['obitel.sourcecraft.site','hordeminecraft.github.io'];
export const API_BASE=staticHosts.includes(location.hostname)?'https://obitel-dead-beta.imdeantoo.chatgpt.site/api/':new URL('api/',location.href).href;
