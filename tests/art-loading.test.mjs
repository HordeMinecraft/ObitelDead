import test from 'node:test';
import assert from 'node:assert/strict';
import {loadArtImage} from '../art.js';

test('unsupported or missing WebP falls back to the existing PNG',async()=>{
 const attempts=[];
 class ImageStub{set src(value){attempts.push(value);queueMicrotask(()=>value.endsWith('.webp')?this.onerror():this.onload())}}
 assert.ok(await loadArtImage('assets/characters.png',ImageStub) instanceof ImageStub);
 assert.deepEqual(attempts,['assets/characters.webp','assets/characters.png']);
});
test('missing graphics rejects instead of leaving startup pending',async()=>{
 const attempts=[];
 class ImageStub{set src(value){attempts.push(value);queueMicrotask(()=>this.onerror())}}
 await assert.rejects(loadArtImage('assets/missing.png',ImageStub),/ART_LOAD/);
 assert.equal(attempts.length,2);
});
