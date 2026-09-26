import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {build as bundle} from 'esbuild';
import {JSDOM,VirtualConsole} from 'jsdom';

// This is an offline DOM integration test. WebGL and device APIs are test doubles.
// It does not visit the managed preview or claim browser, GPU, or hardware coverage.
const exposed=`
globalThis.__compile=compile;globalThis.__review={
 get refs(){return {state,settingsFrom,pausedFrom,sim,ready,build,tournament,renderer,clock,audio,prefs,input,seed};},
 checkReplay,updateHUD,updateDamageWarnings,updateHitReadouts,startMatch,showRepair,openSettings,showBracket,beginReplay,beginFinish,showResult,showMenu,openBuilder,loop,
 repairFixture(){
  tournament?.dispose();tournament=new Tournament(preset(2),false,73145);
  for(const match of tournament.matches[0]){match.winner=match.a;match.reason='Test fixture';}
  tournament.repairModules=copy(compile(preset(2)).modules);
  tournament.repairModules.chassis.hp-=100;tournament.repairModules.armour_front.hp-=50;
  tournament.condition=Object.fromEntries(SLOTS.map(s=>[s,tournament.repairModules[s].hp]));
  showRepair();
 },
 fightFixture(){setState('fighting');clock.resume();},
 dispose(){input.dispose();audio.dispose();renderer?.dispose();sim?.dispose();tournament?.dispose();}
};`;
const bundled=await bundle({entryPoints:['src/main.ts'],bundle:true,format:'iife',write:false,loader:{'.css':'empty'},plugins:[{
 name:'offline-ui-fixture',setup(b){
  b.onLoad({filter:/src\/main\.ts$/},args=>({contents:readFileSync(args.path,'utf8')+exposed,loader:'ts',resolveDir:process.cwd()+'/src'}));
  b.onResolve({filter:/^\.\/render$/},()=>({path:'render-fixture',namespace:'fixture'}));
  b.onLoad({filter:/render-fixture/,namespace:'fixture'},()=>({contents:`
   export class ArenaRenderer {
    constructor(container,onLost,onRestore){if(globalThis.__failRenderer>0){globalThis.__failRenderer--;throw Error('Injected graphics initialization failure');}this.container=container;this.onLost=onLost;this.onRestore=onRestore;this.triangleCount=0;this.drawCalls=0;this.renderMs=0;}
    attach(sim){this.sim=sim;this.endReplay();} setQuality(){} setAdaptive(value){this.adaptive=value;this.needsRender=true;} showBuilder(config){globalThis.__compile(config,true);}
    startReplay(){this.replay=true;} projectCombatPoint(){return{x:45,y:50,visible:true};} robotWarningPosition(_sim,id){return{x:40+id*20,y:50,visible:true};} endReplay(){this.replay=false;} replayFrame(){} update(){} draw(){this.draws=(this.draws??0)+1;this.needsRender=false;} dispose(){this.disposed=true;}
   }`}));
 }}]});
const source=bundled.outputFiles[0].text,results:any[]=[];
async function fixture(hash='',savedBuild?:string){
 const errors:any[]=[],vc=new VirtualConsole();vc.on('jsdomError',error=>errors.push(error));
 const agentTools=new Map<string,any>();
 const dom=new JSDOM('<div id="app"></div>',{url:'https://offline-test.invalid/'+hash,runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc});
 const w=dom.window as any;w.TextDecoder=TextDecoder;w.TextEncoder=TextEncoder;w.eval('globalThis.structuredClone=value=>JSON.parse(JSON.stringify(value));');
 w.HTMLMediaElement.prototype.play=function(){return Promise.reject(new Error('Offline media fixture'));};w.HTMLMediaElement.prototype.pause=function(){};
 w.matchMedia=()=>({matches:false});w.requestAnimationFrame=()=>1;w.cancelAnimationFrame=()=>{};
 if(savedBuild)w.localStorage.setItem('cra.saved-build',savedBuild);
 w.navigator.getGamepads=()=>[];w.document.modelContext={registerTool(tool:any){agentTools.set(tool.name,tool);}};w.eval(source);
 for(let i=0;i<1000&&!w.__review.refs.ready;i++)await new Promise(resolve=>setTimeout(resolve,10));
 assert(w.__review.refs.ready,w.document.querySelector('#startup-error')?.textContent);
 return{w,api:w.__review,errors,agentTools,$:(s:string)=>w.document.querySelector(s),close(){w.__review.dispose();w.close();}};
}
async function test(name:string,run:(f:Awaited<ReturnType<typeof fixture>>)=>unknown){
 if(process.env.CRA_TEST_FILTER&&!new RegExp(process.env.CRA_TEST_FILTER,'i').test(name))return;
 let f:Awaited<ReturnType<typeof fixture>>|undefined;
 try{f=await fixture();const detail=await run(f);assert.equal(f.errors.length,0,f.errors.map(e=>e.message).join('; '));results.push({name,status:'passed',detail});console.log('PASS',name);}
 catch(error){results.push({name,status:'failed',error:String(error)});console.log('FAIL',name,String(error));}
 finally{f?.close();writeFileSync(process.env.CRA_TEST_FILTER?'docs/review-ui-focused-results.json':'docs/review-ui-results.json',JSON.stringify(results,null,2));}
}
const change=(f:any,selector:string,value:string,event='change')=>{const el=f.$(selector);assert(el,selector);el.value=value;el.dispatchEvent(new f.w.Event(event,{bubbles:true}));};

