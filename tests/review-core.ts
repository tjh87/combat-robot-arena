import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import * as THREE from 'three';
import {compile,preset,copy,RULES,flipEnergy,SLOTS,v,add,sub} from '../src/model';
import {Simulation,Tournament,initializePhysics} from '../src/sim';
import {Input,defaults,loadPreferences} from '../src/input';
import {ArenaRenderer} from '../src/render';

const results:any[]=[];
async function test(name:string,run:()=>unknown){
  try {const detail=await run();results.push({name,status:'passed',detail});console.log('PASS',name);}
  catch(error){results.push({name,status:'failed',error:String(error)});console.log('FAIL',name,String(error));}
  writeFileSync('docs/review-core-results.json',JSON.stringify(results,null,2));
}
await initializePhysics();
const make=()=>new Simulation([preset(0),preset(1)],{hazards:false,ai:[false,false]});

await test('Asymmetric armour leaves eight millimetres of clearance on each wheel side',()=>{
  const c=preset(0);c.armour.find(a=>a.mount==='left')!.thickness=0;
  Object.assign(c.armour.find(a=>a.mount==='right')!,{material:'uhmw',thickness:.025});
  const compiled=compile(c);assert.deepEqual(compiled.errors,[]);
  const gaps=compiled.parts.filter(p=>p.id.startsWith('wheel_')).map(p=>{
    const side=p.position.x<0?'left':'right',thickness=c.armour.find(a=>a.mount===side)!.thickness;
    const gap=Math.abs(p.position.x)-c.drive.width/2-c.chassis.width/2-thickness;
    assert(Math.abs(gap-.008)<1e-8,side+' wheel touches armour');return{side,gap};
  });return gaps;
});

await test('An invalid final physics tick pauses without inventing a winner',()=>{
  const sim=make();try{
    const body=sim.bots[0].chassis,step=sim.world.step.bind(sim.world);
    sim.world.step=queue=>{step(queue);body.setLinvel(v(NaN,0,0),true);};
    sim.tick=RULES.matchTicks-1;sim.step();assert(sim.fault);assert.equal(sim.result,undefined);
    const tick=sim.tick;sim.step();assert.equal(sim.tick,tick);return{fault:sim.fault,tick};
  }finally{sim.dispose();}
});

await test('A solver exception becomes a recoverable fault with no result',()=>{
  const sim=make(),step=sim.world.step;try{
    sim.world.step=()=>{throw Error('Injected solver failure');};
    assert.doesNotThrow(()=>sim.step());assert(sim.fault);assert.equal(sim.result,undefined);
    assert.equal(sim.frames.length,1);return{fault:sim.fault};
  }finally{sim.world.step=step;sim.dispose();}
});

await test('Damage carry-over cannot bypass build legality',()=>{
  const c=preset(0);c.chassis.material='hardox';c.chassis.thickness=.02;
  assert(compile(c).errors.some(e=>e.field==='mass'));
  let invalid:Simulation|undefined;
  try{assert.throws(()=>{invalid=new Simulation([c,preset(0)],{allowDamaged:true});},/mass|kg|weight/i);}
  finally{invalid?.dispose();}
});

await test('A flipper with an unavailable actuator can use its fitted roll arm',()=>{
  const c=preset(2);c.chassis.profile='standard';c.selfRight={type:'roll_arm',mount:v(.43,.18,-.18),length:.42,actuator:'R600'};
  c.chassis.equipmentMassKg!-=4;
  assert.deepEqual(compile(c).errors,[]);
  const sim=new Simulation([c,preset(0)],{practice:true,hazards:false,ai:[false,false]});try{
    const b=sim.bots[0];b.modules.weapon_actuator.present=false;assert(sim.requestSelfRight(b));assert.equal(b.rollStart,sim.tick);
    assert(!sim.requestSelfRight(b));return{charges:b.charges,rollStart:b.rollStart};
  }finally{sim.dispose();}
});

