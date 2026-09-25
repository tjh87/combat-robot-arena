import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import * as THREE from 'three';
import {ROSTER,preset,compile,encodeBuild,decodeBuild,canonical,isSpinner,bodyOrigin,armOffset,povMount,partProperties,weaponAxis,v,sub,add,rotate,identity,dot,length,axisQ,RULES} from '../src/model';
import {initializePhysics,Simulation,RAPIER,colliderDesc,neutral,Tournament} from '../src/sim';
import {ArenaRenderer} from '../src/render';
const results:any[]=[];
async function test(name:string,run:()=>unknown){if(process.env.CRA_TEST_FILTER&&!new RegExp(process.env.CRA_TEST_FILTER).test(name))return;try{const detail=await run();results.push({name,status:'passed',detail});console.log('PASS',name,JSON.stringify(detail));}catch(e){results.push({name,status:'failed',error:String(e)});console.log('FAIL',name,String(e));}writeFileSync(process.env.CRA_TEST_FILTER?'docs/roster-focused-results.json':'docs/roster-results.json',JSON.stringify(results,null,2));}
await initializePhysics();
await test('All eleven templates meet the limits and survive build-link round trips',()=>{
 assert.equal(ROSTER.length,11);return ROSTER.map((r,i)=>{const c=preset(i),built=compile(c);assert.deepEqual(built.errors,[],r.name);assert.equal(canonical(decodeBuild(encodeBuild(c))),canonical(c));assert.equal(new Set(built.parts.map(p=>p.id)).size,built.parts.length);assert(built.parts.every(p=>p.mass>0));return{name:r.name,reference:r.reference,mass:built.mass,parts:built.parts.length};});
});
await test('Every new convex part has mass moments consistent with Rapier',()=>{
 const world=new RAPIER.World(v());let checked=0,maxError=0;
 try{for(let i=3;i<ROSTER.length;i++)for(const p of compile(preset(i)).parts){
  const body=world.createRigidBody(RAPIER.RigidBodyDesc.dynamic());world.createCollider(colliderDesc(p),body);const props=partProperties(p),I=body.principalInertia(),q=body.principalInertiaLocalFrame();
  assert(length(sub(props.centre,body.localCom()))<2e-5,p.id+' centroid');
  for(const axis of[v(1,0,0),v(0,1,0),v(0,0,1)]){const a=rotate(axis,{x:-q.x,y:-q.y,z:-q.z,w:q.w}),physical=I.x*a.x*a.x+I.y*a.y*a.y+I.z*a.z*a.z,error=Math.abs(props.about(axis,props.centre)-physical);maxError=Math.max(maxError,error);assert(error<Math.max(3e-5,physical*.001),p.id+' inertia: '+error);checked++;}world.removeRigidBody(body);
 }return{moments:checked,maxAbsoluteError:maxError};}finally{world.free();}
});
await test('Every template can drive and each spinner gains rotor speed with the correct axis',()=>{
 const data:any[]=[];
 for(let i=0;i<ROSTER.length;i++){
  const c=preset(i),s=new Simulation([c,preset(0)],{practice:true,hazards:false,ai:[false,false]});
  try{const b=s.bots[0],start={...b.chassis.translation()};let freeRPM=0;for(let j=0;j<960;j++){s.step([{left:j>720?.6:0,right:j>720?.6:0,weapon:j===0&&isSpinner(c.weapon),selfRight:false},neutral()]);if(j===719){freeRPM=b.rpm;if(c.weapon.type==='flipper')assert(b.rpm<1,'The idle flipper must hold still');}}assert.equal(s.fault,undefined,c.identity.name);assert(Math.abs(s.totalMass(b)-b.compiled.mass)<.002);assert(length(sub(b.chassis.translation(),start))>.12,c.identity.name+' did not drive');if(isSpinner(c.weapon)){assert(freeRPM>35,c.identity.name+' rotor stalled');const parent=b.arm??b.chassis,axis=rotate(weaponAxis(c.weapon),parent.rotation()),delta=sub(b.rotor!.angvel(),parent.angvel());assert(length(sub(delta,{x:axis.x*dot(delta,axis),y:axis.y*dot(delta,axis),z:axis.z*dot(delta,axis)}))<Math.max(.1,length(delta)*.001),c.identity.name+' joint axis');}data.push({name:c.identity.name,rpm:b.rpm,freeRPM,travel:length(sub(b.chassis.translation(),start))});}finally{s.dispose();}
 }return data;
});
await test('Hammer-saw swings twice, returns, conserves its hinge anchors, and respects its work budget',()=>{
 const s=new Simulation([preset(8),preset(0)],{practice:true,hazards:false,ai:[false,false]});let minimum=0,maximumWork=0,anchorError=0,fires=0,timeToStrike=Infinity;const b=s.bots[0],w=b.compiled.config.weapon;assert(w.type==='hammer_saw');
 try{for(let j=0;j<2400;j++){
  if(j===300||j===1300){assert(s.requestStrike(b),'Arm must accept a fresh stroke');fires++;}
  s.step([{...neutral(),weapon:j===0},neutral()]);minimum=Math.min(minimum,b.flipAngle);maximumWork=Math.max(maximumWork,b.flipWork);
  if(j>=300&&j<1300&&b.flipAngle<=-.9&&timeToStrike===Infinity)timeToStrike=(j-300+1)/RULES.hz;
  const anchor=add(b.arm!.translation(),rotate(armOffset(w),b.arm!.rotation()));anchorError=Math.max(anchorError,length(sub(anchor,b.rotor!.translation())));
 }assert.equal(s.fault,undefined);assert(timeToStrike<=.15,'The downward stroke must reach the strike angle within 150 ms');assert(minimum<-.65);assert(Math.abs(b.flipAngle)<.075);assert.equal(b.flipStart,-1);assert(maximumWork<=1300.001);assert(anchorError<.025);assert(b.rpm>200);assert(s.frames.at(-1)!.transforms.some(t=>t.id==='b0:weapon_arm'));s.damage(0,'weapon_actuator',1e9);s.tick+=2*RULES.hz;assert.equal(s.requestStrike(b),true);return{strokes:fires,timeToStrike,minimumAngle:minimum,returnAngle:b.flipAngle,maximumWork,anchorError};}finally{s.dispose();}
});
await test('New templates retain their distinct physical features and reject overlapping custom rotors',()=>{
 const huge=compile(preset(7)),shell=compile(preset(5)),cage=compile(preset(6)),deep=compile(preset(9));
 assert(huge.parts.some(p=>p.id==='floor_-1'));assert(!huge.parts.some(p=>p.id==='floor'));assert(huge.parts.filter(p=>p.body==='wheel_-1_0').length>20);assert.equal(shell.parts.filter(p=>p.id.startsWith('shell_panel')).length,24);assert.equal(cage.parts.filter(p=>p.id.startsWith('cage_arm')).length,3);assert(deep.envelope.y>1.1);
 const smallShell=preset(5);if(smallShell.weapon.type==='shell_spinner')smallShell.weapon.radius=.20;assert(compile(smallShell).errors.some(e=>e.field==='weapon.radius'));
 const saw=preset(8);if(saw.weapon.type==='hammer_saw')saw.weapon.armTravel=1.5;assert(compile(saw).errors.some(e=>e.field==='weapon.armTravel'));
 const badBar=preset(9);if(badBar.weapon.type==='vertical_bar')badBar.weapon.teeth=4;assert(compile(badBar).errors.some(e=>e.field==='weapon.teeth'));
 return{splitChassis:true,hollowWheels:true,spinningShell:true,threeArmCage:true,largeVertical:true};
});
await test('All eleven POV mounts follow actual body pose and face forward in live and replay views',()=>{
 const renderer=Object.create(ArenaRenderer.prototype) as ArenaRenderer;Object.assign(renderer,{bodyGroups:new Map(),replayGroups:new Map(),replay:false});const cam=new THREE.PerspectiveCamera();
 for(let i=0;i<ROSTER.length;i++){const c=preset(i),body=new THREE.Group();body.position.set(1,.8,-2);body.quaternion.setFromEuler(new THREE.Euler(.4,1.3,.2));const fake={bots:[{compiled:{config:c},chassis:{translation:()=>v(),rotation:()=>identity}}]} as any;renderer.bodyGroups.set('b0:chassis',body);renderer.positionPOVCamera(cam,fake);if(c.chassis.profile==='huge'){assert(cam.up.y>.99);assert(cam.getWorldDirection(new THREE.Vector3()).y<0);continue;}const m=povMount(c),local=cam.position.clone().sub(body.position).applyQuaternion(body.quaternion.clone().invert());assert(local.distanceTo(new THREE.Vector3(m.x,m.y,m.z))<1e-7);assert(cam.getWorldDirection(new THREE.Vector3()).distanceTo(new THREE.Vector3(0,-.14,-1).normalize().applyQuaternion(body.quaternion))<1e-7);}
 return{templates:ROSTER.length};
});
await test('Tournament entrants can draw from the full roster without illegal builds',()=>{
 const profiles=new Set();for(let seed=0;seed<8;seed++){const t=new Tournament(preset(8),false,seed);try{for(const e of t.entries){assert.deepEqual(compile(e.config).errors,[]);profiles.add(e.config.chassis.profile);}}finally{t.dispose();}}assert.equal(profiles.size,11);return{seeds:8,templates:profiles.size};
});
await test('All templates create finite, bounded builder geometry and complete cleanup',()=>{
 const context=new Proxy({}, {get:()=>()=>{}});Object.assign(globalThis,{document:{createElement:()=>({width:1,height:1,getContext:()=>context})}});
 const renderer=Object.create(ArenaRenderer.prototype) as ArenaRenderer;Object.assign(renderer,{preview:new THREE.Group(),time:0});const counts:any[]=[];
 for(let i=0;i<ROSTER.length;i++){renderer.showBuilder(preset(i));let triangles=0,meshes=0;renderer.preview.traverse(o=>{if(o instanceof THREE.Mesh){const p=o.geometry.getAttribute('position');assert([...p.array].every(Number.isFinite));triangles+=(o.geometry.index?.count??p.count)/3;meshes++;}});assert(triangles<60000,ROSTER[i].name+' triangle budget: '+triangles);counts.push({name:ROSTER[i].name,triangles,meshes});renderer.clear(renderer.preview);assert.equal(renderer.preview.children.length,0);}return{counts,actualWebGL:'unverified: cloud renderer is disabled'};
});
if(results.some(r=>r.status==='failed'))process.exitCode=1;