await test('Repeated Settings clicks return to the paused match with unchanged physics',async f=>{
 await f.api.startMatch();const sim=f.api.refs.sim;f.$('#open-settings').click();f.$('#open-settings').click();f.$('#close-settings').click();
 assert.equal(f.api.refs.state,'paused');assert(f.api.refs.sim===sim,'The original simulation must remain active');assert(f.$('#resume'));assert(f.api.refs.clock.paused);
});
await test('Clearing purchases clears the orders that Commit actually applies',f=>{
 f.api.repairFixture();const before=f.api.refs.tournament.repairModules.chassis.hp;
 change(f,'[data-repair="chassis"]','40');assert.equal(f.$('#budget').textContent,'860');
 f.$('#clear-repairs').click();assert.equal(f.$('#budget').textContent,'900');assert.equal(f.$('[data-repair="chassis"]').value,'0');
 f.$('#commit-repairs').click();assert.equal(f.api.refs.tournament.round,1);assert.equal(f.api.refs.tournament.condition.chassis,before);
});
await test('Settings preserve staged repairs, name, colour, and the repair window',f=>{
 f.api.repairFixture();change(f,'[data-repair="chassis"]','40');change(f,'#repair-name','Pit Crew');change(f,'#repair-color','#4477aa');
 f.$('#open-settings').click();f.$('#close-settings').click();assert.equal(f.api.refs.state,'repair');
 assert.equal(f.$('[data-repair="chassis"]').value,'40');assert.equal(f.$('#budget').textContent,'860');
 assert.equal(f.$('#repair-name').value,'Pit Crew');assert.equal(f.$('#repair-color').value,'#4477aa');
});
await test('Commit reads the visible repair input even before its change event fires',f=>{
 f.api.repairFixture();const before=f.api.refs.tournament.repairModules.chassis.hp;
 f.$('[data-repair="chassis"]').value='25';f.$('#commit-repairs').click();
 assert.equal(f.api.refs.tournament.condition.chassis,before+25);
});
await test('An invalid builder value remains editable after Settings closes',f=>{
 f.$('[data-nav="builder"]').click();change(f,'[data-path="chassis.width"]','2','input');
 assert(f.$('#builder-error'));f.$('#open-settings').click();f.$('#close-settings').click();
 assert.equal(f.api.refs.state,'builder');assert(f.$('#restore-preset'));f.$('#restore-preset').click();assert.equal(f.$('#test-build').disabled,false);
});
await test('A blank robot name cannot be bypassed by changing another field',f=>{
 f.$('[data-nav="builder"]').click();for(const name of ['', '   ']){change(f,'#build-name',name,'input');change(f,'#primary-color','#4477aa','input');
 assert(f.$('#builder-error')||f.$('#test-build').disabled);f.$('#builder-back').click();assert.equal(f.api.refs.state,'builder');}
});
await test('Match exit works in one click from live play, pause and replay',async f=>{
 for(const mode of ['live','paused','replay']){
  await f.api.startMatch();f.api.fightFixture();const sim=f.api.refs.sim;
  if(mode==='paused')f.$('#pause-button').click();
  if(mode==='replay'){for(let i=0;i<8;i++)sim.step();f.api.beginReplay(sim.frames,'fighting');}
  f.$(mode==='paused'?'#leave-match':'#fight-menu').click();assert.equal(f.api.refs.state,'menu');assert.notEqual(f.api.refs.sim,sim);assert(!f.$('#confirm-leave'));assert.equal(f.api.refs.renderer.replay,false);
 }
 await f.api.startMatch();f.$('[data-nav="menu"]').click();assert.equal(f.api.refs.state,'menu');
});
await test('Context loss during replay ends replay and requires Resume after restoration',async f=>{
 await f.api.startMatch();f.api.fightFixture();const sim=f.api.refs.sim;for(let i=0;i<8;i++)sim.step();
 f.api.beginReplay(sim.frames,'fighting');assert.equal(f.api.refs.state,'replay');const snapshot=JSON.stringify(sim.snapshot());
 f.api.refs.renderer.onLost();assert.equal(f.api.refs.state,'paused');assert.equal(f.api.refs.ready,false);
 f.api.refs.renderer.onRestore();assert.equal(f.api.refs.state,'paused');assert(f.$('#resume'));
 assert.equal(JSON.stringify(sim.snapshot()),snapshot);assert.equal(f.api.refs.renderer.replay,false);
});
await test('Graphics retry keeps the current match and does not reset its condition',async f=>{
 await f.api.startMatch();f.api.fightFixture();const sim=f.api.refs.sim;sim.bots[0].energy-=15000;sim.tick=1200;
 f.api.refs.renderer.onLost();f.$('#context-retry').click();for(let i=0;i<1000&&!f.api.refs.ready;i++)await new Promise(resolve=>setTimeout(resolve,10));
 assert(f.api.refs.sim===sim,'The original simulation must remain active');assert.equal(sim.tick,1200);assert.equal(f.api.refs.state,'paused');assert(f.$('#resume'));
});
await test('Keyboard menus and matches work when gamepad access is denied',async f=>{
 f.w.navigator.getGamepads=()=>{throw new f.w.DOMException('Denied','SecurityError');};
 f.$('#open-settings').click();assert.equal(f.$('#pad-status').textContent,'0 CONNECTED');f.$('#close-settings').click();
 await f.api.startMatch();assert.equal(f.api.refs.state,'countdown');
});
await test('Denied audio never delays match startup',async f=>{
 const param=()=>({value:0,setTargetAtTime(){},setValueAtTime(){},exponentialRampToValueAtTime(){}});
 const node=()=>({gain:param(),frequency:param(),connect(){},disconnect(){},start(){},stop(){}});
 f.w.AudioContext=class{destination={};currentTime=0;createGain=node;createOscillator=node;resume(){return new Promise(()=>{});}close(){return Promise.resolve();}};
 const pending=f.api.startMatch();await Promise.resolve();assert.equal(f.api.refs.state,'countdown');await pending;
});
await test('Practice reset, share/import, result, and tournament menu flows remain usable',async f=>{
 f.$('[data-nav="builder"]').click();f.$('#share-build').click();await Promise.resolve();const link=f.$('#share-link').value;
 assert(link.includes('#build='));f.$('#close-share').click();f.$('#import-build').click();f.$('#import-code').value=link;f.$('#commit-import').click();
 f.$('#test-build').click();await Promise.resolve();assert.equal(f.api.refs.state,'practice');const old=f.api.refs.sim;
 f.$('#practice-reset').click();await Promise.resolve();assert(f.api.refs.sim!==old,'Reset must create a fresh simulation');assert.equal(f.api.refs.sim.tick,0);
 f.api.refs.sim.finish('Fixture result',0);f.api.showResult();assert.equal(f.api.refs.state,'result');
 f.api.showMenu();f.$('[data-nav="bracket"]').click();assert(f.$('#start-tournament'));f.$('#start-tournament').click();
 assert.equal(f.api.refs.tournament.entries.length,8);assert(f.$('#bracket-next'));return{flows:6};
});
await test('Agent menu actions cannot replace a competitive match through Settings',async f=>{
 await f.api.startMatch();f.$('#open-settings').click();const sim=f.api.refs.sim;
 const tool=f.agentTools.get('select_robot_preset');assert(tool);
 assert.throws(()=>tool.execute({preset:'Minotaur'}),/limited/);assert(f.api.refs.sim===sim);
});
await test('Agent status can read an invalid builder draft without throwing',f=>{
 f.$('[data-nav="builder"]').click();change(f,'[data-path="chassis.width"]','2','input');
 const status=f.agentTools.get('read_arena_status').execute({});assert(status.errors.length>0);assert.equal(status.mass,null);
});
await test('Tournament repair windows cannot launch an unrelated practice match',async f=>{
 f.api.repairFixture();const sim=f.api.refs.sim;await f.api.startMatch(true);
 assert.equal(f.api.refs.state,'repair');assert(f.api.refs.sim===sim);
});
await test('Modal keyboard focus cannot reach background setup controls',f=>{
 f.$('#open-settings').click();const first=f.$('#close-settings');first.focus();
 first.dispatchEvent(new f.w.KeyboardEvent('keydown',{key:'Tab',code:'Tab',shiftKey:true,bubbles:true,cancelable:true}));
 assert.notEqual(f.w.document.activeElement,first);assert(f.$('#modals').contains(f.w.document.activeElement));
 f.w.document.activeElement.dispatchEvent(new f.w.KeyboardEvent('keydown',{key:'Tab',code:'Tab',bubbles:true,cancelable:true}));
 assert.equal(f.w.document.activeElement,first);
});

await test('Duplicate Start clicks create one match and one countdown',async f=>{
 const seed=f.api.refs.seed;await Promise.all([f.api.startMatch(),f.api.startMatch()]);
 assert.equal(f.api.refs.state,'countdown');assert.equal(f.api.refs.seed,seed+1);assert.equal(f.api.refs.sim.tick,0);
});
await test('Fresh initialization loads a shared build and rejects a malformed fragment safely',async f=>{
 f.$('[data-nav="builder"]').click();change(f,'#build-name','Reload check','input');
 f.$('#share-build').click();await Promise.resolve();const hash=new URL(f.$('#share-link').value).hash;
 const shared=await fixture(hash);try{assert.equal(shared.api.refs.build.identity.name,'Reload check');assert.equal(shared.api.refs.state,'menu');assert.equal(shared.errors.length,0);}finally{shared.close();}
 const bad=await fixture('#build=invalid');try{assert.equal(bad.api.refs.build.identity.name,'Tombstone');assert(bad.$('#toast').textContent.includes('Invalid build link'));assert.equal(bad.errors.length,0);}finally{bad.close();}
});
await test('A failed graphics retry can recover without discarding the paused match',async f=>{
 await f.api.startMatch();const sim=f.api.refs.sim;f.api.refs.renderer.onLost();f.w.__failRenderer=1;f.$('#context-retry').click();
 await Promise.resolve();await Promise.resolve();assert.equal(f.api.refs.ready,false);assert(f.$('#retry-init'));f.$('#retry-init').click();
 for(let i=0;i<100&&!f.api.refs.ready;i++)await new Promise(resolve=>setTimeout(resolve,10));
 assert(f.api.refs.ready);assert(f.api.refs.sim===sim);assert.equal(f.api.refs.state,'paused');
});

