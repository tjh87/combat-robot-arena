import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {preset,compile,parseConfig,copy,v,add,sub,rotate,quatMul,axisQ,dot,length,RULES} from '../src/model';
import {Simulation,initializePhysics,neutral} from '../src/sim';
await initializePhysics();mkdirSync('browser-evidence',{recursive:true});const rows:any[]=[];
const config=preset(2);assert.equal(config.drive.ratio,6.5);assert.deepEqual(compile(config).errors,[]);assert(Math.abs(compile(config).mass-113.2)<1e-6);
const saved=copy(config);saved.drive.ratio=14;delete saved.drive.hydraTuning;assert.equal(parseConfig(saved).drive.ratio,6.5);const custom=copy(config);custom.drive.ratio=14;assert.equal(parseConfig(custom).drive.ratio,14);custom.drive.ratio=9;assert.equal(parseConfig(custom).drive.ratio,9);custom.drive.radius=.055;custom.drive.ratio=14;assert.equal(parseConfig(custom).drive.ratio,14);
for(const mode of['forward','reverse','left','right','arc','stop','transition'] as const){
 const s=new Simulation([config,preset(0)],{practice:true,hazards:false,ai:[false,false],autoUnstick:false,recordVisuals:false,seed:42673});try{
  for(const id of[0,1]){const b=s.bots[id],origin=b.chassis.translation(),old=b.chassis.rotation(),inv={x:-old.x,y:-old.y,z:-old.z,w:old.w},q=axisQ(v(0,1,0),0),position=id===0?v(0,.066,mode==='reverse'?-3:3):v(5,.2,4);for(const body of b.bodies.values()){body.setTranslation(add(position,rotate(rotate(sub(body.translation(),origin),inv),q)),true);body.setRotation(quatMul(q,quatMul(inv,body.rotation())),true);body.setLinvel(v(),true);body.setAngvel(v(),true);}}
  s.world.propagateModifiedBodyPositionsToColliders();for(let i=0;i<240;i++)s.step();const b=s.bots[0],start={...b.chassis.translation()},energy=b.energy,samples:any[]=[];let angle=0,minUp=1,maxYaw=0,peak=0,contacts=0;
  for(let i=0;i<(mode==='stop'||mode==='transition'?720:480);i++){
   const throttle=mode==='reverse'?-1:mode==='arc'?.7:mode==='left'?0:mode==='right'?0:mode==='stop'?(i<360?1:0):mode==='transition'?(i<240?1:i<480?0:-1):1,turn=mode==='left'?1:mode==='right'?-1:mode==='arc'?.3:0;
   s.step([{...neutral(),left:throttle+turn,right:throttle-turn},neutral()]);assert.equal(s.fault,undefined);const speed=Math.hypot(b.chassis.linvel().x,b.chassis.linvel().z),yaw=dot(b.chassis.angvel(),s.axis(b,v(0,1,0)));peak=Math.max(peak,speed);maxYaw=Math.max(maxYaw,Math.abs(yaw));angle+=yaw/RULES.hz;minUp=Math.min(minUp,s.axis(b,v(0,1,0)).y);let wheelContacts=0;for(const[id,col]of b.colliders)if(/^wheel_-?1_\d$/.test(id))s.world.contactPairsWith(col,other=>{if(s.meta.get(other.handle)?.bot===null)wheelContacts++;});contacts+=wheelContacts;if(i%120===119)samples.push({seconds:(i+1)/240,speed,yaw,wheelContacts});
  }
  const distance=length(sub(b.chassis.translation(),start)),finalSpeed=Math.hypot(b.chassis.linvel().x,b.chassis.linvel().z),row={mode,distance,peakSpeed:peak,finalSpeed,turnRadians:angle,maxYaw,minUp,meanWheelContacts:contacts/(mode==='stop'||mode==='transition'?720:480),energySpent:energy-b.energy,samples};rows.push(row);console.log(JSON.stringify(row));assert(minUp>.95);assert(b.energy<energy);assert(row.meanWheelContacts>3.5);
  if(mode==='forward'||mode==='reverse'){assert(finalSpeed>3.2&&finalSpeed<5);assert(distance>4.5);assert(Math.abs(angle)<.15);}
  if(mode==='left'||mode==='right'){assert(Math.abs(angle)>3&&Math.abs(angle)<6);assert(maxYaw<3.5);assert(distance<.65);assert(Math.sign(angle)===(mode==='left'?-1:1));}
  if(mode==='arc'){assert(finalSpeed>2);assert(Math.abs(angle)>.7&&Math.abs(angle)<2);assert(maxYaw<1.6);}
  if(mode==='stop')assert(finalSpeed<.20);if(mode==='transition'){assert(finalSpeed>2);assert(dot(b.chassis.linvel(),s.forward(b))< -2);}
 }finally{s.dispose();}
}
writeFileSync('browser-evidence/hydra-drive.json',JSON.stringify({source:process.env.GITHUB_SHA,seed:42673,ratio:config.drive.ratio,rows},null,2));
