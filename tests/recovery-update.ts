import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import * as THREE from 'three';
import {Simulation,initializePhysics,neutral,gyroInertialTorque,RAPIER} from '../src/sim';
import {preset,compile,ROSTER,RULES,flipEnergy,isSpinner,selfRightKind,bodyOrigin,weaponAxis,v,add,sub,mul,dot,length,horizontal,rotate,axisQ,quatMul} from '../src/model';
import {ArenaRenderer} from '../src/render';
import {ExhaustPlume} from '../src/exhaust';
const results:any[]=[];
async function test(name:string,fn:()=>unknown){if(process.env.CRA_TEST_FILTER&&!new RegExp(process.env.CRA_TEST_FILTER,'i').test(name))return;try{const detail=await fn();results.push({name,status:'passed',detail});console.log('PASS',name,JSON.stringify(detail));}catch(e){results.push({name,status:'failed',error:String(e)});process.exitCode=1;console.log('FAIL',name,String(e));}writeFileSync('docs/recovery-update-results.json',JSON.stringify(results,null,2));}
await initializePhysics();
function place(s:Simulation,id:number,position:ReturnType<typeof v>,angle=0){const b=s.bots[id],q=axisQ(v(0,0,1),angle);for(const [key,body]of b.bodies){body.setTranslation(add(position,rotate(bodyOrigin(b.compiled.config,key),q)),true);body.setRotation(q,true);body.setLinvel(v(),true);body.setAngvel(v(),true);}s.world.propagateModifiedBodyPositionsToColliders();}
await test('Three horizontal weapons gain at least 20 percent rotor energy within the weight and speed limits',()=>{
 const old=[40.812421425445045,43.55601541173407,82.81436786458274];return [0,3,6].map((index,n)=>{const c=preset(index),b=compile(c);assert.deepEqual(b.errors,[]);assert(isSpinner(c.weapon));const energyKJ=b.rotorInertia*(c.weapon.rpm*Math.PI/30)**2/2000,increasePercent=(energyKJ/old[n]-1)*100;assert(increasePercent>=20);assert(b.tip<=RULES.tip);return{name:c.identity.name,massKg:b.mass,energyKJ,increasePercent};});
});
await test('Hydra has three times the flip allowance and a stronger equal-mass launch',()=>{
 const rows=[];for(const boost of[false,true]){const f=preset(2),target=preset(0),mass=compile(f).mass;target.weapon={type:'none'};Object.assign(target.chassis,{profile:'standard',length:.64,width:.58,height:.16,clearance:.018});Object.assign(target.drive,{layout:4,radius:.10,width:.075});let low=.004,high=.020;for(let i=0;i<30;i++){target.chassis.thickness=(low+high)/2;if(compile(target).mass>mass)high=target.chassis.thickness;else low=target.chassis.thickness;}assert(Math.abs(compile(target).mass-mass)<.001);
  const s=new Simulation([f,target],{practice:true,hazards:false,ai:[false,false],autoUnstick:false});try{
   // Keep identical physical parts and contact geometry for this actuator comparison.
   if(!boost)s.bots[0].compiled.config.chassis.profile='standard';
   for(const[id,x]of [[0,-.7],[1,.7]]){const b=s.bots[id],delta=sub(v(x,b.chassis.translation().y,0),b.chassis.translation());for(const body of b.bodies.values())body.setTranslation(add(body.translation(),delta),true);}s.world.propagateModifiedBodyPositionsToColliders();s.bots[1].energy=0;let height=0;
   for(let t=0;t<1500;t++){s.step([{...neutral(),left:t<450?.3:0,right:t<450?.3:0,weapon:t===450},neutral()]);height=Math.max(height,s.bots[1].chassis.translation().y);}
   assert.equal(s.fault,undefined);assert(s.bots[0].flipWork<=flipEnergy(s.bots[0].compiled.config)+.001);rows.push({boost,allowanceJ:flipEnergy(s.bots[0].compiled.config),workJ:s.bots[0].flipWork,peakHeightM:height});
  }finally{s.dispose();}
 }assert.equal(rows[1].allowanceJ,rows[0].allowanceJ*3);assert(rows[1].workJ>0);assert(rows[1].peakHeightM>rows[0].peakHeightM*1.15,JSON.stringify(rows));return rows;
});
await test('Gigabyte brakes its shell and self-rights through its folding arm',()=>{
 const rows=[];for(const rpm of[0,1000,1950]){const c=preset(5),s=new Simulation([c,preset(0)],{practice:true,hazards:false,ai:[false,false],autoUnstick:false}),b=s.bots[0];try{
  place(s,0,v(0,.8,2.5),Math.PI);for(let t=0;t<240;t++)s.step();b.rotor!.setAngvel(mul(rotate(weaponAxis(c.weapon),b.chassis.rotation()),rpm*Math.PI/30),true);b.weaponOn=true;assert(s.requestSelfRight(b));assert(!s.requestSelfRight(b));let recovered=-1;
  for(let t=0;t<2400;t++){s.step();if(s.axis(b,v(0,1,0)).y>.85&&recovered<0)recovered=(t+1)/240;}
  assert.equal(s.fault,undefined);assert(recovered>0&&recovered<10,'no recovery at '+rpm);assert(s.axis(b,v(0,1,0)).y>.85);assert(b.rollWork>0&&b.rollWork<=4000);assert(b.weaponOn,'Shell must resume after recovery');assert(b.rpm>100,'Shell must spin up again');rows.push({startRPM:rpm,recoveredSeconds:recovered,armWorkJ:b.rollWork});
 }finally{s.dispose();}}return rows;
});
await test('Minotaur uses drum precession and steering to recover onto its wheels from either side',()=>{
 const rows=[];for(const angle of[-Math.PI/2,Math.PI/2]){const c=preset(1),s=new Simulation([c,preset(0)],{practice:true,hazards:false,ai:[false,false],autoUnstick:false}),b=s.bots[0];try{
  place(s,0,v(0,.6,2.5),angle);for(let t=0;t<360;t++)s.step();assert(Math.abs(s.axis(b,v(0,1,0)).y)<.88);b.rotor!.setAngvel(mul(rotate(weaponAxis(c.weapon),b.chassis.rotation()),-c.weapon.rpm*Math.PI/30),true);assert(s.requestSelfRight(b));let recovered=-1,gyroTorque=0;
  for(let t=0;t<2160;t++){s.step();gyroTorque=Math.max(gyroTorque,length(gyroInertialTorque(b.rotor!)));if(b.grounded&&Math.abs(s.axis(b,v(0,1,0)).y)>.88&&recovered<0)recovered=(t+1)/240;}
  assert(recovered>0&&recovered<8);assert(gyroTorque>1);assert(b.grounded&&Math.abs(s.axis(b,v(0,1,0)).y)>.9);assert.equal(b.rollStart,-1);assert(!s.requestSelfRight(b),'already on its wheels');const start={...b.chassis.translation()};for(let t=0;t<360;t++)s.step([{...neutral(),left:.3,right:.3},neutral()]);const travel=horizontal(start,b.chassis.translation());assert(travel>.4);rows.push({side:Math.sign(angle),recoveredSeconds:recovered,gyroTorqueNm:gyroTorque,driveDistanceM:travel,inverted:s.axis(b,v(0,1,0)).y<0});
 }finally{s.dispose();}}return rows;
});
await test('HUGE has two physical side supports and can move after a fall on either side',()=>{
 const c=preset(7),parts=compile(c).parts.filter(p=>p.id.startsWith('large_side_outrigger'));assert.equal(parts.length,2);assert(parts.every(p=>p.collides&&p.mass>0));const rows=[];
 for(const angle of[-Math.PI/2,Math.PI/2]){const s=new Simulation([c,preset(0)],{practice:true,hazards:false,ai:[false,false],autoUnstick:false}),b=s.bots[0];try{place(s,0,v(0,1.1,2.5),angle);for(let t=0;t<720;t++)s.step();const start={...b.chassis.translation()};for(let t=0;t<720;t++)s.step([{...neutral(),left:.7,right:.7},neutral()]);const travel=horizontal(start,b.chassis.translation());assert.equal(s.fault,undefined);assert(travel>.5);rows.push({side:Math.sign(angle),travelM:travel});}finally{s.dispose();}}
 return{supports:2,massKg:parts.reduce((n,p)=>n+p.mass,0),rows};
});
await test('ICEwave exhaust comes from its top outlet, pauses, and stays in a fixed particle pool',()=>{
 const s=new Simulation([preset(3),preset(3)],{practice:true,hazards:false,ai:[false,false]}),p=new ExhaustPlume();try{
  p.update(s,1/12);assert.equal(p.ages.filter(a=>a>=0).length,2);assert(p.positions[1]>.45);for(let t=0;t<3000;t++)p.update(s,.02);const live=p.ages.filter(a=>a>=0).length;assert(live>10&&live<=96);const before=Array.from(p.positions);p.update(s,0);assert.deepEqual(Array.from(p.positions),before);for(const b of s.bots)b.energy=0;for(let t=0;t<100;t++)p.update(s,.02);assert.equal(p.ages.filter(a=>a>=0).length,0);p.update(s,.02,true);assert.equal(p.points.visible,false);return{outlet:'engine exhaust above cowl',particleLimit:p.count,activeBeforeShutdown:live,paused:true};
 }finally{s.dispose();p.points.geometry.dispose();(p.points.material as THREE.PointsMaterial).map?.dispose();(p.points.material as THREE.Material).dispose();}
});
await test('Damage changes armour shape without surface markers',()=>{
 const context=new Proxy({}, {get:()=>()=>{}});Object.assign(globalThis,{document:{createElement:()=>({width:1,height:1,getContext:()=>context})}});const r=Object.create(ArenaRenderer.prototype) as ArenaRenderer,c=preset(0),part=compile(c).parts.find(p=>p.id==='armour_left')!,mesh=r.part(part,c);try{
  const children=mesh.children.length;r.applyHealth(mesh,.3);assert.equal(mesh.children.length,children);assert(!mesh.children.some(o=>o.userData.damageThreshold||o.userData.impactTick));assert(mesh.scale.x<.75);return{markers:0,damagedPanelThickness:mesh.scale.x};
 }finally{r.disposeObject(mesh);}
});
await test('The gyro inertial step changes precession without increasing rotational energy',()=>{
 const world=new RAPIER.World(v());world.timestep=RULES.dt;const b=world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setAngvel(v(1,10,1)));world.createCollider(RAPIER.ColliderDesc.cuboid(.1,.3,1).setMass(10),b);
 const energy=()=>{const q=quatMul(b.rotation(),b.principalInertiaLocalFrame()),a=rotate(b.angvel(),{x:-q.x,y:-q.y,z:-q.z,w:q.w}),I=b.principalInertia();return .5*(I.x*a.x*a.x+I.y*a.y*a.y+I.z*a.z*a.z);};try{const initial=energy();let peak=initial;for(let t=0;t<240;t++){b.resetTorques(false);b.addTorque(gyroInertialTorque(b),true);world.step();peak=Math.max(peak,energy());}assert(peak<=initial*1.01);assert(length(sub(b.angvel(),v(1,10,1)))>.1);return{initialEnergyJ:initial,finalEnergyJ:energy(),maximumEnergyRatio:peak/initial};}finally{world.free();}
});
