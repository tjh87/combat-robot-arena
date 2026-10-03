import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.env.RUNNER_TEMP+'/browser/node_modules/playwright/index.mjs').href);
await mkdir('browser-evidence',{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-gpu-sandbox']});
const page=await browser.newPage({viewport:{width:1600,height:1000}}),errors=[],failedRequests=[];
page.on('pageerror',e=>errors.push(String(e)));page.on('requestfailed',r=>failedRequests.push({url:r.url(),failure:r.failure()}));
await page.addInitScript(()=>{window.__arenaTools=new Map();Object.defineProperty(document,'modelContext',{value:{registerTool(tool){window.__arenaTools.set(tool.name,tool);}},configurable:true});});
try{
 await page.goto(process.env.BASE_URL??'http://127.0.0.1:4173/',{waitUntil:'networkidle'});
 await page.waitForFunction(()=>window.__arenaTools.has('read_arena_status'),{timeout:90000});
 const status=()=>page.evaluate(()=>window.__arenaTools.get('read_arena_status').execute());
 const initial=await status();assert.equal(initial.state,'menu');
 await page.locator('#open-settings').click();await page.locator('#quality').selectOption('low');await page.locator('#pref-reduced').check();await page.locator('#close-settings').click();
 await page.locator('[data-preset="8"]').click();assert.equal((await status()).name,'SawBlaze');
 await page.locator('[data-nav="builder"]').click();await page.waitForFunction(()=>document.querySelector('#totals')?.textContent.includes('LEGAL HEAVYWEIGHT'));
 await page.waitForTimeout(500);await page.screenshot({path:'browser-evidence/sawblaze-builder.png'});
 const graphic=await page.locator('#scene canvas').evaluate(canvas=>{const gl=canvas.getContext('webgl2')??canvas.getContext('webgl');if(!gl)throw Error('WebGL context is absent');const ext=gl.getExtension('WEBGL_debug_renderer_info');return{width:canvas.width,height:canvas.height,renderer:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER)};});
 assert(graphic.width>0&&graphic.height>0);
 await page.locator('#test-build').click();await page.waitForFunction(()=>document.querySelector('#timer-label')?.textContent==='PRACTICE',{timeout:30000});
 await page.keyboard.press('Space');await page.waitForTimeout(1200);await page.screenshot({path:'browser-evidence/sawblaze-practice.png'});
 let current=await status();if(current.state==='paused'&&await page.locator('#resume').count()){await page.locator('#resume').click();current=await status();}
 assert.equal(current.state,'practice');assert.deepEqual(current.errors,[]);assert(!await page.locator('#fault-message').count());
 await page.locator('#camera-button').click();await page.waitForTimeout(250);await page.screenshot({path:'browser-evidence/sawblaze-pov.png'});
 await page.locator('#fight-menu').click();if(await page.locator('#confirm-leave').count())await page.locator('#confirm-leave').click();
 assert.equal(errors.length,0,JSON.stringify(errors));assert.equal(failedRequests.length,0,JSON.stringify(failedRequests));
 const report={status:'passed',source:process.env.GITHUB_SHA,browser:'Chromium with actual WebGL through SwiftShader',graphics:graphic,robot:'SawBlaze',checks:['menu selection','legal builder','practice start','weapon input','POV switch','no JavaScript exceptions','no failed asset requests'],errors,failedRequests};
 await writeFile('browser-evidence/report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}finally{await browser.close();}
