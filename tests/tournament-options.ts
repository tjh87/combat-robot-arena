import assert from 'node:assert/strict';
import {preset} from '../src/model';
import {Tournament,initializePhysics} from '../src/sim';

await initializePhysics();
for(const difficulty of ['easy','medium','hard'] as const){
 const tournament=new Tournament(preset(0),false,7100,difficulty);
 try{
  assert.equal(tournament.difficulty,difficulty);
  tournament.stepOffscreen(1,0);
  assert.equal(tournament.pending?.options.difficulty,difficulty);
 }finally{tournament.dispose();}
}
console.log('PASS tournament difficulty is retained for every direct background simulation');
