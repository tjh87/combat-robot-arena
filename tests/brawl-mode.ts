import assert from 'node:assert/strict';
import * as THREE from 'three';
import {ArenaRenderer} from '../src/render';
import {ROSTER,preset,RULES,SLOTS,MATERIALS} from '../src/model';
import {Simulation,initializePhysics,neutral,type ImpactEvent} from '../src/sim';
import {arenaFilter,robotFilter,robotGroup,robotGroupMask} from '../src/collision-groups';
import {brawlDamageDealt,brawlHUDMarkup,brawlResultsMarkup} from '../src/brawl-view';

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
 sim.finish('Judges’ decision');
 assert.equal(sim.result?.scores.length,5,'Every entrant receives a pairwise 5/3/3 judging total.');
 assert(sim.result?.scores.every(score=>score.length===3));
 assert.match(brawlResultsMarkup(sim),/DAMAGE DEALT/);
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
