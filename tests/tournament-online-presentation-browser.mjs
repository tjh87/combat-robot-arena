import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.env.RUNNER_TEMP+'/browser/node_modules/playwright/index.mjs').href);
const base=process.env.ARENA_URL??'http://127.0.0.1:4173/';
await mkdir('browser-evidence',{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-gpu-sandbox']});
const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
page.setDefaultTimeout(90000);
page.on('pageerror',error=>errors.push(String(error)));
await page.addInitScript(()=>{localStorage.setItem('cra.preferences',JSON.stringify({quality:'low',reduced:true,replays:false}));window.__arenaTools=new Map();Object.defineProperty(document,'modelContext',{value:{registerTool:tool=>window.__arenaTools.set(tool.name,tool)},configurable:true});const raf=requestAnimationFrame.bind(window),pending=[];window.__freezeFrame=true;window.__resumeFrames=()=>{window.__freezeFrame=false;for(const cb of pending.splice(0))raf(cb);};window.requestAnimationFrame=cb=>raf(time=>{if(window.__freezeFrame)pending.push(cb);else cb(time);});});
async function click(selector){
 const button=page.locator(selector);
 await button.evaluate(element=>element.scrollIntoView({block:'center'}));
 assert(await button.isVisible());assert(await button.isEnabled());
 assert(await button.evaluate(element=>{const box=element.getBoundingClientRect(),hit=document.elementFromPoint(box.left+box.width/2,box.top+box.height/2);return hit===element||element.contains(hit);}),selector+' must receive pointer input');
 await button.click({force:true});
}
try{
 await page.goto(base,{waitUntil:'domcontentloaded',timeout:90000});
 await page.waitForFunction(()=>window.__arenaTools.has('read_arena_status'),undefined,{timeout:90000,polling:100});
 await click('[data-nav="online"]');
 await page.waitForFunction(()=>document.querySelector('#online-connection')?.textContent.startsWith('connected'),undefined,{timeout:60000,polling:100});
 await click('#online-create-tournament');
 await page.waitForFunction(()=>document.querySelector('.online-room-number'),undefined,{timeout:60000,polling:100});
 const code=(await page.locator('.online-room-number').textContent()).trim();
 await click('#online-ready');
 await page.waitForFunction(()=>document.querySelector('.online-players .ready-chip')?.textContent==='READY',undefined,{timeout:30000,polling:100});
 await click('#online-start');
 await page.waitForFunction(()=>document.querySelector('#online-bracket-open'),undefined,{timeout:60000,polling:100});
 assert.equal(await page.locator('.online-bracket section').count(),1,'Only the active quarterfinal round exists before advancement');
 const initial=await page.evaluate(()=>window.__arenaTools.get('read_arena_status').execute());
 await click('#online-bracket-open');
 assert.equal(await page.locator('#online-cup-map .cup-stage').count(),3);
 assert.equal(await page.locator('#online-cup-map .cup-entry[data-entry]').count(),8);
 assert.equal(await page.locator('#online-cup-map .cup-path').count(),12);
 assert.equal(await page.locator('#online-cup-map').getAttribute('data-reduced'),'true');
 assert.equal(await page.locator('#online-cup-map .cup-record').count(),8);
 await page.screenshot({path:'browser-evidence/native-online-cup.png',timeout:90000,animations:'disabled'});
 await click('#online-cup-close');
 assert.equal(await page.locator('#online-cup-map').count(),0);
 await page.waitForFunction(async()=>{const status=await window.__arenaTools.get('read_arena_status').execute();return status.online?.framePhase==='fight';},undefined,{timeout:60000,polling:100});
 await page.evaluate(()=>window.__resumeFrames());
 await page.waitForFunction(async()=>{const status=await window.__arenaTools.get('read_arena_status').execute();return status.online?.renderedTick>0;},undefined,{timeout:90000,polling:100});
 await page.evaluate(()=>window.__freezeFrame=true);
 const final=await page.evaluate(()=>window.__arenaTools.get('read_arena_status').execute());
 await page.keyboard.press('v');assert.equal(await page.locator('#hud').getAttribute('data-camera'),'tactical');await page.keyboard.press('v');assert.equal(await page.locator('#hud').getAttribute('data-camera'),'chase');assert.equal(await page.locator('#opponent-arrow svg').count(),1);assert.deepEqual(errors,[]);
 await writeFile('browser-evidence/native-online-cup.json',JSON.stringify({status:'passed',source:process.env.TESTED_SOURCE??process.env.GITHUB_SHA,url:base,code,initial,final,stages:3,entrants:8,paths:12,records:8,close:true,physicalFrame:true,keyboardV:true,redArrowhead:true,errors},null,2));
 console.log('PASS native online room, bracket records and paths, close control, and physical frame');
}catch(error){await writeFile('browser-evidence/native-online-cup-failure.json',JSON.stringify({error:String(error),errors,body:await page.locator('body').textContent().catch(()=>null)},null,2));throw error;}
finally{if(await page.locator('#online-exit').count())await page.locator('#online-exit').click({force:true}).catch(()=>{});await browser.close();}
