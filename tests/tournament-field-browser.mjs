import assert from 'node:assert/strict';
const port=Number(process.env.CRA_CDP_PORT??9224);
const pages=await(await fetch(`http://127.0.0.1:${port}/json/list`)).json();
const target=pages.find(page=>page.type==='page');
const socket=new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve,reject)=>{socket.addEventListener('open',resolve,{once:true});socket.addEventListener('error',reject,{once:true});});
let id=0;const pending=new Map();
socket.addEventListener('message',event=>{const message=JSON.parse(event.data);if(message.id&&pending.has(message.id)){const item=pending.get(message.id);pending.delete(message.id);message.error?item.reject(new Error(message.error.message)):item.resolve(message.result);}});
const call=(method,params={})=>new Promise((resolve,reject)=>{const requestId=++id;pending.set(requestId,{resolve,reject});socket.send(JSON.stringify({id:requestId,method,params}));});
const evaluate=async expression=>{const result=await call('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(result.exceptionDetails)throw new Error(JSON.stringify(result.exceptionDetails));return result.result.value;};
const until=async(expression,label)=>{const deadline=Date.now()+90000;while(Date.now()<deadline){if(await evaluate(expression))return;await new Promise(resolve=>setTimeout(resolve,200));}throw new Error('Timed out: '+label);};
try{
 await call('Page.enable');
 for(const viewport of [{width:1280,height:720,rows:2},{width:800,height:450,rows:3}]){
  await call('Emulation.setDeviceMetricsOverride',{width:viewport.width,height:viewport.height,deviceScaleFactor:1,mobile:false});
  await call('Page.navigate',{url:process.env.CRA_PREVIEW_URL??'http://127.0.0.1:4173/'});
  await until("document.querySelector('#loading')?.classList.contains('hidden')",'game ready');
  await evaluate("document.querySelector('[data-nav=\"bracket\"]')?.click()");
  await until("document.querySelectorAll('[data-tournament-robot]').length===11",'full roster');
  const layout=await evaluate(`(()=>{const rail=document.querySelector('.tournament-roster-rail'),tiles=[...rail.children],rects=tiles.map(tile=>tile.getBoundingClientRect());return{rows:new Set(rects.map(r=>Math.round(r.top))).size,scrollWidth:rail.scrollWidth,width:rail.clientWidth,visible:rects.every(r=>r.top>=0&&r.bottom<=innerHeight&&r.left>=0&&r.right<=innerWidth),columns:getComputedStyle(rail).gridTemplateColumns};})()`);
  console.log('Layout',viewport,layout);
  assert.equal(layout.rows,viewport.rows);assert(layout.scrollWidth<=layout.width+1);assert(layout.visible,'Every robot must be visible in the viewport without scrolling');
 }
 await call('Emulation.setDeviceMetricsOverride',{width:1280,height:720,deviceScaleFactor:1,mobile:false});
 for(const opponents of [1,3,7]){
  if(opponents!==1){await evaluate("document.querySelector('#end-tournament')?.click();document.querySelector('[data-nav=\"bracket\"]')?.click()");await until("document.querySelectorAll('[data-tournament-opponents]').length===3",'size controls');}
  await evaluate(`document.querySelector('[data-tournament-difficulty="hard"]')?.click();document.querySelector('[data-tournament-opponents="${opponents}"]')?.click();document.querySelector('[data-tournament-robot="10"]')?.click()`);
  const setup=await evaluate("(()=>({size:document.querySelector('[data-tournament-opponents][aria-pressed=\"true\"]')?.dataset.tournamentOpponents,difficulty:document.querySelector('[data-tournament-difficulty][aria-pressed=\"true\"]')?.dataset.tournamentDifficulty,robot:document.querySelector('[data-tournament-robot][aria-pressed=\"true\"]')?.dataset.tournamentRobot,facts:[...document.querySelectorAll('.cup-intro-facts b')].map(el=>el.textContent)}))()");
  assert.equal(setup.size,String(opponents));assert.equal(setup.difficulty,'hard');assert.equal(setup.robot,'10');assert.deepEqual(setup.facts,[String(opponents+1),String(Math.log2(opponents+1)),'900']);
  await evaluate("document.querySelector('#start-tournament')?.click()");
  await until("document.querySelector('.cup-map')",'bracket');
  const bracket=await evaluate("(()=>({matches:document.querySelectorAll('.cup-match').length,stages:[...document.querySelectorAll('.cup-stage h3')].map(el=>el.textContent),robot:document.querySelector('.cup-entry.is-player strong')?.textContent,setting:document.querySelector('.cup-shell-header>span')?.textContent,links:document.querySelectorAll('.cup-path').length}))()");
  assert.equal(bracket.matches,opponents);assert.equal(bracket.stages.length,Math.log2(opponents+1));assert.match(bracket.robot,/Quantum/);assert.match(bracket.setting,/HARD AI/);assert.equal(bracket.links,opponents*2);
 }
 console.log('PASS live 2/3-row full-roster layout, 1/3/7 opponent options, persisted robot/difficulty selection, bracket stages and arrow counts');
}finally{socket.close();}
