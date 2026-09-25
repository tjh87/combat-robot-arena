import assert from 'node:assert/strict';
import {Vector3} from 'three';
import {writeFileSync} from 'node:fs';
import {Simulation,initializePhysics,neutral,RAPIER} from '../src/sim';
import {ROSTER,RULES,flipEnergy,preset,compile,isSpinner,isHorizontal,bodyOrigin,rotate,add,sub,v,axisQ,dot,length} from '../src/model';
import {frontMarker,finishedGeometry} from '../src/finish-geometry';
const results:any[]=[];
async function test(name:string,fn:()=>unknown){try{const detail=await fn();results.push({name,status:'passed',detail});console.log('PASS',name,JSON.stringify(detail));}catch(e){results.push({name,status:'failed',error:String(e)});console.log('FAIL',name,String(e));}writeFileSync('docs/sleek-results.json',JSON.stringify(results,null,2));}
await initializePhysics();
function make(i:number){return new Simulation([preset(i),preset(0)],{practice:true,hazards:false,ai:[false,false],autoUnstick:false});}
function pose(s:Simulation,y:number,inverted=false){const b=s.bots[0],q=inverted?axisQ(v(0,0,1),Math.PI):axisQ(v(0,1,0),0),p=v(-3,y,0);for(const[key,body]of b.bodies){body.setTranslation(add(p,rotate(bodyOrigin(b.compiled.config,key),q)),true);body.setRotation(q,true);body.setLinvel(v(),true);body.setAngvel(v(),true);}s.world.propagateModifiedBodyPositionsToColliders();}
await test('All templates remain legal, every weapon gains energy, and Deep Six has the highest rotor energy',()=>{
 const previous=[38.52193,61.31230,3,38.70985,56.56071,118.33189,69.68412,19.21018,35.49949,44.59320];
 const rows=ROSTER.map((r,i)=>{const c=preset(i),b=compile(c),energy=isSpinner(c.weapon)?b.rotorInertia*(c.weapon.rpm*Math.PI/30)**2/2000:flipEnergy(c)/1000;assert.deepEqual(b.errors,[],r.name);assert(energy>previous[i],r.name);return{name:r.name,mass:b.mass,energyKJ:energy,increasePercent:(energy/previous[i]-1)*100};});assert(rows[9].energyKJ>Math.max(...rows.slice(0,9).map(r=>r.energyKJ)));for(const layout of[2,4,6] as const){const c=preset(9);c.drive.layout=layout;const parts=compile(c,true).parts;assert.equal(new Set(parts.map(p=>p.id)).size,parts.length,'Distinct wheel IDs for '+layout+'WD');const wheels=new Set(parts.filter(p=>p.body.startsWith('wheel_')).map(p=>p.body));assert.equal(wheels.size,layout);assert(!parts.some(p=>p.id.includes('_upper')||p.id.startsWith('vertical_roll_')));}return rows;
});
await test('Son of Whyachi strikes 36 mm lower with clearance above its own armour',()=>{const c=preset(6),w=c.weapon;assert(w.type==='horizontal_cage');assert.equal(w.mount.y,.119);const low=w.mount.y-Math.max(w.thickness,w.toothHeight)/2,top=c.chassis.height/2+c.armour.find(a=>a.mount==='top')!.thickness;assert(low>top+.01);return{loweredMm:(.155-w.mount.y)*1000,armourGapMm:(low-top)*1000};});
await test('Minotaur and HyperShock drive inverted with powered reversed weapons',()=>{
 return[1,4].map(i=>{const s=make(i),b=s.bots[0];try{pose(s,i===1?.175:.48,true);let start=v();for(let t=0;t<1680;t++){if(t===960)start={...b.chassis.translation()};s.step([{left:t>960?.25:0,right:t>960?.25:0,weapon:t===480,selfRight:false},neutral()]);}assert.equal(s.fault,undefined);assert(s.axis(b,v(0,1,0)).y<-.7);assert(s.omega(b)<-80);assert(b.modules.weapon.functional&&b.modules.weapon_actuator.functional);const travel=length(sub(b.chassis.translation(),start));assert(travel>1,b.compiled.config.identity.name+' inverted travel: '+travel);return{name:b.compiled.config.identity.name,rpm:b.rpm,travel,up:s.axis(b,v(0,1,0)).y};}finally{s.dispose();}});
});
await test('Every vertical spinner reverses its motor direction when inverted',()=>{
 const rows=[];for(let i=0;i<ROSTER.length;i++){const c=preset(i);if(!isSpinner(c.weapon)||isHorizontal(c.weapon))continue;const s=make(i),b=s.bots[0];try{pose(s,2,true);s.world.gravity=v();b.chassis.setBodyType(RAPIER.RigidBodyType.Fixed,true);for(let t=0;t<360;t++)s.step([{...neutral(),weapon:t===0},neutral()]);assert.equal(s.fault,undefined);assert.equal(b.spinDirection,-c.weapon.direction,c.identity.name);assert(s.omega(b)<-1);rows.push({name:c.identity.name,signedRPM:s.omega(b)*30/Math.PI});}finally{s.dispose();}}return rows;
});
await test('HUGE has equal forward and reverse drive speed within two percent',()=>{
 const speeds=[-1,1].map(dir=>{const s=make(7),b=s.bots[0];try{pose(s,.49);let mean=0,n=0;for(let t=0;t<650;t++){s.step([{left:dir*.65,right:dir*.65,weapon:false,selfRight:false},neutral()]);if(t>360&&t<600){mean+=Math.abs(dot(b.chassis.linvel(),s.forward(b)));n++;}}assert.equal(s.fault,undefined);return mean/n;}finally{s.dispose();}});const error=Math.abs(speeds[0]-speeds[1])/Math.max(...speeds);assert(error<.02);return{reverse:speeds[0],forward:speeds[1],differencePercent:error*100};
});
await test('SawBlaze physically self-rights with its saw arm and returns to its driving pose',()=>{
 const s=make(8),b=s.bots[0];try{pose(s,.92,true);for(let t=0;t<480;t++)s.step();assert(s.axis(b,v(0,1,0)).y<0);assert(s.requestSelfRight(b));let recoveredAt=-1,maxStep=0,previous={...b.chassis.translation()};for(let t=0;t<960;t++){s.step();maxStep=Math.max(maxStep,length(sub(previous,b.chassis.translation())));previous={...b.chassis.translation()};if(s.axis(b,v(0,1,0)).y>.9&&recoveredAt<0)recoveredAt=(t+1)/240;}assert.equal(s.fault,undefined);assert(recoveredAt>0&&recoveredAt<3);assert(s.axis(b,v(0,1,0)).y>.95);assert(Math.abs(b.flipAngle)<.08);assert(b.rollWork>0&&b.rollWork<=5000);assert(maxStep<.05);pose(s,.92,true);s.damage(0,'weapon_actuator',1e9);s.tick+=3*RULES.hz;assert.equal(s.requestSelfRight(b),true);return{recoveredSeconds:recoveredAt,armWorkJ:b.rollWork,maxStep};}finally{s.dispose();}
});
await test('Every model has bounded smooth geometry and an always-visible front marker',()=>{
 let parts=0;for(let i=0;i<ROSTER.length;i++){const c=preset(i),marker=frontMarker(c,'#91c9ff');assert(marker.position.z< -c.chassis.length/2);assert.equal((marker.children[0] as any).material.depthTest,false);for(const p of compile(c).parts.filter(p=>p.collides)){const g=finishedGeometry(p,c),a=g.getAttribute('position');assert([...a.array].every(Number.isFinite),c.identity.name+' '+p.id);g.computeBoundingBox();assert(g.boundingBox!.getSize(new Vector3()).length()<2.5,p.id+' envelope');g.dispose();parts++;}marker.traverse((o:any)=>{o.geometry?.dispose();o.material?.dispose();});}return{models:10,parts};
});
if(results.some(r=>r.status==='failed'))process.exitCode=1;
