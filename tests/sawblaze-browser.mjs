import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.env.RUNNER_TEMP+'/browser/node_modules/playwright/index.mjs').href);
await mkdir('browser-evidence',{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-gpu-sandbox']});
const page=await browser.newPage({viewport:{width:1600,height:1000}}),errors=[],failedRequests=[],shaderErrors=[];
page.on('pageerror',e=>errors.push(String(e)));page.on('requestfailed',r=>failedRequests.push({url:r.url(),failure:r.failure()}));page.on('console',message=>{if(message.type()==='error'&&/shader|WebGLProgram|GL_INVALID/i.test(message.text()))shaderErrors.push(message.text());});
await page.addInitScript(()=>{const raf=window.requestAnimationFrame.bind(window),pending=[];window.__freezeFrame=false;window.__resumeFrames=()=>{window.__freezeFrame=false;for(const callback of pending.splice(0))raf(callback);};window.requestAnimationFrame=callback=>raf(time=>{if(window.__freezeFrame)pending.push(callback);else callback(time);});window.__arenaTools=new Map();Object.defineProperty(document,'modelContext',{value:{registerTool(tool){window.__arenaTools.set(tool.name,tool);}},configurable:true});});
async function snapshot(name){await page.evaluate(()=>window.__freezeFrame=true);await page.waitForTimeout(300);try{await page.screenshot({path:'browser-evidence/'+name+'.png',timeout:90000});}finally{await page.evaluate(()=>window.__resumeFrames());}}
const status=()=>page.evaluate(()=>window.__arenaTools.get('read_arena_status').execute());
const rpm=()=>page.evaluate(()=>Number((document.querySelector('#hud')?.textContent.match(/SPINNING\s*([\d,]+)\s*RPM/i)?.[1]??'0').replaceAll(',','')));
try{
 await page.goto('http://127.0.0.1:4173/',{waitUntil:'networkidle'});await page.waitForFunction(()=>window.__arenaTools.has('read_arena_status'),{timeout:90000});
 await page.locator('#open-settings').click();await page.locator('#quality').selectOption('low');await page.locator('#pref-reduced').check();await page.locator('#close-settings').click();
 await page.locator('[data-preset="8"]').click();assert.equal((await status()).name,'SawBlaze');await page.locator('[data-nav="builder"]').click();await page.waitForFunction(()=>document.querySelector('#totals')?.textContent.includes('LEGAL HEAVYWEIGHT'));await snapshot('sawblaze-builder');
 await page.locator('#open-settings').click();await page.locator('#pref-reduced').uncheck();await page.locator('#close-settings').click();await page.locator('#test-build').click();await page.waitForFunction(()=>document.querySelector('#timer-label')?.textContent==='PRACTICE');
 await snapshot('sawblaze-stopped');await page.keyboard.press('Space');
 const speeds=[];
 for(const [name,minimum]of[['low',250],['mid',1400],['high',4500]]){await page.waitForFunction(minimum=>Number((document.querySelector('#hud')?.textContent.match(/SPINNING\s*([\d,]+)\s*RPM/i)?.[1]??'0').replaceAll(',',''))>=minimum,minimum,{timeout:120000});speeds.push({band:name,rpm:await rpm()});await snapshot('sawblaze-'+name+'-rpm');}
 await page.keyboard.press('KeyQ');await page.waitForTimeout(1200);assert(!await page.locator('#fault-message').count());
 let current=await status();if(current.state==='paused'&&await page.locator('#resume').count()){await page.locator('#resume').click();current=await status();}assert.equal(current.state,'practice');assert.deepEqual(current.errors,[]);
 await page.locator('#camera-button').click();await snapshot('sawblaze-pov');
 assert.equal(errors.length,0,JSON.stringify(errors));assert.equal(shaderErrors.length,0,JSON.stringify(shaderErrors));assert.equal(failedRequests.length,0,JSON.stringify(failedRequests));
 const report={status:'passed',source:process.env.GITHUB_SHA,browser:'Chromium / SwiftShader WebGL',robot:'SawBlaze',speeds,checks:['approved builder assembly','stopped blade','three actual RPM bands','strike input','POV','no shader errors','no JavaScript exceptions','no failed assets']};await writeFile('browser-evidence/report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}finally{await browser.close();}
