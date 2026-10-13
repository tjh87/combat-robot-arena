import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {Tournament,Simulation,initializePhysics,repairQuote} from '../src/sim';
import {preset,compile,copy,RULES} from '../src/model';
import {offlineCup,cupRecords,cupChampion,cupEscape,cupRoundNames,compactCup} from '../src/tournament-view';
import {recommendRepairs} from '../src/repair-view';

await initializePhysics();
const tournament=new Tournament(preset(0),false,76122);
tournament.entries[1].name=tournament.entries[0].name;
assert.equal(cupEscape('<b>"&'),'&lt;b&gt;&quot;&amp;');
for(let round=0;round<3;round++){
 const sim=new Simulation(tournament.playerConfigs(),{hazards:false,ai:[false,false],recordVisuals:false});
 try{sim.finish('Judges’ decision',0);tournament.recordPlayer(sim.result!,sim.bots[0].modules,[40,75]);}
 finally{sim.dispose();}
 tournament.quickResolveComputerMatches();tournament.advance();
}
const model=offlineCup(tournament),records=cupRecords(model);
assert.deepEqual(records.get('e0'),{wins:3,losses:0,damageDealt:225});
assert.deepEqual(records.get('e1'),{wins:0,losses:1,damageDealt:40});
assert.equal([...records.values()].reduce((n,r)=>n+r.wins,0),7);
assert.equal([...records.values()].reduce((n,r)=>n+r.losses,0),7);
assert.match(cupChampion(model,false),/Overall champion/);
assert.match(cupChampion(model,false),/DMG 225 HP/);
assert.match(cupChampion(model,false),/victory-confetti/);
assert(!/victory-confetti/.test(cupChampion(model,true)));
tournament.dispose();

const expanded=new Tournament(preset(0),false,76123,'medium',10);
let expandedEvidence:unknown;
try{
 assert.deepEqual(cupRoundNames(11),['Opening Round','Quarterfinals','Semifinals','Final']);
 for(const [index,match]of expanded.matches[0].entries())if(match.b){match.winner=match.a;match.reason='Fixture';match.damageDealt=[120+index,60+index];}
 const expandedModel=offlineCup(expanded),expandedRecords=cupRecords(expandedModel);expandedEvidence={stages:cupRoundNames(11),damage:[...expandedRecords]};
 assert.equal(expandedModel.bracketSize,16);
 assert.equal([...expandedRecords.values()].reduce((sum,record)=>sum+record.wins,0),3,'Opening byes are not W/L results.');
 assert.match(compactCup(expandedModel),/BYE · AUTO-ADVANCE/);
 expanded.advance();assert.equal(expanded.matches[1].length,4);assert(expanded.playerMatch);
}finally{expanded.dispose();}

const cases=[];
for(const config of[preset(0),preset(2),preset(10)]){
 const original=compile(config).modules,modules=copy(original);modules.chassis.hp=350;modules.drive_left.hp=0;modules.weapon.hp=0;modules.armour_front.hp=Math.max(0,modules.armour_front.max-120.5);const before=copy(modules),orders=recommendRepairs(modules),quote=repairQuote(modules,orders);assert.deepEqual(modules,before);assert(quote.cost<=900);assert.equal(quote.after.chassis.hp,1200);assert(orders.every(o=>o.kind==='replace'||modules[o.module].hp>0));cases.push({profile:config.chassis.profile,cost:quote.cost,orders});
}
const fractional=compile(preset(0)).modules;fractional.chassis.hp-=.2;const quote=repairQuote(fractional,recommendRepairs(fractional));assert.equal(quote.cost,1);assert.equal(quote.after.chassis.hp,1200);assert.equal(recommendRepairs(fractional,0).length,0);
mkdirSync('browser-evidence',{recursive:true});writeFileSync('browser-evidence/tournament-presentation.json',JSON.stringify({source:process.env.GITHUB_SHA,records:[...records],cases,fractionalCost:quote.cost,expanded:expandedEvidence,ruleDamageCarryOver:RULES.hz},null,2));
console.log('PASS W/L and actual HP-damage totals, seeded byes, 11-entrant stage progression, champion state, and repair budgets');
