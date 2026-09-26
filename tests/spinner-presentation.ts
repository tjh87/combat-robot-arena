import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import * as THREE from 'three';
import {rotorMotion,updateRotorMotion} from '../src/combat-visuals';
import {ArenaRenderer} from '../src/render';
import {HitReadouts} from '../src/hit-readouts';
import {preset,isSpinner,SLOTS,v} from '../src/model';
import type {ImpactEvent,VisualFrame} from '../src/sim';

const checks:{name:string,detail:unknown}[]=[];
function test(name:string,run:()=>unknown){checks.push({name,detail:run()});console.log('PASS',name);}
const meshes=(root:THREE.Object3D)=>{const list:THREE.Mesh<THREE.BufferGeometry,THREE.MeshBasicMaterial>[]=[];root.traverse(o=>{if(o instanceof THREE.Mesh)list.push(o);});return list;};
function make(index:number){const config=preset(index),rotor=new THREE.Group(),effect=rotorMotion(config);rotor.add(effect);return{config,rotor,effect};}
function dispose(root:THREE.Object3D){for(const mesh of meshes(root)){mesh.geometry.dispose();mesh.material.dispose();}}

test('All four horizontal weapons use wider and stronger exposure at higher actual RPM',()=>{
 const rows=[];for(const index of[0,3,5,6]){const {config,rotor,effect}=make(index);try{
  updateRotorMotion(rotor,300,0);const list=meshes(effect),slow=list.map(m=>({span:m.geometry.userData.exposureAngle,opacity:m.material.opacity}));
  updateRotorMotion(rotor,600,1);list.forEach((mesh,i)=>{assert(Math.abs(mesh.geometry.userData.exposureAngle/slow[i].span-2)<1e-10);assert(mesh.material.opacity>slow[i].opacity);assert.equal(mesh.geometry.attributes.color.itemSize,4);assert.equal(mesh.material.depthTest,true);assert.equal(mesh.material.depthWrite,false);assert.equal(mesh.material.forceSinglePass,true);assert(!mesh.castShadow);});
  assert(isSpinner(config.weapon));updateRotorMotion(rotor,config.weapon.rpm,2);
  for(const mesh of list){const p=mesh.geometry.attributes.position,c=mesh.geometry.attributes.color;assert([...p.array].every(Number.isFinite));assert([...c.array].every(Number.isFinite));assert(mesh.material.opacity<.6);let transparent=false,visible=false;for(let i=0;i<p.count;i++){assert(Math.hypot(p.getX(i),p.getY(i))<=mesh.geometry.userData.radius+1e-6);assert.equal(p.getZ(i),0);transparent||=c.getW(i)===0;visible||=c.getW(i)>.1;}assert(transparent&&visible);}
  assert(list.length<=2);rows.push({robot:config.identity.name,meshes:list.length,triangles:list.reduce((n,m)=>n+m.geometry.index!.count/3,0),exposureDegrees:list.map(m=>m.geometry.userData.exposureAngle*180/Math.PI)});
 }finally{dispose(effect);}}return rows;
});

test('Horizontal exposure trails follow the real spin direction and inverted rotor pose',()=>{
 for(const index of[0,3,5,6]){const {rotor,effect}=make(index);try{
  rotor.position.set(2,1,-3);rotor.quaternion.setFromEuler(new THREE.Euler(Math.PI,.7,0));const pose=rotor.quaternion.clone();
  updateRotorMotion(rotor,800,0,false,1);const mesh=meshes(effect)[0],positions=mesh.geometry.attributes.position,index=14,data=mesh.geometry.userData;
  const signed=(x:number,y:number)=>Math.atan2(y,x)-data.phase;
  const positive=signed(positions.getX(index),positions.getY(index));updateRotorMotion(rotor,800,.1,false,-1);
  const negative=signed(positions.getX(index),positions.getY(index));assert(Math.abs(Math.sin(positive)+Math.sin(negative))<1e-6);assert.equal(rotor.quaternion.angleTo(pose),0);
  rotor.updateMatrixWorld(true);const p=new THREE.Vector3(positions.getX(index),positions.getY(index),0),expected=p.clone().applyQuaternion(mesh.parent!.quaternion).add(mesh.parent!.position).applyQuaternion(pose).add(rotor.position);
  assert(mesh.localToWorld(p).distanceTo(expected)<1e-6);
 }finally{dispose(effect);}}return{robots:4,directions:2,inverted:true,physicalPoseChanged:false};
});

