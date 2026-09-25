import assert from 'node:assert/strict';
import * as THREE from 'three';
import {trackMesh,animateTrack} from '../src/track-visual';
import {writeFileSync} from 'node:fs';
import {Simulation,initializePhysics,neutral,type ImpactEvent} from '../src/sim';
import {HitReadouts} from '../src/hit-readouts';
import {preset,compile,fitTraction,parseConfig,ROSTER,RULES,v,add,mul,dot,horizontal,bodyOrigin,rotate,identity,weaponAxis,isSpinner} from '../src/model';
const rows:any[]=[];
async function test(name:string,fn:()=>unknown){if(process.env.CASE&&!name.includes(process.env.CASE))return;try{rows.push({name,status:'passed',detail:await fn()});console.log('PASS',name,JSON.stringify(rows.at(-1).detail));}catch(e){rows.push({name,status:'failed',error:String(e)});console.log('FAIL',name,String(e));process.exitCode=1;}writeFileSync('docs/repair-update-results.json',JSON.stringify(rows,null,2));}
await initializePhysics();
const make=(i=10,ai=false)=>new Simulation([preset(i),preset(0)],{practice:true,hazards:false,ai:[ai,false],autoUnstick:true});
function pose(s:Simulation,id:number,p:ReturnType<typeof v>){const b=s.bots[id];for(const[k,body]of b.bodies){body.setRotation(identity,true);body.setTranslation(add(p,bodyOrigin(b.compiled.config,k)),true);body.setLinvel(v(),true);body.setAngvel(v(),true);}s.world.propagateModifiedBodyPositionsToColliders();}
await test('Small damage is counted once and long episodes get unique bubbles',()=>{
 const h=new HitReadouts(),e={id:1,cause:'weapon',point:v(),allocations:[{bot:1,hp:0}]} as ImpactEvent;let shown=0;const seen=new Map<string,number>();
 for(let tick=0;tick<200;tick++){e.allocations[0].hp+=.001;for(const hit of h.update([e],tick)){shown+=hit.hp-(seen.get(hit.key)??0);seen.set(hit.key,hit.hp);}assert.equal(new Set(h.hits.map(x=>x.key)).size,h.hits.length);}
 assert(Math.abs(shown-.2)<1e-9);h.update([e],201);assert(Math.abs(shown-.2)<1e-9);return{increments:200,actualHP:shown,uniqueBubbles:seen.size};
});
await test('Crushing emits one accumulated release bubble without counting HP twice',()=>{
 const h=new HitReadouts(),e={id:2,cause:'crush',point:v(),allocations:[{bot:1,hp:42},{bot:1,hp:18}]} as ImpactEvent;
 assert.equal(h.update([e],0).length,0);e.allocations[1].hp=58;assert.equal(h.update([e],120).length,0);e.releasedTick=240;assert.equal(h.update([e],240)[0].hp,100);assert.equal(h.update([e],241)[0].hp,100);const next={...e,id:3,cause:'weapon',allocations:[{bot:1,hp:7}]} as ImpactEvent;assert.equal(h.update([e,next],242).length,2);assert.equal(h.hits[0].hp,100);assert.equal(h.hits[1].hp,7);assert.equal(h.update([e],600).length,0);return{damageHP:100,bubbles:1};
});
await test('Quantum opens sooner and retreats no more than two robot lengths',()=>{
 const s=make(),b=s.bots[0];try{
  for(let t=0;t<240;t++)s.step();const start=s.tick;b.weaponOn=true;b.crushStart=s.tick;b.ai.waypoint=v();b.unstick.active=true;let released=-1,opened=-1,retreat=0,last={...b.chassis.translation()},releaseTick=0;
  for(let t=0;t<2000;t++){
   s.step();if(released<0&&b.gripRelease){released=(s.tick-start)/240;releaseTick=s.tick;last={...b.chassis.translation()};s.options.ai[0]=true;assert(!b.ai.waypoint);assert(!b.unstick.active);}
   if(released>=0){retreat+=horizontal(last,b.chassis.translation());last={...b.chassis.translation()};if(opened<0&&Math.abs(b.crushAngle)<.05)opened=(s.tick-releaseTick)/240;if(!b.gripRelease)break;}
  }
  assert(released>0&&released<2.15);assert(opened>=0&&opened<1);assert(retreat<=2*b.compiled.envelope.z+.05,JSON.stringify({retreat,bound:2*b.compiled.envelope.z}));assert(!s.fault);return{releaseSeconds:released,openingSeconds:opened,retreatM:retreat,limitM:2*b.compiled.envelope.z};
 }finally{s.dispose();}
});
await test('Quantum manual release preserves the completed crushing event',()=>{
 const s=make(),b=s.bots[0];try{for(let t=0;t<240;t++)s.step();b.weaponOn=true;b.crushStart=s.tick;b.crushEvent={id:92,cause:'crush',point:v(),allocations:[{bot:1,hp:73}]} as ImpactEvent;s.events.push(b.crushEvent);s.step([{...neutral(),weapon:true},neutral()]);assert.equal(b.crushEvent?.releasedTick,s.tick-1);assert(!b.weaponOn);return{releasedHP:b.crushEvent!.allocations[0].hp};}finally{s.dispose();}
});
await test('Gigabyte keeps heading while spinning and brakes after steering',()=>{
 const rows=[];for(const spin of[-1,1]){const s=make(5),b=s.bots[0];try{
  pose(s,0,v(0,.10,3));pose(s,1,v(5,.21,-4));for(let i=0;i<240;i++)s.step();assert(isSpinner(b.compiled.config.weapon));b.spinDirection=spin as 1|-1;b.weaponOn=true;b.rotor!.setAngvel(mul(weaponAxis(b.compiled.config.weapon),spin*140),true);
  let straightYaw=0,turnYaw=0,forward=0,reverse=0;
  for(let i=0;i<1200;i++){const cmd=i<300?[.65,.65]:i<540?[.6,-.6]:i<840?[-.65,-.65]:[0,0];s.step([{...neutral(),left:cmd[0],right:cmd[1]},neutral()]);if(i>120&&i<280)straightYaw=Math.max(straightYaw,Math.abs(b.chassis.angvel().y));if(i>420&&i<530)turnYaw+=b.chassis.angvel().y/110;const speed=dot(b.chassis.linvel(),s.forward(b));forward=Math.max(forward,speed);reverse=Math.max(reverse,-speed);}
  assert(straightYaw<.8,JSON.stringify({straightYaw}));assert(turnYaw<-.4,JSON.stringify({turnYaw}));assert(Math.abs(b.chassis.angvel().y)<.5);assert(forward>1&&reverse>1);assert(s.axis(b,v(0,1,0)).y>.9);assert(!s.fault);rows.push({spin,straightYaw,turnYaw,forward,reverse,finalYaw:b.chassis.angvel().y});
 }finally{s.dispose();}}return rows;
});
await test('Treads have the highest grip, legal fitting and physical roller travel',()=>{
 const legal:string[]=[];for(let i=0;i<ROSTER.length;i++){const c=fitTraction(preset(i),'tracks'),compiled=compile(c,true);assert.equal(parseConfig(c).drive.traction,'tracks');if(!compiled.errors.length)legal.push(c.identity.name);assert.equal(compiled.parts.filter(p=>p.id.startsWith('track_belt_')).reduce((a,p)=>a+p.mass,0),6.4);}
 assert(legal.length>=9);const c=fitTraction(preset(10),'tracks'),s=new Simulation([c,preset(0)],{practice:true,hazards:false,ai:[false,false],autoUnstick:false}),b=s.bots[0];try{
  for(let i=0;i<240;i++)s.step();const origin={...b.chassis.translation()};for(let i=0;i<480;i++)s.step([{...neutral(),left:.6,right:.6},neutral()]);assert(horizontal(origin,b.chassis.translation())>1);assert(Math.abs(b.trackPhase![0])>1);assert(Math.abs(b.colliders.get('wheel_-1_0')!.friction()-2.6)<1e-5);assert(!s.fault);return{legalStockConversions:legal,grip:2.6,travelM:horizontal(origin,b.chassis.translation()),beltTravelM:b.trackPhase};
 }finally{s.dispose();}
});
await test('Ring-out height and distance follow the losing flight after the result',()=>{
 const s=new Simulation([preset(0),preset(10)],{practice:false,hazards:false,ai:[false,false],autoUnstick:false});try{pose(s,0,v(0,.2,0));(s as any).openTravel(0,{id:81},'Post-impact travel');pose(s,0,v(7.9,4,0));for(const body of s.bots[0].bodies.values())body.setLinvel(v(2,1,0),true);s.step();assert.equal(s.result?.reason,'Out of arena');const initial=s.result!.ringOut!;assert(initial.height>3.7&&initial.distance>7.8);const before=initial.distance;for(let i=0;i<60;i++)s.stepAfterFinish();assert(initial.distance>before);s.finalizeFinish();return{bot:initial.bot,heightM:initial.height,distanceM:initial.distance};}finally{s.dispose();}
});

await test('Track meshes stay finite and replay travel restores the same shoe positions',()=>{
 const c=fitTraction(preset(10),'tracks'),parts=compile(c).parts.filter(p=>p.id.startsWith('track_belt_')),meshes=parts.map(p=>trackMesh(p,c));
 for(const mesh of meshes){const shoes=mesh.getObjectByName('tread-shoes') as THREE.InstancedMesh,start=Array.from(shoes.instanceMatrix.array);animateTrack(mesh,.1);const moved=Array.from(shoes.instanceMatrix.array);assert.notDeepEqual(start,moved);assert(moved.every(Number.isFinite));animateTrack(mesh,0);assert.deepEqual(Array.from(shoes.instanceMatrix.array),start);mesh.geometry.computeBoundingBox();assert(mesh.geometry.boundingBox!.min.toArray().every(Number.isFinite));assert(mesh.geometry.boundingBox!.max.toArray().every(Number.isFinite));}
 assert.equal(meshes.length,2);for(const mesh of meshes)mesh.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose();for(const m of Array.isArray(o.material)?o.material:[o.material])m.dispose();}});return{belts:2,deterministicAnimation:true};
});