await test('Arrow keys drive P1 and move focus between menu choices',async f=>{
 const first=f.$('[data-preset="0"]');first.focus();first.dispatchEvent(new f.w.KeyboardEvent('keydown',{key:'ArrowDown',code:'ArrowDown',bubbles:true,cancelable:true}));
 assert.equal(f.w.document.activeElement,f.$('[data-preset="1"]'));
 await f.api.startMatch(true);const input=f.api.refs.input;
 const key=(type:string,code:string)=>f.w.dispatchEvent(new f.w.KeyboardEvent(type,{code,bubbles:true,cancelable:true}));
 key('keydown','ArrowUp');assert.equal(input.sample(0).left,1);assert.equal(input.sample(0).right,1);key('keyup','ArrowUp');
 key('keydown','ArrowLeft');const turn=input.sample(0);assert(turn.left<0&&turn.right>0);key('keyup','ArrowLeft');assert.equal(input.sample(0).left,0);
});
await test('POV switches with the HUD button and camera key, and saves its mode',async f=>{
 await f.api.startMatch(true);const {prefs,input,renderer}=f.api.refs;f.$('#camera-button').click();
 assert.equal(prefs.cameraMode,'pov');assert.equal(renderer.cameraMode,'pov');assert.equal(f.$('#camera-button').getAttribute('aria-pressed'),'true');
 f.w.dispatchEvent(new f.w.KeyboardEvent('keydown',{code:'KeyE',bubbles:true,cancelable:true}));input.sample(0);
 assert.equal(renderer.cameraMode,'tactical');assert.equal(JSON.parse(f.w.localStorage.getItem('cra.preferences')).cameraMode,'tactical');
});
await test('Start lights count 3, 2, 1 before physics starts; pause freezes the match clock',async f=>{
 const tones:number[]=[];f.api.refs.audio.countdownCue=(fight:boolean)=>{tones.push(fight?950:480);return true;};await f.api.startMatch();let now=f.w.performance.now();const signals=new Set<string>();
 for(let i=0;i<80;i++){now+=50;f.api.loop(now);signals.add(f.$('#countdown').dataset.signal);if(f.api.refs.state==='countdown')assert.equal(f.api.refs.sim.tick,0);}
 for(const signal of['3','2','1','FIGHT'])assert(signals.has(signal),signal+' was missing');assert.equal(tones.filter(f=>f===480||f===950).length,4,'One tone per countdown signal');assert.equal(f.api.refs.state,'fighting');
 const sim=f.api.refs.sim;sim.tick=31*240;now+=150;f.api.loop(now);assert.equal(f.$('#timer').textContent,'2:29');
 f.$('#pause-button').click();const tick=sim.tick;for(let i=0;i<20;i++){now+=50;f.api.loop(now);}assert.equal(sim.tick,tick);assert.equal(f.$('#timer-label').textContent,'PAUSED');
});

