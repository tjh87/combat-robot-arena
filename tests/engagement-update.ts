import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {Simulation,initializePhysics,neutral} from '../src/sim';
import {preset,ROSTER,RULES,bodyOrigin,identity,axisQ,weaponAxis,isSpinner,v,add,rotate,mul,sub,dot,length,quatMul,type Vec} from '../src/model';
import {toothBite} from '../src/weapon-impact';
import {colliderBounds} from '../src/arena-wall';
import {tireStress} from '../src/tire-effects';
import {collisionCases} from './collision';

await initializePhysics();
function pose(s:Simulation,id:number,p:Vec,q=identity){const b=s.bots[id];for(const[key,body]of b.bodies){body.setTranslation(add(p,rotate(bodyOrigin(b.compiled.config,key),q)),true);body.setRotation(q,true);body.setLinvel(v(),true);body.setAngvel(v(),true);}s.world.propagateModifiedBodyPositionsToColliders();}
const make=(a=0,b=10,practice=true)=>new Simulation([preset(a),preset(b)],{practice,hazards:false,ai:[false,false],autoUnstick:false});
const results:{name:string,status:string,detail?:unknown,error?:string}[]=[];
async function test(name:string,run:()=>unknown){if(process.env.CASE&&!name.includes(process.env.CASE))return;try{const detail=await run();results.push({name,status:'passed',detail});console.log('PASS',name,JSON.stringify(detail));}catch(error){process.exitCode=1;results.push({name,status:'failed',error:String(error)});console.log('FAIL',name,String(error));}writeFileSync('docs/engagement-update-results.json',JSON.stringify({date:new Date().toISOString(),results},null,2)+'\n');}

await test('Bite follows tooth spacing, feed, insertion and strike angle',()=>{
 const w=preset(0).weapon;assert(isSpinner(w));
 const shallow=toothBite(w,180,.5,.04,1,true),deep=toothBite(w,180,4,.04,1,true),many=toothBite({...w,teeth:8},180,4,.04,1,true),fast=toothBite(w,720,4,.04,1,true),glance=toothBite(w,180,4,.04,.2,true),bare=toothBite(w,180,4,.04,1,false);
 assert(Math.abs(shallow.depth-Math.PI*.5/180)<1e-12);assert(deep.depth>shallow.depth);assert(deep.damageScale>shallow.damageScale);assert(many.depth<deep.depth&&fast.depth<deep.depth);assert(glance.damageScale<deep.damageScale);assert.equal(bare.depth,0);assert(bare.damageScale<shallow.damageScale);
 return{shallowBiteMm:shallow.depth*1000,deepBiteMm:deep.depth*1000,shallowDamagePercent:shallow.damageScale*100,deepDamagePercent:deep.damageScale*100};
});

await test('Every spinning weapon loses speed when it strikes a robot',()=>{
 const rows=[];
 for(let i=0;i<ROSTER.length;i++){const c=preset(i);if(!isSpinner(c.weapon))continue;const s=make(i);try{
  const b=s.bots[0],target=s.bots[1],w=c.weapon;
  pose(s,0,v(0,c.chassis.height/2+c.chassis.clearance+.01,2));const tc=target.compiled.config;pose(s,1,v(0,tc.chassis.height/2+tc.chassis.clearance+.01,.35));
  b.rotor!.setAngvel(mul(weaponAxis(w),w.rpm*Math.PI/30),true);b.weaponOn=true;for(const body of b.bodies.values())body.setLinvel(v(0,0,-3),true);
  let hitTick=-1;for(let t=0;t<600;t++){if(w.type==='hammer_saw'&&t===70)s.requestStrike(b);s.step([{...neutral(),left:.35,right:.35},neutral()]);if(hitTick<0&&s.events.some(e=>e.cause==='weapon'&&e.attacker===0&&e.target===1))hitTick=s.tick;if(hitTick>=0&&s.tick>hitTick+16)break;}
  assert.equal(s.fault,undefined,c.identity.name);const hits=s.events.filter(e=>e.cause==='weapon'&&e.attacker===0&&e.target===1&&e.rotorBefore[0]>200);assert(hits.length,c.identity.name+' missed');
  const hardest=hits.reduce((a,b)=>a.energy>b.energy?a:b),ratio=hardest.rotorAfter[0]/hardest.rotorBefore[0];assert(ratio<.995,c.identity.name+' failed to slow: '+ratio);assert(hits.every(e=>e.engagement!==undefined),c.identity.name+' has no bite data');
  rows.push({name:c.identity.name,energyBeforeJ:hardest.rotorBefore[0],energyAfterJ:hardest.rotorAfter[0],rpmLossPercent:(1-Math.sqrt(ratio))*100,maxBiteMm:Math.max(...hits.map(e=>(e.biteDepth??0)*1000)),maxEngagement:Math.max(...hits.map(e=>e.engagement??0))});
 }finally{s.dispose();}}
 return rows;
});

