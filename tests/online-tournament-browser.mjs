import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.env.RUNNER_TEMP+'/browser/node_modules/playwright/index.mjs').href);
await mkdir('browser-evidence',{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-gpu-sandbox']});
const contexts=[],pages=[],errors=[];let stage='startup';
const base='http://127.0.0.1:4173/';
async function page(game=true){
 const context=await browser.newContext({viewport:{width:1280,height:720}});contexts.push(context);const p=await context.newPage();pages.push(p);p.on('pageerror',e=>errors.push(String(e)));
 if(game){await p.addInitScript(()=>{localStorage.setItem('cra.preferences',JSON.stringify({quality:'low',reduced:true}));window.__arenaTools=new Map();Object.defineProperty(document,'modelContext',{value:{registerTool:t=>window.__arenaTools.set(t.name,t)},configurable:true});const raf=requestAnimationFrame.bind(window),pending=[];window.__freezeFrame=true;window.__resumeFrames=()=>{window.__freezeFrame=false;for(const cb of pending.splice(0))raf(cb);};window.requestAnimationFrame=cb=>raf(t=>{if(window.__freezeFrame)pending.push(cb);else cb(t);});const send=WebSocket.prototype.send;WebSocket.prototype.send=function(raw){let data=raw;if(typeof raw==='string'){try{const message=JSON.parse(raw);if(message.type==='create'){message.hazards=false;data=JSON.stringify(message);}}catch{}}return send.call(this,data);};});await p.goto(base,{waitUntil:'domcontentloaded',timeout:90000});await p.waitForFunction(()=>window.__arenaTools.has('read_arena_status'),undefined,{timeout:90000,polling:100});}
 else{await p.goto(base+'mode-fixture.html');await p.waitForFunction(()=>window.fixtureReady,undefined,{timeout:90000});}
 return p;
}
const status=p=>p.evaluate(()=>window.__arenaTools.get('read_arena_status').execute());
async function until(p,predicate,ms=30000){const end=Date.now()+ms;while(Date.now()<end){const s=(await status(p)).online;if(predicate(s))return s;await p.waitForTimeout(100);}throw Error('No progression: '+JSON.stringify((await status(p)).online));}
try{
 const a=await page();
 await a.locator('[data-nav="builder"]').click({force:true});await a.locator('#builder-preset').selectOption('10');await a.locator('#kit-role').selectOption('weapon');await a.locator('#kit-template').selectOption('10');await a.locator('#install-kit').click({force:true});await a.locator('#build-name').fill('Tournament Custom');await a.locator('#save-build').click({force:true});await a.locator('#builder-back').click({force:true});
 await a.locator('[data-nav="online"]').click({force:true});await a.waitForFunction(()=>document.querySelector('#online-connection')?.textContent.startsWith('connected'),undefined,{timeout:30000,polling:100});
 const saved=await a.locator('#online-saved-robot option').evaluateAll(options=>options.find(o=>o.textContent==='Tournament Custom')?.value);assert(saved);await a.locator('#online-saved-robot').selectOption(saved);
 await a.locator('#online-create-tournament').click({force:true});await a.waitForFunction(()=>document.querySelector('.online-room-number'),undefined,{timeout:30000,polling:100});const code=(await a.locator('.online-room-number').textContent()).trim();
 const b=await page();await b.locator('[data-nav="online"]').click({force:true});await b.waitForFunction(()=>document.querySelector('#online-connection')?.textContent.startsWith('connected'),undefined,{timeout:30000,polling:100});await b.locator('[data-online-robot="2"]').click({force:true});await b.locator('#online-code').fill(code);await b.locator('#online-join').click({force:true});await b.waitForFunction(()=>document.querySelector('.online-room-number'),undefined,{timeout:30000,polling:100});
 for(let i=2;i<8;i++){
  const p=await page(false);await p.evaluate(async({code,index})=>{
   const m=window.fixture,c=new m.RoomConnection(()=>m.preset(index%11),()=> 'Driver '+index);window.client=c;window.rooms=[];window.frames=[];window.clientErrors=[];const repairs=new Set();
   c.onRoom=room=>{window.rooms.push({phase:room.phase,round:room.round,current:room.current,champion:room.champion,rounds:room.rounds});if(room.phase==='repair'&&!repairs.has(room.round)&&room.rounds[room.round].some(match=>match.winner===c.guest)&&!room.entrants.find(p=>p.id===c.guest)?.repairDone){repairs.add(room.round);c.send({type:'repair'});}};
   c.onFrame=frame=>{const room=c.room,match=room?.rounds[room.round]?.[room.current],side=match?.a===c.guest?0:match?.b===c.guest?1:-1;if(side>=0&&frame.phase==='fight'&&frame.match===match.id)c.send({type:'input',match:frame.match,seq:Math.max(frame.ack[side],window.controlSeq??0)+1,left:1,right:1,actions:[]}),window.controlSeq=Math.max(frame.ack[side],window.controlSeq??0)+1;window.frames.push({match:frame.match,tick:frame.tick,phase:frame.phase});if(window.frames.length>20)window.frames.shift();};c.onError=e=>window.clientErrors.push(e);
   await c.connect();const end=Date.now()+30000;while(c.state!=='connected'&&Date.now()<end)await new Promise(r=>setTimeout(r,50));if(c.state!=='connected')throw Error('Socket did not connect');c.join(code);
  },{code,index:i});await p.waitForFunction(()=>window.client.room,undefined,{timeout:30000});await p.evaluate(()=>window.client.send({type:'ready',ready:true}));
 }
 await a.locator('#online-ready').click({force:true});await b.locator('#online-ready').click({force:true});await a.waitForFunction(()=>document.querySelectorAll('.online-players li').length===8&&[...document.querySelectorAll('.online-players li')].every(e=>e.textContent.includes('READY')),undefined,{timeout:30000,polling:100});await a.locator('#online-start').click({force:true});
 stage='seven native fights';const first=await until(a,s=>s.framePhase==='fight');let customSeen=first.robots.includes('Tournament Custom'),spectatorChecks=0;const followed=new Map();
 const transitions=[],driven=new Map();const end=Date.now()+600000;let last='';
 while(Date.now()<end){
  const s=(await status(a)).online;customSeen ||=s.robots?.includes('Tournament Custom')??false;
  if(s.phase!==last){transitions.push({phase:s.phase,tick:s.tick,side:s.side});last=s.phase;}
  for(const p of[a,b]){const driver=(await status(p)).online;if(driver.side<0&&driver.framePhase==='fight'&&followed.get(p)!==driver.match){assert.equal(driver.viewer,0,'A new spectator match resets to the first robot');await p.locator('#online-follow').click({force:true});const next=(await status(p)).online;assert.equal(next.viewer,1);assert.equal(await p.locator('#gauge-name').textContent(),next.robots[1]);followed.set(p,driver.match);spectatorChecks++;}if(driver.side>=0&&driver.framePhase==='fight'&&driven.get(p)!==driver.match){await p.keyboard.up('ArrowUp');await p.keyboard.down('ArrowUp');driven.set(p,driver.match);}if(await p.locator('#online-repair').count())await p.locator('#online-repair').click({force:true});}
  if(s.phase==='finished')break;
  await a.waitForTimeout(500);
 }
 const complete=(await status(a)).online;assert(customSeen,'The saved robot must enter its physical quarterfinal');assert(spectatorChecks>0);assert.equal(complete.phase,'finished',JSON.stringify({complete,transitions}));
 await until(a,s=>!!s.result,30000);assert(await a.locator('.online-result-card').count());
 assert((await a.locator('.online-bracket section').count())===3);assert(/Champion:/.test(await a.locator('#sidebar').textContent()));
 for(const p of pages.slice(2)){assert.deepEqual(await p.evaluate(()=>window.clientErrors),[]);const last=await p.evaluate(()=>window.client.room);assert.equal(last.phase,'finished');assert.deepEqual(last.rounds.map(r=>r.length),[4,2,1]);assert(last.rounds.flat().every(m=>m.status==='finished'&&m.winner&&m.result?.reason!=='Disconnect forfeit'));}
 stage='spectator render';await a.bringToFront();await a.evaluate(()=>window.__resumeFrames());await until(a,s=>s.renderedTick>=complete.tick,60000);await a.evaluate(()=>window.__freezeFrame=true);
 assert.deepEqual(errors,[]);await writeFile('browser-evidence/online-tournament.json',JSON.stringify({status:'passed',source:process.env.GITHUB_SHA,code,savedRobot:'Tournament Custom',customSeen,spectatorChecks,completedMatches:7,transitions,complete,errors},null,2));console.log('PASS native eight-seat tournament, saved robot, seven matches, repairs, spectator progression, result, and champion');
}catch(error){await writeFile('browser-evidence/online-tournament-failure.json',JSON.stringify({stage,error:String(error),errors},null,2));throw error;}
finally{await Promise.all(contexts.map(c=>c.close()));await browser.close();}