test('Replay interpolates blur RPM and restores live buffers without disposing shared geometry',()=>{
 const {rotor,effect}=make(0),renderer=Object.create(ArenaRenderer.prototype) as ArenaRenderer;
 Object.assign(renderer,{bots:new THREE.Group(),replayRoot:new THREE.Group(),bodyGroups:new Map([['b0:rotor',rotor]]),replayGroups:new Map(),reduced:false});renderer.bots.add(rotor);
 updateRotorMotion(rotor,300,0);const live=meshes(effect)[0],before=Array.from(live.geometry.attributes.position.array),opacity=live.material.opacity;let disposed=0;live.geometry.addEventListener('dispose',()=>disposed++);
 renderer.startReplay();const q=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),Math.PI/2);
 const frame={tick:0,transforms:[{id:'b0:rotor',p:v(),q:{x:0,y:0,z:0,w:1}}],rpm:[300,0],directions:[1,1],health:[SLOTS.map(()=>1),SLOTS.map(()=>1)],effects:[]} as unknown as VisualFrame;
 const next={...frame,tick:8,rpm:[900,0],transforms:[{id:'b0:rotor',p:v(),q:{x:q.x,y:q.y,z:q.z,w:q.w}}]} as VisualFrame;
 renderer.replayFrame(frame,next,.5);const replay=meshes(renderer.replayGroups.get('b0:rotor')!)[0];assert.equal(replay.geometry.userData.rpm,600);assert.notEqual(replay.material,live.material);assert.equal(live.material.opacity,opacity);
 assert(renderer.replayGroups.get('b0:rotor')!.quaternion.angleTo(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),Math.PI/4))<1e-6);
 renderer.endReplay();assert.equal(disposed,0);updateRotorMotion(rotor,300,0);assert.deepEqual(Array.from(live.geometry.attributes.position.array),before);dispose(effect);assert.equal(disposed,1);
 return{interpolatedRPM:600,liveRPM:300,sharedBuffersRestored:true,disposals:disposed};
});

test('All nine spinners stop cleanly and keep reduced motion; horizontal buffers are reused',()=>{
 let spinners=0;for(let i=0;i<11;i++){const config=preset(i);if(!isSpinner(config.weapon))continue;spinners++;const {rotor,effect}=make(i);try{
  updateRotorMotion(rotor,0,0);assert(!effect.visible);updateRotorMotion(rotor,config.weapon.rpm,1);assert(effect.visible);const list=meshes(effect),buffers=list.map(m=>m.geometry.attributes.position.array),versions=list.map(m=>m.geometry.attributes.position.version);
  for(let frame=0;frame<180;frame++)updateRotorMotion(rotor,config.weapon.rpm,frame/60);
  list.forEach((mesh,j)=>{assert.equal(mesh.geometry.attributes.position.array,buffers[j]);if(effect.userData.horizontal)assert.equal(mesh.geometry.attributes.position.version,versions[j]);});
  updateRotorMotion(rotor,config.weapon.rpm,4,true);assert(!effect.visible);updateRotorMotion(rotor,0,5);assert(!effect.visible);updateRotorMotion(rotor,Number.NaN,6);assert(!effect.visible);
 }finally{dispose(effect);}}assert.equal(spinners,9);return{spinners,steadyFrames:180,newSteadyStateBuffers:0};
});

test('Suppressing tiny visual labels does not round or drop contact damage or crusher summaries',()=>{
 const h=new HitReadouts(),event={id:1,cause:'weapon',point:v(),allocations:[{bot:0,hp:0}]} as ImpactEvent,seen=new Map<string,number>();let counted=0;
 for(let tick=0;tick<200;tick++){event.allocations[0].hp+=.001;for(const hit of h.update([event],tick)){counted+=hit.hp-(seen.get(hit.key)??0);seen.set(hit.key,hit.hp);}}assert(Math.abs(counted-.2)<1e-10);
 const crush={id:2,cause:'crush',point:v(),allocations:[{bot:1,hp:73.28}]} as ImpactEvent;h.reset();assert.equal(h.update([crush],0).length,0);crush.releasedTick=50;assert.equal(h.update([crush],50)[0].hp,73.28);assert.equal(h.update([crush],51)[0].hp,73.28);
 return{tinyContactHP:counted,crusherHP:73.28,duplicateDamage:0};
});
writeFileSync('docs/spinner-presentation-results.json',JSON.stringify({checks,limits:'Geometry and DOM checks; GPU appearance still requires a WebGL-capable browser.'},null,2)+'\n');
