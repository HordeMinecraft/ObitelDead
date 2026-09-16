import {randomBytes} from 'node:crypto';
import {mkdirSync,readFileSync,writeFileSync,renameSync} from 'node:fs';
import {join} from 'node:path';
import {createHandler} from './domain.js';
export function createService(dir){mkdirSync(dir,{recursive:true});const file=join(dir,'world.json');let db={players:{},raids:{}};try{db=JSON.parse(readFileSync(file,'utf8'))}catch(e){if(e.code!=='ENOENT')throw e}const commit=()=>{writeFileSync(file+'.tmp',JSON.stringify(db));renameSync(file+'.tmp',file)};return createHandler(db,commit,()=>randomBytes(16).toString('hex'))}
