import {cpSync,mkdirSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
// Portable packaging fallback when the Sites plugin helper is unavailable.
mkdirSync('dist/.openai',{recursive:true});
cpSync('.openai/hosting.json','dist/.openai/hosting.json');
cpSync('drizzle','dist/.openai/drizzle',{recursive:true});
const result=spawnSync('tar',['-czf','beta.tar.gz','dist'],{stdio:'inherit'});
if(result.status!==0)process.exit(result.status||1);
