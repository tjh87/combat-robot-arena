import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {Tournament,Simulation,initializePhysics,neutral} from '../src/sim';
import {preset,RULES,v,axisQ} from '../src/model';
import {offlineCup,cupRoundNames,cupIntro,cupChampion,cupRecords,renderCupBracket,compactCup} from '../src/tournament-view';

await initializePhysics();
const dom=new JSDOM('<div id="bracket"></div>');
Object.assign(globalThis,{window:dom.window,document:dom.window.document,getComputedStyle:dom.window.getComputedStyle,requestAnimationFrame:()=>0,cancelAnimationFrame:()=>{},ResizeObserver:class{observe(){}disconnect(){}}});
for(const opponents of [1,3,7,10]){
 const cup=new Tournament(preset(0),false,74121,'hard',opponents);
 try{
  assert.equal(cup.entries.length,opponents+1);
  assert.equal(new Set(cup.entries.map(entry=>entry.config.chassis.profile)).size,opponents+1);
  assert.equal(cup.totalRounds,Math.log2(cup.bracketSize));
  if(opponents===1)assert(compactCup(offlineCup(cup)).includes('<h3>Duel</h3>'));
  const host=dom.window.document.querySelector<HTMLElement>('#bracket')!;
  renderCupBracket(host,offlineCup(cup),true);
  assert.deepEqual([...host.querySelectorAll('.cup-stage h3')].map(h=>h.textContent),cupRoundNames(opponents+1));
  assert.equal(host.querySelectorAll('.cup-match').length,cup.bracketSize-1);
  assert.equal(host.querySelector('.cup-crown')?.getAttribute('data-r'),String(cup.totalRounds));
  assert(cupIntro(preset(0),opponents+1).includes('<b>'+cup.totalRounds+'</b> bracket stage'));
  let playerFights=0;
  for(let round=0;round<cup.totalRounds;round++){
   const playerMatch=cup.playerMatch;
   if(playerMatch){
    assert(playerMatch.a.player||playerMatch.b?.player);
    const fight=new Simulation(cup.playerConfigs(),{hazards:false,ai:[false,false],recordVisuals:false,condition:cup.condition,allowDamaged:!!cup.condition});
    try{
     fight.bots[0].modules.chassis.hp-=50;
     fight.finish('Judges’ decision',0);
     cup.recordPlayer(fight.result!,fight.bots[0].modules);
    }finally{fight.dispose();}
    playerFights++;
   }else{
    assert.equal(opponents,10,'Only the eleven-entrant bracket seeds an opening bye.');
    assert(cup.matches[cup.round].some(match=>match.a.player&&match.reason==='Bye'));
   }
   if(round<cup.finalRound){
    assert.equal(cup.champion,undefined);
    cup.quickResolveComputerMatches();
    if(playerMatch){const condition=cup.condition!.chassis;cup.commitRepair([]);assert.equal(cup.condition!.chassis,condition);}
    cup.advance();
   }
  }
  assert(cup.champion?.player,'Winning the variable-size final immediately crowns the player');
  assert.equal(cup.condition?.chassis,1200-50*playerFights);
  assert.equal(cup.matches.reduce((n,round)=>n+round.length,0),cup.bracketSize-1);
  assert.equal(cupRecords(offlineCup(cup)).get('e0')?.wins,playerFights);
  assert(cupChampion(offlineCup(cup),true).includes('Overall champion'));
 }finally{cup.dispose();}
 const loss=new Tournament(preset(0),false,74121,'easy',opponents);
 if(!loss.playerMatch){loss.quickResolveComputerMatches();loss.advance();}
 const fight=new Simulation(loss.playerConfigs(),{hazards:false,ai:[false,false],recordVisuals:false});
 try{fight.finish('Judges’ decision',1);loss.recordPlayer(fight.result!,fight.bots[0].modules);assert(loss.eliminated);assert.equal(!!loss.champion,opponents===1);}finally{fight.dispose();loss.dispose();}
}
assert.throws(()=>new Tournament(preset(0),false,1,'medium',2),/Choose 1, 3, 7, or 10/);
console.log('PASS 2/4/8/11-entrant brackets, seeded byes, presentation, repairs, damage carryover, losses and automatic champions');

