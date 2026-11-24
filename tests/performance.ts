import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import * as THREE from 'three';
import {FrameGate,AdaptiveResolution,graphicsPixelRatio} from '../src/performance';
import {compactGeometry} from '../src/geometry-memory';
import {finishedGeometry} from '../src/finish-geometry';
import {ROSTER,preset,compile,RULES,MATERIALS} from '../src/model';
import {Simulation,initializePhysics,Tournament} from '../src/sim';
import {BatteryFireVisual} from '../src/battery-fire-visual';
import {ArenaRenderer,impactLightProfile} from '../src/render';
import {SPARK_CAPACITY,SPARK_TRAIL_FLOATS} from '../src/impact-sparks';
import {GameAudio} from '../src/audio';
import {SnapshotTiming} from '../src/online/timing';

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
test('Online timing buffer stays near current snapshots on a stable link and widens only for arrival jitter',()=>{
 const timing=new SnapshotTiming();timing.observe(0,1000);timing.observe(33,1033);const stable=timing.delay;timing.observe(66,1106);const jittered=timing.delay;assert.equal(stable,42);assert(jittered>stable);for(let i=0;i<18;i++)timing.observe(99+i*33,1139+i*33);assert(timing.delay<jittered);for(let i=0;i<8;i++)timing.observe(700+i*33,1900+i*200);assert(timing.delay<=140);return{stable,jittered,recovered:timing.delay,maximum:140};
});
test('Impact light profile is bounded and scales only with authoritative contact energy',()=>{
 const quiet=impactLightProfile(150),medium=impactLightProfile(2500,80),heavy=impactLightProfile(25000,500);assert.equal(quiet.intensity,0);assert(medium.intensity>0&&heavy.intensity>medium.intensity);assert(heavy.distance>medium.distance);assert.equal(heavy.color,0xff9b55);return{medium,heavy};
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
test('Inactive damage smoke performs no position-buffer uploads while active smoke still advances',()=>{
 const renderer=Object.create(ArenaRenderer.prototype) as any,positions=new Float32Array(64*3),ages=new Float32Array(64).fill(-1),geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));Object.assign(renderer,{reduced:false,smokeClock:0,smokeAges:ages,smokeActive:0,smokeCursor:0,smokePositions:positions,smoke:new THREE.Points(geometry,new THREE.PointsMaterial())});const attribute=geometry.getAttribute('position'),initial=attribute.version;
 renderer.updateSmoke({bots:[]},1/60);assert.equal(attribute.version,initial);assert(!renderer.smoke.visible);ages[0]=1;renderer.smokeActive=1;positions[1]=.5;renderer.updateSmoke({bots:[]},1/60);assert(attribute.version>initial);assert(renderer.smoke.visible);return{idleUploads:0,activeUploads:attribute.version-initial};
});
test('Idle and sparse spark fields avoid full-capacity scans and GPU draw work',()=>{
 const renderer=Object.create(ArenaRenderer.prototype) as any,ages=new Float32Array(SPARK_CAPACITY).fill(-1),positions=new Float32Array(SPARK_CAPACITY*3),trailPositions=new Float32Array(SPARK_CAPACITY*SPARK_TRAIL_FLOATS),colors=new Float32Array(trailPositions.length),headColors=new Float32Array(positions.length),velocity=new Float32Array(positions.length),tints=new Float32Array(positions.length),life=new Float32Array(SPARK_CAPACITY),lengths=new Float32Array(SPARK_CAPACITY),branches=new Uint8Array(SPARK_CAPACITY);
 const pointGeometry=new THREE.BufferGeometry();pointGeometry.setAttribute('position',new THREE.BufferAttribute(positions,3));pointGeometry.setAttribute('color',new THREE.BufferAttribute(headColors,3));pointGeometry.setAttribute('sparkSize',new THREE.BufferAttribute(new Float32Array(SPARK_CAPACITY),1));const points=new THREE.Points(pointGeometry,new THREE.PointsMaterial());
 const trailGeometry=new THREE.BufferGeometry();trailGeometry.setAttribute('position',new THREE.BufferAttribute(trailPositions,3));trailGeometry.setAttribute('color',new THREE.BufferAttribute(colors,3));const trails=new THREE.LineSegments(trailGeometry,new THREE.LineBasicMaterial());
 Object.defineProperty(ages,'some',{value(){throw new Error('idle spark path scanned the whole pool');}});
 Object.assign(renderer,{reduced:false,particleAges:ages,particlePositions:positions,particleVelocity:velocity,particleActiveCount:0,particleHighWater:0,sparkTrailPositions:trailPositions,sparkColors:colors,sparkHeadColors:headColors,sparkTints:tints,sparkLifetimes:life,sparkLengths:lengths,sparkBranches:branches,sparkTintScratch:{x:1,y:.5,z:.1},sparkHeadScratch:{x:0,y:0,z:0},particles:points,sparkTrails:trails});
 renderer.animateParticles(1/60);assert(!points.visible&&!trails.visible);assert.equal(pointGeometry.drawRange.count,0);assert.equal(trailGeometry.drawRange.count,0);
 ages[0]=1;ages[2]=1;life[0]=life[2]=2;lengths[0]=lengths[2]=.04;tints[0]=tints[3]=1;tints[1]=tints[4]=.5;tints[2]=tints[5]=.1;positions[1]=positions[7]=.2;positions[16]=123;trailPositions[SPARK_TRAIL_FLOATS*5]=123;renderer.particleActiveCount=2;renderer.particleHighWater=3;
 renderer.animateParticles(1/60);assert(points.visible&&trails.visible);assert.equal(pointGeometry.drawRange.count,3);assert.equal(trailGeometry.drawRange.count,3*SPARK_TRAIL_FLOATS/3);assert.equal(positions[16],123);assert.equal(trailPositions[SPARK_TRAIL_FLOATS*5],123);assert.equal(positions[4],-10,'Inactive holes inside the live prefix stay hidden');
 renderer.animateParticles(3);assert(!points.visible&&!trails.visible);assert.equal(renderer.particleActiveCount,0);assert.equal(pointGeometry.drawRange.count,0);assert.equal(trailGeometry.drawRange.count,0);
 return{capacity:SPARK_CAPACITY,idleDrawVertices:0,sparsePoints:3,sparseTrailVertices:3*SPARK_TRAIL_FLOATS/3};
});
test('Instanced graphics buffers are released when a scene is replaced',()=>{
 const renderer=Object.create(ArenaRenderer.prototype) as ArenaRenderer,root=new THREE.Group(),mesh=new THREE.InstancedMesh(new THREE.BoxGeometry(),new THREE.MeshBasicMaterial(),5);root.add(mesh);let released=0;mesh.addEventListener('dispose',()=>released++);renderer.clear(root);assert.equal(released,1);assert.equal(root.children.length,0);return{instanceDisposals:released};
});
test('Static menus reuse shadows; moving robots and replays refresh medium shadows at 30 Hz',()=>{
 const renderer=Object.create(ArenaRenderer.prototype) as ArenaRenderer;let shadows=0;
 const graphics={shadowMap:{enabled:true,needsUpdate:false},info:{render:{triangles:0,calls:0}},setViewport(){},setScissorTest(){},render(){if(this.shadowMap.needsUpdate){shadows++;this.shadowMap.needsUpdate=false;}}};
 Object.assign(renderer,{container:{getBoundingClientRect(){throw new Error('No flight label: layout must not be measured');}},renderer:graphics,scene:new THREE.Scene(),arena:new THREE.Group(),bots:new THREE.Group(),preview:new THREE.Group(),effects:new THREE.Group(),camera:new THREE.PerspectiveCamera(42,1,.05,100),cameraTarget:new THREE.Vector3(),bodyGroups:new Map(),replayGroups:new Map(),damageDebris:{root:new THREE.Group()},batteryFireVisual:new BatteryFireVisual(),impactLight:new THREE.PointLight(),followCamera:{reset(){}},povTracking:{reset(){}},quality:'medium',mode:'menu',cameraMode:'tactical',time:0,width:1280,height:720,replay:false,reduced:false,inset:false,lastShadowTime:-Infinity,lastShadowTick:-1,lastShadowMode:'',shadowDirty:true});
 for(let i=0;i<60;i++)renderer.draw(undefined,1/30);assert.equal(shadows,1);
 const sim={bots:[0,1].map(id=>({id,compiled:{config:preset(id)},chassis:{translation:()=>({x:id*2,y:.2,z:0})}})),options:{freeForAll:false},tick:0,batteryFireSeconds:()=>0} as unknown as Simulation;renderer.mode='match';const before=shadows;
 for(let i=0;i<60;i++){sim.tick++;renderer.draw(sim,1/60);}assert(shadows-before>=29&&shadows-before<=31,`shadow updates: ${shadows-before}`);
 const replayStart=shadows;renderer.replay=true;for(let i=0;i<60;i++)renderer.draw(sim,1/60);assert(shadows-replayStart>=29&&shadows-replayStart<=31);return{menuFrames:60,menuShadowUpdates:1,matchShadowUpdates:shadows-before-(shadows-replayStart),replayShadowUpdates:shadows-replayStart};
});
test('Idle audio suspends once and resumes through the existing start flow',()=>{
 const audio=new GameAudio();let suspended=0,resumed=0;audio.context={currentTime:0,suspend:()=>{suspended++;return Promise.resolve();},resume:()=>{resumed++;return Promise.resolve();}} as unknown as AudioContext;audio.loadMetalImpacts=()=>{};audio.prepareEngineVoices=()=>{};
 audio.mute();audio.mute();assert.equal(suspended,1);audio.start(.5,.5);assert.equal(resumed,1);audio.mute();assert.equal(suspended,2);return{suspends:suspended,resumes:resumed};
});
await initializePhysics();
test('Cached contact eligibility matches collider flags and remains valid after armor removal',()=>{
 const configs=[preset(7),preset(2),preset(4)],sim=new Simulation(configs,{seed:73145,hazards:false,freeForAll:true,ai:[false,true,true],recordVisuals:false});
 try{let total=0,ineligible=0;for(const b of sim.bots)for(const collider of b.colliders.values()){const info=sim.meta.get(collider.handle);assert(info);const eligible=!collider.isSensor()&&!!collider.collisionGroups();assert.equal(info.contactEligible,eligible);total++;if(!eligible)ineligible++;}
 const bot=sim.bots[0],armour=Object.entries(bot.modules).find(([slot,module])=>slot.startsWith('armour_')&&module.present);assert(armour);const slot=armour[0] as keyof typeof bot.modules;sim.damage(bot.id,slot,bot.modules[slot].hp*MATERIALS[bot.modules[slot].material].resistance+1);assert.equal(bot.modules[slot].functional,false);
 for(const b of sim.bots)for(const collider of b.colliders.values())assert(collider.isValid(),'The live robot-collider map must not retain removed colliders.');for(let tick=0;tick<8;tick++)sim.step();assert.equal(sim.fault,undefined);return{robotColliders:total,cachedIneligible:ineligible,armorSlot:slot,ticksAfterRemoval:8};
 }finally{sim.dispose();}
});
test('Skipping unseen tournament recordings preserves exact seeded physical state and damage',()=>{
 const configs:[ReturnType<typeof preset>,ReturnType<typeof preset>]=[preset(4),preset(7)],a=new Simulation(configs,{seed:991,hazards:true,practice:true,ai:[true,true]}),b=new Simulation(configs,{seed:991,hazards:true,practice:true,ai:[true,true],recordVisuals:false});
 try{for(let tick=0;tick<960;tick++){a.step();b.step();}assert(!a.fault&&!b.fault);assert.deepEqual(a.snapshot(),b.snapshot());assert.deepEqual(a.events,b.events);assert(a.frames.length>0);assert.equal(b.frames.length,0);return{ticks:a.tick,physicsHz:RULES.hz,recordedFrames:a.frames.length,unseenFrames:b.frames.length};}finally{a.dispose();b.dispose();}
});
test('Tournament work yields after its time budget and continues the same match',()=>{
 const tournament=new Tournament(preset(0),false,73145);try{tournament.stepOffscreen(80,0);const sim=tournament.pending!;assert(sim);assert.equal(sim.tick,1);tournament.stepOffscreen(80,0);assert.equal(tournament.pending,sim);assert.equal(sim.tick,2);assert.equal(sim.frames.length,0);return{ticksPerZeroBudgetCall:1};}finally{tournament.dispose();}
});
writeFileSync('docs/performance-regression-results.json',JSON.stringify({checks,graphics:'Geometry and DOM checks do not measure GPU frame rate.'},null,2));
