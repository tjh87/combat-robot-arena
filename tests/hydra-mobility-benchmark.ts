import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {preset,compile,v,add,sub,rotate,quatMul,axisQ,dot,length,RULES} from '../src/model';
import {Simulation,initializePhysics,neutral} from '../src/sim';
await initializePhysics();mkdirSync('browser-evidence',{recursive:true});const rows:any[]=[];const config=preset(2);assert.deepEqual(compile(config).errors,[]);
for(const mode of['forward','reverse','left','right','arc','stop','transition'] as const){
 const s=new Simulation([config,preset(0)],{practice:true,hazards:false,ai:[false,false],autoUnstick:false,recordVisuals:false,seed:42673});try{
  for(const id of[0,1]){const b=s.bots[id],origin=b.chassis.translation(),old=b.chassis.rotation(),inv={x:-old.x,y:-old.y,z:-old.z,w:old.w},q=axisQ(v(0,1,0),0),position=id===0?v(0,config.chassis.height/2+config.chassis.clearance+.008,mode==='reverse'?-5.5:5.5):v(5,.2,5);for(const body of b.bodies.values()){body.setTranslation(add(position,rotate(rotate(sub(body.translation(),origin),inv),q)),true);body.setRotation(quatMul(q,quatMul(inv,body.rotation())),true);body.setLinvel(v(),true);body.setAngvel(v(),true);}}
  s.world.propagateModifiedBodyPositionsToColliders();for(let i=0;i<240;i++)s.step();const b=s.bots[0],start={...b.chassis.translation()},energy=b.energy,samples:any[]=[];let angle=0,minUp=1,maxYaw=0,peak=0,contacts=0;
  const ticks=mode==='stop'||mode==='transition'?720:480;
  for(let i=0;i<ticks;i++){const throttle=mode==='reverse'?-1:mode==='arc'?.7:mode==='left'||mode==='right'?0:mode==='stop'?(i<360?1:0):mode==='transition'?(i<240?1:i<480?0:-1):1,turn=mode==='left'?1:mode==='right'?-1:mode==='arc'?.3:0;s.step([{...neutral(),left:throttle+turn,right:throttle-turn},neutral()]);assert.equal(s.fault,undefined);const speed=Math.hypot(b.chassis.linvel().x,b.chassis.linvel().z),yaw=dot(b.chassis.angvel(),s.axis(b,v(0,1,0)));peak=Math.max(peak,speed);maxYaw=Math.max(maxYaw,Math.abs(yaw));angle+=yaw/RULES.hz;minUp=Math.min(minUp,s.axis(b,v(0,1,0)).y);let support=0;for(const[id,col]of b.colliders)if(/^wheel_-?1_\d$/.test(id))s.world.contactPairsWith(col,other=>{if(s.meta.get(other.handle)?.bot===null)support++;});contacts+=support;if(i%120===119)samples.push({seconds:(i+1)/240,speed,yaw,wheelContacts:support});}
  const row={mode,distance:length(sub(b.chassis.translation(),start)),peakSpeed:peak,finalSpeed:Math.hypot(b.chassis.linvel().x,b.chassis.linvel().z),turnRadians:angle,maxYaw,minUp,meanWheelContacts:contacts/ticks,energySpent:energy-b.energy,samples};rows.push(row);console.log(JSON.stringify(row));assert(b.energy<energy);
 }finally{s.dispose();}
}
const output=process.env.HYDRA_METRICS??'browser-evidence/restored-mobility.json';writeFileSync(output,JSON.stringify({source:process.env.GITHUB_SHA,seed:42673,drive:config.drive,mass:compile(config).mass,rows},null,2));
