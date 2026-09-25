import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import * as THREE from 'three';
import {Simulation,initializePhysics,neutral,type ImpactEvent} from '../src/sim';
import {preset,compile,RULES,SLOTS,v,sub,add,dot,horizontal,mul,isSpinner,weaponAxis} from '../src/model';
import {ArenaRenderer} from '../src/render';
import {SPARK_CAPACITY,SPARK_TRAIL_FLOATS,sparkProfile} from '../src/impact-sparks';
import {readyImpactSounds} from '../src/audio';
const results:any[]=[];
async function test(name:string,run:()=>unknown){if(process.env.CASE&&!name.includes(process.env.CASE))return;try{const detail=await run();results.push({name,status:'passed',detail});console.log('PASS',name,JSON.stringify(detail));}catch(e){results.push({name,status:'failed',error:String(e)});process.exitCode=1;console.log('FAIL',name,String(e));}writeFileSync('docs/crusher-update-results.json',JSON.stringify(results,null,2));}
await initializePhysics();
await test('Crusher builds reject teeth that would close into the floor',()=>{
 const c=preset(10);assert.deepEqual(compile(c).errors,[]);assert(c.weapon.type==='crusher');c.weapon.travel=.65;assert(compile(c).errors.some(e=>e.field==='weapon.travel'));return{defaultValid:true,floorIntersectionRejected:true};
});
function move(s:Simulation,id:number,position:ReturnType<typeof v>){const b=s.bots[id],d=sub(position,b.chassis.translation());for(const body of b.bodies.values())body.setTranslation(add(body.translation(),d),true);s.world.propagateModifiedBodyPositionsToColliders();}
await test('Quantum grips through physical tooth contacts, damages armour, and releases within 2.1 seconds',()=>{
 const target=preset(0);target.weapon={type:'none'};const s=new Simulation([preset(10),target],{practice:true,hazards:false,ai:[false,false],autoUnstick:false});
 try{for(const[i,x]of[[0,-.42],[1,.42]])move(s,i,v(x,s.bots[i].chassis.translation().y,0));let peakForce=0,minUp=1,released=-1;
  for(let t=0;t<2400;t++){s.step([{...neutral(),left:t<700?.1:0,right:t<700?.1:0,weapon:t===280},neutral()]);peakForce=Math.max(peakForce,s.bots[0].crushForce);minUp=Math.min(minUp,s.axis(s.bots[0],v(0,1,0)).y);if(t>280&&!s.bots[0].weaponOn&&released<0)released=(t-280)/RULES.hz;}
  const bites=s.events.filter(e=>e.cause==='crush'),damage=bites.flatMap(e=>e.allocations).reduce((n,a)=>n+a.hp,0);
  assert.equal(s.fault,undefined);assert(peakForce>1500);assert(damage>20,JSON.stringify({damage,released}));assert(minUp>.95);assert(released>0&&released<=2.11);assert(s.bots[0].crushWork<=12000);assert(Math.abs(s.bots[0].crushAngle)<.05);assert(bites.every(e=>e.allocations.length<=SLOTS.length*2));
  return{peakForceN:peakForce,damageHP:damage,releaseSeconds:released,workJ:s.bots[0].crushWork,maxTiltDegrees:Math.acos(minUp)*180/Math.PI,allocationRows:bites.reduce((n,e)=>n+e.allocations.length,0)};
 }finally{s.dispose();}
});
await test('Quantum drives forward and backward, turns, and has the shared chassis health and stronger drive modules',()=>{
 const c=preset(10),built=compile(c),base=compile(preset(0)),s=new Simulation([c,preset(0)],{practice:true,hazards:false,ai:[false,false],autoUnstick:false});try{
  assert.deepEqual(built.errors,[]);assert.equal(built.modules.chassis.max,base.modules.chassis.max);assert(built.modules.drive_left.max>base.modules.drive_left.max);
  const b=s.bots[0];let forward=0,reverse=0,minUp=1,turnRate=0;for(let t=0;t<840;t++){const drive=t<240?1:t<600?-1:0;s.step([{...neutral(),left:t<600?drive:.7,right:t<600?drive:-.7},neutral()]);const speed=dot(b.chassis.linvel(),s.forward(b));forward=Math.max(forward,speed);reverse=Math.max(reverse,-speed);minUp=Math.min(minUp,s.axis(b,v(0,1,0)).y);if(t>=600)turnRate=Math.max(turnRate,Math.abs(b.chassis.angvel().y));}
  assert.equal(s.fault,undefined);assert(forward>2);assert(reverse>2);assert(turnRate>1);assert(minUp>.8);return{massKg:built.mass,forwardMps:forward,reverseMps:reverse,turnRadiansPerSecond:turnRate,maxTiltDegrees:Math.acos(minUp)*180/Math.PI,chassisHP:built.modules.chassis.max,driveHP:built.modules.drive_left.max};
 }finally{s.dispose();}
});
await test('Large hits emit more, faster, longer sparks in a fixed pool, and pause freezes them',()=>{
 const profiles=[200,2000,12000,40000].map(sparkProfile);for(let i=1;i<profiles.length;i++){assert(profiles[i].count>profiles[i-1].count);assert(profiles[i].speed>profiles[i-1].speed);assert(profiles[i].life>profiles[i-1].life);}
 const r=Object.create(ArenaRenderer.prototype) as ArenaRenderer,positions=new Float32Array(SPARK_CAPACITY*3),trail=new Float32Array(SPARK_CAPACITY*SPARK_TRAIL_FLOATS),colors=new Float32Array(SPARK_CAPACITY*SPARK_TRAIL_FLOATS),g=new THREE.BufferGeometry(),tg=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(positions,3));g.setAttribute('sparkSize',new THREE.BufferAttribute(new Float32Array(SPARK_CAPACITY),1));g.setAttribute('color',new THREE.BufferAttribute(new Float32Array(SPARK_CAPACITY*3),3));tg.setAttribute('position',new THREE.BufferAttribute(trail,3));tg.setAttribute('color',new THREE.BufferAttribute(colors,3));
 Object.assign(r,{particleAges:new Float32Array(SPARK_CAPACITY).fill(-1),particlePositions:positions,particleVelocity:new Float32Array(SPARK_CAPACITY*3),sparkLifetimes:new Float32Array(SPARK_CAPACITY),sparkLengths:new Float32Array(SPARK_CAPACITY),sparkSizes:new Float32Array(SPARK_CAPACITY),sparkBranches:new Uint8Array(SPARK_CAPACITY),sparkTrailPositions:trail,sparkColors:colors,sparkHeadColors:new Float32Array(SPARK_CAPACITY*3),particles:new THREE.Points(g),sparkTrails:new THREE.LineSegments(tg),reduced:false});
 try{r.sparks(v(0,.2,0),40000);assert.equal(r.particleAges.filter(a=>a>=0).length,260);for(let i=0;i<10;i++)r.sparks(v(),40000);assert.equal(r.particleAges.filter(a=>a>=0).length,SPARK_CAPACITY);r.animateParticles(.01);const paused=Array.from(positions);r.animateParticles(0);assert.deepEqual(Array.from(positions),paused);for(let i=0;i<120;i++)r.animateParticles(.02);assert(r.particleAges.every(a=>a<0));assert([...positions,...trail,...colors].every(Number.isFinite));return{profiles,maxPerHit:260,pool:SPARK_CAPACITY,paused:true};}finally{g.dispose();tg.dispose();}
});
await test('A real two-metre fall creates height-tagged landing events and does not misclassify weapon hits',()=>{
 const s=new Simulation([preset(0),preset(1)],{practice:true,hazards:false,ai:[false,false],autoUnstick:false});try{move(s,0,v(-3.6,2.15,0));for(let i=0;i<480;i++)s.step();const land=s.events.filter(e=>e.cause==='landing');assert.equal(s.fault,undefined);assert(land.length>0);assert(land.some(e=>(e.fallHeight??0)>1));assert(land.every(e=>e.attacker===null));return{floorEvents:land.length,peakHeightM:Math.max(...land.map(e=>e.fallHeight??0)),energyJ:land.reduce((n,e)=>n+e.energy,0)};}finally{s.dispose();}
});
await test('Simultaneous wheel landings play one drop sound and crusher pressure does not make impact pings',()=>{
 const make=(id:number,tick:number,target=0):ImpactEvent=>({id,tick,target,attacker:null,module:'drive_left',energy:500,episode:String(id),source:'Arena contact',impulse:1,closing:3,point:v(),rotorBefore:[0,0],rotorAfter:[0,0],allocations:[],cause:'landing',fallHeight:1});
 const events=[make(1,100),make(2,103),{...make(3,104),cause:'crush'},make(4,105,1)];const batch=readyImpactSounds(events,140,0);assert.equal(batch.events.length,2);assert.equal(batch.events[0].energy,1000);assert.equal(events[0].energy,500);events.push(make(5,110));assert.equal(readyImpactSounds(events,145,batch.lastID).events.length,0);events.push(make(6,200));assert.equal(readyImpactSounds(events,225,5).events.length,1);return{contacts:3,dropVoices:2,crushVoices:0};
});
await test('Getting farther under the same opponent gives Hydra a stronger launch',()=>{
 const rows=[];for(const fireTick of[100,140,450]){const f=preset(2),target=preset(0),mass=compile(f).mass;target.weapon={type:'none'};Object.assign(target.chassis,{length:.64,width:.58,height:.16,clearance:.018});Object.assign(target.drive,{layout:4,radius:.10,width:.075});let low=.004,high=.020;for(let i=0;i<30;i++){target.chassis.thickness=(low+high)/2;if(compile(target).mass>mass)high=target.chassis.thickness;else low=target.chassis.thickness;}
  const s=new Simulation([f,target],{practice:true,hazards:false,ai:[false,false],autoUnstick:false});try{for(const[id,x]of[[0,-.7],[1,.7]])move(s,id,v(x,s.bots[id].chassis.translation().y,0));s.bots[1].energy=0;let peak=0,minUp=1;
   for(let t=0;t<1500;t++){s.step([{...neutral(),left:t<fireTick?.3:0,right:t<fireTick?.3:0,weapon:t===fireTick},neutral()]);peak=Math.max(peak,s.bots[1].chassis.translation().y);minUp=Math.min(minUp,s.axis(s.bots[0],v(0,1,0)).y);}assert.equal(s.fault,undefined);assert(minUp>.65);rows.push({insertion:s.bots[0].flipDepth,peakM:peak,workJ:s.bots[0].flipWork});
  }finally{s.dispose();}
 }for(let i=1;i<rows.length;i++){assert(rows[i].insertion>rows[i-1].insertion);assert(rows[i].peakM>rows[i-1].peakM);}assert(rows[2].peakM>rows[0].peakM*1.3);return rows;
});
await test('Gigabyte stays upright during full-speed shell operation and six steering changes before wall contact',()=>{
 const s=new Simulation([preset(5),preset(0)],{practice:true,hazards:false,ai:[false,false],autoUnstick:false});try{const b=s.bots[0];move(s,0,v(0,b.chassis.translation().y,2.8));const w=b.compiled.config.weapon;assert(isSpinner(w));b.rotor!.setAngvel(mul(s.axis(b,weaponAxis(w)),w.direction*w.rpm*Math.PI/30),true);let minUp=1,maxSpeed=0,path=0,previous=b.chassis.translation();for(let t=0;t<840;t++){const phase=Math.floor(t/120)%2;s.step([{...neutral(),weapon:t===0,left:phase?.30:.65,right:phase?.65:.30},neutral()]);minUp=Math.min(minUp,s.axis(b,v(0,1,0)).y);maxSpeed=Math.max(maxSpeed,Math.hypot(b.chassis.linvel().x,b.chassis.linvel().z));path+=horizontal(previous,b.chassis.translation());previous=b.chassis.translation();}assert.equal(s.fault,undefined);assert(minUp>.7);assert(b.rpm>1500,'RPM '+b.rpm);assert(path>3);return{maxTiltDegrees:Math.acos(minUp)*180/Math.PI,maxSpeedMps:maxSpeed,pathM:path,finalRPM:b.rpm};}finally{s.dispose();}
});
