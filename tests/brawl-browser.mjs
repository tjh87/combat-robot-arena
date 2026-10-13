import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {build} from 'esbuild';

// Run real menu, simulator, results and production CSS; stub WebGL only for deterministic layout.
const exposed=`globalThis.__brawlFixture={
 get ready(){return ready},get count(){return sim?.bots.length},get ffa(){return sim?.options.freeForAll},
 get names(){return sim.bots.map(b=>b.compiled.config.identity.name)},
 result(){sim.finish('Judges’ decision');showResult()},
 recoverHeld(){setState('fighting');sim.tick=1300;sim.bots[0].count=RULES.hz;input.held.add(prefs.controls[0].forward);recoverRobots();const cmd=input.sampleDevice(0);return{left:cmd.left,right:cmd.right,recovered:sim.bots[0].lastManualRecovery===sim.tick,aiMoved:sim.bots.slice(1).some(b=>b.lastManualRecovery===sim.tick)}},
 dispose(){input.dispose();audio.dispose();renderer?.dispose();sim?.dispose()}
};`;
const bundle=await build({entryPoints:['src/main.ts'],bundle:true,format:'iife',write:false,loader:{'.css':'empty'},plugins:[{name:'brawl-layout',setup(builder){
 builder.onLoad({filter:/src\/main\.ts$/},args=>({contents:readFileSync(args.path,'utf8')+exposed,loader:'ts',resolveDir:process.cwd()+'/src'}));
 builder.onResolve({filter:/^\.\/render$/},()=>({path:'layout-renderer',namespace:'fixture'}));
 builder.onLoad({filter:/layout-renderer/,namespace:'fixture'},()=>({contents:`export class ArenaRenderer{constructor(){this.quality='low';this.triangleCount=0;this.drawCalls=0;this.renderMs=0}attach(sim){this.sim=sim}setQuality(){}setAdaptive(){}showBuilder(){}startReplay(){}endReplay(){}replayFrame(){}update(){}draw(){}dispose(){}opponentIndicator(){return{visible:false}}projectCombatPoint(){return{visible:false}}robotWarningPosition(){return{visible:false}}}`}));
}}]});
const origin=process.env.CRA_PREVIEW_URL??'http://127.0.0.1:4173/';
const html=await(await fetch(origin)).text();
const css=[...html.matchAll(/href="([^\"]+\.css)"/g)].map(m=>new URL(m[1],origin).href);
assert(css.length);
const page=(await(await fetch('http://127.0.0.1:9224/json/list')).json()).find(p=>p.type==='page');
const socket=new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve,reject)=>{socket.addEventListener('open',resolve,{once:true});socket.addEventListener('error',reject,{once:true})});
let id=0;const pending=new Map();
socket.addEventListener('message',e=>{const m=JSON.parse(e.data);if(pending.has(m.id)){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(Error(m.error.message)):p.resolve(m.result)}});
const call=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;pending.set(n,{resolve,reject});socket.send(JSON.stringify({id:n,method,params}))});
const evaluate=async expression=>{const r=await call('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value};
const wait=async(expression,label)=>{for(let i=0;i<400;i++){if(await evaluate(expression))return;await new Promise(r=>setTimeout(r,100))}throw Error('Timed out: '+label)};
try{
 await call('Page.enable');
 for(const device of [{name:'Desktop',width:1280,height:720,mobile:false,ua:'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/130.0.0.0 Safari/537.36'},{name:'Android',width:844,height:390,mobile:true,ua:'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/130.0.0.0 Mobile Safari/537.36'},{name:'Small Android',width:640,height:360,mobile:true,ua:'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/130.0.0.0 Mobile Safari/537.36'}]){
  await call('Emulation.setUserAgentOverride',{userAgent:device.ua});
  await call('Emulation.setDeviceMetricsOverride',{width:device.width,height:device.height,deviceScaleFactor:1,mobile:device.mobile});
  await call('Emulation.setTouchEmulationEnabled',{enabled:device.mobile,maxTouchPoints:device.mobile?5:1});
  await call('Page.navigate',{url:origin});
  await wait('location.origin==='+JSON.stringify(new URL(origin).origin),'origin');
  await evaluate(`document.open();document.write('<!doctype html><html><head></head><body></body></html>');document.close();document.head.innerHTML=${JSON.stringify('<meta name="viewport" content="width=device-width,initial-scale=1"><base href="'+origin+'">'+css.map(url=>'<link rel="stylesheet" href="'+url+'">').join(''))};document.body.innerHTML='<div id="app"></div>';window.requestAnimationFrame=()=>1;window.cancelAnimationFrame=()=>{};`);
  await wait('document.styleSheets.length>0','CSS');
  await evaluate(bundle.outputFiles[0].text);
  await wait('window.__brawlFixture?.ready','physics/menu');
  for(const n of [1,2,3,4]){
   await evaluate(`document.querySelector('[data-mode="brawl"]').click();document.querySelector('[data-brawl-count="${n}"]').click();document.querySelector('#start').click()`);
   await wait(`__brawlFixture.count===${n+1}&&document.querySelectorAll('[data-brawl-card]').length===${n}`,'Brawl field');
   assert(await evaluate('__brawlFixture.ffa'));
   assert.equal(await evaluate('new Set(__brawlFixture.names).size'),n+1);
   const recovery=await evaluate('__brawlFixture.recoverHeld()');
   assert(recovery.recovered,'Player Unstick must find safe space');assert(recovery.left>0&&recovery.right>0,'Unstick must preserve held drive input');assert.equal(recovery.aiMoved,false,'Player Unstick must not teleport AI opponents');
   await evaluate('document.fonts.ready');
   if(device.mobile){
    const layout=await evaluate(`(()=>{const p=document.querySelector('.player-panel').getBoundingClientRect(),t=document.querySelector('.timer').getBoundingClientRect(),r=document.querySelector('#brawl-opponents').getBoundingClientRect();return{separated:p.right<=t.left+1&&t.right<=r.left+1,cards:[...document.querySelectorAll('[data-brawl-card]')].every(e=>{const b=e.getBoundingClientRect();return b.left>=0&&b.right<=innerWidth&&b.top>=0&&b.bottom<=innerHeight}),controls:!!document.querySelector('.touch-controls:not(.hidden)')}})()`);
    assert(layout.separated,'Player card, clock and roster must not overlap: '+device.name);
    assert(layout.cards);await wait("document.querySelector('.touch-controls:not(.hidden)')",'touch controls');
   }
   await evaluate('__brawlFixture.result()');
   if(device.mobile)await wait("getComputedStyle(document.querySelector('.touch-controls')).display==='none'",'touch controls hidden for results');
   assert.equal(await evaluate("document.querySelectorAll('.brawl-result-row').length"),n+1);
   const readability=await evaluate(`(()=>{const rows=[...document.querySelectorAll('.brawl-result-row')];return{rowSizes:rows.map(e=>parseFloat(getComputedStyle(e).fontSize)),nameSizes:rows.map(e=>parseFloat(getComputedStyle(e.querySelector('.brawl-result-machine strong')).fontSize)),hudName:parseFloat(getComputedStyle(document.querySelector('.brawl-hud-heading strong')).fontSize),hudHealth:parseFloat(getComputedStyle(document.querySelector('.brawl-hud-foot')).fontSize),blur:getComputedStyle(document.querySelector('.result-backdrop')).backdropFilter}})()`);
   assert(readability.rowSizes.every(size=>size>=14),'All result rows must be readable');
   assert.equal(new Set(readability.rowSizes).size,1,'Winner and opponent row typography must match');
   assert(readability.nameSizes.every(size=>size>=14));
   assert(readability.hudName>=(device.mobile?12:16));
   assert(readability.hudHealth>=(device.mobile?10:12));
   assert.equal(readability.blur,'none','Brawl results avoid live-canvas backdrop blur');
   if(process.env.CRA_CAPTURE_BRAWL&&n===4){const screenshot=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});writeFileSync('/home/ubuntu/screenshots/brawl-results-'+device.name.replaceAll(' ','-')+'.png',Buffer.from(screenshot.data,'base64'));}
   if(device.mobile)assert(await evaluate(`(()=>{const r=document.querySelector('.results').getBoundingClientRect();return r.left>=0&&r.right<=innerWidth+1&&r.top>=0&&r.bottom<=innerHeight+1&&[...document.querySelectorAll('.modal-actions button')].every(e=>{const b=e.getBoundingClientRect();return b.bottom<=innerHeight+1})})()`),'Mobile results/actions fit');
   await evaluate("document.querySelector('#rematch').click()");
   await wait(`__brawlFixture.count===${n+1}&&document.querySelector('.results')===null`,'rematch');
   await evaluate("document.querySelector('#fight-menu').click()");
   await wait("document.querySelector('#start')",'menu return');
   console.log('PASS',device.name,n,'opponents: selection, unique robots, HUD, results and rematch');
  }
  await evaluate("document.querySelector('[data-mode=\"ai\"]').click();document.querySelector('#start').click()");
  await wait('__brawlFixture.count===2&&!__brawlFixture.ffa','duel path');
  assert.equal(await evaluate("document.querySelectorAll('.player-panel').length"),2);
  console.log('PASS',device.name,'normal duel remains separate');
  await evaluate('__brawlFixture.dispose()');
 }
}finally{socket.close()}
