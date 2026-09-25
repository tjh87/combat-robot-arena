import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {preset,compile,RULES,SLOTS,bodyOrigin,axisQ,rotate,sub,add,v,horizontal,flipEnergy,selfRightKind} from '../src/model';
import {Simulation,initializePhysics,neutral,type Travel} from '../src/sim';
const results:any[]=[];
async function test(name:string,run:()=>unknown){try{const detail=await run();results.push({name,status:'passed',detail});console.log('PASS',name,JSON.stringify(detail));}catch(e){results.push({name,status:'failed',error:String(e)});process.exitCode=1;console.log('FAIL',name,String(e));}writeFileSync('docs/stability-update-results.json',JSON.stringify(results,null,2));}
await initializePhysics();
function overturned(s:Simulation,id:number,x=-3.5,z=0){const b=s.bots[id],p=v(x,.7,z),q=axisQ(v(1,0,0),Math.PI);for(const[key,body]of b.bodies){body.setRotation(q,true);body.setTranslation(add(p,rotate(bodyOrigin(b.compiled.config,key),q)),true);body.setLinvel(v(),true);body.setAngvel(v(),true);}s.world.propagateModifiedBodyPositionsToColliders();b.history=[{tick:s.tick-RULES.hz,p:{...p},ground:false,powered:false}];}
await test('Hydra stays upright on central and off-centre loaded flips while launching above 1.2 metres',()=>{
 const rows=[];for(const sideOffset of[0,.15,-.15]){
  const f=preset(2),target=preset(0),mass=compile(f).mass;target.weapon={type:'none'};Object.assign(target.chassis,{length:.64,width:.58,height:.16,clearance:.018});Object.assign(target.drive,{layout:4,radius:.10,width:.075});let low=.004,high=.020;for(let i=0;i<30;i++){target.chassis.thickness=(low+high)/2;if(compile(target).mass>mass)high=target.chassis.thickness;else low=target.chassis.thickness;}
  const s=new Simulation([f,target],{practice:true,hazards:false,ai:[false,false],autoUnstick:false});try{
   for(const[id,x]of[[0,-.7],[1,.7]]){const b=s.bots[id],delta=sub(v(x,b.chassis.translation().y,id===1?sideOffset:0),b.chassis.translation());for(const body of b.bodies.values())body.setTranslation(add(body.translation(),delta),true);}s.world.propagateModifiedBodyPositionsToColliders();s.bots[1].energy=0;
   let peak=0,minUp=1,ownPeak=0;for(let t=0;t<1500;t++){s.step([{...neutral(),left:t<450?.3:0,right:t<450?.3:0,weapon:t===450},neutral()]);peak=Math.max(peak,s.bots[1].chassis.translation().y);if(t>=450){minUp=Math.min(minUp,s.axis(s.bots[0],v(0,1,0)).y);ownPeak=Math.max(ownPeak,s.bots[0].chassis.translation().y);}}
   assert.equal(s.fault,undefined);assert(peak>1.2);assert(minUp>Math.cos(15*Math.PI/180),'Hydra tilted past 15 degrees');assert(ownPeak<.16,'Excessive chassis recoil');assert(s.bots[0].flipWork<=flipEnergy(f));rows.push({offsetM:sideOffset,opponentPeakM:peak,hydraPeakM:ownPeak,maxTiltDegrees:Math.acos(minUp)*180/Math.PI,workJ:s.bots[0].flipWork});
  }finally{s.dispose();}
 }return rows;
});
await test('Every template can be manually recovered upright without repairs, lost time or displaced opponents',()=>{
 const rows=[];for(let i=0;i<11;i++){
  const s=new Simulation([preset(i),preset(0)],{practice:true,hazards:true,ai:[false,false],autoUnstick:false});try{
   s.tick=2*RULES.hz;const b=s.bots[0];overturned(s,0);b.modules.chassis.hp-=20;b.energy-=500;b.fouls=1;b.engage=3;b.count=3*RULES.hz;
   const before={hp:SLOTS.map(k=>b.modules[k].hp),energy:b.energy,charges:b.charges,tick:s.tick,other:s.bots[1].chassis.translation()},old=b.chassis.translation();
   assert(s.manualRecoveryReady(b));assert.deepEqual(s.manualUnstick(),[b.compiled.config.identity.name]);assert(s.axis(b,v(0,1,0)).y>.999);assert(horizontal(old,b.chassis.translation())>.4);assert.deepEqual(SLOTS.map(k=>b.modules[k].hp),before.hp);assert.equal(b.energy,before.energy);assert.equal(b.charges,before.charges);assert.equal(s.tick,before.tick);assert.equal(b.fouls,1);assert.equal(b.engage,3);assert.deepEqual(s.bots[1].chassis.translation(),before.other);assert.equal(b.count,0);
   const start={...b.chassis.translation()};for(let t=0;t<360;t++)s.step([{...neutral(),left:.4,right:.4},neutral()]);assert.equal(s.fault,undefined);const travel=horizontal(start,b.chassis.translation());assert(travel>.15,b.compiled.config.identity.name+' cannot drive after recovery');rows.push({name:b.compiled.config.identity.name,hasSelfRight:!!selfRightKind(b.compiled.config),travelAfterM:travel});
  }finally{s.dispose();}
 }return rows;
});
await test('A naturally settled inverted robot without self-righting becomes recoverable',()=>{
 const s=new Simulation([preset(0),preset(1)],{practice:true,hazards:false,ai:[false,false],autoUnstick:false});try{overturned(s,0);s.bots[0].history=[];for(let t=0;t<480;t++)s.step();const b=s.bots[0];assert.equal(selfRightKind(b.compiled.config),null);assert(s.axis(b,v(0,1,0)).y<.65);assert(s.manualRecoveryReady(b));assert.equal(s.manualUnstick().length,1);assert(s.axis(b,v(0,1,0)).y>.999);return{readyAfterSeconds:s.time};}finally{s.dispose();}
});
await test('Both stuck robots recover to separate clear positions and recovery cannot be spammed or used after a result',()=>{
 const s=new Simulation([preset(0),preset(9)],{practice:true,hazards:true,ai:[false,false],autoUnstick:false});try{
  s.tick=2*RULES.hz;overturned(s,0,6,6);overturned(s,1,6,3.5);for(const b of s.bots)b.count=2*RULES.hz;
  const b=s.bots[0],p=b.chassis.translation();s.tracking.set(0,{impactId:1,bot:0,role:'Post-impact travel',origin:p,final:p,comOrigin:p,comFinal:p,maxHorizontal:.2,horizontal:.2,displacement3d:.2,path:.2,height:.1,airtime:.2,powered:false,compound:false,reason:'Tracking',ticks:10,still:0,points:[p],airborne:true,landed:0} satisfies Travel);
  assert.equal(s.manualUnstick().length,2);assert(horizontal(s.bots[0].chassis.translation(),s.bots[1].chassis.translation())>2);assert(!s.tracking.has(0));assert.equal(s.travels.at(-1)!.reason,'Manual recovery');assert.equal(s.travels.at(-1)!.path,.2);assert.equal(s.frames.length,1);
  b.count=2*RULES.hz;assert(!s.manualRecoveryReady(b));assert.deepEqual(s.manualUnstick(),[]);s.tick+=5*RULES.hz;assert(s.manualRecoveryReady(b));s.finish('Count-out',1);assert(!s.manualRecoveryReady(b));assert.deepEqual(s.manualUnstick(),[]);return{robotsRecovered:2,cooldownSeconds:5,flightDistanceUnchanged:true};
 }finally{s.dispose();}
});
await test('Healthy idle, moving, unpowered and fully disabled robots cannot use manual recovery',()=>{
 const s=new Simulation([preset(0),preset(1)],{practice:true,hazards:false,ai:[false,false],autoUnstick:false});try{
  for(let t=0;t<240;t++)s.step();const b=s.bots[0];assert(!s.manualRecoveryReady(b));b.count=RULES.hz;b.chassis.setLinvel(v(2,0,0),true);assert(!s.manualRecoveryReady(b));b.chassis.setLinvel(v(),true);b.energy=0;assert(!s.manualRecoveryReady(b));b.energy=1000;b.modules.drive_left.functional=false;b.modules.drive_right.functional=false;assert(!s.manualRecoveryReady(b));assert.deepEqual(s.manualUnstick(),[]);return{blockedStates:4};
 }finally{s.dispose();}
});
