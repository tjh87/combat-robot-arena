import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {Simulation,initializePhysics,neutral,gyroInertialTorque} from '../src/sim';
import {preset,RULES,bodyOrigin,weaponAxis,v,add,mul,length,horizontal,rotate,axisQ} from '../src/model';
await initializePhysics();
if(!process.env.GYRO_GUARDS_ONLY)await import('./gyro-repair');

// Recovery must never bypass lost power, broken drives, or ground contact.
const s=new Simulation([preset(1),preset(0)],{practice:true,hazards:false,ai:[false,false],autoUnstick:false}),b=s.bots[0];
try{
 for(let t=0;t<240;t++)s.step();assert(!s.requestSelfRight(b),'level robot should not dance');
 const q=axisQ(v(0,0,1),Math.PI/2);for(const [key,body]of b.bodies){body.setTranslation(add(v(0,4,2.5),rotate(bodyOrigin(b.compiled.config,key),q)),true);body.setRotation(q,true);body.setLinvel(v(),true);body.setAngvel(v(),true);}s.world.propagateModifiedBodyPositionsToColliders();s.step();
 b.modules.drive_left.functional=false;assert(!s.requestSelfRight(b));b.modules.drive_left.functional=true;
 const energy=b.energy;b.energy=0;assert(!s.requestSelfRight(b));b.energy=energy;
 assert(s.requestSelfRight(b));s.step();assert.equal(b.gyroDance?.ticks,0,'wait for momentum and floor support');
 b.modules.drive_right.functional=false;s.step();assert.equal(b.rollStart,-1);assert.equal(b.gyroDance,undefined);
 console.log('PASS gyro safeguards: level pose, damaged drive, empty battery, unsupported spin-up, interrupted recovery');
}finally{s.dispose();}
