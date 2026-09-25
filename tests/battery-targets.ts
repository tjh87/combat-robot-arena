import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import * as THREE from 'three';
import {Simulation,initializePhysics,type ImpactEvent} from '../src/sim';
import {preset,ROSTER,v,rotate,add,axisQ,identity,type Slot} from '../src/model';
import {batteryZones} from '../src/battery-layout';
import {ArenaRenderer} from '../src/render';
await initializePhysics();let checks=0;
for(let attacker=0;attacker<ROSTER.length;attacker++)for(let target=0;target<ROSTER.length;target++){
 const sim=new Simulation([preset(attacker),preset(target)],{practice:true,hazards:false,ai:[false,false]});
 try{const b=sim.bots[1],c=b.compiled.config;
 for(const zone of batteryZones(c))for(const q of [identity,axisQ(v(0,1,0),1.2),axisQ(v(0,0,1),Math.PI)]){
  b.chassis.setRotation(q,true);const slot:Slot=c.chassis.profile==='gigabyte'?'weapon':'armour_top';
  const reset=()=>{for(const m of Object.values(b.modules)){m.hp=m.max;m.functional=m.present;}b.batteryFire=undefined;};reset();
  const point=add(b.chassis.translation(),rotate(v(zone.position.x,c.chassis.height/2,zone.position.z),q)),direction=rotate(v(0,-1,0),q);
  const event={id:1,cause:'weapon',attacker:0,target:1,point,allocations:[]} as unknown as ImpactEvent;
  sim.damage(1,slot,1,event,undefined,{point,direction});assert.equal(b.modules.battery.hp,b.modules.battery.max,'weak hit bypassed shield');
  reset();event.allocations=[];event.breaches=[];sim.damage(1,slot,3000,event,undefined,{point,direction});
  assert(b.modules.battery.hp<b.modules.battery.max,`${attacker}/${target} target missed`);assert(b.modules[slot].hp>0);assert(event.allocations.reduce((n,a)=>n+a.energy,0)<=3000.0001);
  reset();event.allocations=[];event.breaches=[];sim.damage(1,slot,3000,event,undefined,{point:add(point,rotate(v(c.chassis.width*2,0,0),q)),direction});assert.equal(b.modules.battery.hp,b.modules.battery.max,'off-target hit damaged battery');checks++;
 }
 }finally{sim.dispose();}
}
const sim=new Simulation([preset(1),preset(10)],{practice:true,hazards:false,ai:[false,false]});
try{
 const renderer=Object.create(ArenaRenderer.prototype) as ArenaRenderer;renderer.bodyGroups=new Map();renderer.camera=new THREE.PerspectiveCamera(42,16/9,.05,100);renderer.camera.position.set(0,12,12);renderer.camera.lookAt(0,0,0);renderer.cameraMode='tactical';
 const hints=renderer.batteryHintPositions(sim);assert.equal(hints.length,5);assert(hints.every(h=>h.visible&&Number.isFinite(h.x)&&Number.isFinite(h.y)));assert.deepEqual([...new Set(hints.map(h=>h.bot))],[0,1]);renderer.cameraMode='pov';assert(renderer.batteryHintPositions(sim).filter(h=>h.bot===0).every(h=>!h.visible));
}finally{sim.dispose();}
writeFileSync('docs/battery-targets-results.json',JSON.stringify({status:'passed',attackerTargetPairs:121,rotatedZoneHitWeakHitMissChecks:checks,hintChecks:'Both robots, multiple zones, POV own markers hidden'},null,2));console.log('PASS',checks,'battery target cases and projected hints');
