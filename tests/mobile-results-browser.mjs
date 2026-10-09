import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {build} from 'esbuild';

// Real main.ts result flow and production CSS; only WebGL is replaced for this layout test.
const exposed=`
globalThis.__mobileResultFixture={
 get ready(){return ready;},
 result(reason,cup=false){
  tournament?.dispose();tournament=cup?new Tournament(preset(1),false,8412,'medium',3):undefined;
  tournamentRecorded=false;lastClip=[];sim?.dispose();
  sim=new Simulation([preset(1),preset(0)],{hazards:false,ai:[false,false],recordVisuals:false});
  sim.finish(reason,0);showResult();
 },
 champion(){tournament?.dispose();tournament=new Tournament(preset(1),false,8412,'medium',1);sim?.dispose();sim=new Simulation(tournament.playerConfigs(),{hazards:false,ai:[false,false],recordVisuals:false});tournamentRecorded=false;sim.finish('Structural KO',0);showResult();},
 dispose(){input.dispose();audio.dispose();renderer?.dispose();sim?.dispose();tournament?.dispose();}
};`;
const bundle=await build({entryPoints:['src/main.ts'],bundle:true,format:'iife',write:false,loader:{'.css':'empty'},plugins:[{name:'mobile-layout-fixture',setup(builder){
 builder.onLoad({filter:/src\/main\.ts$/},args=>({contents:readFileSync(args.path,'utf8')+exposed,loader:'ts',resolveDir:process.cwd()+'/src'}));
 builder.onResolve({filter:/^\.\/render$/},()=>({path:'layout-renderer',namespace:'fixture'}));
 builder.onLoad({filter:/layout-renderer/,namespace:'fixture'},()=>({contents:`export class ArenaRenderer{constructor(){this.quality='low';this.triangleCount=0;this.drawCalls=0;this.renderMs=0;}attach(sim){this.sim=sim;}setQuality(){}setAdaptive(){}showBuilder(){}startReplay(){}endReplay(){}replayFrame(){}update(){}draw(){}dispose(){}opponentIndicator(){return{visible:false};}projectCombatPoint(){return{visible:false};}robotWarningPosition(){return{visible:false};}}`}));
}}]});
const origin=process.env.CRA_PREVIEW_URL??'http://127.0.0.1:4173/';
const html=await(await fetch(origin)).text();
const cssLinks=[...html.matchAll(/href="([^\"]+\.css)"/g)].map(match=>new URL(match[1],origin).href);
assert(cssLinks.length>0);
const pages=await(await fetch(`http://127.0.0.1:${process.env.CRA_CDP_PORT??9224}/json/list`)).json();
const socket=new WebSocket(pages.find(page=>page.type==='page').webSocketDebuggerUrl);
await new Promise((resolve,reject)=>{socket.addEventListener('open',resolve,{once:true});socket.addEventListener('error',reject,{once:true});});
let id=0;const pending=new Map();
socket.addEventListener('message',event=>{const result=JSON.parse(event.data);if(pending.has(result.id)){const item=pending.get(result.id);pending.delete(result.id);result.error?item.reject(new Error(result.error.message)):item.resolve(result.result);}});
const call=(method,params={})=>new Promise((resolve,reject)=>{const requestId=++id;pending.set(requestId,{resolve,reject});socket.send(JSON.stringify({id:requestId,method,params}));});
const evaluate=async expression=>{const result=await call('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(result.exceptionDetails)throw new Error(JSON.stringify(result.exceptionDetails));return result.result.value;};
const wait=async(expression,label)=>{for(let i=0;i<400;i++){if(await evaluate(expression))return;await new Promise(resolve=>setTimeout(resolve,100));}throw new Error('Timed out: '+label);};
try{
 await call('Page.enable');
 for(const device of [
  {name:'Android small',width:640,height:360,mobile:true,ua:'Mozilla/5.0 (Linux; Android 13; Pixel 6) AppleWebKit/537.36 Chrome/130.0.0.0 Mobile Safari/537.36'},
  {name:'iPhone landscape',width:844,height:390,mobile:true,ua:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1'},
  {name:'Android browser chrome',width:568,height:280,mobile:true,ua:'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/130.0.0.0 Mobile Safari/537.36'},
  {name:'Desktop unchanged',width:1280,height:720,mobile:false,ua:'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/130.0.0.0 Safari/537.36'}
 ]){
  await call('Emulation.setUserAgentOverride',{userAgent:device.ua});
  await call('Emulation.setDeviceMetricsOverride',{width:device.width,height:device.height,deviceScaleFactor:1,mobile:device.mobile});
  await call('Emulation.setTouchEmulationEnabled',{enabled:device.mobile,maxTouchPoints:device.mobile?5:1});
  await call('Page.navigate',{url:new URL('/__mobile-result-fixture__.html',origin).href});
  await wait("location.origin===new URL("+JSON.stringify(origin)+").origin",'game origin');
  await evaluate(`document.open();document.write('<!doctype html><html><head></head><body></body></html>');document.close();document.head.innerHTML=${JSON.stringify('<meta name="viewport" content="width=device-width,initial-scale=1"><base href="'+origin+'">'+cssLinks.map(url=>'<link rel="stylesheet" href="'+url+'">').join(''))};document.body.innerHTML='<div id="app"></div>';window.requestAnimationFrame=()=>1;window.cancelAnimationFrame=()=>{};`);
  await wait('document.styleSheets.length>0','production CSS');
  await new Promise(resolve=>setTimeout(resolve,500));
  await evaluate(bundle.outputFiles[0].text);
  await wait('window.__mobileResultFixture?.ready','physics and menu');
  assert.equal(await evaluate("document.documentElement.classList.contains('touch-device')"),device.mobile);
  for(const [reason,cup] of [['Structural KO',false],['Judges’ decision',false],['Structural KO',true]]){
   await evaluate(`__mobileResultFixture.result(${JSON.stringify(reason)},${cup})`);
   await evaluate('document.fonts.ready');
   const layout=await evaluate(`(()=>{const modal=document.querySelector('.results'),body=modal.querySelector('.result-content'),footer=modal.querySelector('.modal-actions'),box=modal.getBoundingClientRect(),buttons=[...footer.querySelectorAll('button')].map(button=>{const rect=button.getBoundingClientRect();return{id:button.id,height:rect.height,inside:rect.top>=0&&rect.bottom<=innerHeight&&rect.left>=0&&rect.right<=innerWidth};});return{inside:box.top>=0&&box.left>=0&&box.bottom<=innerHeight+1&&box.right<=innerWidth+1,bodyOverflow:getComputedStyle(body).overflowY,footerPosition:getComputedStyle(footer).position,buttons,headingSize:parseFloat(getComputedStyle(modal.querySelector('.podium-name')).fontSize),cards:modal.querySelectorAll('.podium>article').length,health:modal.querySelectorAll('.result-health-track').length,scrollWidth:body.scrollWidth,bodyWidth:body.clientWidth,details:modal.querySelectorAll('details').length};})()`);
   assert.equal(layout.cards,2);assert.equal(layout.health,2);assert(layout.details>=2);
   if(device.mobile){
    assert(layout.inside,device.name+' dialog must fit');assert.equal(layout.bodyOverflow,'auto');assert.equal(layout.footerPosition,'static');
    assert(layout.buttons.every(button=>button.inside&&button.height>=40),device.name+' buttons must stay visible and tappable');
    assert(layout.headingSize>=16&&layout.headingSize<=22);assert(layout.scrollWidth<=layout.bodyWidth+1,'No horizontal result-body overflow');
    await evaluate("document.querySelector('.results details').open=true;document.querySelector('.result-content').scrollTop=10000");
    assert(await evaluate("[...document.querySelectorAll('.results .modal-actions button')].every(button=>{const r=button.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight})"),'Expanded evidence must not push actions offscreen');
    await evaluate("document.querySelector('#result-menu').click()");assert.equal(await evaluate("document.querySelector('.results')===null"),true,'Menu action remains functional');
   }else{assert.equal(layout.bodyOverflow,'visible');assert.equal(layout.footerPosition,'sticky');assert(layout.headingSize>22);}
   console.log('PASS',device.name,reason,cup?'tournament':'single match',JSON.stringify(layout));
  }
  if(device.mobile){
   await evaluate('__mobileResultFixture.champion()');
   assert(await evaluate("(()=>{const r=document.querySelector('.cup-champion').getBoundingClientRect();return r.width<=innerWidth&&r.height<150})()"),'Mobile tournament champion stays compact');
   await evaluate(`document.querySelector('#modals').innerHTML='';document.querySelector('#arena-overlay').innerHTML='<section class="online-result-card"><h2>Robot wins</h2><p>Match complete</p>'+${JSON.stringify('<div class="score-explainer"><strong>Judges’ scorecard</strong><p>The higher total wins.</p></div><div class="result-score"><div class="score-card"><h3>Minotaur</h3><div class="score-total">8</div></div><div class="score-card"><h3>Tombstone</h3><div class="score-total">3</div></div></div>')}+'</section>'`);
   const onlineLayout=await evaluate("(()=>{const el=document.querySelector('.online-result-card'),r=el.getBoundingClientRect(),s=getComputedStyle(el);return{rect:{top:r.top,right:r.right,bottom:r.bottom,left:r.left,width:r.width,height:r.height},viewport:{width:innerWidth,height:innerHeight},position:s.position,top:s.top,right:s.right,width:s.width,maxHeight:s.maxHeight,touch:document.documentElement.className}})()");
   assert(onlineLayout.rect.top>=0&&onlineLayout.rect.bottom<=onlineLayout.viewport.height&&onlineLayout.rect.right<=onlineLayout.viewport.width,'Online result card fits: '+JSON.stringify(onlineLayout));
  }
  await evaluate('__mobileResultFixture.dispose()');
 }
 console.log('PASS mobile result bounds, compact typography, retained values, independent evidence scrolling, working actions, tournament/online fit and desktop styling');
}finally{socket.close();}
