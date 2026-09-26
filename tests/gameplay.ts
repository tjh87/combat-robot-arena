import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import * as THREE from 'three';
import {RULES,preset,compile,v,add,sub,rotate,horizontal,isSpinner,matchColors} from '../src/model';
import {Simulation,initializePhysics,neutral,FixedClock} from '../src/sim';
import {rotorMotion,updateRotorMotion} from '../src/combat-visuals';
import {ArenaRenderer} from '../src/render';
import {GameAudio} from '../src/audio';

const results:any[]=[];
async function check(name:string,run:()=>unknown){if(process.env.CASE&&!name.includes(process.env.CASE))return;try{const detail=await run();results.push({name,status:'passed',detail});console.log('PASS',name,JSON.stringify(detail));}catch(e){results.push({name,status:'failed',error:String(e)});console.log('FAIL',name,String(e));}writeFileSync('docs/gameplay-results.json',JSON.stringify(results,null,2));}
await initializePhysics();
await check('Healthy waiting robots do not lose without combat or a blocked drive request',()=>{
 const s=new Simulation([preset(9),preset(1)],{hazards:false,ai:[false,false]});
 try{for(let i=0;i<16*240;i++)s.step([neutral(),neutral()]);assert.equal(s.result,undefined);assert.equal(s.fault,undefined);assert(s.bots.every(b=>b.count===0));assert.equal(s.events.length,0);return{seconds:s.time,counts:s.bots.map(b=>b.count)};}finally{s.dispose();}
});
await check('A disabled robot receives the full visible countdown and loses at ten seconds',()=>{
 const s=new Simulation([preset(0),preset(1)],{hazards:false,ai:[false,false]});const counts:number[]=[];
 try{s.bots[1].energy=0;for(let i=0;i<2400;i++){s.step();if(s.tick%240===0)counts.push(10-s.bots[1].count/240);if(i<2399)assert.equal(s.result,undefined);}assert.equal(s.result?.reason,'Count-out');assert.equal(s.result?.winner,0);assert.equal(s.time,10);assert.deepEqual(counts,[9,8,7,6,5,4,3,2,1,0]);return{seconds:s.time,remaining:counts};}finally{s.dispose();}
});
await check('HUGE reaches operating speed without floor strikes or chassis overturning',()=>{
 const s=new Simulation([preset(7),preset(2)],{hazards:false,ai:[false,false]});let minimumClearance=1,minimumUp=1;
 try{for(let i=0;i<2880;i++){s.step([{...neutral(),weapon:i===120},neutral()]);const b=s.bots[0],w=b.compiled.config.weapon;assert(isSpinner(w));minimumClearance=Math.min(minimumClearance,b.rotor!.translation().y-w.radius);minimumUp=Math.min(minimumUp,rotate(v(0,1,0),b.chassis.rotation()).y);}assert.equal(s.result,undefined);assert.equal(s.fault,undefined);assert(minimumClearance>.04);assert(minimumUp>.98);assert(s.bots[0].rpm>2300);assert.equal(s.events.length,0);return{minimumClearance,minimumUp,rpm:s.bots[0].rpm};}finally{s.dispose();}
});
await check('Five robot families escape a corner using the actual drive and AI',()=>{
 const data:any[]=[];for(const i of[0,1,2,7,9]){
 const s=new Simulation([preset(i),preset(2)],{hazards:false,ai:[true,false]});
 try{const b=s.bots[0];for(const body of b.bodies.values())body.setTranslation(add(body.translation(),v(9.8,0,6.2)),true);let escape=0;
 for(let j=0;j<12*240&&!s.result&&!s.fault;j++){s.step();const p=b.chassis.translation();if(!escape&&Math.abs(p.x)<5.6&&Math.abs(p.z)<5.6)escape=s.time;}
 assert.equal(s.fault,undefined);assert(escape>0&&escape<10,b.compiled.config.identity.name+' failed to escape');data.push({name:b.compiled.config.identity.name,escapeSeconds:escape});}finally{s.dispose();}}
 return data;
});
await check('Automatic assistance reverses a blocked player and clears the count without teleporting',()=>{
 const s=new Simulation([preset(2),preset(1)],{hazards:false,ai:[false,false]});let assists=0,maxStep=0;
 try{const b=s.bots[0];for(const body of b.bodies.values())body.setTranslation(add(body.translation(),v(10,0,6.2)),true);let previous={...b.chassis.translation()};for(let i=0;i<12*240&&!s.result;i++){s.step([{left:.8,right:.8,weapon:false,selfRight:false},neutral()]);if(b.unstick.active)assists++;const p=b.chassis.translation();maxStep=Math.max(maxStep,horizontal(previous,p));previous={...p};}assert.equal(s.fault,undefined);assert(assists>0);assert.equal(s.result,undefined);assert(maxStep<.15);return{assistSeconds:assists/240,maxStep,count:b.count/240};}finally{s.dispose();}
});
await check('Launch trails record the flight and stop following the robot after landing',()=>{
 const s=new Simulation([preset(1),preset(2)],{practice:true,hazards:false,ai:[false,false],autoUnstick:false});
 try{for(let i=0;i<120;i++)s.step();const b=s.bots[0];(s as any).openTravel(0,{id:122,tick:s.tick},'Recoil travel');(s as any).openTravel(0,{id:123,tick:s.tick},'Post-impact travel');assert.equal(s.tracking.get(0)?.role,'Post-impact travel');for(const body of b.bodies.values())body.setLinvel(v(2,6,0),true);
 for(let i=0;i<720;i++)s.step();const t=s.travels.find(t=>t.impactId===123)!;assert(t,'Flight never closed');assert(t.airborne);assert.equal(t.reason,'Landed');assert(t.height>1&&t.airtime>.7);assert(t.points.length>10);assert(Math.abs(t.horizontal-horizontal(t.origin,t.final))<1e-8);
 const final=JSON.stringify(t.final);for(let i=0;i<300;i++)s.step([{left:.6,right:.6,weapon:false,selfRight:false},neutral()]);assert.equal(JSON.stringify(t.final),final);assert.equal(s.displayedTravel?.impactId,123);return{distance:t.horizontal,height:t.height,airtime:t.airtime,samples:t.points.length,reason:t.reason};}finally{s.dispose();}
});
await check('Mirror matches use distinct liveries without changing physics or the saved build',()=>{
 for(let i=0;i<10;i++){const original=preset(i),json=JSON.stringify(original),pair=matchColors([original,original]);assert.notEqual(pair[0].identity.primary,pair[1].identity.primary);assert.notEqual(pair[0].identity.secondary,pair[1].identity.secondary);assert.equal(compile(pair[0]).mass,compile(pair[1]).mass);assert.equal(JSON.stringify(original),json);}
 return{templates:10};
});
await check('Rotor exposure trails appear at speed, animate, and vanish when stopped',()=>{
 for(const i of[0,1,3,4,5,6,7,8,9]){const rotor=new THREE.Group(),effect=rotorMotion(preset(i));rotor.add(effect);updateRotorMotion(rotor,0,0);assert(!effect.visible);updateRotorMotion(rotor,1500,1);assert(effect.visible);const mesh=effect.children[0].children[0] as THREE.Mesh<THREE.BufferGeometry,THREE.MeshBasicMaterial>,angle=mesh.rotation.z;assert(mesh.material.opacity>0);updateRotorMotion(rotor,1500,1.016);if(effect.userData.horizontal){assert.equal(mesh.rotation.z,angle);assert(mesh.geometry.userData.exposureAngle>0);}else assert.notEqual(mesh.rotation.z,angle);updateRotorMotion(rotor,1500,2,true);assert(!effect.visible);effect.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose();(o.material as THREE.Material).dispose();}});}return{spinnerTemplates:9};
});
await check('Opponent direction remains on screen for targets in front, behind and on either side',()=>{
 const r=Object.create(ArenaRenderer.prototype) as ArenaRenderer;r.camera=new THREE.PerspectiveCamera(76,16/9,.05,100);r.camera.position.set(0,.7,0);r.camera.lookAt(0,.7,-1);r.bodyGroups=new Map();const other=new THREE.Group();r.bodyGroups.set('b1:chassis',other);const fake={bots:[{chassis:{translation:()=>v()}},{chassis:{translation:()=>v()}}]} as any;
 const data=[];for(const p of[v(0,0,-4),v(0,0,4),v(-4,0,0),v(4,0,0),v(-4,0,4)]){other.position.set(p.x,p.y,p.z);const indicator=r.opponentIndicator(fake);assert(Object.values(indicator).every(x=>typeof x==='boolean'||Number.isFinite(x)));assert(indicator.x>=7&&indicator.x<=93&&indicator.y>=20&&indicator.y<=80);if(p.z>0)assert(indicator.behind);data.push(indicator);}return data;
});
await check('Weapon sound frequencies follow rotor RPM, blade count and motor ratio',()=>{
 class Param{value=0;setTargetAtTime(x:number){this.value=x;}setValueAtTime(x:number){this.value=x;}exponentialRampToValueAtTime(x:number){this.value=x;}}
 const make=()=>({gain:new Param(),playbackRate:new Param(),frequency:new Param(),Q:new Param(),connect(){},disconnect(){},start(){},stop(){}});
 (globalThis as any).AudioContext=class{state='running';sampleRate=8000;currentTime=1;destination={};createGain(){return make();}createOscillator(){return make();}createBiquadFilter(){return make();}createBufferSource(){return make();}createBuffer(_a:number,length:number){return{getChannelData:()=>new Float32Array(length)};}resume(){return Promise.resolve();}close(){return Promise.resolve();}};
 const audio=new GameAudio();try{audio.start(.7,.8);const configs=[preset(0),preset(1)];audio.motors([1,0],[1200,2400],true,configs,[2000,3000]);assert.equal(audio.tones[2].osc.frequency.value,40);assert.equal(audio.tones[3].osc.frequency.value,160);assert(audio.air[0].gain.gain.value>0);const slow=audio.tones[4].osc.frequency.value;audio.motors([1,0],[2400,2400],true,configs,[2000,3000]);assert.equal(audio.tones[4].osc.frequency.value,slow*2);audio.mute();assert(audio.tones.every(t=>t.gain.gain.value===0));assert(audio.air.every(t=>t.gain.gain.value===0));return{voices:audio.tones.length,airLayers:audio.air.length};}finally{audio.dispose();}
});
await check('Damaged armour changes its finish without overlay markers',()=>{
 const context=new Proxy({}, {get:()=>()=>{}});Object.assign(globalThis,{document:{createElement:()=>({width:1,height:1,getContext:()=>context})}});
 const r=Object.create(ArenaRenderer.prototype) as ArenaRenderer,c=preset(0),part=compile(c).parts.find(p=>p.id==='armour_left')!,mesh=r.part(part,c);const children=mesh.children.length;
 r.applyHealth(mesh,.5);assert.equal(mesh.children.length,children);assert(!mesh.children.some(o=>o.userData.damageThreshold||o.userData.impactTick));assert(mesh.scale.x<1);assert((mesh.material as THREE.MeshStandardMaterial).roughness>.6);r.disposeObject(mesh);return{retainedMarks:0,armourDeformed:true};
});
if(results.some(r=>r.status==='failed'))process.exitCode=1;
