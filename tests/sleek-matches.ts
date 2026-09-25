import assert from 'node:assert/strict';
import {writeFileSync,readFileSync} from 'node:fs';
import {Simulation,initializePhysics} from '../src/sim';
import {preset,RULES} from '../src/model';
await initializePhysics();const selected=process.env.CRA_MATCH_PAIR,results:any[]=selected?JSON.parse(readFileSync('docs/sleek-matches.json','utf8')):[];
for(const [i,pair]of [[0,6],[1,4],[2,5],[7,9],[8,9]].entries()){
 if(selected&&Number(selected)!==i)continue;
 const s=new Simulation([preset(pair[0]),preset(pair[1])],{seed:60300+i,hazards:i%2===0,ai:[true,true],difficulty:'medium'});
 try{while(!s.result&&!s.fault&&s.tick<RULES.matchTicks)s.step();assert.equal(s.fault,undefined);assert(s.result);assert(s.events.some(e=>e.attacker!==null),'A complete AI fight must include a weapon hit');assert(s.bots.every(b=>b.energy>=0));results[i]={names:s.bots.map(b=>b.compiled.config.identity.name),winner:s.result.winner,reason:s.result.reason,seconds:s.time,hits:s.events.filter(e=>e.attacker!==null).length,status:'passed'};console.log('PASS',JSON.stringify(results[i]));}
 catch(e){results[i]={pair,status:'failed',error:String(e)};process.exitCode=1;console.log('FAIL',String(e));}finally{s.dispose();writeFileSync('docs/sleek-matches.json',JSON.stringify(results,null,2));}
}
