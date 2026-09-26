import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {Simulation,initializePhysics,neutral} from '../src/sim';
import {ROSTER,RULES,preset,v,add,sub,bodyOrigin,identity} from '../src/model';
await initializePhysics();
const results:any[]=[];
async function test(name:string,run:()=>unknown){try{results.push({name,status:'passed',detail:await run()});console.log('PASS',name);}catch(error){results.push({name,status:'failed',error:String(error)});process.exitCode=1;console.log('FAIL',name,String(error));}writeFileSync('docs/flight-height-results.json',JSON.stringify(results,null,2));}
function make(index=0,practice=true){return new Simulation([preset(index),preset(0)],{practice,hazards:false,ai:[false,false],autoUnstick:false});}
function pose(s:Simulation,x:number,y:number,z:number){const b=s.bots[0];for(const[key,body]of b.bodies){body.setRotation(identity,true);body.setTranslation(add(v(x,y,z),bodyOrigin(b.compiled.config,key)),true);body.setLinvel(v(),true);body.setAngvel(v(),true);}s.world.propagateModifiedBodyPositionsToColliders();}
await test('All eleven robots stay below the flight ceiling after a strong launch and then fall',()=>{
 const rows=[];for(let i=0;i<ROSTER.length;i++){const s=make(i);try{pose(s,0,.8,3);const b=s.bots[0];for(const body of b.bodies.values())body.setLinvel(v(0,35,0),true);let peak=0,falling=false;
  for(let n=0;n<320;n++){s.step([neutral(),neutral()]);const y=s.wholeCOM(b).y;peak=Math.max(peak,y);assert(y<=RULES.maxFlightHeight+1e-5);if(n>100&&b.chassis.linvel().y<-.5)falling=true;}
  assert.equal(s.fault,undefined);assert(peak>RULES.wallHeight);assert(falling);rows.push({robot:ROSTER[i].name,peakCentreM:peak});
 }finally{s.dispose();}}return rows;
});
await test('The limiter preserves horizontal velocity, body spin and relative joint motion',()=>{
 const s=make(8);try{pose(s,0,1,3);const b=s.bots[0],before=[...b.bodies.values()].map((body,i)=>{body.setLinvel(v(2+i*.01,30+i*.03,-3),true);body.setAngvel(v(1,2,3),true);return{body,p:{...body.translation()},lin:{...body.linvel()},ang:{...body.angvel()}};});
  (s as any).limitFlightHeight();let removed:number|undefined;
  for(const row of before){const velocity=row.body.linvel(),delta=row.lin.y-velocity.y;assert.equal(velocity.x,row.lin.x);assert.equal(velocity.z,row.lin.z);assert.deepEqual({...row.body.angvel()},row.ang);assert.deepEqual({...row.body.translation()},row.p);assert(delta>0);if(removed!==undefined)assert(Math.abs(delta-removed)<1e-5);removed=delta;}
  return{bodies:before.length,commonUpwardSpeedRemoved:removed};
 }finally{s.dispose();}
});
await test('Small jumps and normal falls retain their velocity',()=>{
 const s=make();try{pose(s,0,.5,3);let cases=0;for(const y of[-12,-2,0,2]){for(const body of s.bots[0].bodies.values())body.setLinvel(v(1,y,2),true);(s as any).limitFlightHeight();for(const body of s.bots[0].bodies.values())assert.deepEqual({...body.linvel()},v(1,y,2));cases++;}return{cases};}finally{s.dispose();}
});
await test('A solver overshoot moves the complete assembly together without changing its pose',()=>{
 const s=make(10);try{pose(s,0,5,3);const b=s.bots[0],bodies=[...b.bodies.values()],offsets=bodies.map(body=>sub(body.translation(),b.chassis.translation()));(s as any).limitFlightHeight();assert(Math.abs(s.wholeCOM(b).y-RULES.maxFlightHeight)<1e-6);bodies.forEach((body,i)=>{const offset=sub(body.translation(),b.chassis.translation());assert(Math.abs(offset.y-offsets[i].y)<1e-6);assert.equal(offset.x,offsets[i].x);assert.equal(offset.z,offsets[i].z);});return{limitM:RULES.maxFlightHeight};}finally{s.dispose();}
});
await test('All eleven upright robots can still cross the wall and receive a ring-out result',()=>{
 const rows=[];for(let i=0;i<ROSTER.length;i++){const s=make(i,false);try{pose(s,6.2,3,3);const b=s.bots[0],shift=RULES.maxFlightHeight-.015-s.wholeCOM(b).y;for(const body of b.bodies.values()){body.setTranslation(add(body.translation(),v(0,shift,0)),true);body.setLinvel(v(12,0,0),true);}s.world.propagateModifiedBodyPositionsToColliders();for(let n=0;n<100&&!s.result;n++)s.step();assert.equal(s.fault,undefined);assert.equal(s.result?.reason,'Out of arena',ROSTER[i].name);assert.equal(s.result?.winner,1);rows.push(ROSTER[i].name);}finally{s.dispose();}}return{robots:rows};
});
await test('Post-match motion and recorded frames retain the same flight limit',()=>{
 const s=make();try{pose(s,0,1,3);s.finish('Test',1);for(const body of s.bots[0].bodies.values())body.setLinvel(v(0,35,0),true);let peak=0;for(let n=0;n<220;n++){s.stepAfterFinish();peak=Math.max(peak,s.wholeCOM(s.bots[0]).y);}assert(peak<=RULES.maxFlightHeight+1e-5);assert(s.frames.length>0);return{peakCentreM:peak,frames:s.frames.length};}finally{s.dispose();}
});
