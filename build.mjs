import {mkdirSync,cpSync,writeFileSync} from 'node:fs';
import {build} from 'esbuild';
mkdirSync('dist/client',{recursive:true});mkdirSync('dist/server',{recursive:true});
for(const file of ['index.html','style.css','theme.css','beta-theme.css','game.js','config.js','client-api.js','art.js','balance.js','assets'])cpSync(file,'dist/client/'+file,{recursive:true});
await build({entryPoints:['worker.js'],outfile:'dist/server/index.js',bundle:true,format:'esm',platform:'browser',target:'es2022'});
writeFileSync('dist/server/package.json',JSON.stringify({type:'module',main:'index.js'}));
