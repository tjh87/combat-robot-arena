import {writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {SnapshotTiming} from '../src/online/timing';
import {encodeInput} from '../src/online/protocol';

type Scenario={name:string;description:string;arrival:(frame:number,serverTime:number)=>number;recoveryFrames?:number};
type Sample={frame:number;serverTime:number;arrivalTime:number;bufferMs:number;jitterMs:number};
const root=resolve(import.meta.dirname);
const frameInterval=1000/30;
const percentile=(values:number[],p:number)=>{const sorted=[...values].sort((a,b)=>a-b),index=Math.min(sorted.length-1,Math.max(0,Math.ceil(sorted.length*p)-1));return sorted[index];};
const mean=(values:number[])=>values.reduce((sum,value)=>sum+value,0)/Math.max(1,values.length);
const baseOneWayMs=55;
const orderedStall=(stallMs:number,frame:number)=>{const after=frame-90;return after>=0&&after*frameInterval<stallMs?stallMs-after*frameInterval:0;};
const scenarios:Scenario[]=[
 {name:'Stable 30 Hz delivery',description:'Fixed 55 ms one-way model; no arrival variation.',arrival:(_frame,serverTime)=>serverTime+baseOneWayMs},
 {name:'Low consumer jitter',description:'Deterministic ±4 ms arrival variation around the same 55 ms one-way model.',arrival:(frame,serverTime)=>serverTime+baseOneWayMs+[-4,2,0,4,-2,1][frame%6]},
 {name:'Moderate jitter burst',description:'Steady stream with an 80 ms ordered-delivery stall at frame 90; queued snapshots then arrive as an ordered batch.',arrival:(frame,serverTime)=>serverTime+baseOneWayMs+(frame<90?[-9,5,0,7,-4,2][frame%6]:orderedStall(80,frame)),recoveryFrames:90},
 {name:'Severe ordered stall',description:'Steady stream with a 180 ms ordered-delivery stall at frame 90; queued snapshots then arrive as an ordered batch.',arrival:(frame,serverTime)=>serverTime+baseOneWayMs+(frame<90?[-14,8,0,11,-6,3][frame%6]:orderedStall(180,frame)),recoveryFrames:90}
];
const result=scenarios.map(scenario=>{
 const timing=new SnapshotTiming(),samples:Sample[]=[];
 for(let frame=0;frame<240;frame++){
  const serverTime=Math.round(frame*frameInterval*1000)/1000,arrivalTime=Math.round(scenario.arrival(frame,serverTime)*1000)/1000;
  timing.observe(serverTime,arrivalTime);samples.push({frame,serverTime,arrivalTime,bufferMs:timing.delay,jitterMs:timing.jitter});
 }
 const buffers=samples.map(sample=>sample.bufferMs),jitters=samples.map(sample=>sample.jitterMs),recoveryStart=scenario.recoveryFrames;
 const recoveredAt=recoveryStart===undefined?undefined:samples.find(sample=>sample.frame>recoveryStart&&sample.bufferMs<=44)?.frame;
 return {
  name:scenario.name,description:scenario.description,frames:samples.length,snapshotRateHz:30,baseOneWayModelMs:baseOneWayMs,
  buffer:{minimumMs:Math.min(...buffers),meanMs:Number(mean(buffers).toFixed(2)),p50Ms:percentile(buffers,.5),p95Ms:percentile(buffers,.95),maximumMs:Math.max(...buffers),finalMs:buffers.at(-1)},
  jitter:{meanMs:Number(mean(jitters).toFixed(2)),p95Ms:Number(percentile(jitters,.95).toFixed(2)),maximumMs:Number(Math.max(...jitters).toFixed(2)),finalMs:Number(jitters.at(-1)!.toFixed(2))},
  recovery:recoveredAt===undefined?null:{frame:recoveredAt,msSinceStall:Number(((recoveredAt-recoveryStart)*frameInterval).toFixed(1))},
  samples
 };
});
const uuid='d8c9725f-2fbf-4b27-8526-3c5ec0e44a69';
const binaryIdle=encodeInput({type:'input',match:uuid,seq:711,left:0,right:0,actions:[]});
const binaryAction=encodeInput({type:'input',match:uuid,seq:711,left:.375,right:-.625,actions:[{id:7,kind:'weapon'},{id:9,kind:'recover'}]});
const jsonIdle=JSON.stringify({type:'input',match:uuid,seq:711,left:0,right:0,actions:[]});
const jsonAction=JSON.stringify({type:'input',match:uuid,seq:711,left:.375,right:-.625,actions:[{id:7,kind:'weapon'},{id:9,kind:'recover'}]});
const payload={generatedAt:new Date().toISOString(),methodology:{source:'Deterministic simulation against the production SnapshotTiming implementation. Synthetic arrival patterns are controlled test inputs, not measured internet latency.',snapshotRateHz:30,framesPerScenario:240,oldFixedBufferMs:60,newFloorBufferMs:42,maximumBufferMs:140},inputTransport:{binaryIdleBytes:binaryIdle.byteLength,binaryActionBytes:binaryAction.byteLength,jsonIdleBytes:Buffer.byteLength(jsonIdle),jsonActionBytes:Buffer.byteLength(jsonAction),idleReductionPct:Number((100*(1-binaryIdle.byteLength/Buffer.byteLength(jsonIdle))).toFixed(1)),actionReductionPct:Number((100*(1-binaryAction.byteLength/Buffer.byteLength(jsonAction))).toFixed(1))},scenarios:result};
writeFileSync(resolve(root,'network-jitter-results.json'),JSON.stringify(payload,null,2));
const rows=['scenario,frames,buffer_min_ms,buffer_mean_ms,buffer_p50_ms,buffer_p95_ms,buffer_max_ms,buffer_final_ms,jitter_mean_ms,jitter_p95_ms,jitter_max_ms,jitter_final_ms,recovery_ms'];
for(const scenario of result)rows.push([scenario.name,scenario.frames,scenario.buffer.minimumMs,scenario.buffer.meanMs,scenario.buffer.p50Ms,scenario.buffer.p95Ms,scenario.buffer.maximumMs,scenario.buffer.finalMs,scenario.jitter.meanMs,scenario.jitter.p95Ms,scenario.jitter.maximumMs,scenario.jitter.finalMs,scenario.recovery?.msSinceStall??''].map(value=>'"'+String(value).replaceAll('"','""')+'"').join(','));
writeFileSync(resolve(root,'network-jitter-results.csv'),rows.join('\n')+'\n');
console.log(JSON.stringify(payload,null,2));
