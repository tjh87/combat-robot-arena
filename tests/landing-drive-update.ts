import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {preset,compile,encodeBuild,decodeBuild,RULES,v,axisQ,bodyOrigin,rotate,add,sub,length,type BotConfig} from '../src/model';
import {Simulation,initializePhysics,neutral,type ImpactEvent} from '../src/sim';
import {GameAudio,readyImpactSounds} from '../src/audio';
const results:any[]=[];
async function test(name:string,fn:()=>unknown){try{const detail=await fn();results.push({name,status:'passed',detail});console.log('PASS',name,JSON.stringify(detail));}catch(e){process.exitCode=1;results.push({name,status:'failed',error:String(e)});console.log('FAIL',name,String(e));}writeFileSync('docs/landing-drive-update-results.json',JSON.stringify(results,null,2)+'\n');}
await initializePhysics();
function pose(s:Simulation,id:number,p:ReturnType<typeof v>,angle=0){const b=s.bots[id],q=axisQ(v(0,1,0),angle);for(const[key,body]of b.bodies){body.setRotation(q,true);body.setTranslation(add(p,rotate(bodyOrigin(b.compiled.config,key),q)),true);body.setLinvel(v(),true);body.setAngvel(v(),true);}s.world.propagateModifiedBodyPositionsToColliders();}