await test('The complete roster is selectable with no custom-preset collision',f=>{
 const cards=[...f.w.document.querySelectorAll('[data-preset]')];assert.equal(cards.length,11);
 for(let i=0;i<11;i++){f.$('[data-preset="'+i+'"]').click();assert.equal(f.api.refs.build.identity.name,['Tombstone','Minotaur','Hydra','ICEwave','HyperShock','Gigabyte','Son of Whyachi','HUGE','SawBlaze','Deep Six','Quantum'][i]);assert.equal(f.w.document.querySelectorAll('.bot-card.active').length,1);assert.equal(f.$('#opponent').options.length,11);assert.equal(f.w.document.activeElement.dataset.preset,String(i));}
 assert.equal(f.agentTools.get('select_robot_preset').inputSchema.properties.preset.enum.length,11);f.api.openBuilder();assert.equal(f.$('#builder-preset').value,'10');
});
await test('Every roster template can enter Practice and the hammer-saw exposes its strike control',async f=>{
 for(let i=0;i<11;i++){f.api.showMenu();f.$('[data-preset="'+i+'"]').click();await f.api.startMatch(true);assert.equal(f.api.refs.state,'practice');assert.equal(f.api.refs.sim.fault,undefined);assert(f.$('#camera-button'));if(i===8)assert(f.$('.control-strip').textContent.includes('Strike / self-right'));}
});
await test('Builder can edit and share the new articulated assembly',f=>{
 f.api.openBuilder();change(f,'#builder-preset','8');assert.equal(f.$('[data-path="weapon.type"]').value,'hammer_saw');assert.equal(f.$('#test-build').disabled,false);
 // Stock heavyweights now carry an explicit equipment mass. Free space in
 // the mass budget before fitting a longer arm; custom builds never auto-lighten.
 change(f,'[data-path="chassis.equipmentMassKg"]',String(f.api.refs.build.chassis.equipmentMassKg-1),'input');
 change(f,'[data-path="weapon.armLength"]','580','input');assert.equal(f.api.refs.build.weapon.armLength,.58);assert.equal(f.$('#share-build').disabled,false);
 change(f,'#builder-preset','7');assert.equal(f.$('[data-path="drive.radius"]').value,'480');assert.equal(f.$('#test-build').disabled,false);
});
await test('Workshop exposes real weapon mass, references, estimates, and Quantum pressure ratings',f=>{
 f.api.openBuilder();change(f,'#builder-preset','7');assert(Math.abs(Number(f.$('[data-path="weapon.massKg"]').value)-13.6078)<.001);assert(f.$('.weapon-reference').textContent.includes('PUBLISHED REFERENCE MASS'));assert(f.$('.weapon-reference a').href.includes('hugebattlebots.com'));
 change(f,'#builder-preset','8');assert(f.$('.weapon-reference').textContent.includes('GAME MASS ESTIMATE'));change(f,'[data-path="weapon.massKg"]','12','input');assert.equal(f.api.refs.build.weapon.massKg,12);assert(f.$('.weapon-reference').textContent.includes('CUSTOM MASS'));
 change(f,'#builder-preset','10');assert(f.$('.build-totals, #build-totals, #totals')?.textContent.includes('35,000')||f.w.document.body.textContent.includes('35,000'));assert(f.w.document.body.textContent.includes('50,000'));assert(f.$('.weapon-reference').textContent.includes('NOT APPLICABLE'));
});
await test('Workshop identifies battery targets and marks estimated positions for all eleven robots',f=>{
 f.api.openBuilder();for(let i=0;i<11;i++){change(f,'#builder-preset',String(i));const card=f.$('.battery-reference');assert(card);assert(card.textContent.includes('estimate'));assert(card.textContent.includes('covering panel'));assert(card.querySelector('a')?.href.startsWith('https://'));assert.equal(f.$('#test-build').disabled,false);}
 return{robots:11,estimatedPositionsDisclosed:true};
});
await test('Roster selections include all eleven supplied robot photographs',f=>{
 const images=[...f.w.document.querySelectorAll('.bot-card .robot-photo')];assert.equal(images.length,11);assert.equal(new Set(images.map((im:any)=>im.src)).size,11);assert(images.every((im:any)=>im.alt&&im.width===78&&im.height===56));
});
await test('Skipping or finishing a replay resumes the live match without a pause dialog',async f=>{
 await f.api.startMatch();f.api.fightFixture();const sim=f.api.refs.sim;for(let i=0;i<120;i++)sim.step();f.api.beginReplay(sim.frames,'fighting');f.$('#skip-replay').click();assert.equal(f.api.refs.state,'fighting');assert.equal(f.api.refs.clock.paused,false);assert.equal(f.$('#resume'),null);
 f.api.beginReplay(sim.frames.slice(-2),'fighting');let now=f.w.performance.now();for(let i=0;i<5;i++){now+=100;f.api.loop(now);}assert.equal(f.api.refs.state,'fighting');assert.equal(f.api.refs.clock.paused,false);
});
await test('A slow visible frame does not force a pause or skip simulation seconds',async f=>{
 await f.api.startMatch();f.api.fightFixture();const before=f.api.refs.sim.tick;f.api.loop(f.w.performance.now()+900);assert.equal(f.api.refs.state,'fighting');assert(f.api.refs.sim.tick-before<=16);assert.equal(f.$('#resume'),null);
});
await test('The weapon panel reports measured RPM and power, while both count-out timers identify the robot',async f=>{
 await f.api.startMatch(true);const sim=f.api.refs.sim;const halfRPM=sim.bots[0].compiled.config.weapon.rpm/2;sim.bots[0].rpm=halfRPM;sim.bots[0].weaponWatts=2100;sim.bots[0].weaponOn=true;f.$('#camera-button').click();assert.equal(f.$('#gauge-rpm').textContent,Math.round(halfRPM).toLocaleString());assert(f.$('#gauge-watts').textContent.includes('2.1 kW'));assert.equal(f.$('#weapon-gauge').getAttribute('aria-valuenow'),'50');
 assert.equal(f.$('#gauge-power').style.width,'50%');
 sim.bots[1].count=5*240;f.$('#camera-button').click();assert.equal(f.$('#ko-seconds-1').textContent,'5');assert(!f.$('#ko-1').classList.contains('hidden'));assert(f.$('#ko-1').getAttribute('aria-label').includes('P2 Minotaur'));assert.equal(f.$('#ko-ring-1').style.strokeDashoffset,'50');
});
await test('Automatic recovery preference persists and updates the current simulation',async f=>{
 await f.api.startMatch(true);assert(f.api.refs.sim.options.autoUnstick);f.api.openSettings();const checkbox=f.$('#pref-autoUnstick');assert(checkbox.checked);checkbox.checked=false;checkbox.dispatchEvent(new f.w.Event('change',{bubbles:true}));assert.equal(f.api.refs.sim.options.autoUnstick,false);assert.equal(JSON.parse(f.w.localStorage.getItem('cra.preferences')).autoUnstick,false);
});
await test('Builder saves a validated build across reloads and Reset restores the selected template',async f=>{
 f.api.openBuilder();change(f,'#builder-preset','1');change(f,'#build-name','Saved Minotaur','input');change(f,'#primary-color','#2266aa','input');f.$('#save-build').click();
 assert(f.$('#save-build-status').textContent.includes('saved'));const saved=f.w.localStorage.getItem('cra.saved-build');assert(saved);
 const restored=await fixture('',saved);try{assert.equal(restored.api.refs.build.identity.name,'Saved Minotaur');assert.equal(restored.api.refs.build.identity.primary,'#2266aa');restored.api.openBuilder();assert.equal(restored.$('#builder-preset').value,'1');restored.$('#reset-build').click();assert.equal(restored.api.refs.build.identity.name,'Minotaur');assert.equal(restored.w.localStorage.getItem('cra.saved-build'),null);}finally{restored.close();}
 change(f,'[data-path="chassis.width"]','2','input');f.$('#save-build').click();assert.equal(f.w.localStorage.getItem('cra.saved-build'),saved);assert(f.$('#save-build-status').textContent.includes('Could not save'));f.$('#reset-build').click();assert.equal(f.$('#test-build').disabled,false);
});
await test('Results show shared 5/3/3 scores and distinguish a knockout from a judges decision',async f=>{
 await f.api.startMatch(true);const sim=f.api.refs.sim;sim.finish('Count-out',1);f.api.showResult();assert.equal(f.w.document.querySelectorAll('.judge-scoreboard tbody tr').length,3);assert(f.$('.score-explainer').textContent.includes('stoppage decides'));assert(f.$('#result-reason').textContent.includes('10 seconds'));assert(f.$('.score-card.p2').classList.contains('won'));
 sim.result.reason='Judges’ decision';f.api.showResult();assert(f.$('.score-explainer').textContent.includes('higher total wins'));assert.equal([...f.w.document.querySelectorAll('.judge-scoreboard td strong')].reduce((sum:any,el:any)=>sum+Number(el.textContent),0),11);
});
await test('Both central KO clocks identify the robot, freeze on pause, and clear on recovery',async f=>{
 await f.api.startMatch();f.api.fightFixture();const sim=f.api.refs.sim;sim.bots[0].count=8*240;sim.bots[1].count=5*240;f.$('#camera-button').click();assert.equal(f.$('#ko-seconds-0').textContent,'2');assert(f.$('#ko-0').classList.contains('critical'));assert.equal(f.$('#ko-seconds-1').textContent,'5');
 f.$('#pause-button').click();const count=sim.bots[0].count;f.api.loop(f.w.performance.now()+300);assert.equal(sim.bots[0].count,count);f.$('#resume').click();sim.bots[0].count=0;f.$('#camera-button').click();assert(f.$('#ko-0').classList.contains('hidden'));assert(!f.$('#ko-1').classList.contains('hidden'));
});
await test('Hydra shows flip assist in setup, builder and HUD even with zero stored charges',async f=>{
 f.$('[data-preset="2"]').click();assert(f.$('#summary-stat').textContent.includes('FLIP ASSIST'));f.api.openBuilder();assert.equal(f.$('[data-path="weapon.charges"]'),null);assert(f.w.document.body.textContent.includes('Flip assist shows'));assert(!f.w.document.body.textContent.includes('Flips available'));
 f.$('#test-build').click();await Promise.resolve();assert.equal(f.api.refs.state,'practice');f.api.refs.sim.bots[0].charges=0;f.$('#camera-button').click();
 assert.equal(f.$('#gauge-rpm'),null);assert(f.$('#weapon-gauge #flip-cue'));assert.equal(f.$('#weapon-gauge').getAttribute('aria-label'),'Hydra flip assist');assert(!f.$('#weapon-gauge').textContent.includes('Unlimited'));assert(f.$('#weapon-0').textContent.includes('FLIP ASSIST'));assert(!f.$('#weapon-0').textContent.includes('DEPLETED'));
});
await test('Recovery controls appear only for robots with a working recovery system',async f=>{
 const capable=[false,true,true,false,true,true,false,false,true,false,true];
 for(let i=0;i<11;i++){f.api.showMenu();f.$('[data-preset="'+i+'"]').click();await f.api.startMatch(true);assert.equal(!!f.$('#self-right-control'),capable[i]);if(capable[i]){f.api.refs.sim.bots[0].energy=0;f.api.updateHUD();assert.equal(f.$('#self-right-control').classList.contains('hidden'),![2,8].includes(i));}}
});
await test('Computer opponent selection starts the chosen robot and Main menu exits in one click',async f=>{
 assert(f.$('.opponent-picker').compareDocumentPosition(f.$('.bot-options'))&f.w.Node.DOCUMENT_POSITION_FOLLOWING);
 change(f,'#opponent','6');await f.api.startMatch();f.api.fightFixture();const old=f.api.refs.sim;assert.equal(old.bots[1].compiled.config.identity.name,'Son of Whyachi');assert.equal(old.options.ai[1],true);f.$('#fight-menu').click();assert.equal(f.api.refs.state,'menu');assert.equal(old.disposed,true);assert.equal(f.api.refs.clock.paused,true);assert.equal(f.$('#confirm-leave'),null);
});
await test('Results give winner and runner-up separate large named panels',async f=>{
 await f.api.startMatch(true);f.api.refs.sim.finish('Count-out',1);f.api.showResult();assert.equal(f.$('.podium-winner [data-name]').textContent,'Minotaur');assert.equal(f.$('.podium-runner [data-name]').textContent,'Tombstone');assert(f.$('.podium-runner').textContent.includes('RUNNER-UP'));
});
await test('Reinstalling a folding recovery arm keeps a valid template mount',f=>{
 f.api.openBuilder();for(const preset of['4','5']){change(f,'#builder-preset',preset);change(f,'[data-path="selfRight.type"]','none');change(f,'[data-path="selfRight.type"]','roll_arm');assert.equal(f.$('#test-build').disabled,false);assert.equal(f.api.refs.build.selfRight.type,'roll_arm');}
});
await test('Automatic slow motion ignores light hits and heavy arena contacts',async f=>{
 await f.api.startMatch();f.api.fightFixture();f.api.refs.prefs.replays=true;const sim=f.api.refs.sim;for(let t=0;t<480;t++)sim.step();
 const event={id:900,tick:sim.tick-190,energy:11999,cause:'weapon',target:1,attacker:0};sim.events.push(event);f.api.checkReplay();assert.equal(f.api.refs.state,'fighting');event.energy=30000;event.cause='landing / arena';f.api.checkReplay();assert.equal(f.api.refs.state,'fighting');event.cause='weapon';f.api.checkReplay();assert.equal(f.api.refs.state,'replay');f.$('#skip-replay').click();assert.equal(f.api.refs.state,'fighting');
});
await test('R recovers a stuck robot once, supports remapping, and ignores text fields',async f=>{
 await f.api.startMatch(true);const {sim,input,prefs}=f.api.refs,b=sim.bots[0];let calls=0;const recover=sim.manualUnstick.bind(sim);sim.manualUnstick=()=>{calls++;return recover();};b.count=480;
 const key=(code:string,repeat=false,target=f.w)=>target.dispatchEvent(new f.w.KeyboardEvent('keydown',{code,repeat,bubbles:true,cancelable:true}));
 key('KeyR');assert.equal(b.count,0);assert.equal(calls,1);key('KeyR',true);key('KeyR');assert.equal(calls,1);
 f.w.dispatchEvent(new f.w.KeyboardEvent('keyup',{code:'KeyR'}));input.remap={player:0,action:'unstick'};key('KeyZ');assert.equal(prefs.controls[0].unstick,'KeyZ');
 sim.tick+=1200;b.count=480;key('KeyR');assert.equal(calls,1);key('KeyZ');assert.equal(calls,2);assert.equal(b.count,0);f.api.updateHUD();assert(f.$('#unstick-button').textContent.endsWith('Z'));
 f.w.dispatchEvent(new f.w.KeyboardEvent('keyup',{code:'KeyZ'}));const field=f.w.document.createElement('input');f.w.document.body.append(field);field.focus();key('KeyZ',false,field);assert.equal(calls,2);field.remove();return{defaultKey:'R',remap:'Z',repeatIgnored:true,textEntryIgnored:true};
});
await test('Quantum appears as a selectable opponent, editable crusher, and force gauge',async f=>{
 change(f,'#opponent','10');f.$('[data-preset="10"]').click();f.api.openBuilder();assert.equal(f.$('[data-path="weapon.type"]').value,'crusher');assert(f.$('[data-path="weapon.torque"]'));assert(!f.$('#test-build').disabled);f.$('#save-build').click();assert(f.$('#save-build-status').textContent.includes('saved'));
 await f.api.startMatch(true);assert.equal(f.api.refs.sim.bots[0].compiled.config.identity.name,'Quantum');assert.equal(f.api.refs.sim.bots[1].compiled.config.identity.name,'Quantum');f.api.refs.sim.bots[0].crushForce=4300;f.api.updateHUD();assert.equal(f.$('#gauge-unit').textContent,'kN');assert.equal(f.$('#gauge-metric').textContent,'Jaw force');assert.equal(f.$('#gauge-rpm').textContent,'4.3');assert(f.$('#self-right-control'));assert(f.$('#weapon-0').textContent.includes('CRUSHER'));return{templates:11,crusherGauge:'4.3 kN'};
});
await test('Animated start tones pause, resume, and restart for rematches and tournament fights',async f=>{
 const cues:boolean[]=[];f.api.refs.audio.countdownCue=(fight:boolean)=>{cues.push(fight);return true;};
 const run=()=>{let now=f.w.performance.now();for(let i=0;i<80;i++)f.api.loop(now+=50);};
 await f.api.startMatch();assert.equal(f.$('video'),null);assert.equal(f.$('#start-audio'),null);let now=f.w.performance.now();for(let i=0;i<12;i++)f.api.loop(now+=50);f.api.updateHUD();assert.equal(f.api.refs.sim.tick,0);assert.equal(cues.length,1);assert.equal(f.w.document.querySelectorAll('.signal-housing i').length,6);
 f.$('#pause-button').click();const label=f.$('.start-word').textContent;for(let i=0;i<10;i++)f.api.loop(now+=100);assert.equal(cues.length,1);assert.equal(f.$('.start-word').textContent,label);f.$('#resume').click();run();assert.equal(f.api.refs.state,'fighting');assert.deepEqual(cues,[false,false,false,true]);
 f.api.refs.sim.finish('Count-out',0);f.api.showResult();f.$('#rematch').click();run();assert.equal(f.api.refs.state,'fighting');assert.equal(cues.length,8);assert.deepEqual(cues.slice(4),[false,false,false,true]);
 f.api.showMenu();f.api.repairFixture();f.$('#commit-repairs').click();await f.api.startMatch();run();assert.equal(f.api.refs.state,'fighting');assert.deepEqual(cues.slice(8),[false,false,false,true]);
 return{matches:3,tones:cues.length,lamps:6,noMediaDependency:true,pauseSynchronized:true};
});
await test('Unavailable audio does not block the animated countdown',async f=>{
 await f.api.startMatch();let now=f.w.performance.now();for(let i=0;i<80;i++)f.api.loop(now+=50);assert.equal(f.api.refs.state,'fighting');assert.equal(f.$('video'),null);return{matchStarted:true};
});

