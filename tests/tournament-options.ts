import assert from 'node:assert/strict';
import {ROSTER,SLOTS,compile,preset} from '../src/model';
import {Tournament,initializePhysics} from '../src/sim';
import {compactCup,cupIntro,cupRecords,cupRoundNames,offlineCup} from '../src/tournament-view';
import {totalHPLost} from '../src/tournament-damage';

await initializePhysics();
for(const difficulty of ['easy','medium','hard'] as const){
 const tournament=new Tournament(preset(0),false,7100,difficulty);
 try{
  assert.equal(tournament.difficulty,difficulty);
  tournament.stepOffscreen(1,0);
  assert.equal(tournament.pending?.options.difficulty,difficulty);
 }finally{tournament.dispose();}
}
for(const [opponents,entrants,bracketSize,firstStageMatches] of [[1,2,2,1],[3,4,4,2],[7,8,8,4],[10,11,16,8]] as const){
 const tournament=new Tournament(preset(0),false,7140,'medium',opponents);
 try{
  assert.equal(tournament.entries.length,entrants);
  assert.equal(tournament.bracketSize,bracketSize);
  assert.equal(tournament.totalRounds,Math.log2(bracketSize));
  assert.equal(tournament.matches[0].length,firstStageMatches);
  assert(tournament.entries.every(entry=>compile(entry.config).errors.length===0));
  if(opponents===10){
   assert.equal(new Set(tournament.entries.map(entry=>entry.config.chassis.profile)).size,ROSTER.length,'Ten AI opponents plus the player cover eleven distinct stock profiles.');
   assert.equal(tournament.matches[0].filter(match=>match.reason==='Bye').length,5);
   assert.equal(tournament.matches[0].filter(match=>match.b).length,3);
   assert.equal(tournament.matches[0].filter(match=>match.b).length*2,6);
   assert.equal(tournament.playerMatch,undefined,'The top-seeded player advances through the opening bye.');
   assert.deepEqual(cupRoundNames(11),['Opening Round','Quarterfinals','Semifinals','Final']);
   const expectedDamage=tournament.matches[0].filter(match=>match.b).reduce((sum,match,index)=>{match.winner=match.a;match.reason='Fixture';match.damageDealt=[100+index,50+index];return sum+150+index*2;},0);
   const model=offlineCup(tournament),records=cupRecords(model);
   assert.equal(model.bracketSize,16);
   assert.equal([...records.values()].reduce((sum,record)=>sum+record.damageDealt,0),expectedDamage);
   assert.equal(records.get('e0')?.wins,0,'A bye is not counted as a match win.');
   assert.match(cupIntro(preset(0),11),/<b>4<\/b> bracket stages/);
   assert.match(compactCup(model),/BYE · AUTO-ADVANCE/);
   tournament.advance();
   assert.equal(tournament.matches[1].length,4,'The five bye entrants and three opening winners form quarterfinals.');
   assert(tournament.playerMatch,'The player has a quarterfinal after the opening bye.');
  }
 }finally{tournament.dispose();}
}
assert.throws(()=>new Tournament(preset(0),false,1,'medium',2),/Choose 1, 3, 7, or 10/);
const before=Object.fromEntries(SLOTS.map(slot=>[slot,100])) as Record<(typeof SLOTS)[number],number>;
const after=Object.fromEntries(SLOTS.map(slot=>[slot,{hp:75}])) as Record<(typeof SLOTS)[number],{hp:number}>;
assert.equal(totalHPLost({startHP:before,modules:after}),SLOTS.length*25);
console.log('PASS difficulty retention, 1/3/7/10 opponent fields, eleven-entrant seeded byes, stage progression, distinct robots, and cumulative HP damage');
