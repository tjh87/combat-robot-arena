import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {mkdirSync,writeFileSync} from 'node:fs';
import {initializePhysics,Simulation,neutral} from '../src/sim';
import {preset,axisQ,v,RULES} from '../src/model';
import {cacheColliderGeometry,colliderBounds,previousColliderPose} from '../src/arena-wall';
const old=await import(pathToFileURL(process.env.BASELINE_ROOT+'/src/arena-wall.ts').href),oldSim=await import(pathToFileURL(process.env.BASELINE_ROOT+'/src/sim.ts').href),oldModel=await import(pathToFileURL(process.env.BASELINE_ROOT+'/src/model.ts').href);
await initializePhysics();mkdirSync('browser-evidence',{recursive:true});const reports=[];
for(let index=0;index<11;index++){
 const sim=new Simulation([preset(index),preset((index+1)%11)],{practice:true,hazards:false,ai:[false,false],recordVisuals:false});
 try{for(const col of sim.bots[0].colliders.values()){
  for(let sample=0;sample<9;sample++){const p=v(sample*.73,-.2+sample*.31,-sample*.47),q=axisQ([v(1,0,0),v(0,1,0),v(0,0,1),v(1/Math.sqrt(3),1/Math.sqrt(3),1/Math.sqrt(3))][sample%4],sample*.31);const reference=old.colliderBounds(col,p,q);cacheColliderGeometry(col);const actual=colliderBounds(col,p,q);for(const end of['min','max']as const)for(const axis of['x','y','z']as const)assert(Math.abs(reference[end][axis]-actual[end][axis])<1e-12,JSON.stringify({index,sample,axis,reference,actual}));assert.deepEqual(previousColliderPose(col,{p,q}),old.previousColliderPose(col,{p,q}));}
 }reports.push({index,colliders:sim.bots[0].colliders.size,exactBounds:true});}finally{sim.dispose();}
}
const sim=new Simulation([preset(2),preset(4)],{practice:true,hazards:false,ai:[false,false],recordVisuals:false});
try{const cols=sim.bots.flatMap(b=>[...b.colliders.values()]);for(const col of cols)cacheColliderGeometry(col);
 const p=v(6.8,.12,6.8),q=axisQ(v(0,1,0),.74),loops=40;
 const measure=(fn:any)=>{const start=performance.now();let total=0;for(let loop=0;loop<loops;loop++)for(const col of cols)total+=fn(col,p,q).min.x;return{ms:performance.now()-start,total};};
 const baseline=measure(old.colliderBounds),cached=measure(colliderBounds);assert.equal(cached.total,baseline.total);assert(cached.ms<baseline.ms*.75,JSON.stringify({baseline,cached}));
 reports.push({pair:[2,4],queries:cols.length*loops,baselineMs:baseline.ms,cachedMs:cached.ms,speedup:baseline.ms/cached.ms});
 for(const [side,bot]of sim.bots.entries()){const start=bot.chassis.translation();for(const body of bot.bodies.values()){const p=body.translation();body.setTranslation(v(p.x+6.45-start.x,p.y,p.z+(side?1.5:-1.5)-start.z),true);}}
 const reference=new oldSim.Simulation([oldModel.preset(2),oldModel.preset(4)],{practice:true,hazards:false,ai:[false,false],recordVisuals:false});try{for(const [side,bot]of reference.bots.entries()){const start=bot.chassis.translation();for(const body of bot.bodies.values()){const p=body.translation();body.setTranslation(v(p.x+6.45-start.x,p.y,p.z+(side?1.5:-1.5)-start.z),true);}}const newStart=performance.now();for(let tick=0;tick<1200;tick++)sim.step([neutral(),neutral()]);const optimizedMs=performance.now()-newStart,oldStart=performance.now();for(let tick=0;tick<1200;tick++)reference.step([neutral(),neutral()]);const originalMs=performance.now()-oldStart;assert.equal(sim.fault,undefined);assert.equal(reference.fault,undefined);assert.deepEqual(sim.snapshot(),reference.snapshot());reports.push({wallTicks:sim.tick,optimizedMs,originalMs,simulationSpeedup:originalMs/optimizedMs,identicalSnapshot:true,positions:sim.bots.map(b=>b.chassis.translation())});}finally{reference.dispose();}
}finally{sim.dispose();}
writeFileSync('browser-evidence/wall-performance.json',JSON.stringify({source:process.env.GITHUB_SHA,reports},null,2));console.log(JSON.stringify(reports,null,2));
