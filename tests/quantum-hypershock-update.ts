import {BATTERY_CRUSH_RESISTANCE} from '../src/battery-layout';
import {QUANTUM_HYDRAULICS} from '../src/weapon-specs';
import assert from 'node:assert/strict';
import {writeFileSync,readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';
import * as THREE from 'three';
import {ArenaRenderer} from '../src/render';
import {GameAudio} from '../src/audio';
import {Simulation,initializePhysics,neutral,type ImpactEvent} from '../src/sim';
import {preset,compile,ROSTER,RULES,bodyOrigin,batteryPosition,axisQ,rotate,add,sub,v,length,dot,isSpinner,MATERIALS,type Quat} from '../src/model';
import {BATTERY_FIRE} from '../src/combat-damage';
import {MatchHighlights} from '../src/match-highlights';
import {podium} from '../src/result-view';
import {quantumHead,quantumScoop} from '../src/quantum-visual';
import {BatteryFireVisual} from '../src/battery-fire-visual';
const results:any[]=[];
async function test(name:string,fn:()=>unknown){if(process.env.CASE&&!new RegExp(process.env.CASE).test(name))return;try{const detail=await fn();results.push({name,status:'passed',detail});console.log('PASS',name,JSON.stringify(detail));}catch(e){process.exitCode=1;results.push({name,status:'failed',error:String(e)});console.log('FAIL',name,String(e));}writeFileSync('docs/quantum-hypershock-update-results.json',JSON.stringify(results,null,2)+'\n');}
await initializePhysics();
function pose(s:Simulation,id:number,p:ReturnType<typeof v>,q:Quat=axisQ(v(0,0,1),0)){
 const b=s.bots[id];for(const[key,body]of b.bodies){body.setRotation(q,true);body.setTranslation(add(p,rotate(bodyOrigin(b.compiled.config,key),q)),true);body.setLinvel(v(),true);body.setAngvel(v(),true);}s.world.propagateModifiedBodyPositionsToColliders();
}
function impact(s:Simulation,attacker:number,target:number,cause='crush'):ImpactEvent{return{id:900,tick:s.tick,episode:'test',source:s.bots[attacker].compiled.config.identity.name,attacker,target,module:'battery',energy:20000,impulse:1,closing:1,point:add(s.bots[target].chassis.translation(),rotate(batteryPosition(s.bots[target].compiled.config),s.bots[target].chassis.rotation())),rotorBefore:[0,0],rotorAfter:[0,0],allocations:[],cause};}
await test('All eleven robots and builder configurations use 1200 chassis HP',()=>ROSTER.map((r,i)=>{const c=compile(preset(i));assert.deepEqual(c.errors,[]);assert.equal(c.modules.chassis.hp,1200);assert.equal(c.modules.chassis.max,1200);return{bot:r.name,hp:c.modules.chassis.max,massKg:c.mass};}));
await test('Quantum has a 50 percent wider cast head and a smooth concave scoop',()=>{
 const c=preset(10);assert.equal(c.weapon.width,.36);const head=quantumHead(c),scoop=quantumScoop(c);let triangles=0;
 head.traverse((o:any)=>{if(o.geometry){const a=o.geometry.getAttribute('position');assert(Array.from(a.array).every(Number.isFinite));triangles+=(o.geometry.index?.count??a.count)/3;}});
 assert(head.getObjectByName('quantum-crown-openings'));assert(head.getObjectByName('quantum-sculpted-brow'));assert(scoop.geometry.getAttribute('position').count>900);assert(triangles<25000);
 return{headWidthM:c.weapon.width,headTriangles:triangles,scoopVertices:scoop.geometry.getAttribute('position').count};
});
await test('HyperShock has two separate cutters with 15 mm upright and inverted clearance',()=>{
 const c=preset(4),r=compile(c);assert(isSpinner(c.weapon));const centres=[...new Set(r.parts.filter(p=>/^hyper_disc_(left|right)$/.test(p.id)).map(p=>p.position.x))];assert.equal(centres.length,2);assert(centres[1]-centres[0]>.1);
 const axle=bodyOrigin(c,'wheel_-1_0').y;const upright=c.chassis.height/2+c.chassis.clearance+c.weapon.mount.y-c.weapon.radius,inverted=axle+c.drive.radius-c.weapon.mount.y-c.weapon.radius;
 assert(upright>=.0149&&inverted>=.0149);assert.equal(r.parts.filter(p=>p.tooth!==undefined).length,4);return{bladeCentresM:centres,uprightClearanceM:upright,invertedClearanceM:inverted};
});
await test('HyperShock drives both ways inverted with spinning blades clear of the floor',()=>{
 const rows=[];
 for(const inverted of[false,true])for(const direction of[-1,1]){
  const c=preset(4),s=new Simulation([c,preset(0)],{practice:true,hazards:false,ai:[false,false],autoUnstick:true}),b=s.bots[0];try{
   pose(s,0,v(0,.5,0),axisQ(v(0,0,1),inverted?Math.PI:0));pose(s,1,v(-5,.3,-5));
   for(let t=0;t<360;t++)s.step();b.weaponOn=true;let floorHits=0,minBladeY=Infinity;
   for(let t=0;t<18*RULES.hz;t++){
    s.step();if(t%16===0)for(const p of b.compiled.parts.filter(p=>p.body==='rotor')){
     const col=b.colliders.get(p.id)!;s.world.contactPairsWith(col,other=>{const body=other.parent();if(body&&s.bodyIds.get(body.handle)==='floor')s.world.contactPair(col,other,m=>{if(m.numSolverContacts()>0)floorHits++;});});
    }
    minBladeY=Math.min(minBladeY,b.rotor!.translation().y-(isSpinner(c.weapon)?c.weapon.radius:0));
   }
   const rpm=b.rpm,start={...b.chassis.translation()},forward=s.forward(b);let speed=0;
   for(let t=0;t<RULES.hz;t++){s.step([{...neutral(),left:direction*.65,right:direction*.65},neutral()]);speed=Math.max(speed,length(b.chassis.linvel()));minBladeY=Math.min(minBladeY,b.rotor!.translation().y-(isSpinner(c.weapon)?c.weapon.radius:0));}
   const distance=length(sub(b.chassis.translation(),start));assert(dot(sub(b.chassis.translation(),start),forward)*direction>.35);assert.equal(b.spinDirection,inverted?-c.weapon.direction:c.weapon.direction);assert.equal(s.fault,undefined);assert.equal(b.rollStart,-1);assert.equal(b.lastSelfRight,-10000);assert.equal(floorHits,0);assert(minBladeY>.002);assert(rpm>4000);assert(distance>.35);assert(speed>1);assert(inverted?s.axis(b,v(0,1,0)).y<-.9:s.axis(b,v(0,1,0)).y>.9);
   rows.push({inverted,direction,rpm,distanceM:distance,peakSpeedKmh:speed*3.6,minBladeY,floorHits});
  }finally{s.dispose();}
 }return rows;
});
await test('Only a Quantum battery strike ignites at 70 percent damage',()=>{
 const s=new Simulation([preset(10),preset(1)],{practice:true,hazards:false,ai:[false,false],autoUnstick:false});try{
  const b=s.bots[1],res=BATTERY_CRUSH_RESISTANCE;
  s.damage(1,'battery',b.modules.battery.max*.69*res,impact(s,0,1));assert(!b.batteryFire);s.damage(1,'battery',b.modules.battery.max*.02*res,impact(s,0,1));assert(b.batteryFire);assert.equal(s.batteryFireSeconds(b),8);assert.equal(b.modules.chassis.hp,1200);assert.equal(s.bots[0].modules.weapon.hp,s.bots[0].modules.weapon.max);
  const first=b.batteryFire;s.damage(1,'battery',res,impact(s,0,1));assert.equal(b.batteryFire,first);
  const noQuantum=new Simulation([preset(4),preset(1)],{practice:true,hazards:false});try{noQuantum.damage(1,'battery',1e6,impact(noQuantum,0,1,'weapon'));assert(!noQuantum.bots[1].batteryFire);}finally{noQuantum.dispose();}
  return{thresholdPercent:70,seconds:8};
 }finally{s.dispose();}
});
await test('A centred crush penetrates top armour into the battery before destroying the chassis',()=>{
 const s=new Simulation([preset(10),preset(1)],{practice:true,hazards:false});try{
  const b=s.bots[1],e=impact(s,0,1),plate=b.modules.armour_top;e.module='armour_top';e.point.y+=.11;e.penetrationDirection=rotate(v(0,-1,0),b.chassis.rotation());
  s.damage(1,'armour_top',QUANTUM_HYDRAULICS.frontForce*b.compiled.config.armour.find(a=>a.mount==='top')!.thickness+250*BATTERY_CRUSH_RESISTANCE,e);
  assert.equal(b.modules.chassis.hp,1200);assert(b.batteryFire);assert(e.allocations.some(a=>a.module==='battery'&&a.hp>240));assert(!e.allocations.some(a=>a.bot===0));return{chassisHP:b.modules.chassis.hp,batteryHP:b.modules.battery.hp,allocations:e.allocations};
 }finally{s.dispose();}
});
await test('Fire lasts eight simulation seconds, damages its owner, and stops at match end',()=>{
 const s=new Simulation([preset(10),preset(1)],{practice:true,hazards:false,ai:[false,false],autoUnstick:false});try{
  pose(s,0,v(-4,.2,-4));pose(s,1,v(4,.2,4));for(let t=0;t<240;t++)s.step();const b=s.bots[1];s.damage(1,'battery',250*BATTERY_CRUSH_RESISTANCE,impact(s,0,1));const start=b.modules.chassis.hp;b.weaponOn=true;
  for(let t=0;t<8*RULES.hz;t++)s.step();assert.equal(s.fault,undefined);assert.equal(s.batteryFireSeconds(b),0);assert(Math.abs(start-b.modules.chassis.hp-240)<.001);assert(b.weaponOn&&b.rpm>500);assert(!s.capture().effects.some(e=>e.id===b.batteryFire!.event.id));assert.equal(s.capture().fires?.[1],0);assert.equal(s.highlights.robots[0].hardestHit,0);
  const hp=b.modules.chassis.hp;for(let t=0;t<120;t++)s.step();assert.equal(b.modules.chassis.hp,hp);s.finish('Judges’ decision');const tick=s.tick;s.step();assert.equal(s.tick,tick);return{burnDamageHP:start-hp,weaponRPM:b.rpm};
 }finally{s.dispose();}
});
await test('Both result cards show matching dealt and received hit maxima with clear colour and underlines',()=>{
 const h=new MatchHighlights();for(const e of[{attacker:0,target:1,energy:15500,cause:'weapon'},{attacker:1,target:0,energy:4300,cause:'ram'},{attacker:0,target:1,energy:999999,cause:'battery fire'}])h.hit(e as ImpactEvent);
 assert.deepEqual(h.robots.map(b=>[b.hardestHit,b.hardestReceived]),[[15500,4300],[4300,15500]]);for(let i=0;i<900;i++)h.hit({attacker:0,target:1,energy:1,cause:'weapon'}as ImpactEvent);assert.equal(h.robots[1].hardestReceived,15500);
 const dom=new JSDOM(podium([preset(10),preset(4)],1,[{hp:730,max:1200},{hp:1010,max:1200}],h.robots)),d=dom.window.document;
 assert.equal(d.querySelectorAll('.result-hit-dealt').length,2);assert.equal(d.querySelectorAll('.result-hit-received').length,2);assert(d.querySelector('[data-highlights-robot="0"] .result-hit-received dd')?.textContent?.includes('4.30'));assert(d.querySelector('[data-highlights-robot="1"] .result-hit-received dd')?.textContent?.includes('15.50'));assert.equal(d.querySelector('.podium-winner .result-hp')?.getAttribute('data-robot'),'1');
 const css=readFileSync('src/style.css','utf8');assert(css.includes('color:#7ce9a5;text-decoration:underline'));assert(css.includes('color:#ff9298;text-decoration:underline'));return h.robots;
});
await test('Fire visuals use a fixed pool and reproduce the same replay time',()=>{
 const fire=new BatteryFireVisual(),emitters=[{position:v(1,.2,2),active:true},{position:v(-1,.2,-2),active:false}];fire.update(emitters,2);const first=Array.from(fire.flamePositions);fire.update(emitters,5);fire.update(emitters,2);assert.deepEqual(Array.from(fire.flamePositions),first);assert.equal(fire.flamePositions.length,288);assert.equal(fire.smokePositions.length,144);assert(Array.from(fire.flamePositions).every(Number.isFinite));fire.update([],8);assert.equal(fire.lights[0].intensity,0);return{flames:96,smoke:48,deterministic:true};
});

await test('Inverted HyperShock POV remains above its chassis and points forward',()=>{
 const s=new Simulation([preset(4),preset(0)],{practice:true,hazards:false}),camera=new THREE.PerspectiveCamera(),render=Object.create(ArenaRenderer.prototype);render.replay=false;render.bodyGroups=new Map();
 try{const rows=[];for(const inverted of[false,true]){pose(s,0,v(0,.3,0),axisQ(v(0,0,1),inverted?Math.PI:0));render.positionPOVCamera(camera,s);const direction=camera.getWorldDirection(new THREE.Vector3());assert(camera.position.y>s.bots[0].rotor!.translation().y+.155+.05);assert(camera.up.y>.99);assert(direction.z<-.9);rows.push({inverted,eyeHeightM:camera.position.y});}return rows;}finally{s.dispose();}
});
await test('Opponent-only fire audio resets and mutes safely on a new match',()=>{
 const audio=new GameAudio();let calls=0;audio.context={currentTime:2}as AudioContext;audio.fireLoops[1]={gain:{gain:{setTargetAtTime(value:number){assert.equal(value,0);calls++;}}}}as any;audio.resetEngines();audio.mute();assert.equal(calls,2);return{opponentOnlyFireMuted:true};
});
