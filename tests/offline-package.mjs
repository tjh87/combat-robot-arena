import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {readFile,writeFile} from 'node:fs/promises';
import {once} from 'node:events';
const child=spawn(process.execPath,['scripts/serve.mjs','--port=43173'],{stdio:['ignore','pipe','pipe']});
try{
 await Promise.race([new Promise((resolve,reject)=>{child.stdout.on('data',x=>{if(String(x).includes('Combat Robot Arena:'))resolve();});child.on('error',reject);child.on('exit',code=>reject(Error('Server exited '+code)));}),new Promise((_,reject)=>{const t=setTimeout(()=>reject(Error('Server startup timeout')),10000);t.unref();})]);
 const origin='http://127.0.0.1:43173',page=await fetch(origin+'/');assert.equal(page.status,200);const html=await page.text();
 const urls=[...html.matchAll(/(?:src|href)="([^"]+)"/g)].map(m=>m[1]);assert(urls.length>=3);
 for(const url of urls){assert(url.startsWith('/')&&!url.startsWith('//'));const r=await fetch(origin+url);assert.equal(r.status,200,url);assert(Number(r.headers.get('content-length'))>0);}
 assert.equal((await fetch(origin+'/robots/minotaur.png')).status,200);
 assert.equal((await fetch(origin+'/audio/steel_strike_01.mp3')).headers.get('content-type'),'audio/mpeg');
 assert.equal((await fetch(origin+'/package.json')).status,404);
 assert.equal((await fetch(origin+'/%2e%2e%2fpackage.json')).status,403);
 assert.equal((await fetch(origin+'/.env')).status,403);
 assert.equal((await fetch(origin+'/',{method:'POST'})).status,405);
 assert.equal((await fetch(origin+'/',{method:'HEAD'})).status,200);
 assert.equal(await (await fetch(origin+'/',{method:'HEAD'})).text(),'');
 const config=JSON.parse(await readFile('package.json'));assert(!JSON.stringify(config.scripts).includes('.codex'));assert(!JSON.stringify(config.scripts).includes('sites-preview'));
 const result={status:'passed',htmlAssets:urls.length,localRobotImage:true,localAudio:true,sourceFilesNotServed:true,traversalRejected:true,methodsChecked:['GET','HEAD','POST'],server:'127.0.0.1 only',webgl:'Manual browser check required'};
 await writeFile('handover/OFFLINE_VALIDATION.json',JSON.stringify(result,null,2)+'\n');console.log(result);
}finally{child.kill('SIGTERM');if(child.exitCode===null)await once(child,'exit');}