await test('Knockout results hide unused point totals and explain the actual result first',async f=>{
 f.$('[data-preset="2"]').click();await f.api.startMatch(true);const sim=f.api.refs.sim;sim.finish('Count-out',0);sim.result.scores=[[2,1,2],[3,2,1]];f.api.showResult();assert.equal(f.$('.podium-winner [data-name]').textContent,'Hydra');assert.equal(f.$('.score-total'),null);assert(f.$('.score-explainer').textContent.includes('POINTS DO NOT APPLY'));assert.equal(f.$('.unused-scores').open,false);assert(f.$('.score-card.won').textContent.includes('KO WIN'));
});
await test('The flipper assist shows contact readiness and the current weapon key only for Hydra',async f=>{
 f.$('[data-preset="2"]').click();await f.api.startMatch(true);assert(f.$('#flip-cue'));assert.equal(f.$('#flip-cue').dataset.ready,'false');const sim=f.api.refs.sim,original=sim.flipOpportunity.bind(sim);sim.flipOpportunity=()=>({ready:true,label:'FLIP NOW',detail:'Opponent is supported by your flipper.'});f.api.refs.prefs.controls[0].weapon='KeyF';f.api.updateHUD();assert.equal(f.$('#flip-cue-title').textContent,'FLIP NOW');assert.equal(f.$('#flip-cue-key').textContent,'PRESS F');assert.equal(f.$('#flip-cue').dataset.ready,'true');sim.flipOpportunity=original;sim.damage(0,'weapon_actuator',1e9);f.api.updateHUD();assert.notEqual(f.$('#flip-cue-title').textContent,'FLIP UNAVAILABLE');assert.equal(f.$('#flip-cue').dataset.ready,'false');f.api.showMenu();f.$('[data-preset="0"]').click();await f.api.startMatch(true);assert.equal(f.$('#flip-cue'),null);
});
await test('Unstick works for a robot without self-righting and preserves damage and match time',async f=>{
 await f.api.startMatch(true);const sim=f.api.refs.sim,b=sim.bots[0];assert.equal(f.$('#self-right-control'),null);assert(f.$('#unstick-button').disabled);b.count=2*240;b.modules.chassis.hp-=30;const hp=b.modules.chassis.hp,tick=sim.tick,old={...b.chassis.translation()};f.api.updateHUD();assert.equal(f.$('#unstick-button').textContent,'Unstick P1 · R');assert.equal(f.$('#unstick-button').disabled,false);f.$('#unstick-button').click();assert.equal(b.count,0);assert.equal(b.modules.chassis.hp,hp);assert.equal(sim.tick,tick);assert(Math.hypot(b.chassis.translation().x-old.x,b.chassis.translation().z-old.z)>.4);assert(f.$('#unstick-button').disabled);assert(f.$('#caption').textContent.includes('Unstuck: Tombstone'));
});
await test('Unstick labels both robots and cannot change physics during countdown or pause',async f=>{
 await f.api.startMatch();const sim=f.api.refs.sim;sim.bots.forEach((b:any)=>b.count=2*240);f.api.updateHUD();assert(f.$('#unstick-button').disabled);f.api.fightFixture();f.api.updateHUD();assert.equal(f.$('#unstick-button').textContent,'Unstick P1 + P2 · R');f.$('#pause-button').click();const before=JSON.stringify(sim.snapshot());f.$('#unstick-button').click();assert.equal(JSON.stringify(sim.snapshot()),before);f.$('#resume').click();f.api.updateHUD();f.$('#unstick-button').click();assert(sim.bots.every((b:any)=>b.count===0));assert.equal(f.api.refs.state,'fighting');
});