await test('Flipper work appears in powered travel telemetry',()=>{
  const sim=new Simulation([preset(2),preset(0)],{practice:true,hazards:false,ai:[false,false]});try{
    const b=sim.bots[0];assert(sim.requestFire(b));let work=0;
    for(let i=0;i<120;i++){sim.step();work+=b.powerWork;}
    assert(work>0);assert(b.flipWork<=flipEnergy(b.compiled.config));return{poweredWork:work,flipperWork:b.flipWork};
  }finally{sim.dispose();}
});

await test('Arena contact with a weapon credits the affected robot, not a nonexistent opponent',()=>{
  const sim=make();try{
    sim.step();
    const weapon=[...sim.bots[0].colliders.entries()].find(([id])=>sim.meta.get(sim.bots[0].colliders.get(id)!.handle)?.module==='weapon')![1];
    const wallEntry=[...sim.meta].find(([,m])=>m.bot===null)!,wall=sim.world.getCollider(wallEntry[0]);
    sim.world.contactPairsWith=(col,callback)=>{if(col===weapon)callback(wall);};
    sim.world.contactPair=(_a,_b,callback)=>callback({normal:()=>v(1,0,0),numContacts:()=>1,numSolverContacts:()=>1,contactImpulse:()=>100,contactTangentImpulseX:()=>0,contactTangentImpulseY:()=>0,solverContactPoint:()=>v(1,1,0)} as any,false);
    const low=Math.min(weapon.handle,wall.handle);(sim as any).preVelocity=(body:any)=>body?.handle===sim.world.getCollider(low).parent()?.handle?v(10,0,0):v();
    (sim as any).contacts([0,0]);assert.equal(sim.events.length,1);
    assert.equal(sim.events[0].attacker,null);assert.equal(sim.events[0].target,0);assert.equal(sim.events[0].module,'weapon');
    assert.equal(sim.events[0].source,'Arena contact');assert.equal(sim.tracking.size,0);return sim.events[0];
  }finally{sim.dispose();}
});

await test('A failed computer match waits for explicit retry',()=>{
  const t=new Tournament(preset(0),false,73145);try{
    t.stepOffscreen(1);assert(t.pending);t.pending!.fault='Injected offscreen failure';
    assert.throws(()=>t.stepOffscreen(1),/Injected offscreen failure/);
    for(let i=0;i<30;i++)assert.equal(t.stepOffscreen(1),false);
    assert.equal(t.pending,undefined);assert((t as any).fault);
    (t as any).retryOffscreen();t.stepOffscreen(1);assert(t.pending);return{automaticRestarts:0};
  }finally{t.dispose();}
});

Object.assign(globalThis,{window:new EventTarget(),document:new EventTarget(),matchMedia:()=>({matches:false}),localStorage:{getItem:()=>null}});
Object.defineProperty(globalThis,'navigator',{configurable:true,value:{getGamepads:()=>[]}});
await test('Blocked gamepad access does not stop keyboard play',()=>{
  navigator.getGamepads=()=>{throw new DOMException('Blocked','SecurityError');};
  const input=new Input(defaults(),()=>true,()=>{},()=>{});try{input.clear();assert.equal(input.assignmentIssue(false),'');assert.deepEqual(input.sample(0),{left:0,right:0,weapon:false,selfRight:false});}finally{input.dispose();}
});
await test('Polling detects a missing assigned controller without a browser disconnect event',()=>{
  const prefs=defaults();prefs.assignments[0]='pad0';let pads:any[]=[{connected:true,axes:[0,0,0,0],buttons:Array.from({length:10},()=>({pressed:false}))}],pauses=0;
  navigator.getGamepads=()=>pads;const input=new Input(prefs,()=>true,()=>{pauses++;},()=>{});
  try{input.clear();input.sample(0);pads=[];input.sample(0);input.sample(0);assert.equal(pauses,1);}finally{input.dispose();}
});
await test('Stored duplicate bindings reset to a usable keyboard map',()=>{
  const prefs=defaults();prefs.controls[1].forward=prefs.controls[0].forward;
  localStorage.getItem=()=>JSON.stringify(prefs);const loaded=loadPreferences();
  const keys=loaded.controls.flatMap(c=>Object.values(c));assert.equal(new Set(keys).size,keys.length);
});

