import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {preset,compile,RULES,v,axisQ,add,rotate,bodyOrigin,type Slot} from '../src/model';
import {Simulation,initializePhysics,neutral,type ImpactEvent,type Travel} from '../src/sim';
import {damageStatus} from '../src/combat-damage';
import {MatchHighlights} from '../src/match-highlights';
import {GameAudio} from '../src/audio';
import {combustionSamples,engineMix,ENGINE_CADENCE} from '../src/icewave-audio';
const results:any[]=[];
async function test(name:string,run:()=>unknown){try{const detail=await run();results.push({name,status:'passed',detail});console.log('PASS',name,JSON.stringify(detail));}catch(e){results.push({name,status:'failed',error:String(e)});process.exitCode=1;console.log('FAIL',name,String(e));}writeFileSync('docs/speed-scoop-update-results.json',JSON.stringify(results,null,2)+'\n');}
await initializePhysics();
function pose(s:Simulation,i:number,p:any,angle=0){const b=s.bots[i],q=axisQ(v(0,1,0),angle);for(const[key,body]of b.bodies){body.setRotation(q,true);body.setTranslation(add(p,rotate(bodyOrigin(b.compiled.config,key),q)),true);body.setLinvel(v(),true);body.setAngvel(v(),true);}s.world.propagateModifiedBodyPositionsToColliders();}
await test('Weapon and actuator output stay full through 50% damage and retain a 45% reserve',()=>{
 const rows=[];for(const slot of ['weapon','weapon_actuator'] as Slot[])for(const fraction of[0,.49,.5,.51,.75,1]){const m=compile(preset(2)).modules;m[slot].hp=m[slot].max*(1-fraction);const state=damageStatus(m);assert(Math.abs(state.weaponOutput-(fraction<=.5?1:1-1.1*(fraction-.5)))<1e-9);m.battery.hp=0;m.battery.functional=false;assert.equal(damageStatus(m).weaponOutput,state.weaponOutput);assert.equal(damageStatus(m).driveOutput,0);rows.push({slot,damagePercent:fraction*100,outputPercent:state.weaponOutput*100});}return rows;
});
await test('Both scoop edges slide under an opponent during an in-place turn using real ramp contacts',()=>{
 const rows=[];for(const index of[2,10])for(const side of[-1,1]){
  const a=preset(index),target=preset(0);Object.assign(target.chassis,{profile:'standard',form:'box',width:.32,length:.52,height:.16,clearance:.012});target.weapon={type:'none'};target.selfRight={type:'none'};Object.assign(target.drive,{layout:4,radius:.09,width:.06});
  const s=new Simulation([a,target],{practice:true,hazards:false,ai:[false,false],autoUnstick:false});try{
   assert.deepEqual(compile(a).errors,[]);assert(compile(a).mass<RULES.weight);pose(s,0,v(0,a.chassis.height/2+a.chassis.clearance+.008,0));pose(s,1,v(side*.70,.10,-.52),side*Math.PI/2);for(let t=0;t<240;t++)s.step();const base=s.bots[1].chassis.translation().y;let rise=0,support=0;
   const ramps=[...s.bots[0].colliders.entries()].filter(([id])=>id.includes('_side_')).map(([,col])=>col);
   for(let t=0;t<600;t++){s.step([{...neutral(),left:side*.3,right:-side*.3},neutral()]);rise=Math.max(rise,s.bots[1].chassis.translation().y-base);for(const col of ramps)s.world.contactPairsWith(col,other=>{if(s.meta.get(other.handle)?.bot===1)s.world.contactPair(col,other,m=>{if(Math.abs(m.normal().y)>.15)for(let j=0;j<m.numContacts();j++)if(m.contactImpulse(j)>.001)support++;});});}
   assert.equal(s.fault,undefined);assert(support>0);assert(rise>.004,'Side ramp did not lift the opponent');rows.push({bot:a.identity.name,side,liftMm:rise*1000,supportingContacts:support,massKg:compile(a).mass});
  }finally{s.dispose();}
 }return rows;
});
await test('The new side lips clear the floor in forward and reverse driving',()=>{
 const rows=[];for(const index of[2,10])for(const direction of[-1,1]){const c=preset(index),s=new Simulation([c,preset(0)],{practice:true,hazards:false,ai:[false,false],autoUnstick:false});try{
  pose(s,0,v(0,c.chassis.height/2+c.chassis.clearance+.008,2));for(let t=0;t<240;t++)s.step();const from=s.bots[0].chassis.translation().z;for(let t=0;t<240;t++)s.step([{...neutral(),left:direction*.3,right:direction*.3},neutral()]);const distance=(from-s.bots[0].chassis.translation().z)*direction;assert(distance>.25);assert(s.axis(s.bots[0],v(0,1,0)).y>.95);assert.equal(s.fault,undefined);rows.push({bot:c.identity.name,direction,distanceM:distance});
 }finally{s.dispose();}}return rows;
});
await test('Match highlights exclude arena damage, recoil, powered escape and post-landing travel',()=>{
 const h=new MatchHighlights(),event=(attacker:number|null,target:number|null,energy:number,cause='weapon')=>({attacker,target,energy,cause}) as ImpactEvent;
 h.hit(event(0,1,15000));h.hit(event(0,1,3000));h.hit(event(1,0,9000,'crush'));h.hit(event(null,0,80000,'landing'));h.hit(event(0,0,90000));assert.deepEqual(h.robots.map(r=>r.hardestHit),[15000,9000]);
 const t={bot:1,role:'Post-impact travel',horizontal:2,powered:false,airborne:false,landed:0} as Travel;
 h.travel(t,true,false);h.travel({...t,horizontal:100,role:'Recoil travel'},false,false);h.travel({...t,horizontal:40,powered:true},true,true);assert.equal(h.robots[1].furthestTravel,2);
 h.travel({...t,horizontal:4,powered:true,airborne:true},false,false);h.travel({...t,horizontal:4.2,powered:true,airborne:true,landed:1},true,true);h.travel({...t,horizontal:15,airborne:true,landed:2},true,false);assert.equal(h.robots[1].furthestTravel,4.2);assert.equal(h.robots[0].furthestTravel,0);
 for(let i=0;i<800;i++)h.hit(event(0,1,200));assert.equal(h.robots[0].hardestHit,15000);assert.deepEqual(new MatchHighlights().robots,[{furthestTravel:0,maxHeight:0,hardestHit:0,hardestReceived:0},{furthestTravel:0,maxHeight:0,hardestHit:0,hardestReceived:0}]);return h.robots;
});
class Param{value=0;setTargetAtTime(n:number){this.value=n;}setValueAtTime(n:number){this.value=n;}linearRampToValueAtTime(n:number){this.value=n;}exponentialRampToValueAtTime(n:number){this.value=n;}}
const nodes:any[]=[];const node=()=>{const n={gain:new Param(),frequency:new Param(),playbackRate:new Param(),Q:new Param(),stopped:false,disconnected:false,buffer:null as any,connect(){},disconnect(){this.disconnected=true;},start(){},stop(){this.stopped=true;}};nodes.push(n);return n;};
async function audioFixture(fn:(audio:GameAudio)=>unknown){const previous=(globalThis as any).AudioContext;(globalThis as any).AudioContext=class{currentTime=0;sampleRate=12000;state='running';destination={};createGain=node;createOscillator=node;createBufferSource=node;createBiquadFilter=node;createBuffer(_c:number,n:number){const a=new Float32Array(n);return{getChannelData:()=>a,duration:n/12000};}resume(){return Promise.resolve();}close(){return Promise.resolve();}};const audio=new GameAudio();try{audio.start(1,1);return await fn(audio);}finally{audio.dispose();(globalThis as any).AudioContext=previous;}}
await test('ICEwave pitch follows measured RPM immediately, including a hit slowdown and a restart',()=>audioFixture(audio=>{
 const c=preset(3);assert(c.weapon.type==='horizontal_bar');const top=c.weapon.rpm,rows=[];
 for(const fraction of[0,.25,.5,1,.15,0,1]){audio.motors([0,0],[top*fraction,0],true,[c,preset(1)],[0,0],[true,false]);const expected=engineMix(fraction);const audible=[];for(const[index,mode]of(['idle','mid','full']as const).entries()){const voice=audio.combustionLoops[0][index];assert(Math.abs(voice.source.playbackRate.value*ENGINE_CADENCE[mode]-expected.hz)<1e-8);if(voice.gain.gain.value>0)audible.push(mode);}assert(audible.length>0);assert.equal(audio.weaponLoops[0].gain.gain.value,0);assert(audio.combustionLoops[1].every(v=>v.gain.gain.value===0));rows.push({weaponRPM:top*fraction,firingHz:expected.hz,audible});}
 audio.mute();assert(audio.combustionLoops.flat().every(v=>v.gain.gain.value===0));audio.motors([0,0],[top*.5,0],true,[c,preset(1)],[0,0],[true,false]);assert(audio.combustionLoops[0][1].gain.gain.value>0);audio.resetEngines();assert(audio.combustionLoops.flat().every(v=>v.gain.gain.value===0));return rows;
}));
await test('Each match gets three start tones and a distinct fight tone, independent of hit sounds',()=>audioFixture(audio=>{
 const real=audio.countdownCue.bind(audio),cues:boolean[]=[];audio.countdownCue=fight=>{const ok=real(fight);if(ok)cues.push(fight);return ok;};audio.voices=12;
 for(let match=0;match<3;match++){audio.resetCountdown();for(const t of[0,.18,.5,1.18])audio.updateCountdown(t);assert.equal(audio.countdownStep,2);audio.pauseCountdown();for(const t of[1.3,2.18,3.16])audio.updateCountdown(t);assert.equal(audio.countdownStep,4);audio.updateCountdown(4);}
 assert.deepEqual(cues,Array.from({length:3},()=>[false,false,false,true]).flat());audio.resetCountdown();(audio.context as any).state='suspended';audio.updateCountdown(.2);assert.equal(audio.countdownStep,0);(audio.context as any).state='running';audio.updateCountdown(.21);assert.equal(audio.countdownStep,1);return{matches:3,tones:12,resumedAudio:true,independentOfImpactLimit:true};
}));
await test('Engine voices have bounded, non-clipped transients and distinct speed bands',()=>{
 return(['idle','mid','full']as const).map(mode=>{const samples=combustionSamples(12000,mode),rms=Math.sqrt(samples.reduce((sum,x)=>sum+x*x,0)/samples.length),peak=samples.reduce((max,x)=>Math.max(max,Math.abs(x)),0);assert(samples.every(Number.isFinite));assert(rms>.035&&rms<.3);assert(peak<.81&&peak>.7);assert(samples.filter(x=>Math.abs(x)>.78).length<samples.length*.001);return{mode,rms,peak,firingHz:ENGINE_CADENCE[mode]};});
});