await test('Weapon gauges and robot warnings report damage and reduced output',async f=>{
 await f.api.startMatch(true);const {sim}=f.api.refs,b=sim.bots[0];b.weaponOn=true;b.energy=0;f.api.updateHUD();assert.equal(f.$('#gauge-state').textContent,'Spinning up');assert(f.$('#weapon-0').textContent.includes('SPINNING'));
 sim.damage(0,'battery',1e9);sim.damage(0,'weapon',1e9);sim.damage(0,'weapon_actuator',1e9);f.api.updateHUD();f.api.updateDamageWarnings();assert.equal(f.$('#gauge-state').textContent,'Reduced power');assert.equal(f.$('#gauge-output').textContent,'45% power');assert.equal(f.$('#weapon-damage-0').textContent,'WEAPON 100% DMG');assert.equal(f.$('#battery-damage-0').textContent,'BATTERY 100% DMG');assert(!f.$('#damage-badge-0').classList.contains('hidden'));assert(f.$('#robot-weapon-damage-0').textContent.includes('100%'));assert(f.$('#fault-0').textContent.includes('Battery'));assert(!f.$('#fault-0').textContent.includes('Weapon'));return{protectedFailures:3};
});
await test('Nearby damaged robots keep separate warnings and hide them outside play',async f=>{
 await f.api.startMatch(true);const {sim,renderer}=f.api.refs;for(const b of sim.bots){sim.damage(b.id,'weapon',1e9);sim.damage(b.id,'battery',1e9);}renderer.robotWarningPosition=()=>({x:50,y:50,visible:true});f.api.updateHUD();f.api.updateDamageWarnings();const a=f.$('#damage-badge-0'),b=f.$('#damage-badge-1');assert(parseFloat(a.style.left)<50&&parseFloat(b.style.left)>50);assert((parseFloat(b.style.left)-parseFloat(a.style.left))*f.w.innerWidth/100>=217);f.$('#pause-button').click();f.api.updateDamageWarnings();assert(a.classList.contains('hidden')&&b.classList.contains('hidden'));return{alerts:2,minimumSeparationPixels:218,hiddenDuringPause:true};
});
await test('Results display matching robot portraits, winner confetti, and reduced-motion support',async f=>{
 f.$('[data-preset="10"]').click();await f.api.startMatch(true);const sim=f.api.refs.sim;sim.finish('Count-out',1);f.api.showResult();assert(f.$('.podium-winner img').dataset.robotPortrait==='minotaur');assert(f.$('.podium-runner img').dataset.robotPortrait==='quantum');assert.equal(f.$('.podium-winner [data-name]').textContent,'Minotaur');assert.equal(f.w.document.querySelectorAll('.victory-confetti i').length,24);assert.equal(f.w.document.querySelectorAll('.podium-winner .podium-portrait .victory-confetti').length,1);assert.equal(f.$('.podium-runner .victory-confetti'),null);assert.equal(f.$('.result-backdrop > .victory-confetti'),null);assert(f.$('.results').getAttribute('aria-label'));assert(f.$('#result-menu'));assert(f.$('#rematch'));
 sim.result.winner=0;f.api.showResult();assert.equal(f.$('.podium-winner img').dataset.robotPortrait,'quantum');assert.equal(f.w.document.querySelectorAll('.podium-winner .podium-portrait .victory-confetti i').length,24);assert.equal(f.$('.podium-runner .victory-confetti'),null);f.api.refs.prefs.reduced=true;f.api.showResult();assert.equal(f.$('.victory-confetti'),null);f.$('#result-menu').click();assert.equal(f.api.refs.state,'menu');assert.equal(f.$('.podium'),null);return{portraits:2,confetti:24,reducedMotion:true};
});

await test('Both robots show numeric HP and speed, and hit numbers reflect actual losses',async f=>{
 await f.api.startMatch(true);const sim=f.api.refs.sim;
 for(const b of sim.bots){b.modules.chassis.hp-=123;b.chassis.setLinvel({x:3,y:0,z:4},true);}
 f.api.updateHUD();for(const i of[0,1]){assert(f.$('#hp-'+i).textContent.includes('1,077 / 1,200 HP'));assert.equal(f.$('#speed-'+i).textContent,'18.0 km/h');}
 sim.events.push({id:1,tick:0,point:{x:0,y:1,z:0},allocations:[{bot:1,module:'armour_front',hp:37.2,energy:1000}]});f.api.updateHitReadouts();assert.equal(f.$('.hit-hp').textContent,'−37 HP');f.api.updateHitReadouts();assert.equal(f.w.document.querySelectorAll('.hit-number').length,1);sim.tick=400;f.api.updateHitReadouts();assert.equal(f.$('.hit-number'),null);
});

await test('Damage bubbles suppress one-HP labels in live play and replay while retaining precise damage',async f=>{
 await f.api.startMatch(true);const sim=f.api.refs.sim;
 const amounts=[.001,.49,.99,1.49,1.5,499.9,799.9,999.9],expected=[1,1,1,1,2,500,800,1000],tiers=[0,0,0,0,0,4,5,6];
 for(let i=0;i<amounts.length;i++){
  sim.tick=i*400;const allocation={bot:i%2,module:'chassis',hp:amounts[i],energy:1};
  sim.events.push({id:i+1,tick:sim.tick,point:{x:0,y:1,z:0},allocations:[allocation]});f.api.updateHitReadouts();
  if(expected[i]===1)assert.equal(f.$('.hit-number'),null);else{assert.equal(f.$('.hit-hp').textContent,'−'+expected[i].toLocaleString()+' HP');assert.equal(f.$('.hit-number').dataset.tier,String(tiers[i]));}assert.equal(allocation.hp,amounts[i]);
 }
 const frame=sim.capture();frame.hits=[{key:'tiny:1',bot:1,hp:.001,point:{x:0,y:1,z:0},tick:frame.tick}];const next=JSON.parse(JSON.stringify(frame));next.tick+=4;
 f.api.beginReplay([frame,next]);f.api.updateHitReadouts();assert.equal(f.$('.hit-number'),null);
 return{liveCases:amounts.length,replayCases:1,minimumDisplayedHP:2,decimalPlaces:0,physicsPrecisionPreserved:true};
});

await test('A main impact is not followed by a stream of one-HP bubbles on either robot',async f=>{
 await f.api.startMatch(true);const sim=f.api.refs.sim,events=[0,1].map(bot=>({id:100+bot,tick:0,point:{x:0,y:1,z:0},allocations:[{bot,module:'chassis',hp:84,energy:1000}]}));sim.events.push(...events);f.api.updateHitReadouts();assert.equal(f.w.document.querySelectorAll('.hit-number').length,2);
 for(let tick=1;tick<=600;tick++){sim.tick=tick;for(const event of events)event.allocations[0].hp+=.002;f.api.updateHitReadouts();for(const label of f.w.document.querySelectorAll('.hit-hp'))assert.notEqual(label.textContent,'−1 HP');}
 assert.equal(f.$('.hit-number'),null);for(const event of events)assert(Math.abs(event.allocations[0].hp-85.2)<1e-8);
 return{robots:2,trailingUpdates:600,oneHPBubbles:0,preciseHPPerRobot:85.2};
});

await test('All eleven robot weapon panels show clear labels and current control keys',async f=>{
 const names=['Bar spinner','Drum spinner','Flipper','Bar spinner','Disc spinner','Shell spinner','Cage spinner','Vertical spinner','Hammer saw','Vertical spinner','Crusher'];
 f.api.refs.prefs.controls[0].weapon='KeyF';f.api.refs.prefs.controls[0].selfRight='KeyG';
 for(let i=0;i<11;i++){
  f.api.showMenu();f.$('[data-preset="'+i+'"]').click();await f.api.startMatch(true);f.api.updateHUD();
  assert.equal(f.$('#gauge-label').textContent,names[i]);assert.equal(f.$('#gauge-name').textContent,f.api.refs.sim.bots[0].compiled.config.identity.name);if(i===2){assert(f.$('#weapon-gauge #flip-cue'));assert.equal(f.$('.gauge-dial'),null);}else assert(!f.$('.gauge-dial').contains(f.$('#gauge-unit')));assert.equal(f.$('#gauge-key').textContent,'F');assert(f.$('#gauge-action').textContent.length>0);if(i!==2)assert.equal(f.$('#gauge-output').textContent,'100% power');
  assert.equal(f.$('#gauge-secondary').classList.contains('hidden'),i!==8);if(i===8)assert.equal(f.$('#gauge-strike-key').textContent,'G');
 }
 return{robots:11,remappedKeys:2,emptyControlLabels:0};
});

