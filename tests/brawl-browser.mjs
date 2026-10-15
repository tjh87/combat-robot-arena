import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {build} from 'esbuild';

// Run real menu, simulator, results and production CSS; stub WebGL only for deterministic layout.
const exposed=`globalThis.__brawlFixture={
 get ready(){return ready},get count(){return sim?.bots.length},get ffa(){return sim?.options.freeForAll}, openingFilm(){const prior=state;setState('introduction');const scene=document.querySelector('#scene'),canvas=scene.querySelector('canvas'),grain=getComputedStyle(scene,'::after'),vignette=getComputedStyle(scene,'::before'),active=scene.classList.contains('opening-film'),result={active,grain:grain.backgroundImage.includes('data:image/svg+xml'),grainOpacity:grain.opacity,vignette:vignette.backgroundImage.includes('radial-gradient'),canvasFilter:getComputedStyle(canvas).filter};setState(prior);result.removed=!scene.classList.contains('opening-film')&&getComputedStyle(canvas).filter==='none';return result},
 get names(){return sim.bots.map(b=>b.compiled.config.identity.name)},
 randomDraws(){const original=Math.random;try{Math.random=()=>0;const first=brawlConfigs().slice(1).map(c=>c.identity.name);Math.random=()=>.9;const second=brawlConfigs().slice(1).map(c=>c.identity.name);return{first,second,player:build.identity.name}}finally{Math.random=original}},
 zeroHp(id=1){sim.bots[id].modules.chassis.hp=0;updateBrawlCard(sim.bots[id]);const card=document.querySelector('[data-brawl-card="'+id+'"]');return{zero:card.dataset.zeroHp,status:card.querySelector('[data-brawl-status]').textContent,health:card.querySelector('[data-brawl-health]').textContent}},
 damageCallouts(){state='fighting';for(const bot of sim.bots){const badge=document.querySelector('#damage-badge-'+bot.id);badge.dataset.damaged='true';}updateDamageWarnings();return sim.bots.map(bot=>{const badge=document.querySelector('#damage-badge-'+bot.id),r=badge.getBoundingClientRect(),point=renderer.robotWarningPosition(sim,bot.id);return{id:bot.id,visible:!badge.classList.contains('hidden'),side:badge.dataset.calloutSide,box:{left:r.left,top:r.top,right:r.right,bottom:r.bottom},robot:point.bounds}}).filter(item=>item.visible)},
 result(){const leader=sim.bots.length-1;sim.combatDamage.clear();sim.combatDamage.set('fixture-leader',{attacker:leader,target:0,module:'chassis',hp:750});sim.combatDamage.set('fixture-player',{attacker:0,target:leader,module:'chassis',hp:100});sim.highlights.robots.forEach((stats,id)=>stats.maxHeight=.4+id*.5);sim.finish('Judges’ decision');showResult()},
 recoverHeld(){setState('fighting');sim.tick=1300;sim.bots[0].count=RULES.hz;input.held.add(prefs.controls[0].forward);recoverRobots();const cmd=input.sampleDevice(0);return{left:cmd.left,right:cmd.right,recovered:sim.bots[0].lastManualRecovery===sim.tick,aiMoved:sim.bots.slice(1).some(b=>b.lastManualRecovery===sim.tick)}},
 dispose(){input.dispose();audio.dispose();renderer?.dispose();sim?.dispose()}
};`;
const bundle=await build({entryPoints:['src/main.ts'],bundle:true,format:'iife',write:false,loader:{'.css':'empty'},plugins:[{name:'brawl-layout',setup(builder){
 builder.onLoad({filter:/src\/main\.ts$/},args=>({contents:readFileSync(args.path,'utf8')+exposed,loader:'ts',resolveDir:process.cwd()+'/src'}));
 builder.onResolve({filter:/^\.\/render$/},()=>({path:'layout-renderer',namespace:'fixture'}));
 builder.onLoad({filter:/layout-renderer/,namespace:'fixture'},()=>({contents:`export class ArenaRenderer{constructor(container){this.container=container;this.canvas=document.createElement('canvas');container.appendChild(this.canvas);this.quality='low';this.triangleCount=0;this.drawCalls=0;this.renderMs=0}attach(sim){this.sim=sim}setQuality(){}setAdaptive(){}showBuilder(){}startReplay(){}endReplay(){}replayFrame(){}update(){}draw(){}dispose(){}opponentIndicator(){return{visible:false}}projectCombatPoint(){return{visible:false}}robotWarningPosition(sim,id){const x=innerWidth*(.13+.74*(id/Math.max(1,sim.bots.length-1))),y=innerHeight*(.42+(id%2)*.16);return{x:x/innerWidth*100,y:y/innerHeight*100,visible:true,bounds:{left:x-42,top:y-34,right:x+42,bottom:y+34}}}}`}));
}}]});
const origin=process.env.CRA_PREVIEW_URL??'http://127.0.0.1:4173/';
const html=await(await fetch(origin)).text();
const css=[...html.matchAll(/href="([^\"]+\.css)"/g)].map(m=>new URL(m[1],origin).href);
if(!css.length){const main=await(await fetch(new URL('/src/main.ts',origin))).text();for(const match of main.matchAll(/import\s+["']([^"']+\.css(?:\?[^"']*)?)["']/g))css.push(new URL(match[1],origin).href);}assert(css.length);
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
  const film=await evaluate('__brawlFixture.openingFilm()');assert(film.active&&film.grain&&film.vignette&&film.canvasFilter!=='none'&&film.removed,'Match-intro grain/vignette is static, visible, and removed before combat');assert(Number(film.grainOpacity)<=.08,'Opening grain remains subtle');
  for(const n of [1,2,3,4]){
   await evaluate(`document.querySelector('[data-mode="brawl"]').click();document.querySelector('[data-brawl-count="${n}"]').click();document.querySelector('#start').click()`);
   await wait(`__brawlFixture.count===${n+1}&&document.querySelectorAll('[data-brawl-card]').length===${n}`,'Brawl field');
   assert(await evaluate('__brawlFixture.ffa'));
   assert.equal(await evaluate('new Set(__brawlFixture.names).size'),n+1);
   const draws=await evaluate('__brawlFixture.randomDraws()');assert.equal(new Set(draws.first).size,n);assert.equal(new Set(draws.second).size,n);assert(!draws.first.includes(draws.player)&&!draws.second.includes(draws.player));assert.notDeepEqual(draws.first,draws.second,'Fresh Brawl starts randomize the opponent roster');
   const zero=await evaluate('__brawlFixture.zeroHp(1)');assert.equal(zero.zero,'true');assert.match(zero.status,/0 HP · KNOCKED OUT/);assert.match(zero.health,/^0 HP/);
   const callouts=await evaluate('__brawlFixture.damageCallouts()'),visible=await evaluate('(()=>{const v=visualViewport;return{left:v?.offsetLeft??0,top:v?.offsetTop??0,right:(v?.offsetLeft??0)+(v?.width??innerWidth),bottom:(v?.offsetTop??0)+(v?.height??innerHeight)}})()');assert(callouts.length>=2);for(const item of callouts){assert(item.side,'Brawl warning is placed around its robot');assert(item.robot);assert(item.box.left>=visible.left-1&&item.box.top>=visible.top-1&&item.box.right<=visible.right+1&&item.box.bottom<=visible.bottom+1,`${device.name} ${n} AI callout outside visible CSS viewport ${JSON.stringify(visible)}: ${JSON.stringify(item)}`);assert(item.box.right<=item.robot.left||item.box.left>=item.robot.right||item.box.bottom<=item.robot.top||item.box.top>=item.robot.bottom,'Callout does not cover its robot');}
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
   const endCards=await evaluate(`(()=>{const rows=[...document.querySelectorAll('.brawl-result-row')],images=rows.map(e=>e.querySelector('.brawl-result-portrait'));return{images:images.length,allImages:images.every(i=>i?.getAttribute('src')?.startsWith('data:image/webp;base64,')&&i.alt.trim()&&i.getBoundingClientRect().width>0&&i.getBoundingClientRect().height>0),tops:rows.filter(e=>e.dataset.topDamage==='true').map(e=>Number(e.dataset.brawlResultBot)),badges:document.querySelectorAll('.brawl-top-damage[aria-label="Top damage dealer"]').length,heights:rows.map(e=>({id:Number(e.dataset.brawlResultBot),value:e.dataset.peakHeight,text:e.querySelector('.brawl-peak-flight')?.textContent?.trim()}))}})()`);
   assert.equal(endCards.images,n+1,'Every Brawl entrant has a visible robot portrait');assert(endCards.allImages,'Robot portrait has embedded image data, accessible alt text, and visible dimensions');assert.equal(endCards.badges,1,'Highest positive damage dealer has one visible label');assert.deepEqual(endCards.tops,[n],'The top damage label is attached to the seeded damage leader');for(const row of endCards.heights)assert.equal(row.value,(.4+row.id*.5).toFixed(2),'Each Brawl robot displays its own peak flight rise');
   const flightTypography=await evaluate(`(()=>{const row=document.querySelector('.brawl-result-row');return{flight:getComputedStyle(row.querySelector('.brawl-peak-flight strong')).fontSize,name:getComputedStyle(row.querySelector('.brawl-result-name strong')).fontSize,label:getComputedStyle(row.querySelector('.brawl-peak-flight>span')).fontSize}})()`);
   assert.equal(flightTypography.flight,flightTypography.name,'Peak-flight values match the surrounding robot-name text size');
   const readability=await evaluate(`(()=>{const rows=[...document.querySelectorAll('.brawl-result-row')];return{rowSizes:rows.map(e=>parseFloat(getComputedStyle(e).fontSize)),nameSizes:rows.map(e=>parseFloat(getComputedStyle(e.querySelector('.brawl-result-name strong')).fontSize)),hudName:parseFloat(getComputedStyle(document.querySelector('.brawl-hud-heading strong')).fontSize),hudHealth:parseFloat(getComputedStyle(document.querySelector('.brawl-hud-foot')).fontSize),blur:getComputedStyle(document.querySelector('.result-backdrop')).backdropFilter}})()`);
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
