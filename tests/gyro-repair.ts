import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {initializePhysics,Simulation,neutral} from '../src/sim';
import {preset,axisQ,v,bodyOrigin,add,rotate,mul,weaponAxis} from '../src/model';
await initializePhysics();
const rows:any[]=[];
for(const automatic of[false,true])for(const a of [Math.PI, Math.PI/2,-Math.PI/2])for(const sign of (automatic?[0]:[0,1,-1])){
 if(process.env.GYRO_CASE&&process.env.GYRO_CASE!==`${a}:${sign}`)continue;
 const c=preset(1),s=new Simulation([c,preset(0)],{practice:false,hazards:false,ai:[false,false],autoUnstick:automatic}),b=s.bots[0],q=axisQ(v(0,0,1),a);
 for(const [k,body]of b.bodies){body.setTranslation(add(v(0,.6,3),rotate(bodyOrigin(c,k),q)),true);body.setRotation(q,true);body.setLinvel(v(),true);body.setAngvel(v(),true);}s.world.propagateModifiedBodyPositionsToColliders();for(let i=0;i<240;i++)s.step();
 b.rotor!.setAngvel(mul(rotate(weaponAxis(c.weapon),b.chassis.rotation()),sign*(c.weapon as any).rpm*Math.PI/30),true);if(!automatic)s.requestSelfRight(b);
 let recovered=-1,up=0;const trace:any[]=[];
 for(let i=0;i<6000;i++){s.step();up=s.axis(b,v(0,1,0)).y;if(Math.abs(up)>.9&&b.grounded&&b.rollStart<0){recovered=(i+1)/240;break;}if(i%480===0)trace.push({t:i/240,up,rpm:b.rpm,yaw:b.chassis.angvel().y,direction:b.gyroDance?.direction});}
 const row={automatic,angle:a,sign,recovered,up,trace,result:s.result?.reason,fault:s.fault};rows.push(row);console.log(JSON.stringify(row));s.dispose();
}

writeFileSync('docs/gyro-repair-results.json',JSON.stringify(rows,null,2));
for(const row of rows){assert(row.recovered>0&&row.recovered<25,JSON.stringify(row));assert(Math.abs(row.up)>.9);assert(!row.result);assert(!row.fault);}