await test('The upgraded drive saves and loads, remains legal, and supports old builds',()=>{
 const c=preset(4),old=structuredClone(c);old.drive.motor='drive48';old.drive.magnet=0;
 for(const config of[c,old]){assert.deepEqual(decodeBuild(encodeBuild(config)),config);assert.deepEqual(compile(config).errors,[]);}
 for(let i=0;i<11;i++)if(i!==4)assert.equal(preset(i).drive.motor,'drive48');
 const current=compile(c),previous=compile(old);assert(current.mass<RULES.weight);assert(current.endurance>180);assert(Math.abs(current.mass-previous.mass-5)<.001);
 return{beforeKg:previous.mass,afterKg:current.mass,enduranceEstimateSeconds:current.endurance,oldBuildCompatible:true};
});
function driveRun(config:BotConfig,turn=false){
 const s=new Simulation([config,preset(0)],{practice:true,hazards:false,ai:[false,false],autoUnstick:false}),b=s.bots[0];
 try{pose(s,0,v(0,config.chassis.height/2+config.chassis.clearance+.008,5));pose(s,1,v(5,.2,4));for(let t=0;t<15*RULES.hz;t++)s.step([{...neutral(),weapon:t===0},neutral()]);assert(b.rpm>4500);
  let speedHalf=0,peak=0,angle=0,minUp=1;const energy=b.energy;
  for(let t=0;t<1.5*RULES.hz;t++){s.step([{...neutral(),left:1,right:turn?-1:1},neutral()]);const speed=Math.hypot(b.chassis.linvel().x,b.chassis.linvel().z);if(t===RULES.hz/2-1)speedHalf=speed;peak=Math.max(peak,speed);angle+=b.chassis.angvel().y/RULES.hz;minUp=Math.min(minUp,s.axis(b,v(0,1,0)).y);}
  assert.equal(s.fault,undefined);assert(minUp>.98);assert(b.energy<energy);return{speedAtHalfSecond:speedHalf,peakSpeed:peak,turnDegrees:Math.abs(angle*180/Math.PI),minUp};
 }finally{s.dispose();}
}
await test('HyperShock accelerates and turns faster with a fully spinning disc',()=>{
 const current=preset(4),old=structuredClone(current);old.drive.motor='drive48';old.drive.magnet=0;
 const before=driveRun(old),after=driveRun(current),turnBefore=driveRun(old,true),turnAfter=driveRun(current,true);
 assert(after.speedAtHalfSecond>before.speedAtHalfSecond*1.15);assert(after.peakSpeed>before.peakSpeed*1.10);assert(turnAfter.turnDegrees>turnBefore.turnDegrees*1.25);
 return{before,after,turnBefore,turnAfter,accelerationGainPercent:100*(after.speedAtHalfSecond/before.speedAtHalfSecond-1),peakSpeedGainPercent:100*(after.peakSpeed/before.peakSpeed-1),turnGainPercent:100*(turnAfter.turnDegrees/turnBefore.turnDegrees-1)};
});
await test('HyperShock reverses and brakes without tipping or dragging its scoop',()=>{
 const rows=[];for(const direction of[-1,1]){const c=preset(4),s=new Simulation([c,preset(0)],{practice:true,hazards:false,ai:[false,false],autoUnstick:false}),b=s.bots[0];try{
  pose(s,0,v(0,c.chassis.height/2+c.chassis.clearance+.008,0));pose(s,1,v(5,.2,4));for(let t=0;t<240;t++)s.step();const start={...b.chassis.translation()};let minUp=1;
  for(let t=0;t<180;t++){s.step([{...neutral(),left:direction*.7,right:direction*.7},neutral()]);minUp=Math.min(minUp,s.axis(b,v(0,1,0)).y);}const distance=(start.z-b.chassis.translation().z)*direction,speed=length(b.chassis.linvel());assert(distance>1);assert(speed>2);
  for(let t=0;t<240;t++)s.step([neutral(),neutral()]);assert(length(b.chassis.linvel())<.2);assert(minUp>.98);assert.equal(s.fault,undefined);rows.push({direction,distanceM:distance,driveSpeed:speed,stoppedSpeed:length(b.chassis.linvel()),minUp});
 }finally{s.dispose();}}return rows;
});
await test('Floor contacts from one landing share one sound while separate attacks remain distinct',()=>{
 const make=(id:number,tick:number,energy:number,cause:string,target=1)=>({id,tick,energy,cause,target,attacker:cause==='weapon'?0:null,fallHeight:cause==='landing'?2:undefined}) as ImpactEvent;
 const events=[make(1,1,1800,'landing'),make(2,3,600,'landing / arena'),make(3,6,300,'weapon'),make(4,8,800,'landing',0),make(5,40,1500,'landing')];
 const batch=readyImpactSounds(events,90,0);assert.deepEqual(batch.events.map(e=>[e.cause,e.energy]),[['landing',2400],['weapon',300],['landing',800],['landing',1500]]);assert.equal(events[1].cause,'landing / arena');assert.equal(readyImpactSounds(events,120,batch.lastID).events.length,0);return{contacts:5,sounds:4,firstLandingJ:batch.events[0].energy};
});
await test('Actual low and high falls create landing audio events with measured height',()=>{
 const rows=[];for(const height of[.75,2.5]){const c=preset(4),s=new Simulation([c,preset(0)],{practice:true,hazards:false,ai:[false,false],autoUnstick:false});try{
  pose(s,0,v(0,c.chassis.height/2+c.chassis.clearance+height,0));pose(s,1,v(5,.2,4));for(let t=0;t<3*RULES.hz;t++)s.step();const audio=readyImpactSounds(s.events,s.tick,0).events.filter(e=>e.target===0&&e.cause==='landing');assert(audio.length>0);assert(audio.some(e=>(e.fallHeight??0)>height*.5));assert.equal(s.fault,undefined);rows.push({dropHeight:height,sounds:audio.length,largestContactJ:Math.max(...audio.map(e=>e.energy)),measuredHeight:Math.max(...audio.map(e=>e.fallHeight??0))});
 }finally{s.dispose();}}return rows;
});
await test('Landing assets decode with short tails and encoding headroom',()=>{
 return['landing_light_01','landing_heavy_01','landing_heavy_02'].map(name=>{const data=execFileSync('ffmpeg',['-v','error','-i','public/audio/'+name+'.mp3','-ar','44100','-ac','1','-f','f32le','-']);let total=0,tail=0,peak=0;for(let i=0;i<data.length/4;i++){const x=data.readFloatLE(i*4);assert(Number.isFinite(x));total+=x*x;if(i>=.4*44100)tail+=x*x;peak=Math.max(peak,Math.abs(x));}const duration=data.length/4/44100;assert(duration<=.65);assert(peak<.90&&peak>.4);assert(tail/total<.005);return{name,duration,peak,tailPercent:100*tail/total};});
});
await test('Landing playback uses its own softer filter and heavier sample for high falls',()=>{
 const previous=(globalThis as any).AudioContext,sources:any[]=[];
 class Param{value=0;setTargetAtTime(x:number){this.value=x;}setValueAtTime(x:number){this.value=x;}exponentialRampToValueAtTime(x:number){this.value=x;}}
 const node=()=>({gain:new Param(),frequency:new Param(),playbackRate:new Param(),Q:new Param(),connections:[]as any[],connect(n:any){this.connections.push(n);},disconnect(){},start(){},stop(){}});
 (globalThis as any).AudioContext=class{state='running';sampleRate=8000;currentTime=1;destination={};createGain=node;createOscillator=node;createBiquadFilter=node;createBufferSource(){const n=node();sources.push(n);return n;}createBuffer(_c:number,n:number){const a=new Float32Array(n);return{duration:n/8000,getChannelData:()=>a};}resume(){return Promise.resolve();}close(){return Promise.resolve();}};
 const audio=new GameAudio();try{audio.start(1,1);const light={name:'light'}as any,heavy={name:'heavy'}as any,steel={name:'steel'}as any;audio.impactLibrary.landLight=[light];audio.impactLibrary.landHeavy=[heavy];audio.impactLibrary.strike=[steel];
  const rows=[];for(const[energy,height]of[[200,.2],[4500,2.5]]){audio.impact(energy,'metal',height);const source=sources.at(-1),filter=source.connections[0],gain=filter.connections[0];assert.equal(source.buffer,height>.65?heavy:light);assert(filter.frequency.value<=3000);assert(source.playbackRate.value<1);rows.push({height,gain:gain.gain.value,cutoff:filter.frequency.value});source.onended();}assert(rows[1].gain>rows[0].gain);assert.equal(audio.voices,0);return rows;
 }finally{audio.dispose();(globalThis as any).AudioContext=previous;}
});
