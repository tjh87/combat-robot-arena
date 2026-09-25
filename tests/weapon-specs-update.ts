import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';
import {Simulation,initializePhysics,neutral,RAPIER,colliderDesc} from '../src/sim';
import {ROSTER,RULES,preset,compile,canonical,encodeBuild,decodeBuild,isSpinner,partProperties,bodyOrigin,armOffset,weaponAxis,v,add,sub,mul,dot,cross,rotate,length,identity,type Vec} from '../src/model';
import {WEAPON_REFERENCES,LB_TO_KG,LBF_TO_N,QUANTUM_HYDRAULICS,quantumBiteForce} from '../src/weapon-specs';
import {weaponReferenceHTML} from '../src/weapon-reference-view';

await initializePhysics();
const results:{name:string,status:string,detail?:unknown,error?:string}[]=[];
async function test(name:string,fn:()=>unknown){if(process.env.CASE&&!name.includes(process.env.CASE))return;try{const detail=await fn();results.push({name,status:'passed',detail});console.log('PASS',name,JSON.stringify(detail));}catch(e){process.exitCode=1;results.push({name,status:'failed',error:String(e)});console.log('FAIL',name,String(e));}writeFileSync('docs/weapon-specs-results.json',JSON.stringify({date:new Date().toISOString(),results},null,2)+'\n');}
function pose(s:Simulation,id:number,p:Vec){const b=s.bots[id];for(const[key,body]of b.bodies){body.setTranslation(add(p,bodyOrigin(b.compiled.config,key)),true);body.setRotation(identity,true);body.setLinvel(v(),true);body.setAngvel(v(),true);}s.world.propagateModifiedBodyPositionsToColliders();}
const make=(i:number)=>new Simulation([preset(i),preset(0)],{practice:true,hazards:false,ai:[false,false],autoUnstick:false});

await test('All 11 references produce legal heavyweights, exact rotor masses and honest source labels',()=>ROSTER.map((r,i)=>{
 const c=compile(preset(i)),w=c.config.weapon,ref=WEAPON_REFERENCES[r.profile],mass=c.parts.filter(p=>p.body==='rotor').reduce((sum,p)=>sum+p.mass,0);
 assert.deepEqual(c.errors,[],r.name);assert(Math.abs(c.mass-113.2)<1e-6);assert.equal(canonical(decodeBuild(encodeBuild(c.config))),canonical(c.config));
 if(isSpinner(w)){assert(Math.abs(mass-ref.massLb!*LB_TO_KG)<1e-7);assert(c.tip<=RULES.tip);assert(w.rpm<=c.availableRPM);assert(Number.isFinite(c.spinup));}
 const dom=new JSDOM(weaponReferenceHTML(c)),text=dom.window.document.body.textContent!;assert(text.includes(isSpinner(w)?'GAME TARGET':'NOT APPLICABLE'));assert.equal(dom.window.document.querySelectorAll('a[href^="https://"]').length,ref.sources.length);assert(text.includes(ref.massBasis==='published'?'PUBLISHED REFERENCE MASS':ref.massBasis==='estimate'?'GAME MASS ESTIMATE':'GAME GEOMETRY ESTIMATE'));dom.window.close();
 return{name:r.name,weaponKg:mass,rpm:isSpinner(w)?w.rpm:null,massBasis:ref.massBasis,speedBasis:ref.speedBasis};
}));

await test('Changing rotor mass changes inertia, spin-up and solver mass; legacy imports stay valid',()=>{
 const c=preset(8);assert(isSpinner(c.weapon));const full=compile(c);c.weapon.massKg!*=.5;const half=compile(c);
 assert(Math.abs(half.rotorInertia/full.rotorInertia-.5)<1e-8);assert(half.spinup<full.spinup*.65);assert(Math.abs(full.mass-half.mass-full.config.weapon.massKg!/2)<1e-7);
 const s=new Simulation([c,preset(0)],{practice:true,hazards:false,ai:[false,false]});try{assert(Math.abs(s.bots[0].rotor!.mass()-c.weapon.massKg!)<.0001);}finally{s.dispose();}
 delete c.weapon.massKg;delete c.chassis.equipmentMassKg;assert.deepEqual(compile(decodeBuild(encodeBuild(c))).errors,[]);
 for(const mass of[-1,0,NaN,Infinity,81]){c.weapon.massKg=mass;assert.throws(()=>compile(c));}
 return{fullInertia:full.rotorInertia,halfInertia:half.rotorInertia,fullSpinup:full.spinup,halfSpinup:half.spinup};
});

