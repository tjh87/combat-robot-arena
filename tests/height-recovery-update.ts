import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {Simulation,initializePhysics,neutral,type ImpactEvent,type Travel} from '../src/sim';
import {MatchHighlights} from '../src/match-highlights';
import {preset,RULES,bodyOrigin,axisQ,rotate,add,v,quatMul,type Quat} from '../src/model';
const results:any[]=[];
async function test(name:string,fn:()=>unknown){try{const detail=await fn();results.push({name,status:'passed',detail});console.log('PASS',name,JSON.stringify(detail));}catch(e){process.exitCode=1;results.push({name,status:'failed',error:String(e)});console.log('FAIL',name,String(e));}writeFileSync('docs/height-recovery-update-results.json',JSON.stringify(results,null,2)+'\n');}
await initializePhysics();
const make=(index:number,auto=true)=>new Simulation([preset(index),preset(0)],{practice:true,hazards:false,ai:[false,false],autoUnstick:auto});
function pose(s:Simulation,id:number,p:ReturnType<typeof v>,q:Quat=axisQ(v(0,0,1),0)){
 const b=s.bots[id];for(const[key,body]of b.bodies){body.setRotation(q,true);body.setTranslation(add(p,rotate(bodyOrigin(b.compiled.config,key),q)),true);body.setLinvel(v(),true);body.setAngvel(v(),true);}s.world.propagateModifiedBodyPositionsToColliders();
}
await test('Height keeps the highest hit rise for each robot and excludes unrelated movement',()=>{
 const h=new MatchHighlights(),t={bot:0,role:'Post-impact travel',horizontal:2,height:1.5,powered:false,airborne:true,landed:0}as Travel;
 h.travel(t,false,false);h.travel({...t,height:.4},false,false);h.travel({...t,height:8,role:'Recoil travel'},false,false);h.travel({...t,height:6,airborne:false,powered:true},true,true);h.travel({...t,height:5,landed:2},true,false);
 assert.equal(h.robots[0].maxHeight,1.5);assert.equal(h.robots[1].maxHeight,0);h.travel({...t,bot:1,height:2.75},false,false);
 for(let i=0;i<800;i++)h.travel({...t,height:.2},false,false);
 assert.deepEqual(h.robots.map(r=>r.maxHeight),[1.5,2.75]);assert.deepEqual(new MatchHighlights().robots.map(r=>r.maxHeight),[0,0]);return h.robots;
});
await test('A real physics flight records its peak rise and retains it when the match ends',()=>{
 const s=make(1,false),b=s.bots[0];try{
  pose(s,0,v(0,.3,3));pose(s,1,v(-5,.2,-5));for(let t=0;t<240;t++)s.step();
  const origin=b.chassis.translation().y,event={id:1,attacker:1,target:0,cause:'weapon'}as ImpactEvent;
  (s as any).openTravel(0,event,'Post-impact travel');for(const body of b.bodies.values())body.setLinvel(v(1,6,0),true);
  let peak=0;for(let t=0;t<720;t++){s.step();peak=Math.max(peak,b.chassis.translation().y-origin);}
  assert.equal(s.fault,undefined);assert(peak>1.7&&peak<2);assert(Math.abs(s.highlights.robots[0].maxHeight-peak)<.002);s.finish('Count-out',1);
  assert(Math.abs(s.highlights.robots[0].maxHeight-peak)<.002);assert.equal(s.highlights.robots[1].maxHeight,0);return{peakRiseM:peak,resultHeightM:s.highlights.robots[0].maxHeight};
 }finally{s.dispose();}
});
await test('Airborne AI robots do not deploy recovery arms before landing',()=>{
 const rows=[];for(const index of[4,5,10]){const s=make(index),b=s.bots[0];try{
  pose(s,0,v(0,3,3),axisQ(v(0,0,1),Math.PI));pose(s,1,v(-5,.2,-5));s.options.ai[0]=true;
  for(let t=0;t<96;t++){s.step();assert.equal(b.rollStart,-1);assert.equal(b.lastSelfRight,-10000);assert.equal(b.autoRightTicks,0);}assert(b.chassis.translation().y>1.8);assert.equal(s.fault,undefined);rows.push({bot:b.compiled.config.identity.name,airborneSeconds:.4,automaticDeployments:0});
 }finally{s.dispose();}}return rows;
});
await test('Recovery arm movement cannot increase hit travel or height',()=>{
 const s=make(4,false),b=s.bots[0];try{
  pose(s,0,v(0,.5,3),axisQ(v(0,0,1),Math.PI));
  (s as any).openTravel(0,{id:1}as ImpactEvent,'Post-impact travel');
  assert(s.requestSelfRight(b));for(const body of b.bodies.values())body.setTranslation(add(body.translation(),v(1,.7,0)),true);
  (s as any).sampleTravel();assert.equal(s.tracking.size,0);assert.equal(s.travels[0].reason,'Self-righting');assert.equal(s.highlights.robots[0].maxHeight,0);assert.equal(s.highlights.robots[0].furthestTravel,0);
  return{recoveryExcluded:true};
 }finally{s.dispose();}
});
await test('AI recovery still starts after a sustained tip with floor support',()=>{
 const rows=[];for(const index of[4,5,10]){const s=make(index,false),b=s.bots[0];try{
  pose(s,0,v(0,.8,3),axisQ(v(0,0,1),index===4?Math.PI/2:Math.PI));pose(s,1,v(-5,.2,-5));
  for(let t=0;t<3*RULES.hz;t++)s.step();assert(s.automaticSelfRightReady(b),b.compiled.config.identity.name);assert.equal(b.rollStart,-1);s.options.ai[0]=true;let first=-1;
  for(let t=0;t<2*RULES.hz;t++){s.step();if(b.lastSelfRight>=0){first=s.time;break;}}
  assert(first>=3&&first<5,b.compiled.config.identity.name);assert.equal(s.fault,undefined);rows.push({bot:b.compiled.config.identity.name,firstAutomaticRecoverySeconds:first});
 }finally{s.dispose();}}return rows;
});
await test('Unstick recovery helps a stranded shell only when automatic assistance is enabled',()=>{
 const rows=[];for(const auto of[false,true]){const s=make(5,auto),b=s.bots[0];try{
  pose(s,0,v(0,.8,3),axisQ(v(0,0,1),Math.PI));pose(s,1,v(-5,.2,-5));
  for(let t=0;t<2*RULES.hz;t++)s.step([{...neutral(),left:.15,right:.15},neutral()]);
  assert.equal(b.lastSelfRight>=0,auto);assert.equal(s.fault,undefined);rows.push({autoUnstick:auto,recoveryRequested:b.lastSelfRight>=0});
 }finally{s.dispose();}}return rows;
});
await test('Upright driving leaves recovery arms stowed and does not enter recovery settling',()=>{
 const rows=[];for(const index of[4,5,10]){const s=make(index),b=s.bots[0];try{
  let maxAngle=0;for(let t=0;t<6*RULES.hz;t++){
   s.step([{...neutral(),left:t>3*RULES.hz?.4:0,right:t>3*RULES.hz?.1:0,weapon:t===240},neutral()]);
   assert.equal(b.rollStart,-1);assert.equal(b.rollSettling,false);assert.equal(b.autoRightTicks,0);
   const q=b.chassis.rotation(),r=quatMul({x:-q.x,y:-q.y,z:-q.z,w:q.w},b.roll!.rotation()),raw=2*Math.atan2(index===5?r.z:r.x,r.w);maxAngle=Math.max(maxAngle,Math.abs(Math.atan2(Math.sin(raw),Math.cos(raw))));
  }assert(maxAngle<.09);assert.equal(s.fault,undefined);rows.push({bot:b.compiled.config.identity.name,maxArmDegrees:maxAngle*180/Math.PI});
 }finally{s.dispose();}}return rows;
});
await test('Old recovery observations cannot deploy an arm after the robot returns upright',()=>{
 const s=make(4),b=s.bots[0];try{
  pose(s,0,v(0,.8,3),axisQ(v(0,0,1),Math.PI));for(let t=0;t<480;t++)s.step();b.autoRightTicks=.6*RULES.hz;s.options.ai[0]=true;
  pose(s,0,v(0,.1,3));s.step();assert.equal(b.autoRightTicks,0);assert.equal(b.rollStart,-1);assert.equal(b.lastSelfRight,-10000);return{staleObservationIgnored:true};
 }finally{s.dispose();}
});
