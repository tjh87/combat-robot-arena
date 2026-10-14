import assert from 'node:assert/strict';
import * as THREE from 'three';
import {ArenaRenderer} from '../src/render';
import {ROSTER,preset,RULES,SLOTS,MATERIALS} from '../src/model';
import {Simulation,initializePhysics,neutral,type ImpactEvent} from '../src/sim';
import {arenaFilter,robotFilter,robotGroup,robotGroupMask} from '../src/collision-groups';
import {brawlArenaLabel,brawlDamageDealt,brawlHUDMarkup,brawlResultsMarkup} from '../src/brawl-view';
import {sampleBrawlOpponents} from '../src/brawl-opponents';
import {placeBrawlCallout,type BrawlRect} from '../src/brawl-overlay-layout';

const roster=Array.from({length:10},(_,i)=>`Opponent ${i}`),randomA=sampleBrawlOpponents(roster,4,()=>0),randomB=sampleBrawlOpponents(roster,4,()=>.9);
assert.equal(randomA.length,4);assert.equal(new Set(randomA).size,4,'Random sampling never repeats an opponent.');assert.notDeepEqual(randomA,randomB,'Fresh random values produce a different opponent draw.');assert.throws(()=>sampleBrawlOpponents(roster,11),RangeError);
const intersects=(a:BrawlRect,b:BrawlRect)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
const view={width:900,height:600},box={width:184,height:82},robots:BrawlRect[]=[{left:72,top:110,right:152,bottom:188},{left:264,top:210,right:352,bottom:290},{left:498,top:140,right:596,bottom:244},{left:732,top:290,right:820,bottom:382}],occupied:BrawlRect[]=[];
for(const [i,anchor] of [{x:112,y:150},{x:308,y:250},{x:548,y:192},{x:776,y:334}].entries()){const placed=placeBrawlCallout(anchor,view,box,robots,occupied,i);assert(placed.left>=8&&placed.top>=8&&placed.right<=view.width-8&&placed.bottom<=view.height-8);assert(robots.every(robot=>!intersects(placed,robot)),'Callout is outside every projected robot bounds.');assert(occupied.every(label=>!intersects(placed,label)),'Callouts do not overlap each other.');occupied.push(placed);}

const projection=Object.create(ArenaRenderer.prototype) as ArenaRenderer,camera=new THREE.PerspectiveCamera(42,1280/720,.05,100),body=new THREE.Group();camera.position.set(0,8,10);camera.lookAt(0,0,0);camera.updateMatrixWorld(true);body.position.set(0,.2,0);Object.assign(projection,{camera,width:1280,height:720,renderer:{domElement:{getBoundingClientRect:()=>({left:21,top:13,width:1280,height:720})}},bodyGroups:new Map([['b0:chassis',body]])});const projectionBot={id:0,chassis:{translation:()=>({x:0,y:.2,z:0}),rotation:()=>({x:0,y:0,z:0,w:1})},compiled:{envelope:{x:1.4,y:.6,z:1.2}}},screen=projection.robotWarningPosition({bots:[projectionBot]} as unknown as Simulation,0);assert(screen.visible&&screen.bounds&&screen.anchor);assert(screen.bounds.left>=21&&screen.bounds.top>=13&&screen.bounds.right<=1301&&screen.bounds.bottom<=733,'Projected robot bounds use the renderer canvas page origin.');assert(screen.anchor.x>=21&&screen.anchor.x<=1301&&screen.anchor.y>=13&&screen.anchor.y<=733);

assert.equal(brawlArenaLabel(2,true),'P3 · OUT');assert.equal(brawlArenaLabel(2,false),'◆ P3');
await initializePhysics();
assert.deepEqual([0,1,2,3,4].map(robotGroup),[2,4,8,32,64],'Brawl allocates distinct robot groups without reusing the hazard bit.');
assert.equal(robotGroupMask(5),110);
assert.equal(robotFilter(0,2),21,'P1 collision mask remains unchanged.');
assert.equal(robotFilter(1,2),19,'P2 collision mask remains unchanged.');
assert.equal(arenaFilter(2),31,'The existing two-player arena mask remains unchanged.');
assert(robotFilter(0,5)&robotGroup(4),'P1 collides with the fifth robot.');
assert(arenaFilter(5)&robotGroup(4),'The arena collides with the fifth robot.');