await test('Authored centers and moments match Rapier for every part including triangular scoops',()=>{
 const world=new RAPIER.World(v());let count=0,maxError=0;
 try{for(let i=0;i<11;i++)for(const p of compile(preset(i)).parts){const body=world.createRigidBody(RAPIER.RigidBodyDesc.dynamic());world.createCollider(colliderDesc(p),body);const props=partProperties(p),I=body.principalInertia(),q=body.principalInertiaLocalFrame();assert(length(sub(props.centre,body.localCom()))<2e-5,p.id+' center');for(const axis of[v(1,0,0),v(0,1,0),v(0,0,1)]){const a=rotate(axis,{x:-q.x,y:-q.y,z:-q.z,w:q.w}),physical=I.x*a.x*a.x+I.y*a.y*a.y+I.z*a.z*a.z,error=Math.abs(props.about(axis,props.centre)-physical);maxError=Math.max(error,maxError);assert(error<Math.max(3e-5,physical*.001),p.id+' inertia');count++;}world.removeRigidBody(body);}return{moments:count,maxError};}finally{world.free();}
});

await test('HUGE poles lie horizontally at both wheel centers with physical matching endpoints',()=>{
 const c=compile(preset(7)),axleY=c.config.drive.radius-c.config.chassis.height/2-c.config.chassis.clearance;
 const rows=c.parts.filter(p=>p.id.startsWith('large_side_outrigger')).map(p=>{assert(p.shape.kind==='cylinder');const direction=rotate(v(0,1,0),p.rotation),a=sub(p.position,mul(direction,p.shape.width/2)),b=add(p.position,mul(direction,p.shape.width/2));assert(Math.abs(a.y-axleY)<1e-10&&Math.abs(b.y-axleY)<1e-10);assert(Math.abs(a.z)<1e-10&&Math.abs(b.z)<1e-10);assert(Math.abs(b.x-a.x)>.35);return{a,b};});assert.equal(rows.length,2);return rows;
});

await test('SawBlaze hammer motion has zero disc RPM and retains hammer damage with the disc stopped',()=>{
 const s=make(8);try{const b=s.bots[0],w=b.compiled.config.weapon;assert(w.type==='hammer_saw');pose(s,0,v(0,.15,1));const swing=v(-4,0,0);b.arm!.setAngvel(swing,true);b.rotor!.setAngvel(swing,true);for(const body of[b.arm!,b.rotor!])body.setLinvel(cross(swing,sub(body.worldCom(),b.arm!.translation())),true);
 for(const body of b.bodies.values())s.pre.set(body.handle,{p:{...body.translation()},com:{...body.worldCom()},q:{...body.rotation()},lin:{...body.linvel()},ang:{...body.angvel()}});
 assert.equal(s.omega(b),0);const tooth=[...b.colliders.values()].find(c=>s.meta.get(c.handle)?.part?.tooth!==undefined)!,point=add(b.rotor!.translation(),v(0,-.05,-.10)),sample={key:'fixture',a:tooth.handle,b:s.bots[1].colliders.values().next().value!.handle,impulse:100,frictionImpulse:0,closing:2,point,normal:v(0,-1,0)};
 const hit=(s as any).spinnerContact(s.meta.get(tooth.handle),s.bots[1].colliders.values().next().value,sample,1);assert(hit.swingSpeed>.5);assert(hit.speed<1e-5);assert(hit.work<1e-4);assert(hit.damageScale>.99);
 b.rotor!.setAngvel(add(swing,v(100,0,0)),true);assert(Math.abs(s.omega(b)-100)<1e-6);return{hammerSpeed:hit.swingSpeed,discWork:hit.work,hammerDamageScale:hit.damageScale,independentDiscRadPerSecond:s.omega(b)};
 }finally{s.dispose();}
});

