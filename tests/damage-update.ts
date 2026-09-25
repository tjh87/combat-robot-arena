import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import * as THREE from 'three';
import {preset,compile,MATERIALS,RULES,isSpinner,v,add,type Slot} from '../src/model';
import {Simulation,initializePhysics,neutral,type ImpactEvent} from '../src/sim';
import {damageStatus} from '../src/combat-damage';
import {ArenaRenderer} from '../src/render';
import {readyImpactSounds,GameAudio} from '../src/audio';
const results:any[]=[];
async function test(name:string,run:()=>unknown){try{const detail=await run();results.push({name,status:'passed',detail});console.log('PASS',name,JSON.stringify(detail));}catch(error){process.exitCode=1;results.push({name,status:'failed',error:String(error)});console.log('FAIL',name,String(error));}writeFileSync('docs/damage-update-results.json',JSON.stringify(results,null,2)+'\n');}
await initializePhysics();

await test('Weapon output stays full through 50% damage, then derates without stopping',()=>{
 const rows=[];
 for(const [weaponDamage,batteryDamage] of [[0,0],[.5,0],[0,.5],[.75,0],[1,1]]){
  const c=preset(0),s=new Simulation([c,preset(0)],{practice:true,hazards:false,ai:[false,false],autoUnstick:false}),b=s.bots[0];
  try{
   s.world.gravity=v();for(const bot of s.bots){for(const body of bot.bodies.values())body.setTranslation(add(body.translation(),v(0,2,0)),true);bot.chassis.setEnabledTranslations(false,false,false,true);bot.chassis.setEnabledRotations(false,false,false,true);}s.world.propagateModifiedBodyPositionsToColliders();
   s.damage(0,'weapon',b.modules.weapon.max*weaponDamage*MATERIALS[b.modules.weapon.material].resistance);s.damage(0,'battery',b.modules.battery.max*batteryDamage*MATERIALS[b.modules.battery.material].resistance);
   for(let t=0;t<30*RULES.hz;t++)s.step([{...neutral(),weapon:t===0},neutral()]);
   const output=damageStatus(b.modules);assert(b.weaponOn&&s.weaponPowered(b));assert(isSpinner(c.weapon));assert(Math.abs(b.rpm/(c.weapon.rpm*output.rpmScale)-1)<.12,JSON.stringify({weaponDamage,batteryDamage,rpm:b.rpm,output}));assert.equal(s.fault,undefined);
   rows.push({weaponDamage,batteryDamage,rpm:b.rpm,output:output.weaponOutput});
  }finally{s.dispose();}
 }
 assert(Math.abs(rows[0].rpm-rows[1].rpm)<1);assert(Math.abs(rows[0].rpm-rows[2].rpm)<1);assert(rows[1].rpm>rows[3].rpm&&rows[3].rpm>rows[4].rpm);return rows;
});

function contact(a:Slot,b:Slot,options:{bladeSpeed?:number,ramSpeed?:number,bodySpin?:number,swap?:boolean,vertical?:boolean}={}){
 const s=new Simulation([preset(0),preset(0)],{practice:true,hazards:false,ai:[false,false],autoUnstick:false});
 s.step();
 const ids=options.swap?[1,0]:[0,1],col=(id:number,module:Slot)=>[...s.bots[id].colliders.values()].find(c=>s.meta.get(c.handle)?.module===module)!;
 const ca=col(ids[0],a),cb=col(ids[1],b);assert(ca&&cb);const direction=ca.handle<cb.handle?1:-1,axis=options.vertical?v(0,1,0):v(1,0,0),ram=options.ramSpeed??0;
 for(const bot of s.bots)(s as any).pre.set(bot.chassis.handle,{...s.pre.get(bot.chassis.handle),lin:bot.id===ids[0]?v(ram,0,0):v()});
 (s as any).preVelocity=(body:any)=>body?.handle===ca.parent()!.handle?v((options.bladeSpeed??0)+ram+(options.bodySpin??0),options.vertical?20:0,0):body?.handle===s.bots[ids[0]].chassis.handle?v(ram,0,0):v();
 s.world.contactPairsWith=(c,cbk)=>{if(c===ca)cbk(cb);};
 s.world.contactPair=(_a,_b,cbk)=>cbk({normal:()=>v(axis.x*direction,axis.y*direction,0),numContacts:()=>1,numSolverContacts:()=>1,contactImpulse:()=>100,contactTangentImpulseX:()=>0,contactTangentImpulseY:()=>0,solverContactPoint:()=>v(0,1,0)} as any,false);
 try{(s as any).contacts(ids[0]===0?[5000,0]:[0,5000]);return{events:s.events,attacker:ids[0],target:ids[1]};}finally{s.dispose();}
}

