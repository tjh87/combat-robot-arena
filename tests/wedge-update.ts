import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';
import * as THREE from 'three';
import {preset,v,add,bodyOrigin,axisQ,rotate,compile,RULES,flipEnergy,unlimitedFlips,isRampPart} from '../src/model';
import {Simulation,initializePhysics,neutral,type Travel} from '../src/sim';
import {FlightLabel,flightLabelPosition,flightReadout} from '../src/flight-label';
import {GameAudio,impactProfile,impactSurface,readyImpactSounds,exhaustSamples} from '../src/audio';
const results:any[]=[];
async function test(name:string,run:()=>unknown){try{const detail=await run();results.push({name,status:'passed',detail});console.log('PASS',name,JSON.stringify(detail));}catch(e){results.push({name,status:'failed',error:String(e)});process.exitCode=1;console.log('FAIL',name,String(e));}writeFileSync('docs/wedge-update-results.json',JSON.stringify(results,null,2));}
await initializePhysics();
function pose(s:Simulation,i:number,p:{x:number,y:number,z:number},angle=0){const b=s.bots[i],q=axisQ(v(0,1,0),angle);for(const[key,body]of b.bodies){body.setRotation(q,true);body.setTranslation(add(p,rotate(bodyOrigin(b.compiled.config,key),q)),true);body.setLinvel(v(),true);body.setAngvel(v(),true);}s.world.propagateModifiedBodyPositionsToColliders();}
await test('Low clearance blocks a wedge while higher clearance allows entry and lifting',()=>{
 const rows=[];for(const clearance of[.003,.008,.030,.100]){
  const a=preset(2);a.chassis.profile='standard';a.weapon={type:'none'};a.chassis.width=.34;a.chassis.length=.55;a.drive.radius=.09;a.drive.width=.06;
  const b=preset(2);b.chassis.profile='standard';b.chassis.form='box';b.weapon={type:'none'};b.chassis.clearance=clearance;b.chassis.width=.62;b.drive.radius=.1;
  const s=new Simulation([a,b],{practice:true,hazards:false,ai:[false,false],autoUnstick:false});try{
   pose(s,0,v(0,a.chassis.height/2+a.chassis.clearance+.008,0));pose(s,1,v(0,b.chassis.height/2+clearance+.008,-1.05));for(let t=0;t<240;t++)s.step();
   const base=s.bots[1].chassis.translation().y;let rise=0,insertion=-1;
   for(let t=0;t<600;t++){s.step([{...neutral(),left:.22,right:.22},neutral()]);const ap=s.bots[0].chassis.translation(),bp=s.bots[1].chassis.translation();rise=Math.max(rise,bp.y-base);insertion=Math.max(insertion,bp.z+b.chassis.length/2-(ap.z-a.chassis.length/2-.14));}
   assert.equal(s.fault,undefined);if(clearance===.003){assert(insertion<.002);assert(rise<.003);}else{assert(insertion>.05);if(clearance<.05)assert(rise>.01);}
   rows.push({clearanceMm:clearance*1000,insertionMm:insertion*1000,liftMm:rise*1000});
  }finally{s.dispose();}
 }return rows;
});
await test('Hydra can enter beneath each opposing robot using actual wedge contacts',()=>{
 const rows=[];for(let i=0;i<10;i++){
  const a=preset(2),b=preset(i),s=new Simulation([a,b],{practice:true,hazards:false,ai:[false,false],autoUnstick:false});try{
   pose(s,0,v(0,a.chassis.height/2+a.chassis.clearance+.008,0));pose(s,1,v(0,b.chassis.height/2+b.chassis.clearance+.008,-1.85),i===2?Math.PI/2:Math.PI);
   for(let t=0;t<240;t++)s.step();let insertion=-2,rise=0,support=0;const start=s.bots[1].chassis.translation().y;
   const ramps=s.bots[0].compiled.parts.filter(isRampPart).map(p=>s.bots[0].colliders.get(p.id)!);
   for(let t=0;t<1200;t++){
    s.step([{...neutral(),left:.18,right:.18},neutral()]);const ap=s.bots[0].chassis.translation(),bp=s.bots[1].chassis.translation();insertion=Math.max(insertion,bp.z+(i===2?b.chassis.width:b.chassis.length)/2-(ap.z-.66));rise=Math.max(rise,bp.y-start);
    for(const col of ramps)s.world.contactPairsWith(col,other=>{if(s.meta.get(other.handle)?.bot===1)s.world.contactPair(col,other,m=>{if(Math.abs(m.normal().y)>.2)for(let k=0;k<m.numContacts();k++)if(m.contactImpulse(k)>.001)support++;});});
   }
   // Outriggers and long forks may be supported before reaching the main hull.
   // Check real upward contact and lift rather than crossing a hull bounding box.
   assert.equal(s.fault,undefined);assert(support>0,b.identity.name+' lacks ramp support');assert(rise>.001,b.identity.name+' was not lifted');rows.push({name:b.identity.name,supportingContacts:support,chassisInsertionMm:insertion*1000,liftMm:rise*1000,approach:i===2?'side of equal-height wedge':'front'});
  }finally{s.dispose();}
 }return rows;
});
await test('Hydra performs twenty flips without a charge limit and still enforces cooldown and damage',()=>{
 const s=new Simulation([preset(2),preset(0)],{practice:true,hazards:false,ai:[false,false],autoUnstick:false}),b=s.bots[0];let maxWork=0;try{
  for(let t=0;t<240;t++)s.step();const start=b.energy;b.charges=0;
  for(let n=0;n<20;n++){assert(s.requestFire(b),'flip '+n);assert(!s.requestFire(b),'cooldown');for(let t=0;t<480;t++){s.step();maxWork=Math.max(maxWork,b.flipWork);}assert.equal(s.fault,undefined);}
  assert(b.energy<start);assert(maxWork<=flipEnergy(b.compiled.config)+.001);s.damage(0,'weapon_actuator',1e9);assert(s.requestFire(b));assert(unlimitedFlips(b.compiled.config));return{flips:20,chargesRemaining:b.charges,maxWorkJ:maxWork,energySpentJ:start-b.energy};
 }finally{s.dispose();}
});
await test('Minotaur drum is recessed and Deep Six has no upper wheels or struts',()=>{
 const m=preset(1),c=compile(m);assert(m.weapon.type==='drum');assert.equal(m.weapon.mount.z,-.378);assert(c.parts.some(p=>p.id==='floor_wing_-1'));assert(!c.parts.some(p=>p.id==='floor'));assert.deepEqual(c.errors,[]);
 const d=compile(preset(9));assert(!d.parts.some(p=>p.id.includes('_upper')||p.id.startsWith('vertical_roll_')));assert.equal(new Set(d.parts.filter(p=>p.body.startsWith('wheel_')).map(p=>p.body)).size,2);
 return{drumHubMovedBackMm:90,minotaurMassKg:c.mass,deepSixMassKg:d.mass,deepSixParts:d.parts.length};
});
await test('Flight measurements follow the line endpoint and stay within desktop and mobile viewports',()=>{
 const dom=new JSDOM('<div id="scene"></div>');(globalThis as any).document=dom.window.document;
 try{const label=new FlightLabel(document.querySelector('#scene')!),camera=new THREE.PerspectiveCamera(60,16/9,.05,100);camera.position.set(3,4,7);camera.lookAt(0,0,0);
 const track={bot:1,horizontal:3.456,height:1.234,origin:v(0,.15,0),final:v(2,.8,1)} as Travel;assert.deepEqual(flightReadout(track),{robot:'P2',distance:'3.46 m',height:'1.23 m'});label.update(track);
 for(const[w,h]of[[1280,720],[390,844]]){camera.aspect=w/h;camera.updateProjectionMatrix();label.draw(camera,w,h,true);assert(!label.element.hidden);assert(Number.parseFloat(label.element.style.left)>=8);assert(Number.parseFloat(label.element.style.left)+222<=w+1);const p=flightLabelPosition(camera,track,w,h);assert(p);}
 assert(label.element.textContent?.includes('3.46 m'));assert(label.element.textContent?.includes('1.23 m'));label.draw(camera,390,844,false);assert(label.element.hidden);label.update({...track,final:v(300,0,0)});label.draw(camera,390,844,true);assert(label.element.hidden);label.dispose();assert(!document.querySelector('.flight-label'));return{viewports:2,distance:'3.46 m',peakHeight:'1.23 m',hiddenOffscreen:true};
 }finally{dom.window.close();}
});
await test('Hit strength and contact material produce distinct, louder impact sounds',()=>{
 const rows=[40,1000,12000].map(energy=>({energy,...impactProfile(energy)}));assert(rows[0].gain<rows[1].gain&&rows[1].gain<rows[2].gain);assert(rows[0].duration<rows[2].duration);assert.deepEqual(rows.map(r=>r.style),['tap','strike','crash']);
 assert(impactProfile(1000,'rubber').cutoff<impactProfile(1000,'plastic').cutoff);assert(impactProfile(1000,'plastic').cutoff<impactProfile(1000,'metal').cutoff);
 assert.equal(impactSurface('armour_top','uhmw'),'plastic');assert.equal(impactSurface('drive_left'),'rubber');assert.equal(impactSurface('drive_left','steel'),'metal');
 const event={id:1,tick:100,target:1,energy:2} as any;assert.equal(readyImpactSounds([event],109,0).events.length,0);event.energy=7000;const batch=readyImpactSounds([event],110,0);assert.equal(batch.events[0].energy,7000);assert.equal(readyImpactSounds([event],111,batch.lastID).events.length,0);return{profiles:rows,surfaces:3,delayMs:1000*10/RULES.hz};
});
await test('Impact playback creates bounded waveforms, obeys the voice limit, and releases audio nodes',()=>{
 const old=(globalThis as any).AudioContext,buffers:Float32Array[]=[],sources:any[]=[];
 class Param{value=0;setTargetAtTime(x:number){this.value=x;}setValueAtTime(x:number){this.value=x;}exponentialRampToValueAtTime(x:number){this.value=x;}}
 const make=()=>({gain:new Param(),playbackRate:new Param(),frequency:new Param(),Q:new Param(),connections:[] as any[],disconnected:false,connect(n:any){this.connections.push(n);},disconnect(){this.disconnected=true;},start(){},stop(){}});
 (globalThis as any).AudioContext=class{state='running';sampleRate=8000;currentTime=1;destination={};createGain=make;createOscillator=make;createBiquadFilter=make;createBufferSource(){const n=make();sources.push(n);return n;}createBuffer(_channels:number,length:number){const data=new Float32Array(length);buffers.push(data);return{getChannelData:()=>data};}resume(){return Promise.resolve();}close(){return Promise.resolve();}};
 const audio=new GameAudio();try{
  audio.start(.7,.8);assert(audio.available);const rows=[];
  for(const energy of[40,1000,12000]){audio.impact(energy);const source=sources.at(-1),data=buffers.at(-1)!,filter=source.connections[0],gain=filter.connections[0];assert(data.every(x=>Number.isFinite(x)&&Math.abs(x)<=1));const rms=Math.sqrt(data.reduce((sum,x)=>sum+x*x,0)/data.length)*gain.gain.value;rows.push({energy,rms,samples:data.length});source.onended();assert(source.disconnected&&filter.disconnected&&gain.disconnected);assert.equal(audio.voices,0);}
  assert(rows[0].rms<rows[1].rms&&rows[1].rms<rows[2].rms);const first=sources.length;
  for(let i=0;i<15;i++)audio.impact(1000,['metal','plastic','rubber'][i%3] as any);assert.equal(audio.voices,12);assert.equal(sources.length-first,12);for(const s of sources.slice(first))s.onended();assert.equal(audio.voices,0);
  audio.context!.suspend=()=>Promise.resolve();(audio.context as any).state='suspended';audio.impact(1000);assert.equal(audio.voices,0);return{waveforms:rows,maxConcurrentImpacts:12,releasedNodes:true};
 }finally{audio.dispose();(globalThis as any).AudioContext=old;}
});
await test('ICEwave uses a separate pulsed exhaust loop while electrical spinners and actuators keep their own layers',()=>{
 const old=(globalThis as any).AudioContext;
 class Param{value=0;setTargetAtTime(x:number){this.value=x;}setValueAtTime(x:number){this.value=x;}exponentialRampToValueAtTime(x:number){this.value=x;}}
 const make=()=>({gain:new Param(),playbackRate:new Param(),frequency:new Param(),Q:new Param(),connect(){},disconnect(){},start(){},stop(){}});
 (globalThis as any).AudioContext=class{state='running';sampleRate=8000;currentTime=1;destination={};createGain=make;createOscillator=make;createBiquadFilter=make;createBufferSource=make;createBuffer(_channels:number,length:number){const data=new Float32Array(length);return{getChannelData:()=>data};}resume(){return Promise.resolve();}close(){return Promise.resolve();}};
 const audio=new GameAudio();try{
  audio.start(.7,.8);const cfg=[preset(3),preset(1)];audio.motors([0,0],[0,0],true,cfg,[0,0],[true,true]);assert(audio.combustionLoops[0][0].gain.gain.value>0);assert.equal(audio.combustionLoops[1][0].gain.gain.value,0);const idle=audio.combustionLoops[0][0].source.playbackRate.value;
  audio.motors([0,0],[1800,5000],true,cfg,[3000,2000],[true,true]);const running=audio.combustionLoops[0][0].source.playbackRate.value;assert(running>idle*2);assert(audio.tones[5].osc.frequency.value>audio.tones[4].osc.frequency.value);assert(audio.air[1].gain.gain.value>0);
  audio.motors([0,0],[0,0],true,[preset(2),preset(8)],[0,0],[false,false],[4,2]);assert(audio.tones[4].gain.gain.value>0);assert(audio.air[0].gain.gain.value>0);assert.equal(audio.combustionLoops[0][0].gain.gain.value,0);
  audio.mute();assert([...audio.tones,...audio.air,...audio.combustionLoops.flat()].every(t=>t.gain.gain.value===0));const samples=exhaustSamples(8000);assert(samples.every(x=>Number.isFinite(x)&&Math.abs(x)<=1));assert(Math.sqrt(samples.reduce((sum,x)=>sum+x*x,0)/samples.length)>.03);return{exhaustLayers:2,idleRate:idle,runningRate:running,actuatorSound:true,mutedOnPause:true};
 }finally{audio.dispose();(globalThis as any).AudioContext=old;}
});
if(results.some(r=>r.status==='failed'))process.exitCode=1;
