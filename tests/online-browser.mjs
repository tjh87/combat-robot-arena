import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.env.RUNNER_TEMP+'/browser/node_modules/playwright/index.mjs').href);
await mkdir('browser-evidence',{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-gpu-sandbox']});
const contexts=[],pages=[],errors=[],failed=[];
let stage='startup';
const deadline=setTimeout(()=>{void writeFile('browser-evidence/online-browser-failure.json',JSON.stringify({stage,error:'The browser test exceeded its four-minute deadline.',errors,failed},null,2)).finally(()=>process.exit(1));},240000);
async function page(){
 const context=await browser.newContext({viewport:{width:1280,height:720}});contexts.push(context);
 const p=await context.newPage();pages.push(p);
 p.on('pageerror',e=>errors.push(String(e)));p.on('requestfailed',r=>failed.push(r.url()));
 await p.addInitScript(()=>{
  window.__arenaTools=new Map();Object.defineProperty(document,'modelContext',{value:{registerTool(tool){window.__arenaTools.set(tool.name,tool);}},configurable:true});
  const raf=window.requestAnimationFrame.bind(window),pending=[];window.__freezeFrame=false;
  window.__resumeFrames=()=>{window.__freezeFrame=false;for(const cb of pending.splice(0))raf(cb);};
  window.requestAnimationFrame=cb=>raf(t=>{if(window.__freezeFrame)pending.push(cb);else cb(t);});
 });
 await p.goto('http://127.0.0.1:4173/',{waitUntil:'domcontentloaded',timeout:60000});
 await p.waitForFunction(()=>window.__arenaTools.has('read_arena_status'),undefined,{timeout:60000,polling:100});
 await p.locator('#open-settings').click();await p.locator('#quality').selectOption('low');await p.locator('#pref-reduced').check();await p.locator('#close-settings').click();
 await p.locator('[data-nav="online"]').click();
 await p.waitForFunction(()=>document.querySelector('#online-connection')?.textContent.startsWith('connected'),undefined,{timeout:30000,polling:100});
 return p;
}
const status=p=>p.evaluate(()=>window.__arenaTools.get('read_arena_status').execute());
const freeze=()=>Promise.all(pages.map(p=>p.evaluate(()=>window.__freezeFrame=true)));
const resume=()=>Promise.all(pages.map(p=>p.evaluate(()=>window.__resumeFrames())));
async function screenshot(p,name){console.log('Capture '+name);await freeze();await p.waitForTimeout(500);try{await p.screenshot({path:'browser-evidence/'+name+'.png',timeout:30000});}finally{await resume();}}
async function connected(p){await p.waitForFunction(async()=>{const s=await window.__arenaTools.get('read_arena_status').execute();return s.online?.state==='connected'&&s.online.framePhase==='fight'&&!s.online.result;},undefined,{timeout:30000,polling:100});}
try{
 const a=await page(),b=await page();stage='create and join';
 await a.locator('#online-name').fill('Alice');await a.locator('#online-robot').selectOption('2');await a.locator('#online-create-duel').click();
 await a.waitForFunction(()=>document.querySelector('.online-room-number'),undefined,{timeout:30000,polling:100});
 const code=(await a.locator('.online-room-number').textContent()).trim();assert(/^[1-9]\d{3}$/.test(code));
 await b.locator('#online-name').fill('Bob');await b.locator('#online-code').fill(code);await b.locator('#online-join').click();
 await b.waitForFunction(()=>document.querySelectorAll('.online-players li').length===2,undefined,{timeout:30000,polling:100});
 await a.locator('#online-ready').click();await b.locator('#online-ready').click();
 await a.waitForFunction(()=>[...document.querySelectorAll('.online-players li')].every(e=>e.textContent.includes('READY')),undefined,{timeout:30000,polling:100});
 stage='lobby screenshot';await screenshot(a,'online-lobby');stage='start fight';console.log('Start fight');await a.locator('#online-start').click();
 await a.waitForFunction(()=>document.querySelector('#online-clock')?.textContent.includes('LIVE'),undefined,{timeout:30000,polling:100});
 await b.waitForFunction(()=>document.querySelector('#online-clock')?.textContent.includes('LIVE'),undefined,{timeout:30000,polling:100});
 stage='owned controls without render frames';await freeze();await connected(a);await connected(b);
 const sa=await status(a),sb=await status(b);assert.equal(sa.online.side,0);assert.equal(sb.online.side,1);assert.equal(sa.online.viewer,0);assert.equal(sb.online.viewer,1);
 await a.keyboard.down('ArrowUp');await a.waitForTimeout(350);await a.keyboard.up('ArrowUp');await a.waitForTimeout(500);
 const movedA=(await status(a)).online;assert(movedA.ack[0]>sa.online.ack[0]);assert(Math.hypot(movedA.positions[0].x-sa.online.positions[0].x,movedA.positions[0].z-sa.online.positions[0].z)>.02);
 await b.keyboard.down('ArrowUp');await b.waitForTimeout(350);await b.keyboard.up('ArrowUp');await b.waitForTimeout(500);
 const movedB=(await status(b)).online;assert(movedB.ack[1]>sb.online.ack[1]);assert(Math.hypot(movedB.positions[1].x-sb.online.positions[1].x,movedB.positions[1].z-sb.online.positions[1].z)>.02);
 await a.locator('#online-camera').selectOption('pov');await b.locator('#online-camera').selectOption('pov');
 assert.equal((await status(a)).online.camera,'pov');assert.equal((await status(b)).online.camera,'pov');
 stage='refresh';const before=(await status(b)).online.tick;console.log('Before reload',JSON.stringify((await status(b)).online));
 await b.reload({waitUntil:'domcontentloaded',timeout:60000});
 await b.waitForFunction(()=>window.__arenaTools.has('read_arena_status'),undefined,{timeout:60000,polling:100});
 console.log('After startup',JSON.stringify((await status(b)).online));await connected(b);
 const resumed=await status(b);assert.equal(resumed.online.room,code);assert.equal(resumed.online.side,1);assert(resumed.online.tick>=before-2);
 await b.locator('#online-camera').selectOption('pov');await resume();await b.waitForTimeout(1000);
 stage='POV screenshots';await screenshot(a,'online-alice-pov');await screenshot(b,'online-bob-pov');
 stage='reconnected screenshot';await screenshot(b,'online-reconnected');assert.deepEqual(errors,[]);assert.deepEqual(failed.filter(url=>!url.includes('/api/online')),[]);
 await writeFile('browser-evidence/online-browser.json',JSON.stringify({status:'passed',source:process.env.GITHUB_SHA,browser:'Chromium / SwiftShader WebGL',roomDigits:4,twoBrowserContexts:true,ownedSides:[0,1],ownedMovement:true,controlsWithoutRenderFrames:true,ownedPov:true,resumedSeat:true,serverTickContinues:true,errors,failed},null,2));
 console.log('PASS two browsers, four-digit joining, own controls, own POV, and refresh recovery');
}catch(error){
 const details=await Promise.all(pages.map(p=>Promise.race([p.evaluate(async()=>({status:await window.__arenaTools?.get('read_arena_status')?.execute(),sidebar:document.querySelector('#sidebar')?.textContent,clock:document.querySelector('#online-clock')?.textContent})),new Promise(r=>setTimeout(()=>r({error:'Page diagnostics timed out.'}),5000))]).catch(e=>({error:String(e)}))));
 await writeFile('browser-evidence/online-browser-failure.json',JSON.stringify({stage,error:String(error),errors,failed,pages:details},null,2));throw error;
}finally{clearTimeout(deadline);await Promise.all(contexts.map(c=>c.close()));await browser.close();}
