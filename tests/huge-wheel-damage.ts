import assert from 'node:assert/strict';
import {Simulation,initializePhysics,type ImpactEvent} from '../src/sim';
import {preset,MATERIALS,type Slot} from '../src/model';
await initializePhysics();
let checked=0;
const event=():ImpactEvent=>({id:1,tick:0,episode:'wheel-test',source:'Tombstone',attacker:1,target:0,module:'drive_left',energy:10000,impulse:500,closing:10,point:{x:0,y:.5,z:0},rotorBefore:[0,0],rotorAfter:[0,0],allocations:[],cause:'weapon'});
const sim=new Simulation([preset(7),preset(0)],{practice:true,hazards:false});
try{
 const b=sim.bots[0],parts=b.compiled.parts.filter(p=>p.body.startsWith('wheel_'));
 for(const part of parts){const slot=part.module,m=b.modules[slot];m.hp=m.max;const hit=event();sim.damage(0,slot,100*MATERIALS[m.material].resistance,hit,part);assert.equal(m.max-m.hp,50,part.id);assert.equal(hit.allocations[0].hp,50);assert.equal(hit.energy,10000);assert.equal(hit.impulse,500);checked++;}
 console.log('PASS all',checked,'HUGE wheel components receive half damage');
 for(const slot of ['chassis','drive_left','weapon','battery'] as Slot[]){const m=b.modules[slot];m.hp=m.max;const part=b.compiled.parts.find(p=>p.module===slot&&!p.body.startsWith('wheel_'))!;assert(part);sim.damage(0,slot,100*MATERIALS[m.material].resistance,event(),part);assert.equal(m.max-m.hp,100,slot);}
 console.log('PASS exposed motors, chassis, weapon and battery retain normal damage');
 const other=sim.bots[1],wheel=other.compiled.parts.find(p=>p.body.startsWith('wheel_'))!,m=other.modules[wheel.module];sim.damage(1,wheel.module,100*MATERIALS[m.material].resistance,undefined,wheel);assert.equal(m.max-m.hp,100);
 console.log('PASS other robot wheels retain normal damage');
 const left=parts.find(p=>p.module==='drive_left')!,drive=b.modules.drive_left;drive.hp=drive.max;drive.functional=true;
 for(let i=0;i<7;i++)sim.damage(0,'drive_left',100*MATERIALS[drive.material].resistance,event(),left);
 assert.equal(drive.hp,50);assert(drive.functional);sim.damage(0,'drive_left',100*MATERIALS[drive.material].resistance,event(),left);assert.equal(drive.hp,0);assert(!drive.functional);assert.equal(b.modules.chassis.hp,b.modules.chassis.max-100);
 console.log('PASS wheel damage accumulates correctly and can still disable the drive');
}finally{sim.dispose();}