await test('Damage borders increase through seven tiers and respect reduced motion',async f=>{
 await f.api.startMatch(true);const sim=f.api.refs.sim;
 const amounts=[12,39,40,99,100,249,250,499,500,799,800,999,1000,1200],tiers=[0,0,1,1,2,2,3,3,4,4,5,5,6,6];
 for(let i=0;i<amounts.length;i++){
  sim.tick=i*400;sim.events.push({id:i+1,tick:sim.tick,point:{x:0,y:1,z:0},allocations:[{bot:i%2,module:'chassis',hp:amounts[i],energy:1000}]});f.api.updateHitReadouts();
  const el=f.$('.hit-number');assert.equal(el.dataset.tier,String(tiers[i]));assert.equal(el.textContent,'−'+amounts[i].toLocaleString()+' HP');assert.equal(el.querySelectorAll('.hit-burst').length,1);assert.equal(f.$('.hit-word'),null);
 }
 const largest=f.$('.hit-number');assert.equal(largest.style.getPropertyValue('--hit-pop'),'1.34');assert.equal(largest.style.getPropertyValue('--hit-glow'),'20px');
 const initialTransform=largest.style.transform;sim.tick+=60;f.api.updateHitReadouts();assert.notEqual(largest.style.transform,initialTransform);assert(Math.abs(Number(largest.style.getPropertyValue('--hit-pop'))-1)<.03);
 f.api.refs.prefs.reduced=true;f.api.updateHitReadouts();assert.equal(largest.dataset.reduced,'true');assert.equal(largest.style.getPropertyValue('--hit-pop'),'1');const frozenTransform=largest.style.transform;sim.tick+=30;f.api.updateHitReadouts();assert.equal(largest.style.transform,frozenTransform);assert.equal(largest.style.getPropertyValue('--hit-wobble'),'0deg');
 return{tiers:7,thresholdsHP:[40,100,250,500,800,1000],boundaryCases:14,maxPopPercent:34,wordsAbove:0,reducedMotion:true};
});

await test('Hydra assist, gauge and captions share a non-overlapping layout container',async f=>{
 f.$('[data-preset="2"]').click();await f.api.startMatch(true);f.api.updateHUD();
 assert(f.$('.weapon-instruments > #caption'));assert(f.$('.weapon-control-row > .weapon-gauge > #flip-cue'));assert.equal(f.w.document.querySelectorAll('#flip-cue').length,1);assert(f.$('.weapon-control-row > .weapon-gauge'));assert.equal(f.w.document.querySelectorAll('#caption').length,1);
 const sim=f.api.refs.sim;sim.bots[0].modules.chassis.hp=240;sim.bots[1].modules.chassis.hp=600;f.api.updateHUD();assert.equal(f.$('#health-track-0').getAttribute('aria-valuenow'),'20');assert.equal(f.$('#health-track-0').dataset.low,'true');assert.equal(f.$('#health-track-1').getAttribute('aria-valuenow'),'50');assert.equal(f.$('#health-track-1').dataset.low,'false');
});
await test('Results retain HP totals for the correct winner and runner-up, including zero HP',async f=>{
 for(const winner of[0,1]){await f.api.startMatch(true);const sim=f.api.refs.sim;sim.bots[0].modules.chassis.hp=0;sim.bots[1].modules.chassis.hp=731.25;sim.highlights.robots=[{furthestTravel:4.12,maxHeight:2.38,hardestHit:18500,hardestReceived:7500},{furthestTravel:1.26,maxHeight:1.07,hardestHit:7500,hardestReceived:18500}];sim.finish('Count-out',winner);f.api.showResult();
 assert.equal(f.$('.podium-winner .result-hp').dataset.robot,String(winner));assert.equal(f.$('.podium-runner .result-hp').dataset.robot,String(1-winner));assert(f.$('[data-robot="0"] strong').textContent.startsWith('0 /'));assert(f.$('[data-robot="1"] strong').textContent.startsWith('732 /'));assert.equal(f.$('[data-robot="0"] i').style.width,'0%');assert.equal(f.$('.podium-winner [data-highlights-robot]').dataset.highlightsRobot,String(winner));assert(f.$('[data-highlights-robot="0"]').textContent.includes('4.12 m'));assert(f.$('[data-highlights-robot="1"]').textContent.includes('7.50 kJ'));assert.equal(f.$('[data-highlights-robot="0"] .result-height dd').textContent,'2.38 m');assert.equal(f.$('[data-highlights-robot="1"] .result-height dd').textContent,'1.07 m');assert.equal(f.$('[data-robot="1"] [role="progressbar"]').getAttribute('aria-valuenow'),'731.25');f.$('#result-menu').click();}
});


await test('Random buttons select real player and computer robots and keep the manual opponent picker',async f=>{
 const before=f.api.refs.build.identity.name;f.$('#random-player').click();assert.notEqual(f.api.refs.build.identity.name,before);assert(f.$('#random-player')===f.w.document.activeElement);
 const old=f.$('#opponent').value;f.$('#random-opponent').click();assert.notEqual(f.$('#opponent').value,old);const name=f.$('#opponent option:checked').textContent.split(' · ')[0];await f.api.startMatch();assert.equal(f.api.refs.sim.bots[1].compiled.config.identity.name,name);
});
await test('Knockouts show the final motion and a replay before the result modal',async f=>{
 await f.api.startMatch();f.api.fightFixture();const sim=f.api.refs.sim;for(let i=0;i<100;i++)sim.step();
 const e={id:1,tick:sim.tick,source:'Tombstone',episode:'test',point:{x:0,y:1,z:0},attacker:0,target:1,module:'chassis',energy:12000,impulse:100,closing:10,rotorBefore:[10000,0],rotorAfter:[0,0],allocations:[{bot:1,module:'chassis',hp:1200,energy:12000}],cause:'weapon'};sim.events.push(e);sim.finish('Structural KO',0);f.api.beginFinish();assert.equal(f.api.refs.state,'finishing');assert(!f.$('.results'));assert.equal(f.$('#finish-title').textContent,'KNOCKOUT!');
 let now=10000;for(let i=0;i<28;i++)f.api.loop(now+=50);assert.equal(f.api.refs.state,'replay');f.api.updateHitReadouts();assert(!f.$('#hit-readouts').classList.contains('hidden'));
 for(let i=0;i<140&&f.api.refs.state==='replay';i++)f.api.loop(now+=50);assert.equal(f.api.refs.state,'result');assert(f.$('.results'));
});
await test('Replay damage borders use recorded hit time without extra words',async f=>{
 await f.api.startMatch();f.api.fightFixture();const sim=f.api.refs.sim,frame=sim.capture();frame.hits=[{key:'1:1',bot:1,hp:146,point:{x:0,y:1,z:0},tick:frame.tick}];const next=JSON.parse(JSON.stringify(frame));next.tick+=4;f.api.beginReplay([frame,next]);f.api.updateHitReadouts();assert.equal(f.$('.hit-hp').textContent,'−146 HP');assert.equal(f.$('.hit-word'),null);assert.equal(f.$('.hit-number').dataset.tier,'2');assert.equal(f.$('.hit-number').textContent,'−146 HP');const pop=f.$('.hit-number').style.getPropertyValue('--hit-pop');f.api.updateHitReadouts();assert.equal(f.$('.hit-number').style.getPropertyValue('--hit-pop'),pop);assert(!f.$('#hit-readouts').classList.contains('hidden'));
 f.$('#skip-replay').click();assert.equal(f.api.refs.state,'fighting');
});
await test('Ring-out results label the loss correctly and never call it disqualification',async f=>{
 await f.api.startMatch();f.api.refs.sim.finish('Out of arena',0);f.api.showResult();assert(f.$('#result-reason').textContent.includes('RING-OUT'));assert(f.$('.result-score').textContent.includes('OUT OF ARENA'));assert(!f.$('.result-score').textContent.includes('DISQUALIFIED'));
});

