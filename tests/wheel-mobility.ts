import assert from 'node:assert/strict';
import {Simulation,initializePhysics} from '../src/sim';
import {preset,RULES,horizontal} from '../src/model';

await initializePhysics();
const make=()=>new Simulation([preset(7),preset(0)],{seed:48119,practice:true,hazards:false,ai:[true,false],autoUnstick:false});
const intact=make(),damaged=make();
try{
 const robot=damaged.bots[0];
 for(const part of robot.compiled.parts.filter(part=>part.body.startsWith('wheel_'))){
  damaged.damage(0,part.module,1e9,undefined,part);
 }
 assert.equal(robot.modules.drive_left.hp,0);
 assert.equal(robot.modules.drive_right.hp,0);
 assert(!robot.modules.drive_left.functional&&!robot.modules.drive_right.functional,'Damage state should still be recorded');
 const start=intact.bots[0].chassis.translation();
 for(let tick=0;tick<8*RULES.hz;tick++){
  intact.step();damaged.step();
  assert.equal(intact.fault,undefined);assert.equal(damaged.fault,undefined);
 }
 const a=intact.bots[0],b=damaged.bots[0];
 assert(Math.abs(a.command.left-b.command.left)<1e-9,'AI left throttle must not be reduced by wheel damage');
 assert(Math.abs(a.command.right-b.command.right)<1e-9,'AI right throttle must not be reduced by wheel damage');
 assert.equal(a.count,b.count,'Damaged wheels must not create extra immobilization count');
 const distance=horizontal(a.chassis.translation(),b.chassis.translation());
 assert(distance<.01,`Seeded AI motion should match with damaged wheels; divergence was ${distance} m`);
 assert(horizontal(start,a.chassis.translation())>.25,'The intact AI must have moved during the test');
 console.log('PASS damaged wheel modules retain full motor propulsion and AI throttle at 240 Hz');
 console.log(JSON.stringify({ticks:intact.tick,damagedDriveModules:2,aiCommand:[b.command.left,b.command.right],seededPositionDifferenceM:distance}));
}finally{intact.dispose();damaged.dispose();}

const recovery=new Simulation([preset(7),preset(0)],{seed:48119,practice:true,hazards:false,ai:[false,false]});
try{
 const robot=recovery.bots[0];
 for(const part of robot.compiled.parts.filter(part=>part.body.startsWith('wheel_'))){
  recovery.damage(0,part.module,1e9,undefined,part);
 }
 robot.count=2*RULES.hz;
 recovery.step();
 assert(robot.unstick.active,'Automatic recovery should remain available with destroyed wheel modules');
 assert.equal(robot.ai.state,'unstick');
 console.log('PASS automatic recovery remains available after wheel damage');
}finally{recovery.dispose();}
