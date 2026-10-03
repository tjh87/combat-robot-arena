import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import * as THREE from 'three';
import {JSDOM} from 'jsdom';
import {preset,compile,ROSTER,RULES,isSpinner,v,sub,add,bodyOrigin,axisQ,rotate,dot} from '../src/model';
import {Simulation,initializePhysics,neutral,type Result} from '../src/sim';
import {scorecard} from '../src/result-view';
import {rotorMotion,updateRotorMotion} from '../src/combat-visuals';
import {ArenaRenderer} from '../src/render';
import {GameAudio,METAL_IMPACTS} from '../src/audio';
const results:any[]=[];
async function test(name:string,fn:()=>unknown){if(process.env.CASE&&!name.includes(process.env.CASE))return;try{const detail=await fn();results.push({name,status:'passed',detail});console.log('PASS',name,JSON.stringify(detail));}catch(e){results.push({name,status:'failed',error:String(e)});process.exitCode=1;console.log('FAIL',name,String(e));}writeFileSync('docs/blades-update-results.json',JSON.stringify(results,null,2));}
await initializePhysics();
await test('Tombstone reverses during faster spin-up without turning around, and still responds to steering',()=>{
 const rows=[];for(const direction of[-1,1]){const c=preset(0),s=new Simulation([c,preset(0)],{practice:true,hazards:false,ai:[false,false],autoUnstick:false}),b=s.bots[0],q=axisQ(v(0,1,0),0),p=v(-3,c.chassis.height/2+c.chassis.clearance+.008);try{
  for(const[id,body]of b.bodies){body.setTranslation(add(p,rotate(bodyOrigin(c,id),q)),true);body.setRotation(q,true);body.setLinvel(v(),true);body.setAngvel(v(),true);}s.world.propagateModifiedBodyPositionsToColliders();
  for(let t=0;t<600;t++)s.step([{...neutral(),weapon:t===0},neutral()]);const start={...b.chassis.translation()},forward=s.forward(b);
  for(let t=0;t<360;t++)s.step([{...neutral(),left:direction*.3,right:direction*.3},neutral()]);const headingChange=Math.acos(Math.max(-1,Math.min(1,dot(forward,s.forward(b))))),travel=dot(sub(b.chassis.translation(),start),forward)*direction;assert(headingChange<.6);assert(travel>1);const turnStart=s.forward(b);
  for(let t=0;t<120;t++)s.step([{...neutral(),left:-.3,right:.3},neutral()]);const steeringChange=Math.acos(Math.max(-1,Math.min(1,dot(turnStart,s.forward(b)))));assert(steeringChange>.15);assert.equal(s.fault,undefined);rows.push({direction,travelM:travel,headingChangeDegrees:headingChange*180/Math.PI,steeringChangeDegrees:steeringChange*180/Math.PI});
 }finally{s.dispose();}}return rows;
});
await test('A knockout does not display losing judge totals as the winning score',()=>{
 const r={winner:0,reason:'Count-out',scores:[[2,1,2],[3,2,1]],ties:[]} as unknown as Result,dom=new JSDOM(scorecard(r));try{
  assert.equal(dom.window.document.querySelectorAll('.score-total').length,0);assert(!dom.window.document.querySelector('details')?.open);assert(dom.window.document.querySelector('.score-card.won')?.textContent?.includes('KO WIN'));assert(dom.window.document.querySelector('.score-explainer')?.textContent?.includes('POINTS DO NOT APPLY'));
  r.reason='Judges’ decision';r.winner=1;dom.window.document.body.innerHTML=scorecard(r);assert.equal(dom.window.document.querySelector('.score-card.won .score-total')?.firstChild?.textContent,'6');assert(!dom.window.document.querySelector('.unused-scores'));return{knockoutWinner:0,judgeTotals:[5,6],judgedWinner:1,unusedScoresCollapsed:true};
 }finally{dom.window.close();}
});
await test('Rotor blur scales with speed while retaining real blade faces',()=>{
 const rows=[];for(let i=0;i<10;i++){const c=preset(i),w=c.weapon;if(!isSpinner(w))continue;const rotor=new THREE.Group(),motion=rotorMotion(c);rotor.add(motion);updateRotorMotion(rotor,w.rpm,2);assert(motion.visible);let area=0,meshes=0;
  motion.traverse(o=>{if(o instanceof THREE.Mesh){meshes++;assert.equal(o.material.depthWrite,false);if(motion.userData.horizontal){assert.equal(o.material.blending,THREE.NormalBlending);assert.equal(o.material.forceSinglePass,true);assert.equal(o.geometry.attributes.color.itemSize,4);assert(o.geometry.userData.exposureAngle>0);assert(o.material.opacity<.6);}else{const p=(o.geometry as THREE.RingGeometry).parameters;area+=(p.outerRadius**2-p.innerRadius**2)*p.thetaLength/2;assert.equal(o.material.blending,THREE.AdditiveBlending);}}});
  const coverage=area/(Math.PI*w.radius*w.radius);if(!motion.userData.horizontal)assert(coverage<.04);else assert(meshes<=2);
  const mesh=motion.children[0].children[0] as THREE.Mesh,angle=mesh.rotation.z;updateRotorMotion(rotor,w.rpm,2.1);if(!motion.userData.horizontal)assert.notEqual(mesh.rotation.z,angle);else assert.equal(mesh.rotation.z,angle,'Exposure stays attached to the real rotor');updateRotorMotion(rotor,0,2.2);assert(!motion.visible);rows.push({name:c.identity.name,meshes,horizontal:motion.userData.horizontal,verticalStreakCoveragePercent:coverage*100});
  motion.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose();o.material.dispose();}});
 }return rows;
});
await test('Weapon faces retain their cutting edges without damage markers',()=>{
 const r=Object.create(ArenaRenderer.prototype) as ArenaRenderer,rows=[];
 for(const i of[0,1,5,6,8,9]){const c=preset(i),p=compile(c).parts.find(p=>p.tooth===0)!,mesh=r.part(p,c);try{
  const children=mesh.children.length;for(const hp of[1,.6,.1,0])r.applyHealth(mesh,hp);assert.equal(mesh.children.length,children);assert(!mesh.children.some(o=>o.userData.damageThreshold||o.userData.impactTick));assert(mesh.getObjectByName('cutting-edge'));rows.push({name:c.identity.name,damageMarkers:0});
 }finally{r.disposeObject(mesh);}}return rows;
});
await test('Six requested weapons reach operating speed at least fifty percent sooner without changing rotor energy',()=>{
 const previous=[[0,14.045833333333333,50.89794176301254],[3,20.416666666666668,55.65066886024846],[5,35.92916666666667,130.30298750695312],[6,29.1125,101.89964254615806],[8,9.479166666666666,31.66626741649346],[9,33.975,134.08840456853883]];
 return previous.map(([i,before,energy])=>{const c=preset(i),b=compile(c);assert(isSpinner(c.weapon));assert.deepEqual(b.errors,[]);assert(b.spinup<before*.5);assert(Math.abs(b.rotorInertia*(c.weapon.rpm*Math.PI/30)**2/2000-energy)<.001);return{name:ROSTER[i].name,beforeSeconds:before,afterSeconds:b.spinup,reductionPercent:100*(1-b.spinup/before),massKg:b.mass};});
});
await test('Hydra gives a contact-based flip cue and launches an equal-mass opponent higher',()=>{
 const f=preset(2),target=preset(0),mass=compile(f).mass;target.weapon={type:'none'};Object.assign(target.chassis,{length:.64,width:.58,height:.16,clearance:.018});Object.assign(target.drive,{layout:4,radius:.10,width:.075});let low=.004,high=.020;for(let i=0;i<30;i++){target.chassis.thickness=(low+high)/2;if(compile(target).mass>mass)high=target.chassis.thickness;else low=target.chassis.thickness;}assert(Math.abs(compile(target).mass-mass)<.001);
 const s=new Simulation([f,target],{practice:true,hazards:false,ai:[false,false],autoUnstick:false});try{
  assert(!s.flipOpportunity(s.bots[0]).ready);for(const[id,x]of[[0,-.7],[1,.7]]){const b=s.bots[id],delta=sub(v(x,b.chassis.translation().y,0),b.chassis.translation());for(const body of b.bodies.values())body.setTranslation(add(body.translation(),delta),true);}s.world.propagateModifiedBodyPositionsToColliders();s.bots[1].energy=0;
  let height=0,ready=0,firstReady=-1;for(let t=0;t<1500;t++){const cue=s.flipOpportunity(s.bots[0]);if(t<450&&cue.ready){ready++;if(firstReady<0)firstReady=t;}if(t===450)assert(cue.ready);s.step([{...neutral(),left:t<450?.3:0,right:t<450?.3:0,weapon:t===450},neutral()]);height=Math.max(height,s.bots[1].chassis.translation().y);if(t===451)assert.equal(s.flipOpportunity(s.bots[0]).label,'FLIPPING');}
  assert.equal(s.fault,undefined);assert(ready>0);assert(height>.5705521702766418*1.8);assert(s.bots[0].flipWork<=18900);s.damage(0,'weapon_actuator',1e9);assert.notEqual(s.flipOpportunity(s.bots[0]).label,'FLIP UNAVAILABLE');return{massKg:mass,previousPeakM:.5705521702766418,peakM:height,workJ:s.bots[0].flipWork,firstCueSeconds:firstReady/RULES.hz,readySamples:ready};
 }finally{s.dispose();}
});
await test('Recorded impacts, ICEwave engines and eleven unique weapon voices load and release',async()=>{
 const oldAudio=(globalThis as any).AudioContext,oldFetch=globalThis.fetch,requests:string[]=[],sources:any[]=[],decoded:any[]=[];
 class Param{value=0;setTargetAtTime(x:number){this.value=x;}setValueAtTime(x:number){this.value=x;}exponentialRampToValueAtTime(x:number){this.value=x;}}
 const node=()=>({gain:new Param(),playbackRate:new Param(),frequency:new Param(),Q:new Param(),connections:[] as any[],disconnected:false,connect(n:any){this.connections.push(n);},disconnect(){this.disconnected=true;},start(){},stop(){}});
 (globalThis as any).AudioContext=class{state='running';sampleRate=8000;currentTime=1;destination={};createGain=node;createOscillator=node;createBiquadFilter=node;createBufferSource(){const n=node();sources.push(n);return n;}createBuffer(_c:number,n:number){const data=new Float32Array(n);return{getChannelData:()=>data,duration:n/8000};}async decodeAudioData(data:ArrayBuffer){const result={recorded:true,bytes:data.byteLength,duration:10};decoded.push(result);return result;}resume(){return Promise.resolve();}close(){return Promise.resolve();}};
 globalThis.fetch=(async (url:string)=>{requests.push(url);const bytes=readFileSync('public'+url);assert.equal(bytes.subarray(0,3).toString(),'ID3');return{ok:true,arrayBuffer:async()=>bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength)};}) as any;
 const audio=new GameAudio();try{
  audio.start(.7,.8);await audio.impactLoad;assert.equal(requests.length,11);assert(!requests.some(url=>url.includes("icewave")));assert.equal(decoded.length,11);for(const style of['tap','strike','crash'] as const)assert.equal(audio.impactLibrary[style].length,METAL_IMPACTS[style].length);
  const profiles=[];for(let i=0;i<ROSTER.length;i++){const config=preset(i),old=audio.weaponLoops[0];audio.motors([1,0],['rpm' in config.weapon?config.weapon.rpm:0,0],true,[config,preset(0)],[5000,0],[true,false],[3,0]);assert.equal(audio.weaponLoops[0].profile,ROSTER[i].profile);assert(i===3?audio.weaponLoops[0].gain.gain.value===0:audio.weaponLoops[0].gain.gain.value>0);if(old)assert(old.source.disconnected);profiles.push(audio.weaponLoops[0].profile);if(i===3)assert(audio.combustionLoops[0][1].gain.gain.value>0);}assert.equal(new Set(profiles).size,11);audio.mute();assert(audio.weaponLoops.every(v=>v.gain.gain.value===0));assert(audio.combustionLoops.flat().every(v=>v.gain.gain.value===0));
  const rows=[];for(const energy of[40,1000,12000]){audio.impact(energy);const source=sources.at(-1);assert(source.buffer.recorded);rows.push({energy,gain:source.connections[0].connections[0].gain.value,playbackRate:source.playbackRate.value});source.onended();assert(source.disconnected);assert.equal(audio.voices,0);}assert(rows[0].gain<rows[1].gain&&rows[1].gain<rows[2].gain);assert(rows[2].playbackRate<rows[0].playbackRate);for(const [height,energy,style] of [[.2,400,'landLight'],[2,4000,'landHeavy']] as const){audio.impact(energy,'rubber',height);const source=sources.at(-1);assert(audio.impactLibrary[style].includes(source.buffer));source.onended();assert.equal(audio.voices,0);}return{weaponProfiles:profiles.length,samples:decoded.length,bytes:decoded.reduce((s,x)=>s+x.bytes,0),hits:rows};
 }finally{audio.dispose();(globalThis as any).AudioContext=oldAudio;globalThis.fetch=oldFetch;}
});