await test('Landing details show mass, descent, impact speed and one energy budget',async f=>{
 await f.api.startMatch(true);const sim=f.api.refs.sim;
 sim.bots[0].modules.chassis.hp-=.001;
 sim.events.push({id:1,tick:sim.tick,episode:'landing/0/1',source:'Arena landing',attacker:null,target:0,module:'chassis',energy:2200,impulse:700,closing:6.25,point:{x:0,y:0,z:0},rotorBefore:[0,0],rotorAfter:[0,0],allocations:[{bot:0,module:'chassis',energy:600,hp:8.57}],cause:'landing',fallMassKg:113.2,fallHeight:2,fallSpeed:6.25,fallKineticJ:2210.94,fallGravityJ:2210.94,fallAbsorbedJ:133.26});
 sim.finish('Judges’ decision',1);f.api.showResult();const text=f.$('#impact-table').textContent;
 for(const expected of['113.20 kg','2.00 m drop','6.25 m/s downward','Landing energy: 2.21 kJ','Gravity share: 2.21 kJ','Cushioning: 0.13 kJ'])assert(text.includes(expected),expected);
 assert(text.includes('9 HP lost'));assert(!text.includes('8.57 HP'));assert.equal(f.$('.results .data-table tbody tr td:nth-child(2)').textContent,'1 HP');
});

await test('Repair update: result shortcuts, ring-out metrics, fast speed, tracks and visible hit bubbles',async f=>{
 await f.api.startMatch(true);const sim=f.api.refs.sim;sim.bots[0].chassis.setLinvel({x:5,y:0,z:0},true);f.api.updateHUD();assert.equal(f.$('#speed-0').dataset.fast,'true');assert(f.$('#speed-0').textContent.includes('18.0 km/h'));assert(f.$('#player-panel-0').contains(f.$('#speed-0')));
 const before=sim.tick;f.w.document.dispatchEvent(new f.w.KeyboardEvent('keydown',{key:'r',code:'KeyR',bubbles:true}));assert.equal(sim.tick,before);
 sim.events.push({id:901,tick:sim.tick,cause:'weapon',source:'Test hit',module:'chassis',energy:1,impulse:1,closing:1,attacker:0,target:1,rotorBefore:[1,0],rotorAfter:[0,0],point:{x:1000,y:1000,z:1000},allocations:[{bot:1,module:'chassis',energy:1,hp:2.005}]});f.api.refs.renderer.projectCombatPoint=()=>({x:140,y:-50,visible:false});f.api.updateHitReadouts();const bubble=f.$('.hit-number');assert(bubble&&!bubble.classList.contains('hidden'));assert.equal(bubble.textContent,'−2 HP');assert(Number.parseFloat(bubble.style.left)<=58);
 sim.finish('Out of arena',1);sim.result.ringOut={bot:0,origin:{x:0,y:0,z:0},height:3.5,distance:7.4};f.api.showResult();assert(f.$('.ringout-result').textContent.includes('3.50 m'));assert(f.$('.ringout-result').textContent.includes('7.40 m'));
 f.w.document.dispatchEvent(new f.w.KeyboardEvent('keydown',{key:'r',code:'KeyR',bubbles:true}));await Promise.resolve();assert.notEqual(f.api.refs.sim,sim);const next=f.api.refs.sim;next.finish('Fixture',0);f.api.showResult();f.w.document.dispatchEvent(new f.w.KeyboardEvent('keydown',{key:'m',code:'KeyM',bubbles:true}));assert.equal(f.api.refs.state,'menu');
 f.$('[data-preset="10"]').click();f.api.openBuilder();change(f,'[data-path="drive.traction"]','tracks');assert.equal(f.api.refs.build.drive.traction,'tracks');assert.equal(f.$('#test-build').disabled,false);return{shortcuts:2,ringOutMetrics:2,speedKmh:18,offscreenBubbleVisible:true,legalTreadBuild:true};
});

if(results.some(r=>r.status==='failed'))process.exitCode=1;

await test('Battery boxes use no duplicate screen overlays and POV retains its compact gauge',async f=>{
 await f.api.startMatch(true);assert.equal(f.w.document.querySelectorAll('#battery-hints,.battery-target-hint').length,0);
 f.$('#camera-button').click();assert.equal(f.$('#weapon-gauge').closest('[data-camera]').dataset.camera,'pov');assert.equal(f.w.document.querySelectorAll('.battery-target-hint').length,0);assert(f.$('#gauge-name').textContent);assert(f.$('#gauge-label').textContent);
 f.$('#pause-button').click();assert.equal(f.w.document.querySelectorAll('.battery-target-hint').length,0);
});

await test('Performance: hidden tabs pause physics, stop drawing, and stay paused when visible again',async f=>{
 await f.api.startMatch(true);let now=f.w.performance.now()+20;f.api.loop(now);const renderer=f.api.refs.renderer;
 Object.defineProperty(f.w.document,'hidden',{configurable:true,value:true});f.w.document.dispatchEvent(new f.w.Event('visibilitychange'));
 assert.equal(f.api.refs.state,'paused');const tick=f.api.refs.sim.tick,draws=renderer.draws;
 for(let i=0;i<20;i++)f.api.loop(now+=20);assert.equal(f.api.refs.sim.tick,tick);assert.equal(renderer.draws,draws);
 Object.defineProperty(f.w.document,'hidden',{configurable:true,value:false});f.w.document.dispatchEvent(new f.w.Event('visibilitychange'));f.api.loop(now+=20);const pausedDraws=renderer.draws;
 for(let i=0;i<20;i++)f.api.loop(now+=20);assert.equal(renderer.draws,pausedDraws);assert.equal(f.api.refs.sim.tick,tick);
 f.$('#resume').click();f.api.loop(now+=20);assert(f.api.refs.sim.tick>tick);return{hiddenFrames:20,extraHiddenDraws:0,explicitResume:true};
});
await test('Performance: high refresh displays retain 240 Hz physics with at most 60 rendered frames per second',async f=>{
 await f.api.startMatch(true);let now=f.w.performance.now();const renderer=f.api.refs.renderer,before=renderer.draws??0;
 for(let i=0;i<120;i++)f.api.loop(now+=1000/120);
 assert(f.api.refs.sim.tick>=239&&f.api.refs.sim.tick<=242);assert(renderer.draws-before>=59&&renderer.draws-before<=61);return{physicsTicks:f.api.refs.sim.tick,draws:renderer.draws-before};
});
await test('Performance: adaptive display preference saves without changing camera, controls, or quality',f=>{
 const before=JSON.stringify(f.api.refs.prefs.controls);f.$('#open-settings').click();const toggle=f.$('#pref-adaptive');assert(toggle.checked);toggle.checked=false;toggle.dispatchEvent(new f.w.Event('change',{bubbles:true}));
 assert.equal(JSON.parse(f.w.localStorage.getItem('cra.preferences')).adaptive,false);assert.equal(f.api.refs.renderer.adaptive,false);assert.equal(f.api.refs.prefs.quality,'medium');assert.equal(JSON.stringify(f.api.refs.prefs.controls),before);return{saved:true,quality:'medium'};
});
if(results.some(r=>r.status==='failed'))process.exitCode=1;

await test('Performance: countdown and replay audio are not suspended by the HUD timer',async f=>{
 let mutes=0;f.api.refs.audio.mute=()=>{mutes++;};f.api.refs.audio.countdownCue=()=>true;await f.api.startMatch();let now=f.w.performance.now();
 for(let i=0;i<20;i++)f.api.loop(now+=50);assert.equal(f.api.refs.state,'countdown');assert.equal(mutes,0);
 const frame={tick:0,transforms:[],health:[[],[]],effects:[]};f.api.beginReplay(Array.from({length:120},(_,i)=>({...frame,tick:i*4})),'fighting');const replayMutes=mutes;
 for(let i=0;i<10;i++)f.api.loop(now+=50);assert.equal(f.api.refs.state,'replay');assert.equal(mutes,replayMutes);return{countdownMuted:false,replayMuted:false};
});
if(results.some(r=>r.status==='failed'))process.exitCode=1;