await test('Side, rear, top and bottom hits receive more damage than blade clashes in either contact order',()=>{
 const rows=[];
 for(const swap of [false,true]){
  const clash=contact('weapon','weapon',{bladeSpeed:20,swap}),clashEnergy=clash.events[0].allocations.filter(a=>a.bot===clash.target).reduce((n,a)=>n+a.energy,0);assert(clashEnergy>0);
  for(const slot of ['armour_left','armour_right','armour_rear','armour_top','chassis'] as Slot[]){const hit=contact('weapon',slot,{bladeSpeed:20,swap}),event=hit.events[0];assert(event);assert.equal(event.attacker,hit.attacker);assert.equal(event.target,hit.target);assert.equal(event.cause,'weapon');const targetEnergy=event.allocations.filter(a=>a.bot===hit.target).reduce((n,a)=>n+a.energy,0);assert(targetEnergy>clashEnergy*2);assert(!event.allocations.some(a=>a.bot===hit.attacker),'Passive body contact damaged the attacking blade');rows.push({swap,slot,targetEnergy,clashEnergy});}
 }
 return rows;
});

await test('Passive sides and rear cause no damage; a translating ram does',()=>{
 const rows=[];for(const slot of ['armour_left','armour_right','armour_rear'] as Slot[]){
  for(const options of [{bodySpin:20},{ramSpeed:.5},{vertical:true}])assert.equal(contact(slot,'chassis',options).events.length,0);
  const ram=contact(slot,'chassis',{ramSpeed:4}),event=ram.events[0];assert.equal(event.cause,'ram');assert.equal(event.attacker,ram.attacker);assert(event.allocations.some(a=>a.bot===ram.target));assert(!event.allocations.some(a=>a.bot===ram.attacker));rows.push({slot,ramEnergy:event.energy});
 }return rows;
});

await test('Damage warning projection follows both robot positions and hides behind the POV camera',()=>{
 const renderer=Object.create(ArenaRenderer.prototype) as ArenaRenderer;renderer.bodyGroups=new Map();renderer.camera=new THREE.PerspectiveCamera(60,1.6,.1,100);renderer.camera.position.set(0,7,9);renderer.camera.lookAt(0,0,0);
 const s=new Simulation([preset(0),preset(1)],{practice:true,hazards:false});try{
  const a=renderer.robotWarningPosition(s,0),b=renderer.robotWarningPosition(s,1);assert(a.visible&&b.visible);assert.notEqual(a.x,b.x);renderer.camera.position.set(0,1,0);renderer.camera.lookAt(0,1,10);s.bots[0].chassis.setTranslation(v(0,0,-4),true);assert(!renderer.robotWarningPosition(s,0).visible);return{p1:a,p2:b,behindHidden:true};
 }finally{s.dispose();}
});

await test('One strike crossing multiple panels produces one sound; separate hits and landings remain distinct',()=>{
 const make=(id:number,tick:number,energy:number,cause='weapon')=>({id,tick,energy,cause,target:1,attacker:0,fallHeight:cause==='landing'?2:undefined}) as ImpactEvent;
 const events=[make(1,1,1000),make(2,4,9000),make(3,5,500),make(4,35,2000),make(5,36,2000,'landing'),make(6,38,3000,'landing')];
 const r=readyImpactSounds(events,80,0);assert.equal(r.events.length,3);assert.deepEqual(r.events.map(e=>e.energy),[9000,2000,5000]);assert.equal(events[0].energy,1000);assert.equal(readyImpactSounds(events,90,r.lastID).events.length,0);return{contacts:6,sounds:r.events.length,energies:r.events.map(e=>e.energy)};
});

await test('Real AI fights register blade hits and damage without simulation faults',()=>{
 const rows=[];for(const pair of [[0,1],[3,5],[9,10]]){
  const s=new Simulation([preset(pair[0]),preset(pair[1])],{hazards:false,ai:[true,true],autoUnstick:true,seed:62017});try{
   for(let t=0;t<35*RULES.hz&&!s.result&&!s.fault;t++)s.step();assert.equal(s.fault,undefined);const strikes=s.events.filter(e=>e.cause==='weapon'&&e.attacker!==null&&e.target!==null);assert(strikes.length>0,pair+' registered no blade hits');assert(strikes.some(e=>e.allocations.some(a=>a.bot===e.target&&a.hp>0)));rows.push({bots:pair.map(i=>preset(i).identity.name),seconds:s.tick/RULES.hz,strikes:strikes.length,result:s.result?.reason??'ongoing'});
  }finally{s.dispose();}
 }return rows;
});
