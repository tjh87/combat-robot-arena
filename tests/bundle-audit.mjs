import assert from 'node:assert/strict';
import {readFileSync,readdirSync,writeFileSync,statSync} from 'node:fs';
import {join} from 'node:path';
import {createHash} from 'node:crypto';

const files=readdirSync('dist',{recursive:true}).filter(file=>statSync(join('dist',file)).isFile());
assert(files.every(file=>file==='index.html'||file==='favicon.svg'||file==='audio/License.txt'||file==='audio/match-start.mp3'||/^audio\/landing_(light_01|heavy_0[1-2])\.mp3$/.test(file)||/^audio\/steel_(crash_0[1-3]|strike_0[1-3]|tap_0[1-2])\.mp3$/.test(file)||/^robots\/(tombstone|minotaur|hydra|icewave|hypershock|gigabyte|whyachi|huge|sawblaze|deep_six|quantum)\.png$/.test(file)||/^assets\/(index|physics|graphics)-[\w-]+\.(js|css)$/.test(file)));
assert.equal(files.filter(file=>file.endsWith('.mp3')).length,12);
assert(readFileSync('dist/audio/License.txt','utf8').includes('CC0'));
assert.equal(files.filter(file=>file.startsWith('robots/')).length,11);
for(const file of files.filter(file=>file.startsWith('robots/'))){const bytes=readFileSync(join('dist',file));assert(bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])),file+' must be a valid PNG');}
assert(!files.some(file=>file.endsWith('.mp4')),'No video is shipped');
const html=readFileSync('dist/index.html','utf8');
const references=[...html.matchAll(/(?:src|href)="([^"]+)"/g)].map(match=>match[1]);
assert(references.length>=3);
for(const reference of references){assert(reference.startsWith('/')&&!reference.startsWith('//'));assert(files.includes(reference.slice(1)),reference);}
const scripts=files.filter(file=>file.endsWith('.js')),js=scripts.map(file=>readFileSync(join('dist',file),'utf8')).join('\n');
assert.equal(scripts.length,3,'Game, graphics and physics use separate local chunks');
for(const file of scripts){const code=readFileSync(join('dist',file),'utf8');for(const [,chunk]of code.matchAll(/from\s*["']\.\/([^"']+\.js)["']/g))assert(files.includes('assets/'+chunk),'Missing local module: '+chunk);}
assert(!/__review|offline-test\.invalid|Injected graphics initialization failure|jsdom/.test(js));
const offset=js.indexOf('AGFzbQ');assert(offset>=0,'The local physics WASM must be embedded');
const encoded=js.slice(offset).match(/^[A-Za-z0-9+/=]+/)[0],wasm=Buffer.from(encoded,'base64');
assert(WebAssembly.validate(wasm),'The embedded WASM must be valid');
const result={status:'passed',assetReferences:references,embeddedWasmBytes:wasm.length,testFixturesExcluded:true,files:files.map(file=>({path:file,bytes:statSync(join('dist',file)).size,sha256:createHash('sha256').update(readFileSync(join('dist',file))).digest('hex')}))};
writeFileSync('docs/bundle-audit.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