function scenario(check:(sim:Simulation)=>void){
 const sim=new Simulation([preset(0),preset(1)],{hazards:false,ai:[false,false],autoUnstick:false,recordVisuals:false});
 try{check(sim);}finally{sim.dispose();}
}
const rules=(sim:Simulation)=>{(sim as any).rules();};
scenario(sim=>{
 const bot=sim.bots[0],p={...bot.chassis.translation()};bot.grounded=true;bot.command={...neutral(),left:1,right:1};bot.count=bot.pending=9.9*RULES.hz;
 sim.tick=12*RULES.hz;
 bot.history=Array.from({length:10},(_,i)=>({tick:sim.tick-(10-i)*RULES.hz/10,p:{...p,x:p.x-.2},ground:true,powered:true}));
 rules(sim);assert.equal(bot.count,0);assert.equal(sim.result,undefined);
});
scenario(sim=>{
 const bot=sim.bots[0],p={...bot.chassis.translation()};bot.grounded=true;bot.command={...neutral(),left:1,right:1};bot.count=bot.pending=9.9*RULES.hz;
 sim.tick=12*RULES.hz;
 bot.history=Array.from({length:10},(_,i)=>({tick:sim.tick-(10-i)*RULES.hz/10,p:{...p,x:p.x+(i===5?.15:0)},ground:true,powered:true}));
 rules(sim);assert.equal(bot.count,0);assert.equal(sim.result,undefined);
});
scenario(sim=>{
 const bot=sim.bots[0],p={...bot.chassis.translation()};bot.grounded=true;bot.command={...neutral(),left:1,right:-1};bot.count=bot.pending=9.9*RULES.hz;
 sim.tick=12*RULES.hz;
 bot.history=Array.from({length:10},(_,i)=>({tick:sim.tick-(10-i)*RULES.hz/10,p,ground:true,powered:true,heading:v(-sim.forward(bot).z,0,sim.forward(bot).x)}));
 rules(sim);assert.equal(bot.count,0);assert.equal(sim.result,undefined);
});
scenario(sim=>{
 const bot=sim.bots[0];bot.grounded=true;bot.command=neutral();bot.count=bot.pending=9.9*RULES.hz;sim.tick=12*RULES.hz;
 rules(sim);assert.equal(bot.count,0);assert.equal(sim.result,undefined);
});
scenario(sim=>{
 const bot=sim.bots[0],p={...bot.chassis.translation()};bot.grounded=true;bot.command={...neutral(),left:1,right:1};bot.count=bot.pending=9.9*RULES.hz;sim.tick=12*RULES.hz;
 bot.history=Array.from({length:10},(_,i)=>({tick:sim.tick-(10-i)*RULES.hz/10,p,ground:true,powered:true,heading:sim.forward(bot)}));
 rules(sim);assert.equal(sim.result?.reason,'Count-out');assert.equal(sim.result?.winner,1);assert(bot.modules.chassis.hp>0,'Real immobilization can retain chassis health');
});
scenario(sim=>{
 sim.bots[0].energy=0;sim.bots[1].energy=0;
 for(let tick=0;tick<10*RULES.hz;tick++)sim.step();
 assert.equal(sim.result?.reason,'Double stoppage');assert.equal(sim.result?.tick,10*RULES.hz);
});
scenario(sim=>{
 const bot=sim.bots[0];bot.grounded=false;bot.chassis.setRotation(axisQ(v(1,0,0),Math.PI),true);bot.command=neutral();bot.count=bot.pending=9.9*RULES.hz;sim.tick=12*RULES.hz;
 rules(sim);assert.equal(sim.result?.reason,'Count-out');
});
console.log('PASS last-second recovery, looped travel, controlled pivoting and healthy idle reset; genuine stalls/inversion/disabled countouts preserved');
dom.window.close();
