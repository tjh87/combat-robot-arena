import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {Simulation,initializePhysics,neutral} from '../src/sim';
import {preset,ROSTER,compile,bodyOrigin,v,add,sub,rotate,axisQ,dot,length,isSpinner,quatMul} from '../src/model';
const results:any[]=[];
async function test(name:string,run:()=>unknown){try{const detail=await run();results.push({name,status:'passed',detail});console.log('PASS',name,JSON.stringify(detail));}catch(e){results.push({name,status:'failed',error:String(e)});console.log('FAIL',name,String(e));process.exitCode=1;}writeFileSync('docs/mobility-results.json',JSON.stringify(results,null,2));}
await initializePhysics();
function pose(s:Simulation,y:number,inverted=false){const b=s.bots[0],q=axisQ(v(0,0,1),inverted?Math.PI:0),p=v(-3,y,0);for(const[key,body]of b.bodies){body.setTranslation(add(p,rotate(bodyOrigin(b.compiled.config,key),q)),true);body.setRotation(q,true);body.setLinvel(v(),true);body.setAngvel(v(),true);}s.world.propagateModifiedBodyPositionsToColliders();}
await test('Every robot drives forwards and backwards without floor snags, with weapons off and spinning',()=>{
 const rows=[],failures:string[]=[];for(let i=0;i<ROSTER.length;i++)for(const spinning of[false,true])for(const direction of[-1,1]){
  const c=preset(i),s=new Simulation([c,preset(0)],{practice:true,hazards:false,ai:[false,false],autoUnstick:false});try{
   pose(s,c.chassis.height/2+c.chassis.clearance+.008);const b=s.bots[0];for(let t=0;t<600;t++)s.step([{...neutral(),weapon:spinning&&isSpinner(c.weapon)&&t===0},neutral()]);
   const start={...b.chassis.translation()},forward=s.forward(b);let mean=0,stalled=0;for(let t=0;t<360;t++){s.step([{...neutral(),left:direction*.3,right:direction*.3},neutral()]);if(t>120){const speed=dot(b.chassis.linvel(),forward)*direction;mean+=speed;if(speed<.08)stalled++;}}
   const travel=dot(sub(b.chassis.translation(),start),forward)*direction,speed=mean/239;rows.push({name:c.identity.name,spinning,direction,travel,speed,stalled});assert.equal(s.fault,undefined);if(travel<=.25||speed<=.15||stalled>=60)failures.push(c.identity.name+' '+direction+' spinning '+spinning+' travel '+travel+' speed '+speed+' stalled '+stalled);
  }finally{s.dispose();}
 }writeFileSync('docs/mobility-cases.json',JSON.stringify(rows,null,2));assert.deepEqual(failures,[]);return rows;
});
await test('HyperShock folds its self-righting paddles flat, deploys physically, and returns upright',()=>{
 const c=preset(4),s=new Simulation([c,preset(0)],{practice:true,hazards:false,ai:[false,false],autoUnstick:false}),b=s.bots[0];try{
  assert(!b.compiled.parts.some(p=>p.id.startsWith('disc_roll_arch')));assert(b.roll);pose(s,.48,true);for(let t=0;t<480;t++)s.step();assert(s.axis(b,v(0,1,0)).y<0);assert(s.requestSelfRight(b));let recovered=-1,maxAngle=0;
  for(let t=0;t<1200;t++){s.step();const q=b.chassis.rotation(),r=b.roll!.rotation(),rel=quatMul({x:-q.x,y:-q.y,z:-q.z,w:q.w},r);maxAngle=Math.max(maxAngle,Math.abs(2*Math.atan2(rel.z,rel.w)));if(s.axis(b,v(0,1,0)).y>.9&&recovered<0)recovered=(t+1)/240;}
  const q=b.chassis.rotation(),r=b.roll!.rotation(),rel=quatMul({x:-q.x,y:-q.y,z:-q.z,w:q.w},r),foldedAngle=2*Math.atan2(rel.z,rel.w);assert.equal(s.fault,undefined);assert(recovered>0&&recovered<4,'recovery '+recovered);assert(s.axis(b,v(0,1,0)).y>.9);assert(Math.abs(foldedAngle)<.08,'paddles stayed out '+foldedAngle);assert(b.rollWork>0&&b.rollWork<=2000);return{recoveredSeconds:recovered,maxAngle,foldedAngle,workJ:b.rollWork};
 }finally{s.dispose();}
});
await test('Compact profiles retain their spinning weapons and legal build dimensions',()=>{
 return[4,8].map(i=>{const c=preset(i),b=compile(c);assert.deepEqual(b.errors,[]);assert(isSpinner(c.weapon));assert.equal(c.chassis.length,i===4?.565:.52);return{name:c.identity.name,mass:b.mass,length:c.chassis.length,envelope:b.envelope};});
});
