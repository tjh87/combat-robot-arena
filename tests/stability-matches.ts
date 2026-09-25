import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {Simulation,initializePhysics} from '../src/sim';
import {preset,RULES} from '../src/model';
await initializePhysics();const results:any[]=[];
for(const [i,opponent]of[1,5].entries()){
 const s=new Simulation([preset(2),preset(opponent)],{seed:61420+i,hazards:i===1,ai:[true,true],difficulty:'medium'});
 try{while(!s.result&&!s.fault&&s.tick<RULES.matchTicks)s.step();assert.equal(s.fault,undefined);assert(s.result);assert(s.events.some(e=>e.attacker!==null),'An AI fight must include a weapon hit');assert(s.bots.every(b=>b.energy>=0));const row={names:s.bots.map(b=>b.compiled.config.identity.name),winner:s.result.winner,reason:s.result.reason,seconds:s.time,weaponHits:s.events.filter(e=>e.attacker!==null).length,status:'passed'};results.push(row);console.log('PASS',JSON.stringify(row));}
 catch(e){results.push({opponent,status:'failed',error:String(e)});process.exitCode=1;console.log('FAIL',String(e));}finally{s.dispose();writeFileSync('docs/stability-matches.json',JSON.stringify(results,null,2));}
}
