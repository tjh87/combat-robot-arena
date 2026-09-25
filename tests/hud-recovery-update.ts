import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {Simulation,initializePhysics,neutral} from '../src/sim';
import {preset,compile,RULES,bodyOrigin,axisQ,rotate,add,sub,mul,dot,length,v,isSpinner,weaponAxis,strikeMultiplier,flipEnergy,quatMul,parseConfig} from '../src/model';
const results:any[]=[];
async function test(name:string,fn:()=>unknown){try{const detail=await fn();results.push({name,status:'passed',detail});console.log('PASS',name,JSON.stringify(detail));}catch(e){process.exitCode=1;results.push({name,status:'failed',error:String(e)});console.log('FAIL',name,String(e));}writeFileSync('docs/hud-recovery-update-results.json',JSON.stringify(results,null,2)+'\n');}
await initializePhysics();
await test('Quantum and HyperShock recover from six orientations through vertical arm contact',()=>{
 const rows=[];
 for(const index of[4,10])for(const [name,axis,angle]of[['inverted roll',v(0,0,1),Math.PI],['left',v(0,0,1),Math.PI/2],['right',v(0,0,1),-Math.PI/2],['front',v(1,0,0),Math.PI/2],['rear',v(1,0,0),-Math.PI/2],['inverted pitch',v(1,0,0),Math.PI]] as const){
  const c=preset(index),compiled=compile(c);assert.deepEqual(compiled.errors,[]);assert(compiled.mass<=RULES.weight);const s=new Simulation([c,preset(0)],{practice:true,hazards:false,ai:[false,false],autoUnstick:false}),b=s.bots[0],q=axisQ(axis,angle);
  try{for(const[key,body]of b.bodies){body.setRotation(q,true);body.setTranslation(add(v(0,.8,3),rotate(bodyOrigin(c,key),q)),true);body.setLinvel(v(),true);body.setAngvel(v(),true);}s.world.propagateModifiedBodyPositionsToColliders();for(let t=0;t<240;t++)s.step();
   const before=s.axis(b,v(0,1,0)).y;let recovered=before>.9&&b.grounded?0:-1;if(recovered<0){assert(s.requestSelfRight(b));assert(!s.requestSelfRight(b));}
   for(let t=0;t<2400;t++){s.step();if(recovered<0&&s.axis(b,v(0,1,0)).y>.85&&b.grounded)recovered=t/RULES.hz;}
   assert(recovered>=0&&recovered<8,c.identity.name+' / '+name);assert(s.axis(b,v(0,1,0)).y>.97);assert.equal(b.rollStart,-1);assert(!s.requestSelfRight(b));assert.equal(s.fault,undefined);assert(b.rollWork<=12000);rows.push({bot:c.identity.name,orientation:name,recoveredSeconds:recovered,armWorkJ:b.rollWork,massKg:compiled.mass});
  }finally{s.dispose();}
 }return rows;
});
await test('HyperShock brakes a running disc, rights itself, and restores its weapon',()=>{
 const rows=[];for(const[axis,angle]of[[v(0,0,1),Math.PI],[v(1,0,0),-Math.PI/2]]as const){
 const c=preset(4),s=new Simulation([c,preset(0)],{practice:true,hazards:false,ai:[false,false],autoUnstick:false}),b=s.bots[0],q=axisQ(axis,angle);try{
  for(const[key,body]of b.bodies){body.setRotation(q,true);body.setTranslation(add(v(0,.8,3),rotate(bodyOrigin(c,key),q)),true);}s.world.propagateModifiedBodyPositionsToColliders();for(let t=0;t<240;t++)s.step();assert(isSpinner(c.weapon));b.rotor!.setAngvel(mul(rotate(weaponAxis(c.weapon),b.chassis.rotation()),c.weapon.rpm*Math.PI/30),true);b.weaponOn=true;assert(s.requestSelfRight(b));let recovered=-1,braked=false;
  for(let t=0;t<2400;t++){s.step();braked||=!b.weaponOn;if(recovered<0&&s.axis(b,v(0,1,0)).y>.9&&b.grounded)recovered=t/RULES.hz;}assert(braked);assert(recovered>=0&&recovered<9);assert(b.weaponOn&&b.rpm>500);assert(s.axis(b,v(0,1,0)).y>.90);assert.equal(s.fault,undefined);rows.push({axis,angle,recoveredSeconds:recovered,endRPM:b.rpm});
 }finally{s.dispose();}}return rows;
});
await test('Only the requested weapons receive the exact strike multipliers',()=>{
 const values=[1.5,1,1.5,1.5,1,1.5,1.5,3,1,4,1];return values.map((expected,index)=>{const c=preset(index);assert.equal(strikeMultiplier(c),expected);if(index===2)assert.equal(flipEnergy(c),18900);return{bot:c.identity.name,multiplier:expected};});
});
// Spinner impact energy and tooth engagement are checked in engagement-update.ts.

await test('Vertical recovery arms stay folded during ordinary driving and repeated recovery requests',()=>{
 const rows=[];for(const index of[4,10]){const s=new Simulation([preset(index),preset(0)],{practice:true,hazards:false,ai:[false,false],autoUnstick:true}),b=s.bots[0];try{
  for(let t=0;t<1200;t++)s.step([{...neutral(),left:t>240&&t<480?.25:0,right:t>240&&t<480?.25:0},neutral()]);const q=b.chassis.rotation(),r=quatMul({x:-q.x,y:-q.y,z:-q.z,w:q.w},b.roll!.rotation()),angle=2*Math.atan2(r.x,r.w);assert(Math.abs(Math.atan2(Math.sin(angle),Math.cos(angle)))<.08);assert(s.axis(b,v(0,1,0)).y>.97);assert(!s.requestSelfRight(b));assert.equal(s.fault,undefined);rows.push({bot:b.compiled.config.identity.name,stowedAngleDegrees:angle*180/Math.PI});
 }finally{s.dispose();}}return rows;
});

await test('Saved stock arms migrate without discarding custom colours or other settings',()=>{
 return [4,10].map(index=>{const c=preset(index);c.identity.name='Saved build';c.identity.primary='#123456';c.selfRight=index===4?{type:'roll_arm',mount:v(-.15,.097,0),length:.31,actuator:'R600'}:{type:'roll_arm',mount:v(-.225,.12,.205),length:.45,actuator:'R600'};const migrated=parseConfig(c);assert.deepEqual(migrated.selfRight,preset(index).selfRight);assert.equal(migrated.identity.name,'Saved build');assert.equal(migrated.identity.primary,'#123456');assert.deepEqual(migrated.weapon,c.weapon);assert.deepEqual(compile(migrated).errors,[]);return{profile:c.chassis.profile,migrated:true};});
});
