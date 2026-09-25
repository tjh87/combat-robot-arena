import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import * as THREE from 'three';
import {compile,preset,partProperties,v,rotate,quatMul,axisQ,identity,SLOTS} from '../src/model';
import {Simulation,initializePhysics,RAPIER,colliderDesc} from '../src/sim';
import {ArenaRenderer} from '../src/render';
import {buildFoundry,hazardVisual} from '../src/visuals';

// Scene graph and physics tests, without a browser or a WebGL substitute.
// Canvas drawing is a no-op here; procedural paint is inspected separately.
const context=new Proxy({}, {get:()=>()=>{}});
Object.assign(globalThis,{document:{createElement:()=>({width:1,height:1,getContext:()=>context})}});
const results:any[]=[];
async function test(name:string,run:()=>unknown){try{const detail=await run();results.push({name,status:'passed',detail});console.log('PASS',name);}catch(error){results.push({name,status:'failed',error:String(error)});console.log('FAIL',name,String(error));}writeFileSync('docs/visual-results.json',JSON.stringify(results,null,2));}
await initializePhysics();

await test('Clipped plate mass moments match independently constructed Rapier hulls',()=>{
 const world=new RAPIER.World(v());let checked=0;
 try{for(let i=0;i<3;i++)for(const p of compile(preset(i)).parts.filter(p=>['floor','lid','armour_top'].includes(p.id)||p.id.startsWith('drum_bearing_'))){
  const local={...p,position:v(),rotation:identity},body=world.createRigidBody(RAPIER.RigidBodyDesc.dynamic());world.createCollider(colliderDesc(local),body);
  const props=partProperties(local),I=body.principalInertia(),q=body.principalInertiaLocalFrame();
  for(const axis of[v(1,0,0),v(0,1,0),v(0,0,1)]){const a=rotate(axis,{x:-q.x,y:-q.y,z:-q.z,w:q.w}),physical=I.x*a.x*a.x+I.y*a.y*a.y+I.z*a.z*a.z;assert(Math.abs(props.about(axis,props.centre)-physical)<.00001);checked++;}
  world.removeRigidBody(body);
 }return{momentsCompared:checked};}finally{world.free();}
});

await test('Compact preset geometry preserves legal envelopes and underside blade clearance',()=>{
 const configs=[preset(0),preset(1),preset(2)];for(const c of configs)assert.deepEqual(compile(c).errors,[]);
 assert.equal(configs[0].drive.layout,2);assert.equal(configs[1].drive.layout,2);
 const c=configs[0],w=c.weapon;assert(w.type==='horizontal_bar');const upper=w.mount.y+Math.max(w.thickness,w.toothHeight)/2;
 assert(upper< -c.chassis.height/2-.004);assert(c.chassis.height/2+c.chassis.clearance+w.mount.y-Math.max(w.thickness,w.toothHeight)/2>.003);
 assert(w.mount.z>-.45);assert(w.radius*2>c.chassis.width+c.drive.width*2);
 const sim=new Simulation([c,preset(1)],{practice:true,hazards:false,ai:[false,false]});try{
  for(let i=0;i<720;i++)sim.step([{left:0,right:0,weapon:i===0,selfRight:false},{left:0,right:0,weapon:i===0,selfRight:false}]);assert(sim.bots[1].rpm>100,'The drum must spin clear of the floor');
  assert.equal(sim.fault,undefined);assert(sim.bots[0].rpm>100);assert(sim.bots[0].modules.chassis.hp===sim.bots[0].modules.chassis.max);
  return{masses:configs.map(c=>compile(c).mass),bladeFloorGap:.006,bladeTopGap:-c.chassis.height/2-upper,rpm:sim.bots.map(b=>b.rpm)};
 }finally{sim.dispose();}
});