await test('Walls stop low crossings at high speed and only permit clearance over the rim',()=>{
 let cases=0,maxCoordinate=0,clearedRim=0;
 for(const index of[0,7,9])for(const angle of[0,Math.PI/4,Math.PI/2,3*Math.PI/4,Math.PI,5*Math.PI/4,3*Math.PI/2,7*Math.PI/4])for(const speed of[20,150]){
  const s=make(index);try{const b=s.bots[0],c=b.compiled.config,direction=v(Math.cos(angle),0,Math.sin(angle)),start=mul(direction,5.8/Math.max(Math.abs(direction.x),Math.abs(direction.z))),height=cases%2?1.3:c.chassis.height/2+c.chassis.clearance+.01;start.y=height;pose(s,0,start);pose(s,1,v(0,.12,0));
   for(const body of b.bodies.values())body.setLinvel(mul(direction,speed),true);
   for(let t=0;t<90;t++){s.step();const p=b.chassis.translation();maxCoordinate=Math.max(maxCoordinate,Math.abs(p.x),Math.abs(p.z));if(Math.max(Math.abs(p.x),Math.abs(p.z))>RULES.floor/2+.03){const low=Math.min(...[...b.colliders.values()].filter(c=>c.isValid()&&!c.isSensor()&&c.collisionGroups()).map(c=>colliderBounds(c).min.y));assert(low>RULES.wallHeight,JSON.stringify({index,angle,speed,t,p,low}));clearedRim++;break;}assert(!s.outOfArena(b),JSON.stringify({index,angle,speed,t,p}));}
   assert.equal(s.fault,undefined);cases++;
  }finally{s.dispose();}
 }
 return{cases,contained:cases-clearedRim,clearedRim,maxSpeedMps:150,maxChassisCoordinateM:maxCoordinate,wallInnerCoordinateM:RULES.floor/2,ccdSubsteps:RULES.ccdSubsteps};
});

await test('A robot can leave only by clearing the top of a wall',()=>{
 const s=make(0,1,false);try{pose(s,0,v(6.3,RULES.wallHeight+.55,3));for(const body of s.bots[0].bodies.values())body.setLinvel(v(11,0,0),true);for(let i=0;i<180&&!s.result;i++)s.step();assert.equal(s.fault,undefined);assert.equal(s.result?.reason,'Out of arena');assert.equal(s.result?.winner,1);return{reason:s.result?.reason,wallHeightM:RULES.wallHeight};}finally{s.dispose();}
});

await test('An unpowered impact does not add launch energy or cancel physical recoil',()=>{
 const s=make();try{
  s.world.gravity=v();pose(s,0,v(0,3,2));pose(s,1,v(0,3,.35));
  for(const b of s.bots){b.energy=0;b.modules.weapon_actuator.present=false;}
  const attacker=s.bots[0],w=attacker.compiled.config.weapon;assert(isSpinner(w));attacker.rotor!.setAngvel(mul(weaponAxis(w),w.rpm*Math.PI/30),true);for(const body of attacker.bodies.values())body.setLinvel(v(0,0,-3),true);
  const bodies=()=>[...s.bots.flatMap(b=>[...b.bodies.values()]),...s.debris.map(d=>d.body)];
  const momentum=()=>bodies().reduce((p,b)=>add(p,mul(b.linvel(),b.mass())),v());
  const kinetic=()=>bodies().reduce((e,b)=>{const q=quatMul(b.rotation(),b.principalInertiaLocalFrame()),a=rotate(b.angvel(),{x:-q.x,y:-q.y,z:-q.z,w:q.w}),I=b.principalInertia();return e+.5*b.mass()*dot(b.linvel(),b.linvel())+.5*(I.x*a.x*a.x+I.y*a.y*a.y+I.z*a.z*a.z);},0);
  const beforeK=kinetic(),beforeP=momentum();let hitTick=-1,maxK=beforeK,maxMomentumError=0;
  for(let t=0;t<120;t++){s.step();maxK=Math.max(maxK,kinetic());maxMomentumError=Math.max(maxMomentumError,length(sub(momentum(),beforeP)));if(hitTick<0&&s.events.some(e=>e.cause==='weapon'&&e.attacker===0))hitTick=s.tick;if(hitTick>=0&&s.tick>hitTick+3)break;}
  assert.equal(s.fault,undefined);assert(hitTick>0);assert(maxK<=beforeK*1.015,JSON.stringify({beforeK,maxK}));assert(maxMomentumError<length(beforeP)*.025,JSON.stringify({beforeP,maxMomentumError}));
  return{initialEnergyJ:beforeK,finalEnergyJ:kinetic(),maximumEnergyJ:maxK,momentumErrorPercent:100*maxMomentumError/length(beforeP),hitTick};
 }finally{s.dispose();}
});