const configs=ROSTER.slice(0,5).map((_,i)=>preset(i));
assert.equal(new Set(configs.map(config=>config.identity.name)).size,5);
let sim=new Simulation(configs,{freeForAll:true,hazards:true,ai:[false,true,true,true,true],seed:9182});
try{
 assert.equal(sim.bots.length,5);
 assert.equal(sim.options.ai?.filter(Boolean).length,4);
 assert.equal(sim.highlights.robots.length,5);
 sim.bots[0].unstick={active:true,since:sim.tick,attempt:1};sim.command(0,{left:1,right:.7,weapon:false,selfRight:false});sim.step();assert.equal(sim.bots[0].command.left,1,'Player steering must override automatic recovery in Brawl.');assert.equal(sim.bots[0].command.right,.7);assert.equal(sim.bots[0].unstick.active,false);
 const pooledPre=(sim as any).pre as Map<number,object>,pooledEntries=[...pooledPre.entries()];sim.step();assert.equal(pooledPre.size,pooledEntries.length,'Pre-step state map remains bounded.');for(const [handle,state] of pooledEntries)assert.equal(pooledPre.get(handle),state,'Pre-step snapshots are reused instead of allocated each 240 Hz tick.');
 for(let i=0;i<360;i++)sim.step(sim.bots.map(()=>neutral()));
 assert.equal(sim.fault,undefined,'Five-robot physics and AI run without a simulation fault.');
 assert.equal((brawlHUDMarkup(sim).match(/data-brawl-card=/g)??[]).length,4,'The live roster includes every AI opponent.');
 const event:ImpactEvent={id:900,tick:sim.tick,episode:'brawl-test',source:'Test attack',attacker:0,target:1,module:'chassis',energy:100,impulse:4,closing:2,point:{x:0,y:0,z:0},rotorBefore:[],rotorAfter:[],allocations:[],cause:'weapon'};
 sim.damage(1,'chassis',37*MATERIALS[sim.bots[1].modules.chassis.material].resistance,event);
 sim.events.push(event);
 sim.highlights.hit({...event,attacker:4,target:3});
 assert.equal(sim.highlights.robots[4].hardestHit,100);
 assert.equal(sim.highlights.robots[3].hardestReceived,100);
 assert.equal(brawlDamageDealt(sim,0),37,'Damage totals count HP actually allocated to other robots.');
 sim.events.length=0;
 assert.equal(brawlDamageDealt(sim,0),37,'Whole-match damage survives trimmed event logs.');
 sim.bots[1].modules.chassis.hp=0;assert.match(brawlHUDMarkup(sim),/data-zero-hp="true"/);assert.match(brawlHUDMarkup(sim),/0 HP · KNOCKED OUT/);
 sim.finish('Judges’ decision');
 assert.equal(sim.result?.scores.length,5,'Every entrant receives a pairwise 5/3/3 judging total.');
 assert(sim.result?.scores.every(score=>score.length===3));
 assert.match(brawlResultsMarkup(sim),/DAMAGE DEALT/);assert.match(brawlResultsMarkup(sim),/0 HP · KNOCKED OUT/);
 assert.match(brawlResultsMarkup(sim),/37 <small>HP<\/small>/);
 assert.equal((brawlResultsMarkup(sim).match(/class="brawl-result-row/g)??[]).length,5,'The standings contain all five robots.');
}finally{sim.dispose();}

sim=new Simulation(configs,{freeForAll:true,hazards:false,ai:[false,true,true,true,true],seed:9183});
try{
 for(const bot of sim.bots.slice(1))bot.count=RULES.hz*10;
 sim.step(sim.bots.map(()=>neutral()));
 assert.equal(sim.result?.reason,'Last robot standing');
 assert.equal(sim.result?.winner,0);
 assert(sim.bots.slice(1).every(bot=>bot.eliminatedReason==='Count-out'));
 assert.equal(sim.manualRecoveryReady(sim.bots[1]),false,'A genuine count-out must not be resurrected by Unstick.');
}finally{sim.dispose();}

for(const opponentCount of [1,2,3,4]){
 const battle=new Simulation(configs.slice(0,opponentCount+1),{freeForAll:true,hazards:false,ai:configs.slice(0,opponentCount+1).map((_,i)=>i>0),seed:9200+opponentCount});
 try{
  assert.equal(battle.bots.length,opponentCount+1);
  for(const bot of battle.bots.slice(1))bot.count=RULES.hz*10;
  battle.step(battle.bots.map(()=>neutral()));
  assert.equal(battle.result?.reason,'Last robot standing');
  assert.equal(battle.result?.winner,0);
  assert.equal(battle.result?.scores.length,opponentCount+1);
 }finally{battle.dispose();}
}

const renderer=Object.create(ArenaRenderer.prototype) as ArenaRenderer;
const mesh=new THREE.Mesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshStandardMaterial());
mesh.userData.module='armour_top';const group=new THREE.Group();group.add(mesh);
Object.assign(renderer,{replayGroups:new Map([['b4:chassis',group]]),reduced:false});
const health=Array.from({length:5},()=>SLOTS.map(()=>1));health[4][SLOTS.indexOf('armour_top')]=0;
renderer.replayFrame({tick:0,transforms:[{id:'b4:chassis',p:{x:0,y:0,z:0},q:{x:0,y:0,z:0,w:1}}],health,effects:[]});
assert.equal(mesh.visible,false,'Replay applies armour loss to the fifth robot.');
mesh.geometry.dispose();(mesh.material as THREE.Material).dispose();

console.log('PASS Brawl 1–4 AI field support, 5-robot collision masks, live opponent HUD, FFA damage/5-3-3 standings, and usual count-out elimination.');