await test('Body-mounted POV uses the interpolated robot heading, pitch and roll',()=>{
 const renderer=Object.create(ArenaRenderer.prototype) as ArenaRenderer,sim=new Simulation([preset(0),preset(1)],{practice:true,hazards:false});
 Object.assign(renderer,{bodyGroups:new Map(),replayGroups:new Map(),replay:false});const group=new THREE.Group();group.position.set(2,.4,-3);renderer.bodyGroups.set('b0:chassis',group);
 const camera=new THREE.PerspectiveCamera(76,16/9,.05,100);let poses=0;
 try{for(const angles of[[0,0,0],[0,Math.PI/2,0],[.4,1.1,.7],[0,0,Math.PI]]){
  group.quaternion.setFromEuler(new THREE.Euler(...angles as [number,number,number]));renderer.positionPOVCamera(camera,sim);
  const forward=new THREE.Vector3(0,-.14,-1).normalize().applyQuaternion(group.quaternion),up=new THREE.Vector3(0,1,0).applyQuaternion(group.quaternion),c=sim.bots[0].compiled.config;
  assert(camera.getWorldDirection(new THREE.Vector3()).distanceTo(forward)<1e-7);assert(camera.up.distanceTo(up)<1e-7);
  const local=camera.position.clone().sub(group.position).applyQuaternion(group.quaternion.clone().invert());assert(local.y>c.chassis.height/2);assert(local.z>0);poses++;
 }
 renderer.replay=true;const recorded=new THREE.Group();recorded.position.set(-5,.3,4);recorded.rotation.y=-1;renderer.replayGroups.set('b0:chassis',recorded);renderer.positionPOVCamera(camera,sim);
 assert(camera.position.distanceTo(recorded.position)<.7);assert(camera.getWorldDirection(new THREE.Vector3()).distanceTo(new THREE.Vector3(0,-.14,-1).normalize().applyQuaternion(recorded.quaternion))<1e-7);
 return{livePoses:poses,recordedReplayPose:true};}finally{sim.dispose();}
});

await test('Detailed arena and robots retain finite geometry within the triangle budget',()=>{
 const renderer=Object.create(ArenaRenderer.prototype) as ArenaRenderer,scene=new THREE.Group();buildFoundry(scene);
 for(let i=0;i<3;i++)for(const part of compile(preset(i)).parts.filter(p=>p.collides))scene.add(renderer.part(part,preset(i)));
 for(const kind of['hammer','blade','auger'] as const)scene.add(hazardVisual(kind));
 let triangles=0,draws=0,maps=0;
 scene.traverse(o=>{if(o instanceof THREE.Mesh){const p=o.geometry.getAttribute('position');assert([...p.array].every(Number.isFinite));triangles+=(o.geometry.index?.count??p.count)/3;draws++;if((o.material as THREE.MeshStandardMaterial).map)maps++;}});
 assert(triangles<150000);assert(draws<400);assert(maps>=9);renderer.clear(scene);return{triangles,meshBatches:draws,paintedSurfaces:maps,actualWebGL:'unverified'};
});

await test('Painted top armour survives replay cycles without disposing live textures',()=>{
 const renderer=Object.create(ArenaRenderer.prototype) as ArenaRenderer;Object.assign(renderer,{bots:new THREE.Group(),bodyGroups:new Map(),replayRoot:new THREE.Group(),replayGroups:new Map(),replay:false,reduced:false});
 const c=preset(0),p=compile(c).parts.find(p=>p.id==='armour_top')!,mesh=renderer.part(p,c),body=new THREE.Group();body.add(mesh);renderer.bots.add(body);renderer.bodyGroups.set('b0:chassis',body);
 let disposals=0;mesh.traverse(o=>{if(o instanceof THREE.Mesh){const map=(o.material as THREE.MeshStandardMaterial).map;map?.addEventListener('dispose',()=>disposals++);}});
 for(let i=0;i<10;i++){renderer.startReplay();renderer.replayFrame({tick:0,transforms:[{id:'b0:chassis',p:v(),q:identity}],health:[SLOTS.map(()=>1),SLOTS.map(()=>1)],effects:[]});renderer.endReplay();assert.equal(disposals,0);}
 renderer.clear(renderer.bots);assert.equal(disposals,1);return{replayCycles:10,textureDisposalsAfterCleanup:disposals};
});
if(results.some(r=>r.status==='failed'))process.exitCode=1;
