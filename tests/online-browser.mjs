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
 await p.waitForFunction(()=>window.__arenaTools.has('read_arena_status'),undefined,{timeout:60000});
 await p.locator('#open-settings').click();await p.locator('#quality').selectOption('low');await p.locator('#pref-reduced').check();await p.locator('#close-settings').click();
 await p.locator('[data-nav="online"]').click();
 await p.waitForFunction(()=>document.querySelector('#online-connection')?.textContent.startsWith('connected'),undefined,{timeout:30000});
 return p;
}
const status=p=>p.evaluate(()=>window.__arenaTools.get('read_arena_status').execute());
async function screenshot(p,name){
 console.log('Capture '+name);
 await Promise.all(pages.map(view=>view.evaluate(()=>window.__freezeFrame=true)));
 await p.waitForTimeout(500);
 try{await p.screenshot({path:'browser-evidence/'+name+'.png',timeout:30000});}
 finally{await Promise.all(pages.map(view=>view.evaluate(()=>window.__resumeFrames())));}
}
try{
 const a=await page(),b=await page();stage='create and join';
 await a.locator('#online-name').fill('Alice');await a.locator('#online-robot').selectOption('2');await a.locator('#online-create-duel').click();
 await a.waitForFunction(()=>document.querySelector('.online-room-number'),undefined,{timeout:30000});
 const code=(await a.locator('.online-room-number').textContent()).trim();assert(/^[1-9]\d{3}$/.test(code));
 await b.locator('#online-name').fill('Bob');await b.locator('#online-code').fill(code);await b.locator('#online-join').click();
 await b.waitForFunction(()=>document.querySelectorAll('.online-players li').length===2,undefined,{timeout:30000});
 await a.locator('#online-ready').click();await b.locator('#online-ready').click();
 await a.waitForFunction(()=>[...document.querySelectorAll('.online-players li')].every(e=>e.textContent.includes('READY')),undefined,{timeout:30000});
 stage='lobby screenshot';await screenshot(a,'online-lobby');stage='start fight';console.log('Start fight');await a.locator('#online-start').click();
 await a.waitForFunction(()=>document.querySelector('#online-clock')?.textContent.includes('LIVE'),undefined,{timeout:30000});
 await b.waitForFunction(()=>document.querySelector('#online-clock')?.textContent.includes('LIVE'),undefined,{timeout:30000});
 const sa=await status(a),sb=await status(b);assert.equal(sa.online.side,0);assert.equal(sb.online.side,1);
 stage='owned controls';await a.keyboard.down('ArrowUp');await a.waitForTimeout(1500);await a.keyboard.up('ArrowUp');
 await b.keyboard.down('ArrowUp');await b.waitForTimeout(1500);await b.keyboard.up('ArrowUp');
 await a.locator('#online-camera').selectOption('pov');await b.locator('#online-camera').selectOption('pov');
 assert.equal((await status(a)).online.camera,'pov');assert.equal((await status(b)).online.camera,'pov');
 stage='refresh';const before=(await status(b)).online.tick;console.log('Reload second player');
 await a.evaluate(()=>window.__freezeFrame=true);
 try{
  await b.reload({waitUntil:'domcontentloaded',timeout:60000});
  await b.waitForFunction(()=>window.__arenaTools.has('read_arena_status'),undefined,{timeout:60000});
  await b.waitForFunction(()=>document.querySelector('#online-clock')?.textContent.includes('LIVE'),undefined,{timeout:30000});
 }finally{await a.evaluate(()=>window.__resumeFrames());}
 const resumed=await status(b);assert.equal(resumed.online.room,code);assert.equal(resumed.online.side,1);assert(resumed.online.tick>=before-2);
 await b.locator('#online-camera').selectOption('pov');
 stage='POV screenshots';await screenshot(a,'online-alice-pov');await screenshot(b,'online-bob-pov');
 stage='reconnected screenshot';await screenshot(b,'online-reconnected');assert.deepEqual(errors,[]);assert.deepEqual(failed.filter(url=>!url.includes('/api/online')),[]);
 await writeFile('browser-evidence/online-browser.json',JSON.stringify({status:'passed',source:process.env.GITHUB_SHA,browser:'Chromium / SwiftShader WebGL',roomDigits:4,twoBrowserContexts:true,ownedSides:[0,1],ownedPov:true,resumedSeat:true,serverTickContinues:true,errors,failed},null,2));
 console.log('PASS two browsers, four-digit joining, own controls, own POV, and refresh recovery');
}catch(error){
 await writeFile('browser-evidence/online-browser-failure.json',JSON.stringify({stage,error:String(error),errors,failed},null,2));throw error;
}finally{clearTimeout(deadline);await Promise.all(contexts.map(c=>c.close()));await browser.close();}
