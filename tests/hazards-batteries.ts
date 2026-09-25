import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import * as THREE from 'three';
import {Simulation,initializePhysics,neutral,type ImpactEvent,RAPIER} from '../src/sim';
import {preset,compile,ROSTER,v,rotate,add,sub,mul,cross,dot,axisQ,identity,bodyOrigin,RULES,MATERIALS} from '../src/model';
import {ARENA_HAZARDS as C,hazardContactCentre} from '../src/arena-hazards';
import {batteryZones,batteryAlongRay,batteryReferenceHTML} from '../src/battery-layout';
import {hazardVisual} from '../src/visuals';
await initializePhysics();const results:any[]=[];
async function test(name:string,fn:()=>unknown){if(process.env.CASE&&!name.includes(process.env.CASE))return;try{const detail=await fn();results.push({name,status:'passed',detail});console.log('PASS',name,JSON.stringify(detail));}catch(e){results.push({name,status:'failed',error:String(e)});console.log('FAIL',name,String(e));process.exitCode=1;}writeFileSync('docs/hazards-batteries-results.json',JSON.stringify(results,null,2));}
function make(hazards=true,index=10){return new Simulation([preset(index),preset(0)],{practice:true,hazards,ai:[false,false],autoUnstick:false});}
function pose(s:Simulation,id:number,p:ReturnType<typeof v>,q=identity){const b=s.bots[id];for(const [key,body]of b.bodies){body.setRotation(q,true);body.setTranslation(add(p,rotate(bodyOrigin(b.compiled.config,key),q)),true);body.setLinvel(v(),true);body.setAngvel(v(),true);}s.world.propagateModifiedBodyPositionsToColliders();}
await test('All 11 robots have fitted, mass-accounted battery targets',()=>{
 let count=0;for(let i=0;i<ROSTER.length;i++){const c=preset(i),p=compile(c),zones=batteryZones(c);assert.deepEqual(p.errors,[]);assert(Math.abs(p.mass-113.2)<1e-6);assert(Math.abs(p.parts.filter(p=>p.module==='battery').reduce((n,p)=>n+p.mass,0)-(.8+c.battery.capacityWh/180))<1e-9);for(const z of zones){for(const a of ['x','z'] as const)assert(Math.abs(z.position[a])+z.size[a]/2<(a==='x'?c.chassis.width:c.chassis.length)/2);assert.equal(batteryAlongRay(c,add(z.position,v(0,.14,0)),v(0,-1,0)),zones.indexOf(z));}assert(batteryReferenceHTML(c).includes('estimate'));count+=zones.length;}return{robots:11,zones:count,stockMassKg:113.2};
});
await test('Quantum reaches every battery zone through a local puncture, with no damage on a miss',()=>{
 let zones=0;const checks=[];for(let i=0;i<ROSTER.length;i++){const s=new Simulation([preset(10),preset(i)],{practice:true,hazards:false,ai:[false,false],autoUnstick:false});try{const b=s.bots[1],c=b.compiled.config;
  for(const zone of batteryZones(c))for(const q of[identity,axisQ(v(0,1,0),1.2),axisQ(v(0,0,1),Math.PI)]){
   pose(s,1,v(2,2,2),q);b.modules.battery.hp=b.modules.battery.max;b.modules.battery.functional=true;const panel=b.modules.armour_top;panel.hp=panel.max;panel.functional=true;
   const event={id:90,cause:'crush',attacker:0,target:1,point:add(b.chassis.translation(),rotate(v(zone.position.x,c.chassis.height/2,zone.position.z),q)),penetrationDirection:rotate(v(0,-1,0),q),allocations:[]} as unknown as ImpactEvent;
   const shield=panel.hp,pack=b.modules.battery.hp;s.damage(1,'armour_top',3000,event);assert(b.modules.battery.hp<pack,c.identity.name+' missed battery');assert(panel.hp>0,c.identity.name+' incorrectly erased whole panel');assert(panel.hp<shield);assert.equal(b.modules.chassis.hp,1200);assert(event.allocations.reduce((n,a)=>n+a.energy,0)<=3000.0001);
   const after=b.modules.battery.hp;event.point=add(b.chassis.translation(),rotate(v(c.chassis.width*2,.1,0),q));s.damage(1,'armour_top',3000,event);assert.equal(b.modules.battery.hp,after,'distant miss reached battery');zones++;
  }checks.push({robot:c.identity.name,zones:batteryZones(c).length});
 }finally{s.dispose();}}return{rotatedHitAndMissChecks:zones,robots:checks};
});
await test('A held Quantum bite punctures armour and crushes the battery through real tooth contacts',()=>{
 const s=new Simulation([preset(10),preset(0)],{practice:true,hazards:false,ai:[false,false],autoUnstick:false});try{
  const q=axisQ(v(0,1,0),-Math.PI/2);for(const id of[0,1])pose(s,id,v(id===0?-.42:.34,s.bots[id].chassis.translation().y,0),q);
  for(let i=0;i<1200;i++)s.step([{...neutral(),weapon:i===80},neutral()]);
  const b=s.bots[1],bite=s.events.find(e=>e.cause==='crush')!;assert(bite);assert(b.modules.battery.hp<320,'held bite did not reach the pack');assert(b.modules.armour_top.hp>b.modules.armour_top.max*.9,'a local puncture erased the entire panel');assert(bite.allocations.some(a=>a.module==='battery'));assert(bite.allocations.reduce((n,a)=>n+a.energy,0)<=bite.energy+.001);assert(!s.fault);
  return{batteryDamageHP:b.modules.battery.max-b.modules.battery.hp,armourDamageHP:b.modules.armour_top.max-b.modules.armour_top.hp,workJ:bite.energy};
 }finally{s.dispose();}
});
await test('Hammer heads are 50 lb, swing on a hinge and keep one finite strike budget',()=>{
 const s=make();try{const h=s.hazards[0];assert(Math.abs(h.body.collider(0).mass()-C.headKg)<.0001);assert(Math.abs(h.body.mass()-(C.headKg+C.armKg))<.0001);pose(s,0,v(-5.7,.16,-5.30));pose(s,1,v(4,.2,0));s.tick=1160;let travel=0,energy=0,pivotError=0;
  for(let i=0;i<280;i++){s.step();const body=h.body,q=body.rotation(),p=hazardContactCentre(h);travel=Math.max(travel,Math.abs(p.z-h.base.z));pivotError=Math.max(pivotError,Math.hypot(body.translation().x-h.base.x,body.translation().y-h.base.y,body.translation().z-h.base.z));if(h.phase==='active'){const I=body.principalInertia(),qr=body.principalInertiaLocalFrame(),wa=rotate(rotate(body.angvel(),{x:-q.x,y:-q.y,z:-q.z,w:q.w}),{x:-qr.x,y:-qr.y,z:-qr.z,w:qr.w});energy=Math.max(energy,.5*body.mass()*dot(body.linvel(),body.linvel())+.5*(I.x*wa.x**2+I.y*wa.y**2+I.z*wa.z**2));}assert(h.spent<=C.hammerJ+.001);}
  const hits=s.events.filter(e=>e.source===h.name);assert(travel>1);assert(pivotError<.03);assert(energy<=C.hammerJ*1.025,JSON.stringify({energy}));assert(hits.length);assert(hits.reduce((n,e)=>n+e.energy,0)<=C.hammerJ+.001);assert(s.bots[0].modules.chassis.hp>1000);assert(!s.fault);return{headKg:h.body.collider(0).mass(),movingKg:h.body.mass(),maxEnergyJ:energy,pivotErrorM:pivotError,hits:hits.length};
 }finally{s.dispose();}
});
await test('Paired saw discs emerge, cut on contact and retract below the floor',()=>{
 const s=make();try{const h=s.hazards.find(h=>h.kind==='blade')!;pose(s,0,v(h.base.x,.13,h.base.z));pose(s,1,v(4,.2,0));let low=Infinity,high=-Infinity,rate=0;for(let i=0;i<1500;i++){s.step();low=Math.min(low,h.body.translation().y);high=Math.max(high,h.body.translation().y);rate=Math.max(rate,Math.abs(dot(h.body.angvel(),h.axis)));}const hits=s.events.filter(e=>e.source===h.name);assert(low+C.sawRadius<0);assert(high+C.sawRadius>.25);assert(rate>20);assert(hits.length,'saws made no cutting contact');assert(hits.some(e=>e.allocations.some(a=>a.hp>0)));assert(!s.fault);return{blades:2,minTipM:low+C.sawRadius,maxTipM:high+C.sawRadius,maxRPM:rate*30/Math.PI,damageHP:hits.flatMap(e=>e.allocations).reduce((n,a)=>n+a.hp,0)};}finally{s.dispose();}
});
await test('Deck screws lift inward, detect a pinned robot and reverse automatically',()=>{
 const s=make();try{const h=s.hazards.find(h=>h.deck)!;pose(s,0,v(4,.2,0));for(let i=0;i<180;i++)s.step();assert(dot(h.body.angvel(),h.axis)<-4.5);const up=cross(h.body.angvel(),v(0,0,C.screwRadius));assert(up.y>0);const top=cross(h.body.angvel(),v(0,C.screwRadius,0));assert(top.z<0);
  pose(s,0,v(h.base.x,.20,h.base.z+.55));for(const body of s.bots[0].bodies.values()){body.lockTranslations(true,true);body.lockRotations(true,true);}let reversed=-1,positive=false;
  for(let i=0;i<900;i++){s.step();if(h.reverseUntil>s.tick){reversed=i/240;break;}}
  assert(reversed>=C.jamSeconds&&reversed<2.5,JSON.stringify({reversed,jamTicks:h.jamTicks}));pose(s,0,v(4,.2,0));for(let i=0;i<900;i++){s.step();if(h.reverseUntil>s.tick&&dot(h.body.angvel(),h.axis)>1)positive=true;}assert(positive,'screw did not turn backward');assert(dot(h.body.angvel(),h.axis)<-4.5);assert(!s.fault);return{upwardContactVelocity:up.y,jamDetectionSeconds:reversed,reverseSeconds:C.reverseSeconds,returnsToForward:true};
 }finally{s.dispose();}
});
await test('Hazard geometry matches the moving collision assemblies',()=>{
 const rows=[];for(const [kind,deck]of[['hammer',false],['blade',false],['auger',false],['auger',true]] as const){const root=hazardVisual(kind,deck);root.updateMatrixWorld(true);let triangles=0;root.traverse(o=>{if(o instanceof THREE.Mesh){const p=o.geometry.getAttribute('position');assert(Array.from(p.array).every(Number.isFinite));triangles+=(o.geometry.index?.count??p.count)/3;}});const size=new THREE.Box3().setFromObject(root).getSize(new THREE.Vector3());if(kind==='hammer')assert(size.y>1.3);if(kind==='blade'){assert(size.y>.63&&size.y<.66);assert(size.x<.40);}if(kind==='auger')assert(Math.abs(size.x-(deck?C.screwLength:3.3))<.1);assert(triangles<15000);rows.push({kind,deck,triangles,size:size.toArray()});root.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose();for(const m of Array.isArray(o.material)?o.material:[o.material])m.dispose();}});}return rows;
});