await test('A coasting weapon loses energy against both a wall and the floor',()=>{
 const rows=[];for(const surface of ['wall','floor']){const s=make();try{
  const b=s.bots[0],w=b.compiled.config.weapon;assert(isSpinner(w));const q=surface==='floor'?axisQ(v(0,0,1),.4):identity;
  pose(s,0,surface==='wall'?v(6.3,.14,3):v(0,1.2,3),q);pose(s,1,v(-4,.14,-3));b.energy=0;b.weaponOn=false;
  b.rotor!.setAngvel(mul(rotate(weaponAxis(w),q),w.rpm*Math.PI/30),true);if(surface==='wall')for(const body of b.bodies.values())body.setLinvel(v(3,0,0),true);
  let hit;for(let t=0;t<360;t++){s.step();hit=s.events.find(e=>e.target===0&&(e.module==='weapon'||surface==='floor'&&e.cause==='landing')&&e.attacker===null&&e.rotorBefore[0]>1000&&e.rotorAfter[0]<e.rotorBefore[0]*.99);if(hit)break;}
  assert.equal(s.fault,undefined);assert(hit,surface+' did not slow the blade');rows.push({surface,energyBeforeJ:hit.rotorBefore[0],energyAfterJ:hit.rotorAfter[0]});
 }finally{s.dispose();}}return rows;
});

await test('A hammer has one finite 3500 J charge per cycle and Quantum survives the strike',()=>{
 const s=new Simulation([preset(10),preset(0)],{practice:false,hazards:true,ai:[false,false],autoUnstick:false});try{
  const c=s.bots[0].compiled.config;pose(s,0,v(-5.7,c.chassis.height/2+c.chassis.clearance+.009,-5.6));pose(s,1,v(4,.21,3));s.tick=1175;let maximumK=0,active=0;
  for(let t=0;t<190;t++){s.step();const h=s.hazards[0];if(h.phase==='active'){active++;maximumK=Math.max(maximumK,.5*h.body.mass()*dot(h.body.linvel(),h.body.linvel()));assert(h.spent<=h.budget+.001);}}
  const hits=s.events.filter(e=>e.source==='Corner Hammer A');assert(hits.length>0);assert(active>0);assert(maximumK>3000&&maximumK<=3500.1);assert(hits.reduce((n,e)=>n+e.energy,0)<=3500.1);assert.equal(s.result,undefined);assert.equal(s.fault,undefined);assert(s.bots[0].modules.chassis.hp>1050);
  return{headMassKg:s.hazards[0].body.mass(),maximumKineticEnergyJ:maximumK,assignedImpactEnergyJ:s.hazards[0].spent,chassisHp:s.bots[0].modules.chassis.hp};
 }finally{s.dispose();}
});

await test('Static pushing pressure makes no smoke, and slipping tires respond to load',()=>{
 assert.equal(tireStress(0,1,20),0);assert.equal(tireStress(.19,1,20),0);
 const sliding=tireStress(1,0,0),pushed=tireStress(1,0,3),powered=tireStress(1,1,3);
 assert(sliding>0&&pushed>sliding&&powered>pushed);return{stationary:0,sliding,pushed,powered};
});

await test('Fast tooth sweeps keep all 200 hits and reject all 200 near misses',()=>{
 const r=collisionCases(RULES.hz,RULES.ccdSubsteps);assert.equal(r.hitPass,200);assert.equal(r.nearPass,200);assert.equal(r.failures.length,0);return{hits:r.hitPass,nearMisses:r.nearPass,hz:RULES.hz};
});

await test('Six seeded matches cover all eleven templates and all three difficulties',()=>{
 const rows=[];for(const [n,[a,b]] of [[0,10],[1,5],[2,9],[3,4],[6,8],[7,0]].entries()){
  if(process.env.MATCH_INDEX!==undefined&&n!==Number(process.env.MATCH_INDEX))continue;
  const difficulty=(['easy','medium','hard'] as const)[n%3],s=new Simulation([preset(a),preset(b)],{practice:false,hazards:true,ai:[true,true],difficulty,seed:230900+n});try{
   for(let t=0;t<RULES.matchTicks&&!s.result&&!s.fault;t++)s.step();assert.equal(s.fault,undefined);assert(s.result);assert(s.events.some(e=>e.attacker!==null),'no combat occurred');assert(s.bots.every(bot=>Number.isFinite(bot.rpm)&&bot.energy>=0));
   rows.push({a:ROSTER[a].name,b:ROSTER[b].name,difficulty,seconds:s.tick/RULES.hz,reason:s.result.reason,impacts:s.events.length});console.log('MATCH',JSON.stringify(rows.at(-1)));
  }finally{s.dispose();}
 }return rows;
});
