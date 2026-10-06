import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {mkdirSync,writeFileSync} from 'node:fs';
import {Simulation,initializePhysics,AI_SETTINGS} from '../src/sim';
import {preset,RULES} from '../src/model';
const old=await import(pathToFileURL(process.env.BASELINE_ROOT+'/src/sim.ts').href);await initializePhysics();
assert.equal(AI_SETTINGS.hard.delay,old.AI_SETTINGS.hard.delay/2);assert.equal(AI_SETTINGS.hard.aim,old.AI_SETTINGS.hard.aim/2);assert.equal(AI_SETTINGS.hard.ready,old.AI_SETTINGS.hard.ready);
const evidence=[];
for(const difficulty of['easy','medium','hard']as const){const sim=new Simulation([preset(0),preset(1)],{practice:true,hazards:false,ai:[false,true],difficulty,seed:71319,recordVisuals:false}),reference=new old.Simulation([preset(0),preset(1)],{practice:true,hazards:false,ai:[false,true],difficulty,seed:71319,recordVisuals:false});let current=0,prior=0;const decide=(sim as any).decide.bind(sim),oldDecide=(reference as any).decide.bind(reference);(sim as any).decide=(b:any)=>{current++;decide(b);};(reference as any).decide=(b:any)=>{prior++;oldDecide(b);};try{for(let tick=0;tick<360;tick++){sim.step();reference.step();}assert.equal(sim.fault,undefined);assert.equal(reference.fault,undefined);assert.equal(current,prior*(difficulty==='hard'?2:1));assert.deepEqual(sim.bots.map(b=>b.compiled.mass),reference.bots.map((b:any)=>b.compiled.mass));assert.deepEqual(sim.bots.map(b=>b.startHP),reference.bots.map((b:any)=>b.startHP));evidence.push({difficulty,decisions:current,previous:prior,delayMs:AI_SETTINGS[difficulty].delay/RULES.hz*1000,aimDegrees:AI_SETTINGS[difficulty].aim});}finally{sim.dispose();reference.dispose();}}
mkdirSync('browser-evidence',{recursive:true});writeFileSync('browser-evidence/hard-double.json',JSON.stringify({source:process.env.GITHUB_SHA,evidence},null,2));console.log('PASS hard decisions doubled, latency and aim error halved, easy and medium unchanged');
