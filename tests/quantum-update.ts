import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import * as THREE from 'three';
import {Simulation,initializePhysics,type ImpactEvent} from '../src/sim';
import {preset,compile,v,axisQ,bodyOrigin,add,rotate,povMount,RULES} from '../src/model';
import {quantumHead,quantumFang} from '../src/quantum-visual';
import {HitReadouts} from '../src/hit-readouts';
import {contactDamage} from '../src/combat-damage';
import {combustionSamples} from '../src/icewave-audio';
const results:any[]=[];
async function test(name:string,fn:()=>unknown){try{const detail=await fn();results.push({name,status:'passed',detail});console.log('PASS',name,JSON.stringify(detail));}catch(e){results.push({name,status:'failed',error:String(e)});process.exitCode=1;console.log('FAIL',name,String(e));}writeFileSync('docs/quantum-update-results.json',JSON.stringify(results,null,2)+'\n');}
await initializePhysics();
await test('Quantum self-rights from both sides and two inverted orientations using its folding arm',()=>{
 const rows=[];
 for(const [axis,angle] of [[v(0,0,1),Math.PI],[v(0,0,1),Math.PI/2],[v(0,0,1),-Math.PI/2],[v(1,0,0),Math.PI]] as const){
  const c=preset(10);assert.deepEqual(compile(c).errors,[]);const s=new Simulation([c,preset(0)],{practice:true,hazards:false,ai:[false,false],autoUnstick:false}),b=s.bots[0],q=axisQ(axis,angle);
  try{
   for(const [key,body]of b.bodies){body.setRotation(q,true);body.setTranslation(add(v(0,.8,3),rotate(bodyOrigin(c,key),q)),true);body.setLinvel(v(),true);body.setAngvel(v(),true);}s.world.propagateModifiedBodyPositionsToColliders();
   for(let t=0;t<240;t++)s.step();assert(s.axis(b,v(0,1,0)).y<.65);assert(s.requestSelfRight(b));assert(!s.requestSelfRight(b));let recovered=-1;
   for(let t=0;t<2400;t++){s.step();if(recovered<0&&s.axis(b,v(0,1,0)).y>.85&&b.grounded)recovered=t/240;}
   assert(recovered>=0&&recovered<5);assert(s.axis(b,v(0,1,0)).y>.95);assert(b.rollWork>0&&b.rollWork<=4000);assert.equal(s.fault,undefined);rows.push({axis,angle,recoveredSeconds:recovered,armWorkJ:b.rollWork,massKg:b.compiled.mass});
  }finally{s.dispose();}
 }return rows;
});
await test('Quantum has a smooth open skull, real cutouts, and pointed inner fangs',()=>{
 const head=quantumHead(preset(10));let meshes=0,holes=0,triangles=0;
 head.traverse(o=>{if(!(o instanceof THREE.Mesh))return;meshes++;const g=o.geometry as THREE.ExtrudeGeometry;assert([...g.attributes.position.array].every(Number.isFinite));holes+=(g.parameters.shapes as THREE.Shape).holes.length;triangles+=g.attributes.position.count/3;assert.equal(g.parameters.options.bevelSegments,3);});
 assert.equal(holes,9);assert.equal(meshes,7);assert(head.getObjectByName('quantum-inner-fang'));for(const side of[-1,1]){const fang=quantumFang(preset(10),side);assert([...fang.geometry.attributes.position.array].every(Number.isFinite));assert.equal(Math.sign(fang.position.x),side);fang.geometry.computeBoundingBox();assert(fang.geometry.boundingBox!.max.y-fang.geometry.boundingBox!.min.y>.19);}const size=new THREE.Box3().setFromObject(head).getSize(new THREE.Vector3());assert(size.x<.30&&size.y<.50&&size.z<.70);return{meshes,holes,triangles,size};
});
await test('Hit readouts count actual HP once, combine contacts, and expire on simulation time',()=>{
 const numbers=new HitReadouts(),events=[{id:1,point:v(),allocations:[{bot:1,hp:40}]} as ImpactEvent];
 assert.equal(numbers.update(events,0)[0].hp,40);assert.equal(numbers.update(events,0)[0].hp,40);
 events[0].allocations[0].hp+=5;events.push({id:2,point:v(),allocations:[{bot:1,hp:12},{bot:0,hp:3}]} as ImpactEvent);
 const hits=numbers.update(events,10);assert.equal(hits.length,2);assert.equal(hits.find(h=>h.bot===1)!.hp,57);assert.equal(hits.find(h=>h.bot===0)!.hp,3);assert.equal(numbers.update(events,10).length,2);assert.equal(numbers.update(events,RULES.hz*2).length,0);
 numbers.reset();assert.equal(numbers.hits.length,0);return{contacts:2,totalTargetHP:57,recoilHP:3,duplicateHP:0,lifetimeSeconds:1.3};
});
await test('The attacking blade is protected in both contact orders and unequal blade clashes',()=>{
 for(const swap of[false,true])for(const both of[false,true]){
  const a=contactDamage({weaponA:true,weaponB:true,cutA:!swap||both,cutB:swap||both,speedA:swap?2:20,speedB:swap?20:2,ramA:0,ramB:0})!;
  assert.equal(a.attacker,swap?1:0);assert.equal(a.shares[a.attacker!],0);assert.equal(a.shares[1-a.attacker!],.5);
 }
 return{contactOrders:2,bladeCases:4,attackerShare:0};
});
await test('ICEwave camera clears its engine and exhaust stack',()=>{
 const c=preset(3),mount=povMount(c),oldHeight=.37;assert(mount.y>.65);const parts=compile(c).parts.filter(p=>/engine|exhaust/.test(p.id));assert(parts.length>0);for(const p of parts)assert(mount.y>p.position.y+.07);return{previousHeightM:oldHeight,heightM:mount.y,increaseM:mount.y-oldHeight};
});
await test('Original combustion audio stays bounded and rises from idle to full throttle',()=>{
 const sr=12000;
 // Measure firing cadence from the energy envelope; metallic harmonics may
 // be louder than the combustion fundamental in the updated engine voice.
 function peak(data:Float32Array,start:number){const envelope=new Float32Array(sr);let sum=0;for(let i=0;i<sr;i++){let x=0;for(let j=0;j<8;j++)x+=data[start+Math.min(sr-1,i+j)]**2/8;envelope[i]=x;sum+=x;}const mean=sum/sr;for(let i=0;i<sr;i++)envelope[i]-=mean;let best=-Infinity,hz=0;for(let f=45;f<=190;f++){const lag=Math.floor(sr/f);let correlation=0;for(let n=0;n<sr-lag;n++)correlation+=envelope[n]*envelope[n+lag];correlation/=sr-lag;if(correlation>best){best=correlation;hz=f;}}return hz;}
 const rows=['idle','mid','full'].map(mode=>{const data=combustionSamples(sr,mode as any),max=data.reduce((a,b)=>Math.max(a,Math.abs(b)),0),rms=Math.sqrt(data.reduce((n,x)=>n+x*x,0)/data.length);assert([...data].every(Number.isFinite));assert(max<=.83&&rms>.05);return{mode,duration:data.length/sr,max,rms,startHz:peak(data,0),endHz:peak(data,data.length-sr)};});
 assert(rows[0].startHz<70);assert(rows[2].startHz>140);assert(rows[1].startHz>80&&rows[1].startHz<115);return rows;
});
