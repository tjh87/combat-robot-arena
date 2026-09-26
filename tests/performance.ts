import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import * as THREE from 'three';
import {FrameGate,AdaptiveResolution,graphicsPixelRatio} from '../src/performance';
import {compactGeometry} from '../src/geometry-memory';
import {finishedGeometry} from '../src/finish-geometry';
import {ROSTER,preset,compile,RULES} from '../src/model';
import {Simulation,initializePhysics,Tournament} from '../src/sim';
import {BatteryFireVisual} from '../src/battery-fire-visual';
import {ArenaRenderer} from '../src/render';
import {GameAudio} from '../src/audio';

const checks:{name:string,detail:unknown}[]=[];
function test(name:string,run:()=>unknown){const detail=run();checks.push({name,detail});console.log('PASS',name);}
test('Presentation rate is bounded on 60, 120 and 144 Hz displays; static screens redraw only on changes',()=>{
 const counts=[];
 for(const refresh of[60,120,144])for(const target of[30,60]){const gate=new FrameGate();let draws=0;for(let i=0;i<refresh*10;i++)if(gate.due(i*1000/refresh,'match',target))draws++;assert(Math.abs(draws-target*10)<=1);counts.push({refresh,target,draws});}
 const paused=new FrameGate();assert(paused.due(0,'paused',0));for(let t=1;t<200;t++)assert(!paused.due(t*16.67,'paused',0));assert(paused.due(4000,'paused',0,true));assert(paused.due(4001,'menu',30));return counts;
});
test('Adaptive resolution responds to sustained load, recovers slowly, and keeps manual quality available',()=>{
 const r=new AdaptiveResolution();for(let i=0;i<31*14;i++)r.sample(1/31);assert.equal(r.scale,.65);const low=r.scale;for(let i=0;i<60*9;i++)r.sample(1/60);assert(r.scale>low&&r.scale<1);const prior=r.scale;r.sample(2);assert.equal(r.scale,prior);
 assert.equal(graphicsPixelRatio('high',2,3840,2160,false),1.5);const ratio=graphicsPixelRatio('medium',2,3840,2160);assert(ratio**2*3840*2160<=1600*900+.01);assert.equal(graphicsPixelRatio('medium',1,1280,720),1);return{minimumScale:low,recovered:r.scale,mediumPixelBudget:1600*900};
});
test('All 11 robot shapes keep every triangle, UV seam and normal after vertex indexing',()=>{
 let parts=0,oldBytes=0,newBytes=0;
 for(let i=0;i<ROSTER.length;i++){const config=preset(i);for(const p of compile(config).parts.filter(p=>p.collides)){const raw=finishedGeometry(p,config),copy=raw.clone(),packed=compactGeometry(raw);const a=copy.index?copy.toNonIndexed():copy,b=packed.index?packed.toNonIndexed():packed;
  for(const name of Object.keys(a.attributes)){const av=a.getAttribute(name).array,bv=b.getAttribute(name).array;assert.equal(bv.length,av.length);for(let n=0;n<av.length;n++)assert(Math.abs(av[n]-bv[n])===0,`${config.identity.name}/${p.id}/${name}/${n}`);}
  const bytes=(g:THREE.BufferGeometry)=>Object.values(g.attributes).reduce((n,a)=>n+a.array.byteLength,0)+(g.index?.array.byteLength??0);oldBytes+=bytes(copy);newBytes+=bytes(packed);parts++;
  if(a!==copy)a.dispose();if(b!==packed)b.dispose();copy.dispose();packed.dispose();
 }}assert(newBytes<oldBytes);return{robots:ROSTER.length,parts,oldBytes,newBytes};
});
test('Inactive battery flames issue no buffer uploads and active flames still move and light the robot',()=>{
 const fire=new BatteryFireVisual(),p=fire.flames.geometry.getAttribute('position');const initial=p.version;for(let i=0;i<120;i++)fire.update([],i/60);assert.equal(p.version,initial);assert(!fire.flames.visible&&!fire.smoke.visible);fire.update([{position:{x:1,y:2,z:3},active:true}],1);assert(fire.flames.visible&&fire.lights[0].intensity>0&&p.version>initial);const active=p.version;fire.update([],2);assert.equal(p.version,active);assert.equal(fire.lights[0].intensity,0);return{idleUpdates:120,idleUploads:0};
});
test('Instanced graphics buffers are released when a scene is replaced',()=>{
 const renderer=Object.create(ArenaRenderer.prototype) as ArenaRenderer,root=new THREE.Group(),mesh=new THREE.InstancedMesh(new THREE.BoxGeometry(),new THREE.MeshBasicMaterial(),5);root.add(mesh);let released=0;mesh.addEventListener('dispose',()=>released++);renderer.clear(root);assert.equal(released,1);assert.equal(root.children.length,0);return{instanceDisposals:released};
});
test('Static menus reuse shadows; moving robots and replays refresh medium shadows at 30 Hz',()=>{
 const renderer=Object.create(ArenaRenderer.prototype) as ArenaRenderer;let shadows=0;
 const graphics={shadowMap:{enabled:true,needsUpdate:false},info:{render:{triangles:0,calls:0}},setViewport(){},setScissorTest(){},render(){if(this.shadowMap.needsUpdate){shadows++;this.shadowMap.needsUpdate=false;}}};
 Object.assign(renderer,{renderer:graphics,scene:new THREE.Scene(),arena:new THREE.Group(),bots:new THREE.Group(),preview:new THREE.Group(),effects:new THREE.Group(),camera:new THREE.PerspectiveCamera(42,1,.05,100),cameraTarget:new THREE.Vector3(),bodyGroups:new Map(),replayGroups:new Map(),batteryFireVisual:new BatteryFireVisual(),quality:'medium',mode:'menu',cameraMode:'tactical',time:0,width:1280,height:720,replay:false,reduced:false,inset:false,lastShadowTime:-Infinity,lastShadowTick:-1,lastShadowMode:'',shadowDirty:true});
 for(let i=0;i<60;i++)renderer.draw(undefined,1/30);assert.equal(shadows,1);
 const sim={bots:[0,1].map(id=>({id,compiled:{config:preset(id)},chassis:{translation:()=>({x:id*2,y:.2,z:0})}})),tick:0,batteryFireSeconds:()=>0} as unknown as Simulation;renderer.mode='match';const before=shadows;
 for(let i=0;i<60;i++){sim.tick++;renderer.draw(sim,1/60);}assert(shadows-before>=29&&shadows-before<=31,`shadow updates: ${shadows-before}`);
 const replayStart=shadows;renderer.replay=true;for(let i=0;i<60;i++)renderer.draw(sim,1/60);assert(shadows-replayStart>=29&&shadows-replayStart<=31);return{menuFrames:60,menuShadowUpdates:1,matchShadowUpdates:shadows-before-(shadows-replayStart),replayShadowUpdates:shadows-replayStart};
});
test('Idle audio suspends once and resumes through the existing start flow',()=>{
 const audio=new GameAudio();let suspended=0,resumed=0;audio.context={currentTime:0,suspend:()=>{suspended++;return Promise.resolve();},resume:()=>{resumed++;return Promise.resolve();}} as unknown as AudioContext;audio.loadMetalImpacts=()=>{};audio.prepareEngineVoices=()=>{};
 audio.mute();audio.mute();assert.equal(suspended,1);audio.start(.5,.5);assert.equal(resumed,1);audio.mute();assert.equal(suspended,2);return{suspends:suspended,resumes:resumed};
});
await initializePhysics();
test('Skipping unseen tournament recordings preserves exact seeded physical state and damage',()=>{
 const configs:[ReturnType<typeof preset>,ReturnType<typeof preset>]=[preset(4),preset(7)],a=new Simulation(configs,{seed:991,hazards:true,practice:true,ai:[true,true]}),b=new Simulation(configs,{seed:991,hazards:true,practice:true,ai:[true,true],recordVisuals:false});
 try{for(let tick=0;tick<960;tick++){a.step();b.step();}assert(!a.fault&&!b.fault);assert.deepEqual(a.snapshot(),b.snapshot());assert.deepEqual(a.events,b.events);assert(a.frames.length>0);assert.equal(b.frames.length,0);return{ticks:a.tick,physicsHz:RULES.hz,recordedFrames:a.frames.length,unseenFrames:b.frames.length};}finally{a.dispose();b.dispose();}
});
test('Tournament work yields after its time budget and continues the same match',()=>{
 const tournament=new Tournament(preset(0),false,73145);try{tournament.stepOffscreen(80,0);const sim=tournament.pending!;assert(sim);assert.equal(sim.tick,1);tournament.stepOffscreen(80,0);assert.equal(tournament.pending,sim);assert.equal(sim.tick,2);assert.equal(sim.frames.length,0);return{ticksPerZeroBudgetCall:1};}finally{tournament.dispose();}
});
writeFileSync('docs/performance-regression-results.json',JSON.stringify({checks,graphics:'Geometry and DOM checks do not measure GPU frame rate.'},null,2));