await test('Quantum closes quickly in free air, uses 4WD, and releases with zero phantom pressure',()=>{
 const s=make(10);try{const b=s.bots[0],w=b.compiled.config.weapon;assert(w.type==='crusher');assert.equal(b.compiled.config.drive.layout,4);let closed=-1,maxPressure=0,peakPower=0,maxWork=0;for(let t=0;t<1000;t++){s.step([{...neutral(),weapon:t===0},neutral()]);if(closed<0&&Math.abs(b.crushAngle+w.travel)<.04)closed=t/RULES.hz;maxPressure=Math.max(maxPressure,b.crushForce);peakPower=Math.max(peakPower,b.weaponWatts);maxWork=Math.max(maxWork,b.crushWork);}assert.equal(s.fault,undefined);assert(closed>0&&closed<.65);assert.equal(maxPressure,0);assert.equal(b.weaponOn,false);assert(peakPower<=3500.001);assert(maxWork<=12000.001);assert(Math.abs(b.crushAngle)<.05);return{closeSeconds:closed,maxPressure,peakPower,maxWork};}finally{s.dispose();}
});

await test('A struck Quantum jaw cannot brake with torque beyond its actuator rating',()=>{
 const s=make(10);try{const b=s.bots[0],w=b.compiled.config.weapon;assert(w.type==='crusher');pose(s,0,v(0,2,1));b.weaponOn=true;b.crushStart=s.tick;const rows=[];
 for(const speed of[-100,100]){b.rotor!.setAngvel(v(speed,0,0),true);b.crushContactTicks=1;(s as any).motors(b);assert(b.actuatorTorque>=-w.torque&&b.actuatorTorque<=w.torque*.45);assert(b.weaponWatts<=QUANTUM_HYDRAULICS.pumpWatts+.001);assert(b.actuatorTorque*speed<0);rows.push({jawRadPerSecond:speed,brakingTorqueNm:b.actuatorTorque});}return rows;
 }finally{s.dispose();}
});

await test('Quantum front and rear contact pressure follows 35000 and 50000 lbf with bounded pump work',()=>{
 assert(Math.abs(quantumBiteForce(.66,.66)/LBF_TO_N-35000)<1e-6);assert(Math.abs(quantumBiteForce(.66,.462)/LBF_TO_N-50000)<1e-6);
 return ['front','rear'].map(kind=>{const s=make(10);try{const b=s.bots[0];pose(s,0,v(0,.09,1));const block=s.world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(.0936,kind==='front'?.16:.215,1+(kind==='front'?-.535:-.352))),col=s.world.createCollider(RAPIER.ColliderDesc.cuboid(.06,.04,.045).setCollisionGroups((4<<16)|2),block);s.meta.set(col.handle,{bot:1,module:'armour_top',part:s.bots[1].compiled.parts.find(p=>p.module==='armour_top')});let peak=0,pressureTicks=0,power=0;
 for(let t=0;t<860;t++){s.step([{...neutral(),weapon:t===60},neutral()]);peak=Math.max(peak,b.crushForce);if(b.crushPhase==='pressure')pressureTicks++;power=Math.max(power,b.weaponWatts);}
 assert.equal(s.fault,undefined);assert(pressureTicks>30,kind+' contact did not hold');assert(peak>(kind==='front'?34000:47000)*LBF_TO_N,kind+' pressure too low');assert(peak<=QUANTUM_HYDRAULICS.rearForce+.1);assert(power<=3500.001);assert(b.crushWork<=12000.001);assert(s.events.some(e=>e.cause==='crush'&&e.allocations.length));return{kind,forceLbf:peak/LBF_TO_N,pressureTicks,pumpWatts:power,workJ:b.crushWork};}finally{s.dispose();}});
});

await test('Quantum auto release retreats two full robot lengths then re-engages without another bite',()=>{
 const s=new Simulation([preset(10),preset(0)],{practice:true,hazards:false,ai:[true,false],autoUnstick:false,difficulty:'hard'});try{pose(s,0,v(0,.09,0));pose(s,1,v(0,.14,-4));const b=s.bots[0];b.weaponOn=true;b.crushStart=-10000;let releaseStart:Vec|undefined,limit=0,maximum=0,states=0,finished=false;
 for(let t=0;t<2200;t++){s.step();if(b.gripRelease&&!releaseStart){releaseStart={...b.gripRelease.p};limit=b.gripRelease.distance;}if(releaseStart){maximum=Math.max(maximum,b.chassis.translation().z-releaseStart.z);if(b.ai.state==='release'){states++;assert.equal(b.weaponOn,false);}else if(states>0){finished=true;break;}}}
 assert.equal(s.fault,undefined);assert(finished);assert(limit===2*b.compiled.envelope.z);assert(maximum>limit-.12&&maximum<limit+.08,JSON.stringify({maximum,limit}));return{targetM:limit,actualM:maximum,releaseFrames:states,nextState:b.ai.state};}finally{s.dispose();}
});