await test('Replay restores historical armour thickness without mutating live meshes across fifty transitions',()=>{
  const renderer=Object.create(ArenaRenderer.prototype) as ArenaRenderer;
  Object.assign(renderer,{bots:new THREE.Group(),bodyGroups:new Map(),replayRoot:new THREE.Group(),replayGroups:new Map(),replay:false,reduced:false});
  const c=preset(0);const part=compile(c).parts.find(p=>p.id==='armour_left')!;part.material='uhmw';
  const mesh=renderer.part(part,c),group=new THREE.Group();group.add(mesh);mesh.scale.x=.2;renderer.bodyGroups.set('b0:chassis',group);renderer.bots.add(group);
  let geometryDisposals=0;mesh.geometry.addEventListener('dispose',()=>geometryDisposals++);
  const before={scale:mesh.scale.clone(),color:(mesh.material as THREE.MeshStandardMaterial).color.getHex()};
  for(let i=0;i<50;i++){
    renderer.startReplay();renderer.replayFrame({tick:0,transforms:[{id:'b0:chassis',p:v(),q:{x:0,y:0,z:0,w:1}}],health:[SLOTS.map(()=>1),SLOTS.map(()=>1)],effects:[]});
    const historical=renderer.replayGroups.get('b0:chassis')!.children[0] as THREE.Mesh;
    assert.equal(historical.scale.x,1);assert.notEqual(historical.material,mesh.material);renderer.endReplay();
    assert.equal(renderer.replayRoot.children.length,0);assert.equal(renderer.replayGroups.size,0);
    assert(mesh.scale.equals(before.scale));assert.equal((mesh.material as THREE.MeshStandardMaterial).color.getHex(),before.color);
  }
  assert.equal(geometryDisposals,0);renderer.clear(renderer.bots);return{transitions:50,liveGeometryDisposedDuringReplay:0};
});

await test('Armour wear follows its exact health fraction below four percent',()=>{
  const renderer=Object.create(ArenaRenderer.prototype) as ArenaRenderer,c=preset(0);
  const part=compile(c).parts.find(p=>p.id==='armour_left')!;part.material='uhmw';
  const mesh=renderer.part(part,c);renderer.applyHealth(mesh,.02);assert.equal(mesh.scale.x,.02);renderer.disposeObject(mesh);
});
await test('Replay camera keeps recorded robot positions inside the frame',()=>{
  const renderer=Object.create(ArenaRenderer.prototype) as ArenaRenderer;
  Object.assign(renderer,{scene:new THREE.Scene(),camera:new THREE.PerspectiveCamera(42,1280/720,.05,100),cameraTarget:new THREE.Vector3(),arena:new THREE.Group(),bots:new THREE.Group(),preview:new THREE.Group(),effects:new THREE.Group(),replayGroups:new Map(),replay:true,mode:'match',reduced:true,inset:false,time:0,width:1280,height:720});
  for(let i=0;i<2;i++){const group=new THREE.Group();group.position.set(6,0,-6+i);renderer.replayGroups.set('b'+i+':chassis',group);}
  renderer.renderer={setViewport(){},setScissorTest(){},render(){},info:{render:{calls:1,triangles:0}}} as any;
  renderer.batteryFireVisual={visible:false,update(){}} as any;
  const sim={tick:0,batteryFireSeconds:()=>0,bots:[{id:0,compiled:compile(preset(0)),chassis:{translation:()=>v(-6,0,6)}},{id:1,compiled:compile(preset(1)),chassis:{translation:()=>v(-6,0,5)}}]} as any;
  renderer.draw(sim);renderer.camera.updateMatrixWorld();
  for(const group of renderer.replayGroups.values()){const p=group.position.clone().project(renderer.camera);assert(Math.abs(p.x)<.85&&Math.abs(p.y)<.85,'Recorded robot is outside the camera frame');}
});

if(results.some(r=>r.status==='failed'))process.exitCode=1;
