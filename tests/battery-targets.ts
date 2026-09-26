import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import * as THREE from 'three';
import {Simulation,initializePhysics,type ImpactEvent} from '../src/sim';
import {preset,ROSTER,v,rotate,add,axisQ,identity,type Slot} from '../src/model';
import {batteryZones} from '../src/battery-layout';
import {batteryOutlines} from '../src/battery-outline';
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
for(let i=0;i<ROSTER.length;i++){
 const c=preset(i),root=batteryOutlines(c);assert.equal(root.children.length,1,'One box per robot');
 const line=root.children[0] as THREE.LineSegments;assert(line.material instanceof THREE.LineBasicMaterial);assert.equal(line.material.color.getHex(),0xff354b);assert.equal(line.material.depthTest,false);
 const bounds=new THREE.Box3().setFromObject(root);for(const zone of batteryZones(c)){assert(bounds.min.x<=zone.position.x-zone.size.x/2+1e-6);assert(bounds.max.x>=zone.position.x+zone.size.x/2-1e-6);assert(bounds.min.z<=zone.position.z-zone.size.z/2+1e-6);assert(bounds.max.z>=zone.position.z+zone.size.z/2-1e-6);}
 const replay=root.clone(true);assert.equal(replay.children.length,1,'Replay keeps one box');const positions=line.geometry.getAttribute('position');assert(positions.count>8&&positions.count%2===0,'Dotted segments retained');line.geometry.dispose();line.material.dispose();
}
writeFileSync('docs/battery-targets-results.json',JSON.stringify({status:'passed',attackerTargetPairs:121,rotatedZoneHitWeakHitMissChecks:checks,hintChecks:'One dotted box per robot across all 11 models; replay preserves one box; physical zones unchanged'},null,2));console.log('PASS',checks,'battery target cases and 11 single-box markers');
