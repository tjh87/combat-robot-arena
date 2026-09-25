import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {Simulation,initializePhysics} from '../src/sim';
import {preset,RULES} from '../src/model';
await initializePhysics();const results:any[]=[];
for(const [i,pair]of [[10,1],[2,5]].entries()){
 const s=new Simulation([preset(pair[0]),preset(pair[1])],{seed:61420+i,hazards:i===1,ai:[true,true],difficulty:'medium'});
 try{let peakCrushForce=0;while(!s.result&&!s.fault&&s.tick<RULES.matchTicks){s.step();peakCrushForce=Math.max(peakCrushForce,s.bots[0].crushForce);}assert.equal(s.fault,undefined);assert(s.result);assert(s.events.some(e=>e.attacker!==null),'AI must engage');assert(s.bots.every(b=>b.energy>=0));const row={names:s.bots.map(b=>b.compiled.config.identity.name),winner:s.result.winner,reason:s.result.reason,seconds:s.time,weaponHits:s.events.filter(e=>e.attacker!==null).length,crushBites:s.events.filter(e=>e.cause==='crush').length,peakCrushForceN:peakCrushForce,status:'passed'};results.push(row);console.log('PASS',JSON.stringify(row));}
 catch(error){results.push({pair,status:'failed',error:String(error)});process.exitCode=1;console.log('FAIL',String(error));}finally{s.dispose();writeFileSync('docs/crusher-matches.json',JSON.stringify(results,null,2));}
}
