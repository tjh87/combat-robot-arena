import assert from 'node:assert/strict';
import * as THREE from 'three';
import {preset,compile,partProperties,armOffset,bodyOrigin,add,rotate,axisQ,v,canonical,encodeBuild,decodeBuild} from '../src/model';
import {sawbladeContours} from '../src/sawblade-profile';
import {sawblazeSweepClearance} from '../src/sawblaze-geometry';
import {rotorMotion,updateRotorMotion} from '../src/combat-visuals';
import {initializePhysics,Simulation,neutral} from '../src/sim';
import {ArenaRenderer} from '../src/render';
import {disposeSawbladeExposure} from '../src/sawblaze-blur';

const c=preset(8),w=c.weapon;assert(w.type==='hammer_saw');const built=compile(c);
assert.deepEqual(built.errors,[]);assert.equal(canonical(decodeBuild(encodeBuild(c))),canonical(c));assert(Math.abs(built.mass-113.2)<1e-8);
assert(sawbladeContours(w.radius)[0][27].y<0,'The broad hammer flank faces forward.');
const clearance=sawblazeSweepClearance(c,built.parts);assert(clearance>.002,'The full rotating envelope clears this robot throughout its normal stroke.');
for(const side of[-1,0,1]){
 const wedge=built.parts.find(p=>p.id==='saw_fork_'+side)!,collar=built.parts.find(p=>p.id==='saw_fork_collar_'+side)!;assert(wedge.shape.kind==='hull');assert(collar.shape.kind==='hull');assert.equal(wedge.body,collar.body);
 const vertices=(p:typeof wedge)=>p.shape.kind==='hull'?Array.from({length:p.shape.vertices.length/3},(_,i)=>add(bodyOrigin(c,p.body),add(p.position,v(...p.shape.vertices.slice(i*3,i*3+3) as [number,number,number])))):[];
 const shared=vertices(wedge).filter(a=>vertices(collar).some(b=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z)<1e-9));assert(shared.length>=2,'A wedge shares its rear top edge with its black support.');assert(wedge.mass>0);assert(partProperties(wedge).about(v(1,0,0))>0);
}
console.log('PASS Approved assembly, upright forward blade, three attached wedges and swept clearance',JSON.stringify({massKg:built.mass,clearanceM:clearance,pivot:w.mount}));

const root=new THREE.Group(),motion=rotorMotion(c);root.add(motion);let previous=0;
for(const rpm of[0,200,900,1800,3600,w.rpm]){
 updateRotorMotion(root,rpm,1,false,1);const angle=motion.userData.exposureAngle;assert(angle>=previous);previous=angle;
 assert.equal(motion.visible,rpm>60);for(const child of motion.children){const material=(child as THREE.Mesh).material as THREE.ShaderMaterial;assert.equal(material.uniforms.direction.value,1);assert(Number.isFinite(material.uniforms.strength.value));}
}
assert(Math.abs(previous-Math.PI*2)<1e-10);updateRotorMotion(root,900,1,false,-1);for(const child of motion.children)assert.equal(((child as THREE.Mesh).material as THREE.ShaderMaterial).uniforms.direction.value,-1);
updateRotorMotion(root,w.rpm,2,true,1);assert(!motion.visible);updateRotorMotion(root,0,3,false,1);assert(!motion.visible);
// Replay uniforms retain independent speed state while the coverage mask stays immutable.
const replay=root.clone(true);replay.traverse(o=>{if(o instanceof THREE.Mesh)o.material=o.material.clone();});updateRotorMotion(replay,1800,4,false,-1);updateRotorMotion(root,200,4,false,1);
assert.notEqual(replay.getObjectByName('rotor-motion')!.userData.exposureAngle,motion.userData.exposureAngle);
for(const group of[root,replay])group.traverse(o=>{if(o instanceof THREE.Mesh){disposeSawbladeExposure(o.material as THREE.Material);(o.material as THREE.Material).dispose();}});motion.children.forEach(o=>(o as THREE.Mesh).geometry.dispose());
console.log('PASS RPM-based exposure, full high-speed blur, reverse direction, reduced motion, stop and replay state');

const old=structuredClone(c);assert(old.weapon.type==='hammer_saw');old.weapon.mount=v(0,.115,.115);assert.deepEqual(compile(old).errors,[],'The saved default pivot migrates to the approved assembly.');
await initializePhysics();const sim=new Simulation([c,preset(0)],{practice:true,hazards:false,ai:[false,false],autoUnstick:false});
try{for(let t=0;t<1600;t++){if(t===300||t===1000)assert(sim.requestStrike(sim.bots[0]));sim.step([{...neutral(),weapon:t===0},neutral()]);assert.equal(sim.fault,undefined);assert(sim.bots[0].flipWork<=1300.001);}assert(sim.bots[0].rpm>200);assert(Math.abs(sim.bots[0].flipAngle)<.075);console.log('PASS Real Rapier spins, strikes twice, returns and respects the arm work budget',JSON.stringify({rpm:sim.bots[0].rpm,angle:sim.bots[0].flipAngle}));}finally{sim.dispose();}
const context=new Proxy({}, {get:()=>()=>{}});Object.assign(globalThis,{document:{createElement:()=>({getContext:()=>context})}});const renderer=Object.create(ArenaRenderer.prototype) as ArenaRenderer;
for(const p of built.parts.filter(p=>p.id.startsWith('saw_'))){const mesh=renderer.part(p,c);assert([...mesh.geometry.getAttribute('position').array].every(Number.isFinite));renderer.disposeObject(mesh);}
console.log('PASS Finite assembly geometry and disposal');
