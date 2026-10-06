import {componentProfile,componentConfig} from './model';
import {impactEnergy,normalKineticEnergy} from './impact-energy';
import {hydraSleekWheels,hydraBearingDrag} from './hydra-wheels';
import {WallDamage,isArenaWall,type WallCrack} from './wall-damage';
import {batteryAlongRay,batteryZones,BATTERY_CRUSH_RESISTANCE} from './battery-layout';
import {createHazards,stepHazard,hazardContactCentre,type Hazard} from './arena-hazards';
export type {Hazard} from './arena-hazards';
import RAPIER from '@dimforge/rapier3d-compat';
import {HitReadouts,type HitReadout} from './hit-readouts';
import {contactSparkDirection} from './impact-sparks';
import {MatchHighlights} from './match-highlights';
import {toothBite,remainingSpin} from './weapon-impact';
import {colliderBounds,previousColliderPose,cacheColliderGeometry} from './arena-wall';
import {BATTERY_FIRE,HUGE_WHEEL_DAMAGE_SCALE,damageStatus,contactDamage} from './combat-damage';
import {QUANTUM_HYDRAULICS,quantumBiteForce} from './weapon-specs';
import {HUGE_HANDLING,hugeDriveDuty} from './huge-handling';
import {LANDING,landingEnergy} from './landing-impact';
import {RULES,feedPerTooth,batteryPosition,wheelBase,wheelCentreZ,isRampPart,strikeMultiplier,verticalSelfRight,unlimitedFlips,flipEnergy,selfRightKind,SLOTS,MATERIALS,MOTORS,ROSTER,isSpinner,isHorizontal,weaponAxis,bodyOrigin,armOffset,matchColors,compile,canonical,partProperties,motorModel,driveMotorStep,spinnerMotor,copy,preset,rng,v,add,sub,mul,dot,cross,length,horizontal,rotate,axisQ,quatMul,identity,clamp,type BotConfig,type Compiled,type Part,type Slot,type Module,type Vec,type Quat,type Material} from './model';
export {RAPIER};
let initPromise:Promise<void>|undefined;
export function initializePhysics(){return initPromise??=RAPIER.init().catch(e=>{initPromise=undefined;throw e;});}
export type Command={left:number,right:number,weapon:boolean,selfRight:boolean};
export const neutral=():Command=>({left:0,right:0,weapon:false,selfRight:false});
export type Difficulty='easy'|'medium'|'hard';
export type Transform={id:string,p:Vec,q:Quat};
export type VisualFrame={wallCracks?:readonly WallCrack[],tick:number,transforms:Transform[],health:number[][],effects:{id:number,tick:number,p:Vec,energy:number,damage?:number,direction?:Vec}[],hits?:HitReadout[],speeds?:number[],tracks?:number[][],rpm?:number[],directions?:number[],firePoints?:Vec[],fires?:number[]};
export type ImpactEvent={id:number,tick:number,episode:string,source:string,attacker:number|null,target:number|null,module:Slot|'arena',energy:number,impulse:number,closing:number,point:Vec,rotorBefore:number[],rotorAfter:number[],allocations:{bot:number,module:Slot,energy:number,hp:number}[],cause:string;robotSpeed?:[number,number];translationEnergy?:number;rotationalEnergy?:number;otherContactEnergy?:number;penetrationDirection?:Vec;breaches?:{target:number,slot:string,point:Vec,work:number}[];releasedTick?:number;fallHeight?:number;fallMassKg?:number;fallSpeed?:number;fallKineticJ?:number;fallGravityJ?:number;fallAbsorbedJ?:number;damageScale?:number;biteDepth?:number;engagement?:number;sparkDirection?:Vec};
export type ContactSample={key:string,a:number,b:number,impulse:number,frictionImpulse:number,closing:number,point:Vec,normal:Vec};
export type Travel={impactId:number,bot:number,role:'Post-impact travel'|'Recoil travel',origin:Vec,final:Vec,comOrigin:Vec,comFinal:Vec,maxHorizontal:number,horizontal:number,displacement3d:number,path:number,height:number,airtime:number,powered:boolean,compound:boolean,reason:string,ticks:number,still:number,points:Vec[],airborne:boolean,landed:number,endedTick?:number};
export type RingOut={bot:number,origin:Vec,height:number,distance:number};
export type Result={ringOut?:RingOut,winner:0|1,reason:string,tick:number,scores:[number[],number[]],metrics:[number[],number[]],ties:string[],damage:number[],raw:{engage:number[],closing:number[],pin:number[],forced:number[],stable:number[]}};
type ColliderInfo={bot:number|null,module:Slot|'arena',part?:Part,hazard?:number};
type Episode={id:string,last:number,energy:number,impulse:number,peak:number,event?:ImpactEvent};
type BodyState={p:Vec,com:Vec,q:Quat,lin:Vec,ang:Vec};
type FallState={peakY:number,airTicks:number,lastContact:number,landing?:{event:ImpactEvent,budget:number,absorbed:number}};
type AIObs={tick:number,p:Vec,q:Quat,forward:Vec,other:Vec,otherQ:Quat,speed:number,yawRate:number,rpm:number,rpmScale:number,up:number,pin:number,charge:number,enabled:boolean,weaponOn:boolean,weaponWorks:boolean,lastFire:number,flipStart:number,flipAngle:number,lastSelfRight:number,driveLeft:boolean,driveRight:boolean};
export type Bot={id:0|1;batteryFire?:{localPoint?:Vec,started:number,until:number,attacker:0|1,event:ImpactEvent};compiled:Compiled;driveInertia:Map<string,number>;chassis:RAPIER.RigidBody;rotor?:RAPIER.RigidBody;arm?:RAPIER.RigidBody;roll?:RAPIER.RigidBody;bodies:Map<string,RAPIER.RigidBody>;colliders:Map<string,RAPIER.Collider>;joints:Map<string,RAPIER.ImpulseJoint>;modules:Record<Slot,Module>;startHP:Record<Slot,number>;energy:number;charges:number;weaponOn:boolean;driveSign:1|-1;spinDirection:1|-1;rpm:number;rotorEnergy:number;flipStart:number;flipWork:number;flipAngle:number;rollStart:number;gyroDance?:{ticks:number,settled:number,direction?:number,braking?:boolean};autoRightTicks:number;rollWork:number;rollSettling:boolean;rollStowAt:number;rollStowAngle:number;resumeWeapon:boolean;lastSelfRight:number;lastManualRecovery:number;flipDepth:number;crushAngle:number;crushForce:number;crushContactTicks:number;crushPhase:'closing'|'pressure'|'opening';crushWork:number;crushStart:number;crushEvent?:ImpactEvent;trackPhase?:[number,number];driveRamp:[number,number];gripRelease?:{tick:number,p:Vec,back:Vec,distance:number,travelled:number,lastP:Vec};lastFire:number;command:Command;grounded:boolean;groundTicks:number;powerWork:number;weaponWatts:number;actuatorTorque:number;unstick:{active:boolean,since:number,attempt:number};count:number;pending:number;recovery:number;history:{tick:number,p:Vec,ground:boolean,powered:boolean}[];fouls:number;wall:boolean;pinVictim:boolean;ai:{state:string,reason:string,since:number,command:Command,history:AIObs[],lastProgress:Vec,progressTick:number,waypoint?:Vec,lastWeaponRequest:number,lastFireRequest:number,lastRightRequest:number};lastAction:number;lastHazard:number;lastAttacker:number|null;engage:number;closing:number;pin:number;forced:number;stable:number;faults:string[];};
export type SimOptions={prediction?:boolean,predictionSide?:number,recordVisuals?:boolean,seed?:number,practice?:boolean,hazards?:boolean,ai?:[boolean,boolean],difficulty?:Difficulty,condition?:Record<Slot,number>,conditionBySide?:[Record<Slot,number>|undefined,Record<Slot,number>|undefined],allowDamaged?:boolean,autoUnstick?:boolean};
export const AI_SETTINGS={easy:{delay:60,aim:15,ready:.4},medium:{delay:29,aim:7,ready:.6},hard:{delay:15,aim:2,ready:.75}};
const groups=(membership:number,filter:number)=>(membership<<16)|filter;
export function colliderDesc(p:Part){let d:RAPIER.ColliderDesc;if(p.shape.kind==='box'){const s=p.shape.size;d=RAPIER.ColliderDesc.cuboid(s.x/2,s.y/2,s.z/2);}else if(p.shape.kind==='cylinder')d=RAPIER.ColliderDesc.cylinder(p.shape.width/2,p.shape.radius);else{const hull=RAPIER.ColliderDesc.convexHull(new Float32Array(p.shape.vertices));if(!hull)throw Error('Invalid convex part: '+p.id);d=hull;}d.setMass(p.mass);
 if(p.analyticPrism){
  // Exact prism moments avoid float32 hull integration errors at narrow SVG edges.
  const props=partProperties({...p,position:v(),rotation:identity}),centre=props.centre;
  const ix=props.about(v(1,0,0),centre),iy=props.about(v(0,1,0),centre),iz=props.about(v(0,0,1),centre);
  const yz=props.about(v(0,Math.SQRT1_2,Math.SQRT1_2),centre)-(iy+iz)/2,mean=(iy+iz)/2,split=Math.hypot((iy-iz)/2,yz);
  d.setMassProperties(p.mass,centre,v(ix,mean+split,mean-split),axisQ(v(1,0,0),Math.atan2(2*yz,iy-iz)/2));
 }
 return d.setContactSkin(.001).setTranslation(p.position.x,p.position.y,p.position.z).setRotation(p.rotation);}
export const protectedWeaponModule=(slot:Slot)=>slot==='weapon'||slot==='weapon_actuator';
export function panelLoss(energy:number,resistance:number,hp:number){return Math.min(hp,Math.max(0,energy)/resistance);}
// Rapier 0.19 keeps free angular velocity constant. Supply the missing Euler
// inertial term with an implicit step; it cannot add rotational energy.
export function gyroInertialTorque(body:RAPIER.RigidBody,dt:number=RULES.dt){
 const q=quatMul(body.rotation(),body.principalInertiaLocalFrame()),local=rotate(body.angvel(),{x:-q.x,y:-q.y,z:-q.z,w:q.w}),I=body.principalInertia(),weighted=(w:Vec)=>v(I.x*w.x,I.y*w.y,I.z*w.z);
 if(Math.min(I.x,I.y,I.z)<1e-6)return v();let next={...local};
 for(let j=0;j<4;j++){
  const momentum=weighted(next),residual=add(weighted(sub(next,local)),mul(cross(next,momentum),dt));
  const columns=[v(1,0,0),v(0,1,0),v(0,0,1)].map(e=>add(weighted(e),mul(add(cross(e,momentum),cross(next,weighted(e))),dt))),[a,b,c]=columns,det=dot(a,cross(b,c));
  if(Math.abs(det)<1e-12)return v();const delta=v(dot(residual,cross(b,c))/det,dot(a,cross(residual,c))/det,dot(a,cross(b,residual))/det);next=sub(next,delta);
 }
 if(!Number.isFinite(length(next))||dot(next,weighted(next))>dot(local,weighted(local))+1e-5)return v();
 return rotate(mul(weighted(sub(next,local)),1/dt),q);
}
export function workLimitedTorque(torque:number,omega:number,inverseInertia:number,remaining:number){const work=(scale:number)=>Math.max(0,torque*scale*omega*RULES.dt+.5*(torque*scale)**2*inverseInertia*RULES.dt**2);let scale=1;if(work(1)>remaining){let low=0,high=1;for(let i=0;i<24;i++){const mid=(low+high)/2;if(work(mid)>remaining)high=mid;else low=mid;}scale=low;}return{torque:torque*scale,work:work(scale)};}
export function assignPoints(metrics:[number[],number[]],seed:number):{scores:[number[],number[]],ties:string[]}{const scores:[number[],number[]]=[[],[]],ties:string[]=[];for(let c=0;c<3;c++){const a=metrics[0][c],b=metrics[1][c],total=a+b,share=total?Math.max(a,b)/total:.5;let lead=a===b?((seed+c)%2):a>b?0:1;if(a===b)ties.push(['Damage','Aggression','Control'][c]);const points=c===0?(share<.65?3:share<.85?4:5):(share<.75?2:3);scores[lead][c]=points;scores[1-lead][c]=(c===0?5:3)-points;}return{scores,ties};}

export class Simulation{
 wallDamage=new WallDamage();
 private substepContacts?:ContactSample[];private floorSupport=new Set<number>();private falls=new Map<number,FallState>();
 world:RAPIER.World;queue:RAPIER.EventQueue;startedContacts=new Set<string>();robotsInContact=false;pushImpulse=[0,0];hammerFloorWork=new Map<string,number>();driveWork=[0,0];bots:Bot[]=[];tick=0;seed:number;random:()=>number;options:Required<Pick<SimOptions,'practice'|'hazards'|'ai'|'difficulty'|'autoUnstick'>>;
 private prediction=false;private predictionSide=0;private recordVisuals=true;
 highlights=new MatchHighlights();private hitReadouts=new HitReadouts();private lastHitClips=new Map<number,{event:number,tick:number,frames:VisualFrame[]}>();
 meta=new Map<number,ColliderInfo>();bodyIds=new Map<number,string>();hazards:Hazard[]=[];episodes=new Map<string,Episode>();events:ImpactEvent[]=[];travels:Travel[]=[];tracking=new Map<number,Travel>();debris:{body:RAPIER.RigidBody,part:Part,id:string}[]=[];frames:VisualFrame[]=[];result?:Result;fault?:string;notices:string[]=[];pre=new Map<number,BodyState>();nextImpact=1;disposed=false;physicsMs=0;pinState={attacker:-1,victim:-1,ticks:0,releaseAt:0,fouled:false};tiePreference:number;probeCandidates=0;
 constructor(configs:[BotConfig,BotConfig],opt:SimOptions={}){
 this.prediction=opt.prediction??false;this.predictionSide=opt.predictionSide??0;this.recordVisuals=opt.recordVisuals??true;this.seed=opt.seed??42673;this.random=rng(this.seed);const entrants=configs.map((c,id)=>({id,key:c.identity.name+canonical(c)})).sort((a,b)=>a.key<b.key?-1:a.key>b.key?1:0);this.tiePreference=entrants[Math.floor(this.random()*2)].id;this.options={practice:opt.practice??false,hazards:opt.hazards??true,ai:opt.ai??[false,true],difficulty:opt.difficulty??'medium',autoUnstick:opt.autoUnstick??true};
 for(const config of configs){const errors=compile(config,this.options.practice).errors;if(errors.length)throw Error(errors.map(e=>e.message).join(' '));}if(opt.condition&&Object.values(opt.condition).some(hp=>!Number.isFinite(hp)))throw Error('Invalid module condition');
 this.queue=new RAPIER.EventQueue(true);this.world=new RAPIER.World(v(0,-9.81,0));this.world.timestep=RULES.dt;this.world.numSolverIterations=RULES.solverIterations;this.world.maxCcdSubsteps=RULES.ccdSubsteps;
 configs=matchColors(configs);this.arena();for(let i=0;i<2;i++)this.bots.push(this.makeBot(configs[i],i as 0|1,opt.conditionBySide?.[i]??(i===0?opt.condition:undefined)));
 this.capture();
 }
 private arena(){
 const fixed=(name:string,size:Vec,pos:Vec,friction=.8)=>{const body=this.world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(pos.x,pos.y,pos.z));const col=this.world.createCollider(RAPIER.ColliderDesc.cuboid(size.x/2,size.y/2,size.z/2).setFriction(friction).setRestitution(.05).setCollisionGroups(groups(1,31)),body);this.meta.set(col.handle,{bot:null,module:'arena'});this.bodyIds.set(body.handle,name);};
 fixed('floor',v(RULES.floor+.6,.3,RULES.floor+.6),v(0,-.15,0));const edge=RULES.floor/2;
 const h=RULES.wallHeight,t=RULES.wallThickness,span=RULES.floor+2*t;
 fixed('north',v(span,h,t),v(0,h/2,-edge-t/2));fixed('south',v(span,h,t),v(0,h/2,edge+t/2));fixed('west',v(t,h,span),v(-edge-t/2,h/2,0));fixed('east',v(t,h,span),v(edge+t/2,h/2,0));
 fixed('shelf',v(3.3,.32,1.4),v(0,.16,-5.9));
 if(!this.options.hazards)return;
 this.hazards=createHazards(this.world,(col,id)=>this.meta.set(col.handle,{bot:null,module:'arena',hazard:id}));
 for(const h of this.hazards)this.bodyIds.set(h.body.handle,'hazard_'+h.id);
 }
 private makeBot(config:BotConfig,id:0|1,condition?:Record<Slot,number>):Bot{
 const compiled=compile(config,this.options.practice),c=compiled.config;if(compiled.errors.length)throw Error(compiled.errors.map(x=>x.message).join(' '));
 const yaw=id===0?-Math.PI/2:Math.PI/2,rotation=axisQ(v(0,1,0),yaw),origin=v(id===0?-3.6:3.6,c.chassis.height/2+c.chassis.clearance+.008,0);
 const bodies=new Map<string,RAPIER.RigidBody>(),colliders=new Map<string,RAPIER.Collider>(),joints=new Map<string,RAPIER.ImpulseJoint>();
 const chassis=this.world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(origin.x,origin.y,origin.z).setRotation(rotation).setCcdEnabled(true).setLinearDamping(.03).setAngularDamping(.04));bodies.set('chassis',chassis);this.bodyIds.set(chassis.handle,`b${id}:chassis`);
 const modules=copy(compiled.modules);if(condition)for(const s of SLOTS){modules[s].hp=clamp(condition[s]??modules[s].max,0,modules[s].max);modules[s].functional=modules[s].present&&(modules[s].hp>0||protectedWeaponModule(s));}
 for(const p of compiled.parts){if(!modules[p.module].functional&&p.module.startsWith('armour_'))continue;
 let body=bodies.get(p.body);let local=p;
 if(!body){const mount=bodyOrigin(c,p.body);const world=add(origin,rotate(mount,rotation));body=this.world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(world.x,world.y,world.z).setRotation(rotation).setCcdEnabled(true));bodies.set(p.body,body);this.bodyIds.set(body.handle,`b${id}:${p.body}`);
 const armParent=p.body==='rotor'&&c.weapon.type==='hammer_saw',parent=armParent?bodies.get('weapon_arm')!:chassis,anchor=armParent?armOffset(c.weapon as import('./model').Spinner):mount;const axis=p.body==='rotor'?weaponAxis(c.weapon):p.body==='self_right'&&componentProfile(c,'selfRight')==='gigabyte'?v(0,0,1):v(1,0,0);const data=RAPIER.JointData.revolute(anchor,v(),axis);const joint=this.world.createImpulseJoint(data,parent,body,true) as RAPIER.RevoluteImpulseJoint;joint.setContactsEnabled(false);if(p.body==='rotor'&&c.weapon.type==='flipper')joint.setLimits(-.025,c.weapon.travel);if(p.body==='rotor'&&c.weapon.type==='crusher')joint.setLimits(-c.weapon.travel,.025);if(p.body==='self_right'&&!verticalSelfRight(c))joint.setLimits(componentProfile(c,'selfRight')==='gigabyte'?-.02:-2.5,componentProfile(c,'selfRight')==='gigabyte'?3.1:.02);if(p.body.startsWith('ground_fork_'))joint.setLimits(componentProfile(c,'weapon')==='sawblaze'?-.02:-.12,componentProfile(c,'weapon')==='sawblaze'?.015:.18);if(p.body==='weapon_arm'&&c.weapon.type==='hammer_saw')joint.setLimits(-(c.weapon.armTravel??1.12),Math.PI-(c.weapon.armTravel??1.12));joints.set(p.body,joint);}
 if(p.body.startsWith('wheel_'))local={...p,position:sub(p.position,bodyOrigin(c,p.body))};
 const ramp=isRampPart(p),skid=ramp||/^(frame_skid|drum_bearing|saw_guard|saw_rear_skid|large_(front|tail|side)|vertical_tail)/.test(p.id),desc=colliderDesc(local).setContactSkin(ramp?(unlimitedFlips(c)?.0002:.0005):.001).setFriction(p.material==='rubber'?(c.drive.traction==='tracks'?2.6:componentProfile(c,'drive')==='quantum'?1.8:componentProfile(c,'drive')==='gigabyte'?1.7:1.35):skid?.12:.55).setRestitution(skid?0:.06).setCollisionGroups(p.collides?groups(id===0?2:4,id===0?21:19):0).setSensor(!p.collides).setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS);
 // Sliding steel tips must not inherit the floor's high tyre-grip coefficient.
 if(skid)desc.setFrictionCombineRule(RAPIER.CoefficientCombineRule.Min);
 if(p.material==='rubber'&&(componentProfile(c,'drive')==='quantum'||componentProfile(c,'drive')==='gigabyte'||c.drive.traction==='tracks'))desc.setFrictionCombineRule(RAPIER.CoefficientCombineRule.Max);
 if((componentProfile(c,'drive')==='huge'&&c.drive.traction!=='tracks'||hydraSleekWheels(c))&&p.body.startsWith('wheel_'))desc.setCollisionGroups(0);
 const collider=this.world.createCollider(desc,body);colliders.set(p.id,collider);this.meta.set(collider.handle,{bot:id,module:p.module,part:p});}
 // Continuous rounded wheel contacts prevent gaps between visual spokes and
 // tread sectors from catching the floor, rails or an opponent's wedge.
 if(componentProfile(c,'drive')==='huge'&&c.drive.traction!=='tracks')for(const [key,body]of bodies)if(key.startsWith('wheel_')){
  const part=compiled.parts.find(p=>p.body===key)!,edge=Math.min(.008,c.drive.width*.2),desc=RAPIER.ColliderDesc.roundCylinder(c.drive.width/2-edge,c.drive.radius-edge,edge).setRotation(axisQ(v(0,0,1),Math.PI/2)).setDensity(0).setFriction(HUGE_HANDLING.friction).setFrictionCombineRule(RAPIER.CoefficientCombineRule.Max).setRestitution(.03).setContactSkin(.001).setCollisionGroups(groups(id===0?2:4,id===0?21:19)).setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS);
  const collider=this.world.createCollider(desc,body);colliders.set(key+'_contact',collider);this.meta.set(collider.handle,{bot:id,module:part.module,part:{...part,id:key+'_contact'}});
 }
  if(hydraSleekWheels(c))for(const[key,body]of bodies)if(key.startsWith('wheel_')){
   const part=compiled.parts.find(p=>p.body===key)!,edge=Math.min(.0012,c.drive.width*.08),desc=RAPIER.ColliderDesc.roundCylinder(c.drive.width/2-edge,c.drive.radius-edge,edge).setRotation(axisQ(v(0,0,1),Math.PI/2)).setMass(0).setFriction(1.35).setRestitution(.06).setContactSkin(.001).setCollisionGroups(groups(id===0?2:4,id===0?21:19)).setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS);
   const collider=this.world.createCollider(desc,body);colliders.set(key+'_contact',collider);this.meta.set(collider.handle,{bot:id,module:part.module,part:{...part,id:key+'_contact'}});
  }
 const startHP={} as Record<Slot,number>;SLOTS.forEach(s=>startHP[s]=modules[s].hp);
 const driveInertia=new Map<string,number>();for(const[id,body]of bodies)if(id.startsWith('wheel_')){const q=body.principalInertiaLocalFrame(),a=rotate(v(1,0,0),{x:-q.x,y:-q.y,z:-q.z,w:q.w}),I=body.principalInertia(),wheel=I.x*a.x*a.x+I.y*a.y*a.y+I.z*a.z*a.z;driveInertia.set(id,1/(1/Math.max(.00001,wheel)+1/compiled.inertia.x));}
 return{id,compiled,driveInertia,chassis,rotor:bodies.get('rotor'),arm:bodies.get('weapon_arm'),roll:bodies.get('self_right'),bodies,colliders,joints,modules,startHP,energy:c.battery.capacityWh*3600,charges:c.weapon.type==='flipper'?c.weapon.charges:0,weaponOn:false,driveSign:1,spinDirection:isSpinner(c.weapon)?c.weapon.direction:1,rpm:0,rotorEnergy:0,flipStart:-1,flipWork:0,flipAngle:0,rollStart:-1,autoRightTicks:0,rollWork:0,rollSettling:false,rollStowAt:0,rollStowAngle:0,resumeWeapon:false,lastSelfRight:-10000,lastManualRecovery:-10000,flipDepth:0,crushAngle:0,crushForce:0,crushContactTicks:0,crushPhase:'opening',crushWork:0,crushStart:-1,driveRamp:[0,0],lastFire:-10000,command:neutral(),grounded:false,groundTicks:0,powerWork:0,weaponWatts:0,actuatorTorque:0,unstick:{active:false,since:0,attempt:0},count:0,pending:0,recovery:0,history:[],fouls:0,wall:false,pinVictim:false,ai:{state:'spin up',reason:'Prepare weapon',since:0,command:neutral(),history:[],lastProgress:origin,progressTick:0,lastWeaponRequest:-10000,lastFireRequest:-10000,lastRightRequest:-10000},lastAction:-10000,lastHazard:-10000,lastAttacker:null,engage:0,closing:0,pin:0,forced:0,stable:0,faults:[]};
 }
 get time(){return this.tick/RULES.hz;}
 get remaining(){return Math.max(0,180-(this.result?.tick??this.tick)/RULES.hz);}
 manualRecoveryReady(b:Bot){
  if(this.result||this.fault||!this.powered(b)||!b.modules.drive_left.functional&&!b.modules.drive_right.functional||this.tick-b.lastManualRecovery<5*RULES.hz)return false;
  if(length(b.chassis.linvel())>.8)return false;
  const first=b.history[0],settled=first&&this.tick-first.tick>=.8*RULES.hz&&Math.abs(first.p.y-b.chassis.translation().y)<.06;
  return !!(b.count>0||settled&&(this.axis(b,v(0,1,0)).y<.65||b.pinVictim||b.wall&&horizontal(first.p,b.chassis.translation())<.08));
 }
 manualUnstick(onlyBot?:number){
  const recovered:string[]=[];
  for(const b of this.bots){if(onlyBot!==undefined&&b.id!==onlyBot)continue;if(!this.manualRecoveryReady(b))continue;
   const c=b.compiled.config,old=b.chassis.translation(),f=this.forward(b),yaw=Math.hypot(f.x,f.z)>.1?Math.atan2(-f.x,-f.z):0,q=axisQ(v(0,1,0),yaw),y=c.chassis.height/2+c.chassis.clearance+.018;
   // Conservative clear space around the full build keeps weapons away from
   // walls, hazards and the other robot after the manual reset.
   const radius=Math.max(c.chassis.length,c.chassis.width)/2+(isSpinner(c.weapon)?c.weapon.radius:0)+.30,edge=RULES.floor/2-radius-.25,candidates:Vec[]=[];
   for(const d of[.65,1.3,2.1,3.1])for(let j=0;j<12;j++){const a=j*Math.PI/6;candidates.push(v(clamp(old.x+Math.cos(a)*d,-edge,edge),y,clamp(old.z+Math.sin(a)*d,-edge,edge)));}
   candidates.push(v(b.id?3:-3,y,0),v(0,y,2.5),v(0,y,-2.5));candidates.sort((a,z)=>horizontal(a,old)-horizontal(z,old));
   const other=this.bots[1-b.id],otherRadius=Math.max(other.compiled.envelope.x,other.compiled.envelope.z)/2+.35,shape=new RAPIER.Cylinder(Math.max(.45,b.compiled.envelope.y)/2,radius),spot=candidates.find(p=>horizontal(p,other.chassis.translation())>radius+otherRadius&&!this.hazards.some(h=>horizontal(p,h.base)<radius+.6)&&!this.world.intersectionWithShape(v(p.x,Math.max(.45,b.compiled.envelope.y)/2+.025,p.z),identity,shape,undefined,undefined,undefined,undefined,col=>{const m=this.meta.get(col.handle);return !col.isSensor()&&m?.bot!==b.id&&this.bodyIds.get(col.parent()!.handle)!=='floor';}));
   if(!spot)continue;
   this.closeTravel(b.id,'Manual recovery');this.falls.delete(b.id);this.floorSupport.delete(b.id);
   for(const[id,body]of b.bodies){body.setTranslation(add(spot,rotate(bodyOrigin(c,id),q)),true);body.setRotation(q,true);body.setLinvel(v(),true);body.setAngvel(v(),true);body.resetForces(false);body.resetTorques(false);this.pre.delete(body.handle);}
   Object.assign(b,{lastManualRecovery:this.tick,count:0,pending:0,recovery:0,history:[],grounded:false,groundTicks:0,driveSign:1,rpm:0,rotorEnergy:0,flipStart:-1,flipAngle:0,rollStart:-1,gyroDance:undefined,autoRightTicks:0,rollSettling:false,rollStowAt:0,rollStowAngle:0,resumeWeapon:false,crushStart:-1,crushAngle:0,crushForce:0,crushContactTicks:0,crushPhase:'opening',crushWork:0,crushEvent:undefined,driveRamp:[0,0],gripRelease:undefined,command:neutral(),wall:false,pinVictim:false});b.unstick.active=false;b.ai.history=[];b.ai.lastProgress={...spot};b.ai.progressTick=this.tick;
   this.world.propagateModifiedBodyPositionsToColliders();recovered.push(c.identity.name);
  }
  if(recovered.length){this.pinState={attacker:-1,victim:-1,ticks:0,releaseAt:0,fouled:false};this.frames=[];this.episodes.clear();this.capture();this.notice('Unstuck: '+recovered.join(' and '));}
  return recovered;
 }
 powered(b:Bot){return b.energy>0&&b.modules.battery.functional;}
 // Arcade weapons have a protected supply. Hull, armour and drive still take
 // damage; collisions may slow a rotor, but its motor always spins it up again.
 weaponPowered(b:Bot){return !!b.rotor&&b.modules.weapon.present&&b.modules.weapon_actuator.present;}
 axis(b:Bot,axis:Vec){return rotate(axis,b.chassis.rotation());}
 omega(b:Bot){if(!b.rotor)return 0;const parent=b.arm??b.chassis,axis=rotate(weaponAxis(b.compiled.config.weapon),parent.rotation());return dot(sub(b.rotor.angvel(),parent.angvel()),axis);}
 forward(b:Bot){if(componentProfile(b.compiled.config,'drive')==='huge'){const f=cross(v(0,1,0),this.axis(b,v(1,0,0)));return mul(f,1/Math.max(.001,length(f)));}return this.axis(b,v(0,0,-1));}
 wholeCOM(b:Bot){let p=v(),mass=0;for(const body of b.bodies.values()){const m=body.mass();mass+=m;p=add(p,mul(body.worldCom(),m));}return mass?mul(p,1/mass):b.chassis.translation();}
 totalMass(b:Bot){return [...b.bodies.values()].reduce((s,x)=>s+x.mass(),0);}
 command(bot:number,cmd:Command){this.bots[bot].command={left:clamp(cmd.left,-1,1),right:clamp(cmd.right,-1,1),weapon:!!cmd.weapon,selfRight:!!cmd.selfRight};}
 private torquePair(b:Bot,body:RAPIER.RigidBody,axis:Vec,torque:number,parent=b.chassis,reaction=1){body.addTorque(mul(axis,torque),true);parent.addTorque(mul(axis,-torque*reaction),true);}
 private spend(b:Bot,joules:number){const cost=Math.min(b.energy,Math.max(0,joules));b.energy=Math.max(0,b.energy-cost);return cost;}
 requestFire(b:Bot){const w=b.compiled.config.weapon;if(w.type!=='flipper'||!this.weaponPowered(b))return false;if(b.flipStart>=0||this.tick-b.lastFire<1.5*RULES.hz){if(!this.options.ai[b.id])this.notice('Flipper is recharging');return false;}b.flipStart=this.tick;b.lastFire=this.tick;b.flipWork=0;b.flipDepth=this.flipperInsertion(b);return true;}
 flipperInsertion(b:Bot){
  const w=b.compiled.config.weapon;if(w.type!=='flipper')return 0;const other=this.bots[1-b.id],q=b.chassis.rotation(),inv={x:-q.x,y:-q.y,z:-q.z,w:q.w},p=rotate(sub(other.chassis.translation(),b.chassis.translation()),inv),o=other.compiled.config.chassis;
  const forward=rotate(this.axis(other,v(0,0,1)),inv),side=rotate(this.axis(other,v(1,0,0)),inv),half=Math.abs(forward.z)*o.length/2+Math.abs(side.z)*o.width/2;
  if(p.z>=0||Math.abs(p.x)>o.width/2+w.width/2)return 0;return clamp((p.z+half-(w.mount.z-w.length))/w.length,0,1);
 }
 flipOpportunity(b:Bot){
  const c=b.compiled.config,w=c.weapon,wait=Math.max(0,1.5-(this.tick-b.lastFire)/RULES.hz);
  if(w.type!=='flipper'||!this.weaponPowered(b))return{ready:false,label:'FLIP UNAVAILABLE',detail:'Select a flipper to use flip assist.'};
  if(b.flipStart>=0)return{ready:false,label:'FLIPPING',detail:'Wait for the arm to return.'};
  if(wait>0)return{ready:false,label:'RECHARGING',detail:wait.toFixed(1)+' s remaining'};
  if(this.axis(b,v(0,1,0)).y<.65)return{ready:false,label:'SELF-RIGHT',detail:'Use the arm to regain balance.'};
  const other=this.bots[1-b.id],delta=sub(this.wholeCOM(other),b.chassis.translation()),q=b.chassis.rotation(),local=rotate(delta,{x:-q.x,y:-q.y,z:-q.z,w:q.w});
  if(local.z>0||Math.abs(local.x)>Math.max(.23,-local.z*.45))return{ready:false,label:'ALIGN WITH OPPONENT',detail:'Aim the centre of the flipper at them.'};
  let support=false;for(const p of b.compiled.parts.filter(p=>p.body==='rotor')){const col=b.colliders.get(p.id);if(!col)continue;this.world.contactPairsWith(col,otherCol=>{const info=this.meta.get(otherCol.handle);if(info?.bot!==other.id||info.module==='weapon')return;this.world.contactPair(col,otherCol,m=>{if(Math.abs(dot(m.normal(),this.axis(b,v(0,1,0))))>.25&&m.numSolverContacts()>0)support=true;});});}
  const centred=Math.abs(local.x)<w.width/2+other.compiled.config.chassis.width*.22;
  if(support&&centred)return{ready:true,label:'FLIP NOW',detail:'Under opponent: '+Math.round(this.flipperInsertion(b)*100)+'% · '+Math.round((.4+.6*this.flipperInsertion(b))*100)+'% flip power.'};
  return{ready:false,label:length(delta)>1.6?'CLOSE THE GAP':'DRIVE UNDER',detail:'Get the flipper beneath the opponent.'};
 }
 requestStrike(b:Bot){
 const w=b.compiled.config.weapon;if(w.type!=='hammer_saw'||!b.arm)return false;
 if(!this.weaponPowered(b)||b.flipStart>=0||this.tick-b.lastFire<1.4*RULES.hz)return false;
 b.flipStart=this.tick;b.lastFire=this.tick;b.flipWork=0;return true;
 }
 canSelfRight(b:Bot){const kind=selfRightKind(b.compiled.config);if(!kind)return false;if(kind==='arm')return this.powered(b)&&b.modules.self_right.functional;if(!this.weaponPowered(b))return false;if(kind==='saw')return !!b.arm;return kind!=='gyro'||this.powered(b)&&b.modules.drive_left.functional&&b.modules.drive_right.functional;}
 // Automatic recovery needs a stable tip on the arena, not a brief flight or lean.
 automaticSelfRightReady(b:Bot){return b.autoRightTicks>=.6*RULES.hz;}
 private observeRecovery(b:Bot){
  const kind=selfRightKind(b.compiled.config),up=this.axis(b,v(0,1,0)).y;
  const invertedDriving=componentProfile(b.compiled.config,'drive')==='hypershock'&&up<-.7&&b.grounded;
  const tipped=!invertedDriving&&(kind==='gyro'?up<.6:kind==='saw'?up<.2:up<.5);
  if(!kind||!tipped||!this.canSelfRight(b)||b.rollStart>=0||length(b.chassis.linvel())>(kind==='gyro'?1.2:.5)||length(b.chassis.angvel())>(kind==='gyro'?5:2)){b.autoRightTicks=0;return;}
  let supported=false;
  for(const col of b.colliders.values()){
   if(col.isSensor())continue;
   this.world.contactPairsWith(col,other=>{
    const parent=other.parent(),name=parent?this.bodyIds.get(parent.handle):undefined;
    if(name!=='floor'&&name!=='shelf')return;
    this.world.contactPair(col,other,m=>{if(m.numSolverContacts()>0&&Math.abs(m.normal().y)>.5)supported=true;});
   });if(supported)break;
  }
  b.autoRightTicks=supported?Math.min(.6*RULES.hz,b.autoRightTicks+1):0;
  if(kind==='gyro'&&this.options.autoUnstick&&this.automaticSelfRightReady(b))this.requestSelfRight(b);
 }
 requestSelfRight(b:Bot){if(selfRightKind(b.compiled.config)==='arm'&&b.rollStart>=0&&this.tick-b.lastSelfRight<(verticalSelfRight(b.compiled.config)?10:componentProfile(b.compiled.config,'selfRight')==='gigabyte'?9:4)*RULES.hz)return false;if(selfRightKind(b.compiled.config)==='gyro'){
  if(!this.canSelfRight(b)||b.rollStart>=0||Math.abs(this.axis(b,v(0,1,0)).y)>.90&&b.grounded||this.tick-b.lastSelfRight<3*RULES.hz)return false;
  b.weaponOn=true;b.spinDirection=(Math.abs(this.omega(b))>50?Math.sign(this.omega(b)):b.compiled.config.weapon.type==='drum'?-b.compiled.config.weapon.direction:b.spinDirection) as 1|-1;b.lastSelfRight=this.tick;b.rollStart=this.tick;b.rollWork=0;b.gyroDance={ticks:0,settled:0,braking:isSpinner(b.compiled.config.weapon)&&Math.abs(this.omega(b))*30/Math.PI>b.compiled.config.weapon.rpm*.55};return true;
 }if(b.compiled.config.weapon.type==='hammer_saw'){
  if(this.axis(b,v(0,1,0)).y>.2)return this.requestStrike(b);
  if(!this.weaponPowered(b)||!b.arm||this.tick-b.lastSelfRight<3*RULES.hz)return false;
  b.lastSelfRight=this.tick;b.rollStart=this.tick;b.rollWork=0;b.rollSettling=false;b.flipStart=-1;return true;
 }if(this.tick-b.lastSelfRight<3*RULES.hz){this.notice('Self-right cooldown: 3 seconds');return false;}const c=b.compiled.config;if(verticalSelfRight(c)&&this.axis(b,v(0,1,0)).y>.9&&b.grounded)return false;if(!this.powered(b)&&c.weapon.type!=='flipper'){this.notice('Self-right unavailable: no drive power');return false;}if(c.weapon.type==='flipper'){const usable=this.weaponPowered(b)&&b.flipStart<0&&this.tick-b.lastFire>=1.5*RULES.hz;if(usable||c.selfRight.type==='none'||!b.modules.self_right.functional){const fired=this.requestFire(b);if(fired)b.lastSelfRight=this.tick;return fired;}}if(c.selfRight.type==='none'||!b.modules.self_right.functional){if(!this.options.ai[b.id])this.notice('No working self-right mechanism');return false;}if(b.energy<2000){this.notice('Self-right needs 2,000 J');return false;}if(componentProfile(c,'selfRight')==='quantum'){b.weaponOn=true;b.crushStart=this.tick;b.crushWork=0;}b.resumeWeapon=(componentProfile(c,'selfRight')==='gigabyte'||verticalSelfRight(c)&&isSpinner(c.weapon))&&b.weaponOn;b.lastSelfRight=this.tick;b.rollStart=this.tick;b.rollWork=0;b.rollSettling=false;return true;}
 private notice(s:string){if(this.notices.at(-1)!==s)this.notices.push(s);if(this.notices.length>10)this.notices.shift();}
 private motors(b:Bot){
 if(this.prediction&&b.id!==this.predictionSide)return;
 const wasWeaponOn=b.weaponOn,c=b.compiled.config,cmd=b.command,powered=this.powered(b),weaponPowered=this.weaponPowered(b),output=damageStatus(b.modules),up=this.axis(b,v(0,1,0));b.powerWork=0;b.weaponWatts=0;b.actuatorTorque=0;this.driveWork[b.id]=0;
 for(const body of b.bodies.values()){body.resetForces(false);body.resetTorques(false);}
 if(cmd.weapon){if(c.weapon.type==='flipper')this.requestFire(b);else if(c.weapon.type!=='none'){if((componentProfile(c,'selfRight')==='gigabyte'||verticalSelfRight(c)&&isSpinner(c.weapon))&&b.rollStart>=0)b.resumeWeapon=!b.resumeWeapon;else b.weaponOn=!b.weaponOn;if(c.weapon.type==='crusher'){if(b.weaponOn){b.crushStart=this.tick;b.crushWork=0;b.crushEvent=undefined;b.crushContactTicks=0;b.crushForce=0;b.gripRelease=undefined;}}}}
 if(cmd.selfRight)this.requestSelfRight(b);
 if(verticalSelfRight(c)&&b.rollStart>=0){cmd.left=0;cmd.right=0;}
 if(b.gripRelease){const release=b.gripRelease,p=b.chassis.translation();release.travelled+=horizontal(p,release.lastP);release.lastP={...p};
  if(!this.options.ai[b.id]&&this.tick-release.tick>8*RULES.hz)b.gripRelease=undefined;
  if(this.options.ai[b.id]&&!this.result){const remaining=release.distance-release.travelled,speed=dot(b.chassis.linvel(),release.back),throttle=-clamp(remaining*.55-speed*.22,0,.34),f=this.forward(b),desired=mul(release.back,-1),error=Math.atan2(f.x*desired.z-f.z*desired.x,dot(f,desired)),turn=clamp(error*1.4,-.25,.25);cmd.left=throttle+turn;cmd.right=throttle-turn;
   if(remaining<=.025||this.tick-release.tick>8*RULES.hz){cmd.left=0;cmd.right=0;b.gripRelease=undefined;b.ai.waypoint=undefined;b.ai.lastProgress={...p};b.ai.progressTick=this.tick;b.history=[];}
  }
 }

 // Steering changes the drum axis. The rotor's inertial term below creates
 // precession through the hinge; no recovery impulse or pose reset is added.
 if(selfRightKind(c)==='gyro'&&b.rollStart>=0){
  const elapsed=(this.tick-b.rollStart)/RULES.hz,dance=b.gyroDance??={ticks:0,settled:0};
  // Minotaur drives on either face. Do not rock it off stable inverted wheels.
  const onWheels=Math.abs(up.y)>.90&&b.grounded;
  dance.settled=onWheels&&length(b.chassis.angvel())<.75?dance.settled+1:0;
  cmd.left=0;cmd.right=0;
  if(!this.canSelfRight(b)||elapsed>26||dance.settled>=.3*RULES.hz){b.rollStart=-1;b.gyroDance=undefined;}
  else{
   b.weaponOn=true;
   // Build angular momentum before rocking. Pulsed wheel torque changes the
   // drum axis through floor contact; its physical inertia supplies precession.
   // A fast drum can trap the chassis in a steady lean before rocking starts.
   // Brake below the operating band, let the body settle, then build momentum.
   // Retain the spin direction so preparation cannot waste a full reversal.
   if(dance.braking&&isSpinner(c.weapon)&&Math.abs(this.omega(b))*30/Math.PI<c.weapon.rpm*.15&&length(b.chassis.angvel())<.75) dance.braking=false;
   const ready=!dance.braking&&isSpinner(c.weapon)&&this.omega(b)*b.spinDirection*30/Math.PI>=c.weapon.rpm*.35&&Math.abs(this.omega(b))*30/Math.PI<=c.weapon.rpm*.55;
   if(up.y>.1&&this.floorSupport.has(b.id)){const brake=clamp(dot(b.chassis.angvel(),up),-1,1);cmd.left=brake;cmd.right=-brake;}
   else if(ready&&!onWheels&&this.floorSupport.has(b.id)){
    const q=b.chassis.rotation(),down=rotate(v(0,-1,0),{x:-q.x,y:-q.y,z:-q.z,w:q.w});
    dance.direction??=-Math.sign(Math.abs(down.x)>.1?down.x:1)*b.spinDirection;
    // Re-evaluate the useful steering direction after a failed rock. The
    // chassis can land on its other side; retaining the initial direction
    // then drives precession away from upright for the rest of the attempt.
    if(up.y>-.7&&Math.abs(down.x)>.3&&dance.ticks%Math.round(.7*RULES.hz)===0) dance.direction=-Math.sign(down.x)*b.spinDirection;
    const pulse=dance.ticks++%Math.round(.7*RULES.hz)<Math.round(.55*RULES.hz)?1:0;
    cmd.left=dance.direction*pulse;cmd.right=-dance.direction*pulse;

   }
  }
 }
 const rotorRecovery=(componentProfile(c,'selfRight')==='gigabyte'||verticalSelfRight(c)&&isSpinner(c.weapon))&&b.rollStart>=0,rotorBraking=rotorRecovery&&Math.max(Math.abs(this.omega(b)),length(b.rotor?.angvel()??v()))*30/Math.PI>180;if(rotorRecovery){b.weaponOn=false;if(rotorBraking)b.rollStart=this.tick;}
 if(componentProfile(c,'drive')==='huge'||componentProfile(c,'drive')==='gigabyte')b.driveSign=1;else if(b.grounded&&b.groundTicks>=.15*RULES.hz){if(up.y>.70)b.driveSign=1;else if(up.y<-.70)b.driveSign=-1;}
 // A two-wheel spinner's reaction can steer it off a straight
 // command. Counter that yaw through the drive motors, within their limits.
 if(componentProfile(c,'drive')==='gigabyte'||componentProfile(c,'drive')==='huge'){const rate=2.4*RULES.dt;b.driveRamp[0]+=clamp(cmd.left-b.driveRamp[0],-rate,rate);b.driveRamp[1]+=clamp(cmd.right-b.driveRamp[1],-rate,rate);cmd.left=b.driveRamp[0];cmd.right=b.driveRamp[1];}
 // The compact wheel stance uses the full-size steering response.
 if(hydraSleekWheels(c)){const forward=(cmd.left+cmd.right)/2,turn=(cmd.left-cmd.right)/2;cmd.left=forward+turn*0.92;cmd.right=forward-turn*0.92;}
 const straightAssist=isHorizontal(c.weapon)&&componentProfile(c,'weapon')!=='gigabyte'&&c.drive.traction!=='tracks'&&c.drive.layout===2&&b.weaponOn&&b.grounded&&up.y>.65&&Math.abs(cmd.left-cmd.right)<.05&&Math.abs(cmd.left)>.03?clamp(dot(b.chassis.angvel(),up)*.35,-.35,.35):0;
 // Inverted traction control limits acceleration using the support margin
 // and higher centre of mass. It retains full speed and physical gyroscopic motion.
 const wheelY=c.drive.radius-c.chassis.height/2-c.chassis.clearance,margin=Math.max(.025,wheelBase(c)/2-Math.abs(b.compiled.com.z-wheelCentreZ(c))),comHeight=Math.max(.06,c.drive.radius+wheelY-b.compiled.com.y);
 const driveTorqueLimit=componentProfile(c,'drive')==='hypershock'&&up.y<-.65?b.compiled.mass*9.81*margin/comHeight*.60*c.drive.radius/c.drive.layout:Infinity;
 const supported=this.floorSupport.has(b.id);b.grounded=false;const axis=this.axis(b,v(1,0,0)),tracks=c.drive.traction==='tracks';
 let hugeDuty:readonly[number,number]|undefined=componentProfile(c,'drive')==='huge'&&!tracks?hugeDriveDuty(cmd.left,cmd.right,dot(b.chassis.linvel(),this.forward(b)),b.chassis.angvel().y,axis.y):undefined;
 if((componentProfile(c,'drive')==='gigabyte'||tracks)&&supported&&up.y>.65&&b.rollStart<0){
  const forward=(cmd.left+cmd.right)/2,turn=(cmd.left-cmd.right)/2,speed=dot(b.chassis.linvel(),this.forward(b)),yaw=dot(b.chassis.angvel(),up),drive=clamp(forward*.30+(forward*(tracks?3.2:4.5)-speed)*.55,-1,1),steer=clamp(turn*.30+(yaw+turn*(tracks?1.7:2.4))*(tracks?.45:.85),tracks?-.75:-1,tracks?.75:1);
  hugeDuty=[clamp(drive+steer,-1,1),clamp(drive-steer,-1,1)];
 }

 for(const [id,body]of b.bodies){if(!id.startsWith('wheel_'))continue;const p=body.translation();const grounded=p.y<=c.drive.radius+.035&&Math.abs(axis.y)<.6;this.world.contactPairsWith(b.colliders.get(id+'_contact')??b.colliders.get(id)!,other=>{const info=this.meta.get(other.handle);if(info?.bot===null&&other.translation().y<.5)b.grounded=true;});b.grounded ||=grounded;
 const side=id.includes('_-1_')?'drive_left':'drive_right',gyro=selfRightKind(c)==='gyro'&&b.rollStart>=0,input=clamp(((side==='drive_left')===(gyro||b.driveSign>0)?cmd.left:cmd.right)+(side==='drive_left'?straightAssist:-straightAssist),-1,1);
 const omega=-dot(sub(body.angvel(),b.chassis.angvel()),axis),inversion=gyro?1:b.driveSign,bearingDrag=hydraSleekWheels(c)?hydraBearingDrag(c):.012;let torque=-omega*bearingDrag;if(tracks){b.trackPhase??=[0,0];b.trackPhase[side==='drive_left'?0:1]+=omega*c.drive.radius*RULES.dt/(c.drive.layout/2);}
 if(powered&&b.modules[side].functional){const duty=hugeDuty?hugeDuty[side==='drive_left'?0:1]:input;const m=driveMotorStep(c.drive.ratio,omega,duty*inversion,b.driveInertia.get(id)!,c.drive.motor,bearingDrag);torque=0;const scale=Math.min(output.driveOutput,b.energy/Math.max(.001,m.watts*RULES.dt),driveTorqueLimit/Math.max(.001,Math.abs(m.torque)));torque+=m.torque*scale;this.spend(b,m.watts*RULES.dt*scale);if(Math.abs(duty)>.03){const work=Math.max(0,m.torque*omega)*RULES.dt*scale;b.powerWork+=work;this.driveWork[b.id]+=work;}}
 this.torquePair(b,body,axis,-torque);}
 for(const [id,body]of b.bodies)if(id.startsWith('ground_fork_'))this.torquePair(b,body,axis,-dot(sub(body.angvel(),b.chassis.angvel()),axis)*.04);
 if(b.grounded)b.groundTicks++;else b.groundTicks=0;
 this.stabilizeChassis(b);
 // Release floor attraction while the recovery arm lifts the chassis.
 if(c.drive.magnet>0&&b.rollStart<0&&b.grounded&&up.y>.65&&b.chassis.translation().y<c.chassis.height/2+.08)b.chassis.addForce(v(0,-c.drive.magnet,0),true);
 if(b.rotor&&c.weapon.type!=='none'){
 const w=c.weapon,spinAxis=rotate(weaponAxis(w),(b.arm??b.chassis).rotation()),omega=this.omega(b);b.rpm=Math.abs(omega)*30/Math.PI;b.rotorEnergy=.5*b.compiled.rotorInertia*omega*omega;
 if(w.type==='flipper'){
 const braced=unlimitedFlips(c)&&b.flipStart>=0&&b.grounded&&up.y>.80&&b.chassis.translation().y<c.chassis.height/2+c.chassis.clearance+.06,reaction=braced?0:1;
 const invI=1/Math.max(.01,b.compiled.rotorInertia)+reaction/Math.max(.01,b.compiled.inertia.x),effectiveI=1/invI,cq=b.chassis.rotation(),rq=b.rotor.rotation(),relative=quatMul({x:-cq.x,y:-cq.y,z:-cq.z,w:cq.w},rq);const rawAngle=2*Math.atan2(relative.x,relative.w);b.flipAngle=Math.atan2(Math.sin(rawAngle),Math.cos(rawAngle));let torque=-omega*2;
 if(b.flipStart>=0){const elapsed=(this.tick-b.flipStart)/RULES.hz,ext=elapsed<w.stroke;
 // Tune the servo for the actual load on the arm. The empty arm must settle
 // without slamming its stop; contact still supplies all opponent lift.
 let loadI=0;if(ext)for(const p of b.compiled.parts.filter(p=>p.body==='rotor')){const col=b.colliders.get(p.id);if(!col)continue;this.world.contactPairsWith(col,other=>{const id=this.meta.get(other.handle)?.bot;if(id===undefined||id===null||id===b.id)return;this.world.contactPair(col,other,m=>{for(let j=0;j<m.numSolverContacts();j++){const lever=cross(sub(m.solverContactPoint(j),b.rotor!.translation()),spinAxis);loadI=Math.max(loadI,this.totalMass(this.bots[id])*dot(lever,lever));}});});}
 const servoInvI=1/Math.max(.01,b.compiled.rotorInertia+loadI)+reaction/Math.max(.01,b.compiled.inertia.x),target=ext?w.travel-(unlimitedFlips(c)?.10:0):0,boost=ext&&unlimitedFlips(c)?3:1,stiffness=5000*boost,damping=(unlimitedFlips(c)&&!ext?4:2)*Math.sqrt(stiffness/servoInvI),loadedLaunch=ext&&unlimitedFlips(c)&&loadI>.15&&b.flipAngle<Math.min(.90,w.travel-.25);
 // Pressure falls smoothly with arm speed. Catch the stroke before the hard
 // stop, rather than applying launch pressure to late or repeated contacts.
 const launchScale=unlimitedFlips(c)?.4+.6*b.flipDepth:1;let demand=loadedLaunch?clamp((16200-omega*630)*launchScale,0,16200*launchScale):clamp(((target-b.flipAngle)*stiffness-omega*damping)/(1+damping*RULES.dt*servoInvI+stiffness*RULES.dt**2*servoInvI),-1500*boost,3600*boost);
 // A damped return stroke halves peak retraction torque to reduce recoil.
 if(!ext&&unlimitedFlips(c))demand=clamp(demand,-750,750);
 if(weaponPowered){const limited=workLimitedTorque(demand*output.weaponOutput,omega,servoInvI,ext?Math.max(0,flipEnergy(c)*output.weaponOutput-b.flipWork):Infinity);torque+=limited.torque;b.actuatorTorque=limited.torque;b.powerWork+=limited.work;if(ext)b.flipWork+=limited.work;b.weaponWatts+=limited.work/RULES.dt;}
 if(elapsed>=w.stroke+.5&&Math.abs(b.flipAngle)<.08)b.flipStart=-1;
 }else if(weaponPowered){const damping=2*Math.sqrt(1500*effectiveI),hold=clamp((-b.flipAngle*1500-omega*damping)/(1+damping*RULES.dt*invI+1500*RULES.dt**2*invI),-700,700),limited=workLimitedTorque(hold,omega,invI,Infinity);torque+=limited.torque;b.powerWork+=limited.work;b.weaponWatts+=limited.work/RULES.dt;}
 this.torquePair(b,b.rotor,spinAxis,torque,b.chassis,reaction);
 // Ground bracing routes launch pressure through the four-wheel footprint.
 // It only acts during a supported stroke, never while airborne or inverted.
 if(braced){b.chassis.addForce(v(0,-Math.abs(torque)*.8/Math.max(.2,c.chassis.length/2),0),true);const rollAxis=this.axis(b,v(0,0,1)),tilt=this.axis(b,v(1,0,0)).y,rate=dot(b.chassis.angvel(),rollAxis),stiffness=6000,damping=2*Math.sqrt(stiffness*b.compiled.inertia.z);b.chassis.addTorque(mul(rollAxis,clamp(-tilt*stiffness-rate*damping,-1800,1800)),true);const pitchAxis=this.axis(b,v(1,0,0)),pitchRate=dot(b.chassis.angvel(),pitchAxis),pitchDamping=2*Math.sqrt(4000*b.compiled.inertia.x);b.chassis.addTorque(mul(pitchAxis,clamp(rollAxis.y*4000-pitchRate*pitchDamping,-1800,1800)),true);}
 }else if(w.type==='crusher'){
 const cq=b.chassis.rotation(),rq=b.rotor.rotation(),relative=quatMul({x:-cq.x,y:-cq.y,z:-cq.z,w:cq.w},rq),raw=2*Math.atan2(relative.x,relative.w);b.crushAngle=Math.atan2(Math.sin(raw),Math.cos(raw));
 const righting=componentProfile(c,'selfRight')==='quantum'&&b.rollStart>=0;if(righting)b.weaponOn=true;
 if(!righting&&b.weaponOn&&(this.tick-b.crushStart>2.1*RULES.hz||b.crushContactTicks>1.2*RULES.hz||b.crushWork>=QUANTUM_HYDRAULICS.cycleJoules))b.weaponOn=false;
 const quantum=componentProfile(c,'weapon')==='quantum',pressure=quantum&&b.weaponOn&&b.crushContactTicks>0&&!righting;
 b.crushPhase=!b.weaponOn?'opening':pressure?'pressure':'closing';
 // High-flow closing gets the tooth to the target quickly. The pressure
 // stage models local indentation, with its own force/flow curve below.
 // Full rated hydraulic force is never a free-space launch impulse.
 const target=b.weaponOn?(pressure?Math.max(-w.travel,b.crushAngle-.016):-w.travel):0;
 const invI=1/Math.max(.01,b.compiled.rotorInertia)+1/Math.max(.01,b.compiled.inertia.x),stiffness=18000,damping=2*Math.sqrt(stiffness/invI);
 let demand=clamp(((target-b.crushAngle)*stiffness-omega*damping)/(1+damping*RULES.dt*invI+stiffness*RULES.dt**2*invI),-w.torque,w.torque*.8);
 if(quantum&&!righting&&b.weaponOn){const speedLimit=pressure?.12:w.travel/QUANTUM_HYDRAULICS.closeSeconds;demand=clamp(clamp(demand,(-speedLimit-omega)/(RULES.dt*invI),(speedLimit-omega)/(RULES.dt*invI)),-w.torque,w.torque*.8);}
 if(weaponPowered){const remaining=quantum&&!righting?Math.min(QUANTUM_HYDRAULICS.pumpWatts*RULES.dt,b.weaponOn?Math.max(0,QUANTUM_HYDRAULICS.cycleJoules-b.crushWork):Infinity):Infinity,limit=workLimitedTorque(demand*output.weaponOutput,omega,invI,remaining);this.torquePair(b,b.rotor,spinAxis,limit.torque);b.weaponWatts=limit.work/RULES.dt;b.actuatorTorque=limit.torque;if(quantum&&b.weaponOn&&!righting)b.crushWork+=limit.work;}else this.torquePair(b,b.rotor,spinAxis,-omega*4);
 }else{
 let torque=-omega*.015;if(rotorRecovery&&weaponPowered){const invI=1/Math.max(.01,b.compiled.rotorInertia)+1/Math.max(.01,isHorizontal(w)?b.compiled.inertia.y:b.compiled.inertia.x);torque+=clamp(-omega/(RULES.dt*invI),-300,300);}
 if(weaponPowered&&b.weaponOn){if(!isHorizontal(w)&&!(selfRightKind(c)==='gyro'&&b.rollStart>=0)){b.spinDirection=(w.direction*b.driveSign) as 1|-1;}const m=spinnerMotor(w,omega,b.spinDirection,selfRightKind(c)==='gyro'&&b.rollStart>=0?Math.min(b.gyroDance?.braking?0:.5,output.rpmScale):output.rpmScale),scale=output.weaponOutput;torque+=m.torque*scale;b.actuatorTorque=m.torque*scale;b.weaponWatts=m.watts*scale;b.powerWork+=Math.max(0,m.torque*omega)*RULES.dt*scale;}
 this.torquePair(b,b.rotor,spinAxis,torque,b.arm??b.chassis);
 }}
 if(b.arm&&c.weapon.type==='hammer_saw'){
 const cq=b.chassis.rotation(),aq=b.arm.rotation(),relative=quatMul({x:-cq.x,y:-cq.y,z:-cq.z,w:cq.w},aq),rawAngle=2*Math.atan2(relative.x,relative.w),angle=Math.atan2(Math.sin(rawAngle),Math.cos(rawAngle)),om=dot(sub(b.arm.angvel(),b.chassis.angvel()),axis),elapsed=b.flipStart<0?0:(this.tick-b.flipStart)/RULES.hz;
 b.flipAngle=angle;
 if(weaponPowered){
  const rightElapsed=b.rollStart<0?0:(this.tick-b.rollStart)/RULES.hz;
  if(b.rollStart>=0&&!b.rollSettling&&rightElapsed>.6&&up.y>.93&&b.grounded&&length(b.chassis.angvel())<1){b.rollSettling=true;b.rollStowAt=rightElapsed;b.rollStowAngle=angle;}
  if(b.rollStart>=0&&(rightElapsed>8||b.rollSettling&&Math.abs(angle)<.07&&Math.abs(om)<.4&&up.y>.93&&b.grounded)){b.rollStart=-1;b.rollSettling=false;}
  const righting=b.rollStart>=0&&!b.rollSettling,settling=b.rollSettling||!righting&&this.tick-b.lastSelfRight<8*RULES.hz;
  const gravity=[b.arm,b.rotor!].reduce((sum,body)=>sum+dot(cross(sub(body.worldCom(),b.arm!.translation()),v(0,-9.81*body.mass(),0)),axis),0),striking=b.flipStart>=0&&elapsed<.42,target=b.rollSettling?b.rollStowAngle*clamp(1-(rightElapsed-b.rollStowAt)/2.2,0,1):righting?(Math.PI-(c.weapon.armTravel??1.12))*Math.min(1,rightElapsed/.9):striking?-(c.weapon.armTravel??1.12):0,demand=clamp((target-angle)*(righting?1250:settling?260:striking?1240:620)-om*(righting?95:settling?110:striking?90:68)-gravity,righting?-850:settling?-180:striking?-820:-410,righting?1100:settling?180:360),armI=b.compiled.parts.filter(p=>p.body==='weapon_arm').reduce((n,p)=>n+partProperties(p).about(v(1,0,0)),0)+b.compiled.parts.filter(p=>p.body==='rotor').reduce((n,p)=>n+p.mass,0)*(c.weapon.armLength??.59)**2;
  const limited=workLimitedTorque(demand*output.weaponOutput,om,1/Math.max(.01,armI)+1/Math.max(.01,b.compiled.inertia.x),righting?Math.max(0,5000-b.rollWork):striking?Math.max(0,1300-b.flipWork):Infinity);
  this.torquePair(b,b.arm,axis,limited.torque);b.weaponWatts+=limited.work/RULES.dt;b.powerWork+=limited.work;if(righting)b.rollWork+=limited.work;else if(striking)b.flipWork+=limited.work;
 }else this.torquePair(b,b.arm,axis,-om*.1);
 if(b.flipStart>=0&&elapsed>1.1&&Math.abs(angle)<.07)b.flipStart=-1;
 }
 if(c.weapon.type==='crusher'&&wasWeaponOn&&!b.weaponOn)this.releaseCrusher(b);
 if(b.roll&&c.selfRight.type==='roll_arm'){
  if(componentProfile(c,'selfRight')==='gigabyte'){const joint=b.joints.get('self_right') as RAPIER.RevoluteImpulseJoint;joint.setLimits(b.rollStart<0||rotorBraking?-.008:-.02,b.rollStart<0||rotorBraking?.008:3.1);}
  const elapsed=(this.tick-b.rollStart)/RULES.hz-(componentProfile(c,'selfRight')==='quantum'?.45:0),vertical=verticalSelfRight(c),folding=['hypershock','gigabyte','quantum'].includes(componentProfile(c,'selfRight')??'standard'),localRollAxis=folding&&!vertical?v(0,0,1):v(componentProfile(c,'selfRight')==='hypershock'?-1:1,0,0),rollAxis=this.axis(b,localRollAxis),om=dot(sub(b.roll.angvel(),b.chassis.angvel()),rollAxis),cycling=b.rollStart>=0&&!rotorBraking&&elapsed<(vertical?8:folding?4:2);
  if((cycling||rotorBraking||componentProfile(c,'selfRight')==='gigabyte'||vertical&&(up.y>.65||componentProfile(c,'selfRight')==='hypershock'&&up.y<-.65)&&b.grounded)&&powered&&b.modules.self_right.functional){
   const cq=b.chassis.rotation(),rq=b.roll.rotation(),relative=quatMul({x:-cq.x,y:-cq.y,z:-cq.z,w:cq.w},rq),raw=2*Math.atan2(folding&&!vertical?relative.z:relative.x,relative.w)*(componentProfile(c,'selfRight')==='hypershock'?-1:1),wrapped=Math.atan2(Math.sin(raw),Math.cos(raw)),angle=folding&&b.rollStart>=0&&wrapped<-.2?wrapped+Math.PI*2:wrapped;
   // Fold off the deck, push through real floor contact, then stow again.
   if(vertical&&b.rollStart>=0&&!b.rollSettling&&elapsed>.5&&up.y>.90&&b.grounded){b.rollSettling=true;b.rollStowAt=elapsed;b.rollStowAngle=angle;}const phase=vertical?Math.max(0,elapsed)%3.5:elapsed;
   const target=vertical&&b.rollSettling?b.rollStowAngle*clamp(1-(elapsed-b.rollStowAt)/1.25,0,1):cycling&&!b.rollSettling&&phase<(vertical?2.15:folding?1.7:1)?(vertical?4.65:folding?3:-2.35)*clamp(phase/(vertical?1.55:folding?1:.65),0,1):0;
   // A small overshoot past stow must reverse back, not drive another full turn into the floor.
   const error=vertical&&b.rollSettling?Math.atan2(Math.sin(target-angle),Math.cos(target-angle)):target-angle;
   const rollI=b.compiled.parts.filter(p=>p.body==='self_right').reduce((n,p)=>n+partProperties(p).about(localRollAxis,v()),0),invI=1/Math.max(.001,rollI)+1/Math.max(.001,folding&&!vertical?b.compiled.inertia.z:b.compiled.inertia.x),damping=2*Math.sqrt(750/invI),torque=clamp((error*750-om*damping)/(1+damping*RULES.dt*invI+750*RULES.dt**2*invI),vertical&&b.rollSettling?-140:vertical||componentProfile(c,'selfRight')==='gigabyte'?-650:-350,vertical&&b.rollSettling?140:vertical||componentProfile(c,'selfRight')==='gigabyte'?650:350),limited=workLimitedTorque(torque,om,invI,Math.max(0,Math.min(cycling?(vertical?12000:componentProfile(c,'selfRight')==='gigabyte'?4000:2000)-b.rollWork:b.energy,b.energy)));
   this.torquePair(b,b.roll,rollAxis,limited.torque);if(cycling)b.rollWork+=limited.work;b.powerWork+=limited.work;this.spend(b,limited.work);if(vertical&&b.rollSettling&&Math.abs(angle)<.09&&Math.abs(om)<.5){if(up.y>.85){b.rollStart=-1;if(b.resumeWeapon){b.weaponOn=weaponPowered;b.resumeWeapon=false;}}else b.rollSettling=false;}
   if(componentProfile(c,'selfRight')==='gigabyte'&&b.rollStart>=0&&!cycling&&!rotorBraking&&Math.abs(angle)<.05&&Math.abs(om)<.5){b.rollStart=-1;if(b.resumeWeapon){b.weaponOn=weaponPowered;b.resumeWeapon=false;}}
  }else{this.torquePair(b,b.roll,rollAxis,-om*2);if(b.rollStart>=0&&(!powered||!b.modules.self_right.functional||!cycling&&!rotorBraking)){b.rollStart=-1;if(b.resumeWeapon){b.weaponOn=weaponPowered;b.resumeWeapon=false;}}}
 }
 if(b.rotor&&isSpinner(c.weapon))b.rotor.addTorque(gyroInertialTorque(b.rotor),true);
 if(powered)this.spend(b,8*RULES.dt);cmd.weapon=false;cmd.selfRight=false;
 }
 private releaseCrusher(b:Bot){
  if(b.crushEvent&&b.crushEvent.releasedTick===undefined)b.crushEvent.releasedTick=this.tick;
  const p={...b.chassis.translation()};
  b.gripRelease={tick:this.tick,p,back:mul(this.forward(b),-1),distance:2*b.compiled.envelope.z,travelled:0,lastP:{...p}};
  b.unstick.active=false;b.ai.waypoint=undefined;b.ai.lastProgress={...p};b.ai.progressTick=this.tick;b.history=[];
 }
 private stabilizeChassis(b:Bot){
  const c=b.compiled.config,huge=componentProfile(c,'drive')==='huge',shell=componentProfile(c,'drive')==='gigabyte';
  if((!huge&&!shell)||b.rollStart>=0||(huge?!this.floorSupport.has(b.id):!b.grounded))return;
  const up=this.axis(b,v(0,1,0));if(shell&&up.y<.45)return;
  const target=v(0,huge&&up.y<0?-1:1,0),error=cross(up,target),rate=b.chassis.angvel();
  for(const local of[v(1,0,0),v(0,0,1)]){
   const axis=this.axis(b,local),I=local.x?b.compiled.inertia.x:b.compiled.inertia.z,k=huge?(local.x?HUGE_HANDLING.pitchSpring:HUGE_HANDLING.rollSpring):1100,d=2.2*Math.sqrt(k*I),limit=huge?(local.x?HUGE_HANDLING.pitchTorque:HUGE_HANDLING.rollTorque):240;
   const angle=Math.atan2(dot(error,axis),dot(up,target)),torque=(angle*k-dot(rate,axis)*d)/(1+d*RULES.dt/I+k*RULES.dt**2/I);
   b.chassis.addTorque(mul(axis,clamp(torque,-limit,limit)),true);
  }
 }
 outOfArena(b:Bot){const p=b.chassis.translation(),edge=RULES.floor/2+.38;return Math.abs(p.x)>edge||Math.abs(p.z)>edge||p.y<-.6;}
 private containArena(){
  const edge=RULES.floor/2;
  for(const b of this.bots){
   const before=this.pre.get(b.chassis.handle),p=b.chassis.translation(),margin=Math.max(b.compiled.envelope.x,b.compiled.envelope.y,b.compiled.envelope.z)+.1;
   if(!before||Math.max(Math.abs(p.x),Math.abs(p.z))<edge-margin)continue;
   const correction=v(),blocked=new Set<'x'|'z'>();let rotorBlocked=false;
   for(const col of b.colliders.values()){
    if(!col.isValid()||col.isSensor()||!col.collisionGroups())continue;
    const oldBody=this.pre.get(col.parent()!.handle);if(!oldBody)continue;cacheColliderGeometry(col);
    const oldPose=previousColliderPose(col,oldBody),old=colliderBounds(col,oldPose.p,quatMul(oldBody.q,oldPose.localRotation)),now=colliderBounds(col);
    for(const axis of['x','z']as const)for(const side of[-1,1]){
     // A robot that already cleared the wall can complete a real ring-out.
     if((side>0?old.min[axis]:-old.max[axis])>edge+RULES.wallThickness+.03)continue;
     const a=side>0?old.max[axis]:-old.min[axis],z=side>0?now.max[axis]:-now.min[axis];if(z<=edge+.03)continue;
     const at=a<edge&&z>a?clamp((edge-a)/(z-a),0,1):0,low=old.min.y+(now.min.y-old.min.y)*at;
     if(low>=RULES.wallHeight+.005)continue;
     const shift=(edge+.002-z)*side;if(side>0)correction[axis]=Math.min(correction[axis],shift);else correction[axis]=Math.max(correction[axis],shift);
     blocked.add(axis);rotorBlocked ||=this.meta.get(col.handle)?.part?.body==='rotor';
    }
   }
   if(!blocked.size)continue;
   for(const axis of blocked){const side=-Math.sign(correction[axis]);let energy=0,impulse=0;for(const body of b.bodies.values()){const speed=Math.max(0,body.linvel()[axis]*side);energy+=.5*body.mass()*speed*speed;impulse+=body.mass()*speed;}
    this.wallDamage.impact(axis==='x'?(side>0?'east':'west'):(side>0?'south':'north'),{...p},energy,impulse,this.tick);
   }
   // Last-resort motion clamp after a missed wall contact. Move the complete
   // assembly together, preserve its joints, and remove outward velocity.
   for(const body of b.bodies.values()){body.setTranslation(add(body.translation(),correction),true);const velocity={...body.linvel()};for(const axis of blocked)if(velocity[axis]*correction[axis]<0)velocity[axis]=0;body.setLinvel(velocity,true);}
   if(rotorBlocked&&isSpinner(b.compiled.config.weapon))this.limitRotorEnergy(b,0);
   b.wall=true;this.world.propagateModifiedBodyPositionsToColliders();
  }
 }
 // Gameplay flight ceiling, measured at the complete robot's centre of mass.
 // Remove only excess upward translation; retain horizontal motion, spin and
 // relative body velocities. The ballistic limit produces a natural apex.
 private limitFlightHeight(){
  const gravity=Math.max(0,-this.world.gravity.y);
  for(const b of this.bots){
   let mass=0,height=0,up=0;for(const body of b.bodies.values()){const m=body.mass();mass+=m;height+=body.worldCom().y*m;up+=body.linvel().y*m;}
   if(mass<=0)continue;height/=mass;up/=mass;
   const overshoot=Math.max(0,height-RULES.maxFlightHeight),allowed=height>=RULES.maxFlightHeight?0:gravity>0?Math.sqrt(2*gravity*(RULES.maxFlightHeight-height)):Infinity,remove=Math.max(0,up-allowed);
   if(!overshoot&&!remove)continue;
   for(const body of b.bodies.values()){
    if(overshoot){const p=body.translation();body.setTranslation(v(p.x,p.y-overshoot,p.z),true);}
    if(remove){const velocity=body.linvel();body.setLinvel(v(velocity.x,velocity.y-remove,velocity.z),true);}
   }
   // Catch a contact impulse that crosses the ceiling within this solver step.
   if(overshoot)this.world.propagateModifiedBodyPositionsToColliders();
  }
 }
 private integrateWorld(){
  this.limitFlightHeight();
  const gyro=this.bots.filter(b=>selfRightKind(b.compiled.config)==='gyro'&&b.rollStart>=0&&b.rotor);
  this.substepContacts=undefined;if(!gyro.length){this.world.step(this.queue);return;}this.substepContacts=[];
  const base=gyro.map(b=>sub(b.rotor!.userTorque(),gyroInertialTorque(b.rotor!))),dt=RULES.dt/4;this.world.timestep=dt;
  for(let i=0;i<4;i++){for(let j=0;j<gyro.length;j++){const body=gyro[j].rotor!;body.resetTorques(false);body.addTorque(add(base[j],gyroInertialTorque(body,dt)),true);}this.world.step(this.queue);this.substepContacts.push(...this.contactSamples());}
  this.world.timestep=RULES.dt;
 }
 // Let the final strike finish its motion without more damage or new judging.
 stepAfterFinish(){
  if(!this.result||this.fault||this.disposed)return;
  this.pre.clear();for(const b of this.bots)for(const body of b.bodies.values())this.pre.set(body.handle,{p:{...body.translation()},com:{...body.worldCom()},q:{...body.rotation()},lin:{...body.linvel()},ang:{...body.angvel()}});
  for(const b of this.bots){b.command=neutral();this.motors(b);}
  this.integrateWorld();this.tick++;this.containArena();this.limitFlightHeight();this.sampleTravel();this.updateRingOut();
  for(const b of this.bots)b.rpm=Math.abs(this.omega(b))*30/Math.PI;
  if(this.tick%(RULES.hz/60)===0&&this.frames.at(-1)?.tick!==this.tick)this.capture();
 }
 private updateRingOut(){const ring=this.result?.ringOut;if(!ring)return;const p=this.bots[ring.bot].chassis.translation();ring.height=Math.max(ring.height,p.y-ring.origin.y);ring.distance=Math.max(ring.distance,horizontal(p,ring.origin));}
 finalizeFinish(){this.updateRingOut();for(const id of this.tracking.keys())this.closeTravel(id,'Match ended');}
 private hazardsStep(){for(const h of this.hazards)stepHazard(this.world,h,this.tick,this.bots,c=>this.meta.get(c.handle)?.bot);}
 private observeAI(){for(const b of this.bots){if(!this.options.ai[b.id])continue;const o=this.bots[1-b.id];b.ai.history.push({tick:this.tick,p:{...b.chassis.translation()},q:{...b.chassis.rotation()},forward:this.forward(b),other:{...o.chassis.translation()},otherQ:{...o.chassis.rotation()},speed:length(b.chassis.linvel()),yawRate:b.chassis.angvel().y,rpm:b.rpm,rpmScale:damageStatus(b.modules).rpmScale,up:this.axis(b,v(0,1,0)).y,pin:this.pinState.attacker===b.id?this.pinState.ticks:0,charge:b.compiled.config.weapon.type==='flipper'?1:0,enabled:this.powered(b),weaponOn:b.weaponOn,weaponWorks:this.weaponPowered(b),lastFire:b.lastFire,flipStart:b.flipStart,flipAngle:b.flipAngle,lastSelfRight:b.lastSelfRight,driveLeft:b.modules.drive_left.functional,driveRight:b.modules.drive_right.functional});if(b.ai.history.length>Math.ceil(.3*RULES.hz)+1)b.ai.history.shift();}}
 private decide(b:Bot){
 const opt=AI_SETTINGS[this.options.difficulty],history=b.ai.history;
 const obs=[...history].reverse().find(x=>x.tick<=this.tick-opt.delay)??history[0];if(!obs)return;
 const w=b.compiled.config.weapon,delta=sub(obs.other,obs.p),distance=Math.hypot(delta.x,delta.z),forward=obs.forward,toward=Math.atan2(delta.x,-delta.z),heading=Math.atan2(forward.x,-forward.z);
 const angleWrap=(x:number)=>Math.atan2(Math.sin(x),Math.cos(x));const aimNoise=(this.random()-.5)*2*opt.aim*Math.PI/180;
 const disabled=w.type==='none'||!obs.weaponWorks;
 const ready=disabled||w.type==='crusher'|| (w.type==='flipper'?obs.charge>0&&obs.tick-obs.lastFire>=1.5*RULES.hz&&obs.flipStart<0&&Math.abs(obs.flipAngle)<.18:obs.rpm>=w.rpm*obs.rpmScale*opt.ready);
 if(!b.gripRelease&&!(w.type==='crusher'&&b.weaponOn)&&this.tick-b.ai.progressTick>=2*RULES.hz){if(horizontal(obs.p,b.ai.lastProgress)<.20)b.ai.waypoint=v((this.random()-.5)*9,0,(this.random()-.5)*9);b.ai.lastProgress={...obs.p};b.ai.progressTick=this.tick;}
 if(b.ai.waypoint&&horizontal(obs.p,b.ai.waypoint)<.8)b.ai.waypoint=undefined;
 if(!b.gripRelease&&!(w.type==='crusher'&&b.weaponOn)&&obs.p.z<-4.9&&Math.abs(obs.p.x)<2.2&&obs.other.z>-4.8)b.ai.waypoint=v(obs.p.x<0?-2.55:2.55,0,-4.65);
 const danger=this.automaticSelfRightReady(b)||(!b.grounded&&obs.up<.35)||Math.abs(obs.p.x)>6.35||Math.abs(obs.p.z)>6.35||obs.p.y>b.compiled.config.chassis.height/2+b.compiled.config.chassis.clearance+.45;
 const release=componentProfile(b.compiled.config,'weapon')==='quantum'?b.gripRelease:undefined;
 const releaseRemaining=release?release.distance-release.travelled:0;
 const quantumRelease=!!release&&releaseRemaining>.025&&this.tick-release.tick<8*RULES.hz;
 if(release&&!quantumRelease){b.gripRelease=undefined;b.ai.waypoint=undefined;b.ai.lastProgress={...obs.p};b.ai.progressTick=this.tick;}
 const candidates=[
 {state:'recover',score:danger?100:-Infinity,reason:obs.up<-.5?'Use the physical self-right mechanism':'Return to clear floor',target:obs.up<-.5?obs.other:v(),throttle:obs.up<-.5?.15:.65},
 {state:'release',score:quantumRelease?110:obs.pin>=9*RULES.hz?95:-Infinity,reason:'Open the jaw and retreat up to two robot lengths',target:quantumRelease?add(obs.p,mul(release!.back,-2)):obs.other,throttle:componentProfile(b.compiled.config,'weapon')==='quantum'?-Math.min(.34,Math.max(.035,releaseRemaining*.55)):-.85},
 {state:'evade',score:!ready&&distance<1.9?82-distance:-Infinity,reason:'Create space for the weapon',target:obs.other,throttle:-.75},
 {state:'spin up',score:!ready?70:-Infinity,reason:'Wait for weapon readiness',target:obs.other,throttle:.28},
 {state:'approach',score:ready?54+Math.min(5,distance):45,reason:disabled?'Push with the working drive':'Close on the opponent',target:obs.other,throttle:!obs.driveLeft||!obs.driveRight?.5:.88},
 {state:'attack',score:ready&&distance<1.55?67-distance*3:-Infinity,reason:disabled?'Push without weapon power':w.type==='flipper'?'Align the flipper lip':'Engage with a ready weapon',target:obs.other,throttle:1},
 {state:'disengage',score:b.ai.waypoint?75:-Infinity,reason:'Move to a safe waypoint',target:b.ai.waypoint??obs.other,throttle:.8}
 ];
 let chosen=candidates.reduce((best,x)=>x.score>best.score?x:best),current=candidates.find(x=>x.state===b.ai.state)!;
 const emergency=chosen.state==='recover'||chosen.state==='release';
 if(!emergency&&current&&Number.isFinite(current.score)&&(this.tick-b.ai.since<.3*RULES.hz||current.score+4>=chosen.score))chosen=current;
 const {state,reason,target}=chosen;let throttle=chosen.throttle;if(state!==b.ai.state)b.ai.since=this.tick;b.ai.state=state;b.ai.reason=reason;
 const goal=sub(target,obs.p),error=angleWrap(Math.atan2(goal.x,-goal.z)-heading+aimNoise),turn=clamp(componentProfile(b.compiled.config,'drive')==='huge'?error*.8+obs.yawRate*.32:error*1.8,-1,1);if(Math.abs(error)>1.1&&throttle>0)throttle=.15;if(w.type==='crusher'&&state==='attack'&&distance<1.15)throttle=Math.min(throttle,.35);
 const cmd:Command={left:clamp(throttle+turn,-1,1),right:clamp(throttle-turn,-1,1),weapon:false,selfRight:false};
 if(w.type==='flipper'){const reach=w.length+w.mount.z*-1+.35;if(!disabled&&state==='attack'&&distance<reach&&Math.abs(angleWrap(toward-heading))<.3&&ready&&this.tick-b.ai.lastFireRequest>=1.5*RULES.hz){cmd.weapon=true;b.ai.lastFireRequest=this.tick;}}
 else if(w.type==='crusher'){if(state!=='release'&&!quantumRelease&&!disabled&&!obs.weaponOn&&distance<.86&&Math.abs(angleWrap(toward-heading))<.24&&this.tick-b.ai.lastWeaponRequest>2.6*RULES.hz){cmd.weapon=true;b.ai.lastWeaponRequest=this.tick;}}
 else if(w.type!=='none'&&!disabled&&!obs.weaponOn&&!((componentProfile(b.compiled.config,'selfRight')==='gigabyte'||verticalSelfRight(b.compiled.config))&&b.rollStart>=0)&&this.tick-b.ai.lastWeaponRequest>opt.delay+4){cmd.weapon=true;b.ai.lastWeaponRequest=this.tick;}
 if(w.type==='hammer_saw'&&!disabled&&ready&&state==='attack'&&distance<(w.armLength??.59)+.45&&Math.abs(angleWrap(toward-heading))<.35&&obs.flipStart<0&&this.tick-b.ai.lastFireRequest>=1.4*RULES.hz){cmd.selfRight=true;b.ai.lastFireRequest=this.tick;}
 if(state==='recover'&&this.automaticSelfRightReady(b)&&obs.tick-obs.lastSelfRight>=3*RULES.hz&&this.tick-b.ai.lastRightRequest>=3*RULES.hz){cmd.selfRight=true;b.ai.lastRightRequest=this.tick;}
 b.ai.command={...cmd};b.command=cmd;
 }
 step(commands?:[Command,Command]){
 if(this.result||this.fault||this.disposed)return;const start=performance.now();try{
 if(commands)commands.forEach((c,i)=>{if(!this.options.ai[i])this.command(i,c);});for(const b of this.bots)this.observeRecovery(b);this.observeAI();if(this.tick%(RULES.hz/60)===0)for(const b of this.bots)if(this.options.ai[b.id])this.decide(b);
 this.pre.clear();for(const b of this.bots)for(const body of b.bodies.values())this.pre.set(body.handle,{p:{...body.translation()},com:{...body.worldCom()},q:{...body.rotation()},lin:{...body.linvel()},ang:{...body.angvel()}});
 const requestedDrive=this.bots.map(b=>({left:b.command.left,right:b.command.right})),rotorBefore=this.bots.map(b=>.5*b.compiled.rotorInertia*this.omega(b)**2);for(const b of this.bots){this.recoverStuck(b);this.motors(b);}if(!this.prediction)this.hazardsStep();for(const h of this.hazards){const body=h.body;this.pre.set(body.handle,{p:{...body.translation()},com:{...body.worldCom()},q:{...body.rotation()},lin:{...body.linvel()},ang:{...body.angvel()}});}this.integrateWorld();this.tick++;this.startedContacts.clear();this.queue.drainCollisionEvents((a,b,started)=>{if(started)this.startedContacts.add(`${Math.min(a,b)}:${Math.max(a,b)}`);});
 for(const b of this.bots){for(const body of b.bodies.values())if(![body.translation(),body.rotation(),body.linvel(),body.angvel()].every(value=>Object.values(value).every(Number.isFinite)))throw Error('A robot has an invalid physics state.');}
 if(!this.prediction)this.contacts(rotorBefore);this.containArena();if(!this.prediction){this.crushing();this.burnBatteries();}this.limitFlightHeight();if(!this.prediction){this.sampleTravel();this.rules();}for(const b of this.bots)Object.assign(b.command,requestedDrive[b.id]);
 for(const b of this.bots){b.rpm=Math.abs(this.omega(b))*30/Math.PI;b.rotorEnergy=.5*b.compiled.rotorInertia*this.omega(b)**2;}
 if(this.tick%(RULES.hz/60)===0&&this.frames.at(-1)?.tick!==this.tick)this.capture();
 }catch(error){this.result=undefined;this.fault=(error instanceof Error?error.message:'Physics could not continue.')+' Restart this match.';}finally{this.physicsMs=performance.now()-start;}
 }
 private crushing(){
  for(const b of this.bots){b.crushForce=0;const w=b.compiled.config.weapon;if(w.type!=='crusher'||!b.weaponOn||!this.weaponPowered(b)){b.crushContactTicks=0;b.crushPhase='opening';continue;}
   let target:ColliderInfo|undefined,point=v(),force=0;
   for(const[id,col]of b.colliders)if(id.startsWith('crusher_tooth'))this.world.contactPairsWith(col,other=>{const m=this.meta.get(other.handle);if(m?.bot===null||m?.bot===undefined||m.bot===b.id)return;this.world.contactPair(col,other,manifold=>{for(let j=0;j<manifold.numContacts();j++){const f=manifold.contactImpulse(j)/RULES.dt;if(f>force){force=f;target=m;point=manifold.numSolverContacts()?manifold.solverContactPoint(0):col.translation();}}});});
   // Once a bite is loaded, pressure is shared among the tooth contacts.
   // Keep the pressure stage engaged at the lower per-contact holding load.
   if(!target||force<(b.crushContactTicks>0?25:150)){b.crushContactTicks=0;b.crushPhase='closing';continue;}
   b.crushContactTicks++;b.crushPhase='pressure';const quantum=componentProfile(b.compiled.config,'weapon')==='quantum',output=damageStatus(b.modules).weaponOutput;
   // Rigid colliders cannot deform: pressure work is integrated as local
   // indentation damage. Solver impulses still provide motion and recoil.
   const jawQ=b.rotor!.rotation(),jawPoint=rotate(sub(point,b.rotor!.translation()),{x:-jawQ.x,y:-jawQ.y,z:-jawQ.z,w:jawQ.w}),lever=Math.abs(jawPoint.z),pressure=quantumBiteForce(w.length,lever)*Math.min(1,b.crushContactTicks*RULES.dt/QUANTUM_HYDRAULICS.pressureRiseSeconds)*output;
   b.crushForce=quantum?pressure:force;
   const power=quantum?Math.min(Math.max(0,QUANTUM_HYDRAULICS.pumpWatts*output-b.weaponWatts),pressure*QUANTUM_HYDRAULICS.indentSpeed):3500*output*clamp((force-150)/1500,0,1);
   const energy=Math.min(power*RULES.dt,QUANTUM_HYDRAULICS.cycleJoules-b.crushWork);if(energy<=0)continue;b.crushWork+=energy;b.weaponWatts+=energy/RULES.dt;
   if(!b.crushEvent){b.crushEvent={id:this.nextImpact++,tick:this.tick,episode:'crusher/'+b.id+'/'+b.crushStart,source:b.compiled.config.identity.name,attacker:b.id,target:target.bot,module:target.module,energy:0,impulse:0,closing:0,point:{...point},rotorBefore:[0,0],rotorAfter:[0,0],allocations:[],cause:'crush'};this.events.push(b.crushEvent);if(this.events.length>600)this.events.shift();}
   const event=b.crushEvent;event.penetrationDirection=rotate(v(0,-1,0),b.rotor!.rotation());event.target=target.bot!;event.module=target.module;event.point={...point};event.energy+=energy;event.impulse+=force*RULES.dt;this.damage(target.bot!,target.module,energy,event,target.part);this.highlights.hit(event);const other=this.bots[target.bot!];other.lastAttacker=b.id;other.lastAction=this.tick;
  }
 }
 private preVelocity(body:RAPIER.RigidBody|null,point:Vec){if(!body)return v();const s=this.pre.get(body.handle);return s?add(s.lin,cross(s.ang,sub(point,s.com))):body.velocityAtPoint(point);}
 private limitRotorEnergy(b:Bot,energy:number){
  if(!b.rotor||!isSpinner(b.compiled.config.weapon))return;
  const parent=b.arm??b.chassis,axis=rotate(weaponAxis(b.compiled.config.weapon),parent.rotation()),omega=this.omega(b),next=remainingSpin(omega,b.compiled.rotorInertia,energy);
  b.rotor.setAngvel(add(b.rotor.angvel(),mul(axis,next-omega)),true);
 }
 private spinnerContact(m:ColliderInfo,other:RAPIER.Collider,s:ContactSample,direction:number){
  if(m.bot===null||m.module!=='weapon'||m.part?.body!=='rotor')return;
  const b=this.bots[m.bot],w=b.compiled.config.weapon;if(!b.rotor||!isSpinner(w))return;
  const parent=b.arm??b.chassis,state=this.pre.get(b.rotor.handle)!,parentState=this.pre.get(parent.handle)!,axis=rotate(weaponAxis(w),parentState.q),omega=dot(sub(state.ang,parentState.ang),axis),normal=mul(s.normal,direction);
  const velocity=sub(this.preVelocity(b.rotor,s.point),this.preVelocity(parent,s.point)),speed=Math.max(0,dot(velocity,normal)),tangent=Math.sqrt(Math.max(0,dot(velocity,velocity)-dot(velocity,normal)**2));
  const radial=sub(sub(s.point,state.p),mul(axis,dot(sub(s.point,state.p),axis))),radialLength=length(radial),radialDirection=mul(radial,1/Math.max(.0001,radialLength));
  const feed=Math.max(0,dot(sub(this.preVelocity(parent,s.point),this.preVelocity(other.parent(),s.point)),radialDirection));
  const probe=add(state.p,mul(axis,dot(sub(s.point,state.p),axis))),otherState=this.pre.get(other.parent()!.handle),old=otherState?previousColliderPose(other,otherState):undefined;
  const surface=other.shape.projectPoint(old?.p??other.translation(),old&&otherState?quatMul(otherState.q,old.localRotation):other.rotation(),probe,true).point,delta=sub(surface,probe),distance=length(sub(delta,mul(axis,dot(delta,axis))));
  let radius=w.radius;if(m.part.tooth!==undefined&&m.part.shape.kind==='hull'){radius=0;const vertices=m.part.shape.vertices;for(let i=0;i<vertices.length;i+=3){const p=add(m.part.position,rotate(v(vertices[i],vertices[i+1],vertices[i+2]),m.part.rotation)),localAxis=weaponAxis(w);radius=Math.max(radius,length(sub(p,mul(localAxis,dot(p,localAxis)))));}}
  // Rigid contacts stop overlap at first touch. Include feed per tooth, still
  // capped by exposed tooth depth and the shared rotor energy budget.
  const bite=toothBite(w,omega,feed,Math.max(0,radius-distance)+(feedPerTooth(feed,w.teeth,omega)??0),speed/Math.max(.001,length(velocity)),m.part.tooth!==undefined);
  const swingSpeed=b.arm?Math.max(0,dot(sub(this.preVelocity(b.arm,s.point),this.preVelocity(b.chassis,s.point)),normal)):0;
  // The overhead stroke has its own physical kinetic energy. Tooth bite
  // scales disc cutting only; a stationary disc can still land a hammer hit.
  const swingShare=swingSpeed/Math.max(.001,speed+swingSpeed);
  return{bot:b,speed,swingSpeed,work:.5*(s.impulse*speed+s.frictionImpulse*tangent),...bite,damageScale:bite.damageScale*(1-swingShare)+swingShare};
 }
 private landingContacts(samples:ContactSample[],metadata:Map<number,ColliderInfo>,rotorBefore:number[],updated:Set<ImpactEvent>){
  const handled=new Set<string>();
  for(const b of this.bots){
   let mass=0,y=0,vy=0;for(const body of b.bodies.values()){const m=body.mass(),old=this.pre.get(body.handle);mass+=m;y+=(old?.com.y??body.worldCom().y)*m;vy+=(old?.lin.y??body.linvel().y)*m;}if(mass<=0)continue;y/=mass;vy/=mass;
   const state=this.falls.get(b.id)??{peakY:y,airTicks:0,lastContact:-10000};this.falls.set(b.id,state);
   state.peakY=Math.max(state.peakY,y);
   if(state.landing&&this.tick-state.landing.event.tick>LANDING.windowSeconds*RULES.hz)state.landing=undefined;
   const floor=samples.flatMap(s=>{if(Math.abs(s.normal.y)<.5)return[];const ma=metadata.get(s.a)!,mb=metadata.get(s.b)!,robot=ma.bot===b.id?ma:mb.bot===b.id?mb:undefined,other=ma.bot===b.id?s.b:s.a,arena=ma.bot===b.id?mb:ma;
    if(!robot||arena.bot!==null||arena.hazard!==undefined)return[];const name=this.bodyIds.get(this.world.getCollider(other)?.parent()?.handle??-1);return name==='floor'||name==='shelf'?[{s,robot}]:[];
   });
   if(!this.floorSupport.has(b.id)){state.airTicks++;if(this.tick-state.lastContact>.10*RULES.hz)state.landing=undefined;continue;}
   const height=Math.max(0,state.peakY-y),down=Math.max(0,-vy);
   if(!state.landing&&floor.length&&state.airTicks>=3&&down>LANDING.minSpeed&&(height>.06||down>2)){
    const energy=landingEnergy(mass,down,height),strongest=floor.reduce((a,z)=>a.s.impulse>z.s.impulse?a:z);
    const event:ImpactEvent={id:this.nextImpact++,tick:this.tick,episode:`landing/${b.id}/${this.tick}`,source:'Arena landing',attacker:null,target:b.id,module:strongest.robot.module,energy:0,impulse:0,closing:down,point:{...strongest.s.point},rotorBefore:[...rotorBefore],rotorAfter:[...rotorBefore],allocations:[],cause:'landing',fallHeight:height,fallMassKg:mass,fallSpeed:down,fallKineticJ:energy.kinetic,fallGravityJ:energy.gravity,fallAbsorbedJ:energy.absorbed};
    state.landing={event,budget:energy.kinetic,absorbed:energy.absorbed};this.events.push(event);if(this.events.length>600)this.events.shift();const travel=this.tracking.get(b.id);if(travel)travel.compound=true;
   }
   state.airTicks=0;state.peakY=y;state.lastContact=this.tick;
   const landing=state.landing;if(!landing)continue;
   for(const hit of floor)handled.add(hit.s.key);
   const impulse=floor.reduce((n,hit)=>n+hit.s.impulse*Math.abs(hit.s.normal.y),0);if(impulse<=0)continue;
   const hammer=this.hazards.find(h=>h.kind==='hammer'&&(h.phase==='active'||h.phase==='return')&&horizontal(hazardContactCentre(h),b.chassis.translation())<1.2);
   const event=landing.event,previous=event.energy,delta=Math.min(Math.max(0,landing.budget-previous),.5*impulse*down,hammer?Math.max(0,hammer.budget-hammer.spent):Infinity);
   event.impulse+=impulse;event.energy+=delta;updated.add(event);
   if(hammer){hammer.spent+=delta;const key=`${hammer.id}/${hammer.cycle}/${b.id}`;this.hammerFloorWork.set(key,(this.hammerFloorWork.get(key)??0)+delta);}
   const damage=Math.max(0,event.energy-landing.absorbed)-Math.max(0,previous-landing.absorbed);if(damage<=0)continue;
   // Wheels/armour take the local hit; the frame also receives landing shock.
   // All contact points share one translational-energy budget for this fall.
   for(const hit of floor)this.damage(b.id,hit.robot.module,damage*LANDING.contactShare*hit.s.impulse*Math.abs(hit.s.normal.y)/impulse,event,hit.robot.part);
   this.damage(b.id,'chassis',damage*LANDING.chassisShare,event);
  }
  return handled;
 }
 private contactSamples(){
 const samples:ContactSample[]=[],seen=new Set<string>();this.bots.forEach(b=>b.wall=false);this.robotsInContact=false;this.floorSupport.clear();
 for(const b of this.bots)for(const col of b.colliders.values()){if(!col.isValid()||col.isSensor()||!col.collisionGroups())continue;const own=this.meta.get(col.handle);if(!own)continue;this.world.contactPairsWith(col,other=>{
 // Adjacent parts of one robot generate many candidate pairs. They never
 // produce game damage or support here; reject them before string keys and
 // additional WASM collider lookups. Rapier still solves every physical contact.
 const otherInfo=this.meta.get(other.handle);if(!otherInfo||own.bot!==null&&own.bot===otherInfo.bot)return;
 const ordered=col.handle<other.handle,a=ordered?col.handle:other.handle,d=ordered?other.handle:col.handle,key=`${a}:${d}`;if(seen.has(key))return;seen.add(key);const ca=ordered?col:other,cb=ordered?other:col,ma=ordered?own:otherInfo,mb=ordered?otherInfo:own;
 this.world.contactPair(ca,cb,(m,flipped)=>{const normal=mul(m.normal(),flipped?-1:1);if(ma.bot!==null&&mb.bot!==null&&m.numContacts()>0)this.robotsInContact=true;for(let j=0;j<m.numContacts();j++){const impulse=m.contactImpulse(j);if(impulse<=1e-5)continue;let point:Vec;if(m.numSolverContacts())point=m.solverContactPoint(Math.min(j,m.numSolverContacts()-1));else{const lp=m.localContactPoint1(j),owner=flipped?cb:ca;point=lp?add(owner.translation(),rotate(lp,owner.rotation())):owner.translation();}
 const va=this.preVelocity(ca.parent(),point),vb=this.preVelocity(cb.parent(),point),closing=Math.max(0,dot(sub(va,vb),normal));samples.push({key,a,b:d,impulse,frictionImpulse:Math.hypot(m.contactTangentImpulseX(j),m.contactTangentImpulseY(j)),closing,point,normal:{...normal}});}
 if(m.numSolverContacts()>0&&Math.abs(normal.y)>.5){const id=ma.bot??mb.bot,arena=ma.bot===null?ca:mb.bot===null?cb:undefined,name=arena?this.bodyIds.get(arena.parent()!.handle):undefined;if(id!==null&&(name==='floor'||name==='shelf'))this.floorSupport.add(id);}
 if(ma.bot!==null&&mb.bot===null&&Math.abs(normal.y)<.4)this.bots[ma.bot].wall=true;
 if(mb.bot!==null&&ma.bot===null&&Math.abs(normal.y)<.4)this.bots[mb.bot].wall=true;
 });});}
 return samples;
 }
 private contacts(rotorBefore:number[]){
 const spinBudget=this.bots.map((b,i)=>{if(!b.rotor||!isSpinner(b.compiled.config.weapon))return 0;const parent=b.arm??b.chassis,axis=rotate(weaponAxis(b.compiled.config.weapon),this.pre.get(parent.handle)!.q),omega=dot(sub(this.pre.get(b.rotor.handle)!.ang,this.pre.get(parent.handle)!.ang),axis);return rotorBefore[i]+Math.max(0,b.actuatorTorque*omega*RULES.dt)+.5*(b.actuatorTorque*RULES.dt)**2/Math.max(.001,b.compiled.rotorInertia);});
 const debit=(hit:ReturnType<Simulation['spinnerContact']>)=>{if(!hit)return 0;const used=Math.min(spinBudget[hit.bot.id],hit.work);spinBudget[hit.bot.id]-=used;this.limitRotorEnergy(hit.bot,spinBudget[hit.bot.id]);return used;};
 const masses=this.bots.map(b=>[...b.bodies.values()].reduce((total,body)=>total+(body.isValid()?body.mass():0),0)),linear=this.bots.map(b=>this.pre.get(b.chassis.handle)?.lin??v()),motionBudget=masses.map((mass,i)=>.5*mass*dot(linear[i],linear[i]));
 const samples=this.substepContacts??this.contactSamples(),updatedEvents=new Set<ImpactEvent>();this.substepContacts=undefined;this.pushImpulse[0]=this.pushImpulse[1]=0;
 samples.sort((a,b)=>a.a-b.a||a.b-b.b);const aggregate=new Map<string,ContactSample>();for(const s of samples){const old=aggregate.get(s.key);if(old){old.closing=(old.closing*old.impulse+s.closing*s.impulse)/(old.impulse+s.impulse);old.impulse+=s.impulse;old.frictionImpulse+=s.frictionImpulse;}else aggregate.set(s.key,{...s});}
 const wallHits=new Map<string,{wall:import('./wall-damage').WallName,point:Vec,energy:number,impulse:number,velocity:Vec}>();
 const contactMetadata=new Map(this.meta),landingKeys=this.landingContacts([...aggregate.values()],contactMetadata,rotorBefore,updatedEvents);for(const s of aggregate.values()){const ma=contactMetadata.get(s.a)!,mb=contactMetadata.get(s.b)!;
 const ca=this.world.getCollider(s.a),cb=this.world.getCollider(s.b),spinA=cb?.isValid()?this.spinnerContact(ma,cb,s,1):undefined,spinB=ca?.isValid()?this.spinnerContact(mb,ca,s,-1):undefined,spentA=debit(spinA),spentB=debit(spinB);
 if(landingKeys.has(s.key))continue;
 const robotPair=ma.bot!==null&&mb.bot!==null;
 if(robotPair){this.pushImpulse[ma.bot!]+=s.impulse;this.pushImpulse[mb.bot!]+=s.impulse;}
 const cutting=(m:ColliderInfo,handle:number,direction:number)=>{if(m.bot===null||m.module!=='weapon'||m.part?.body!=='rotor')return 0;const body=this.world.getCollider(handle)?.parent();if(!body?.isValid())return 0;return Math.max(0,dot(sub(this.preVelocity(body,s.point),this.preVelocity(this.bots[m.bot].chassis,s.point)),s.normal)*direction);};
 const ramSpeed=(m:ColliderInfo,direction:number)=>{if(m.bot===null||Math.abs(s.normal.y)>.6)return 0;const velocity=this.pre.get(this.bots[m.bot].chassis.handle)?.lin??v();return Math.max(0,(velocity.x*s.normal.x+velocity.z*s.normal.z)*direction);};
 const speedA=cutting(ma,s.a,1),speedB=cutting(mb,s.b,-1),ramA=ramSpeed(ma,1),ramB=ramSpeed(mb,-1),policy=robotPair?contactDamage({weaponA:ma.module==='weapon',weaponB:mb.module==='weapon',cutA:speedA>.35,cutB:speedB>.35,speedA,speedB,ramA,ramB}):null;
 if(robotPair&&(!policy||policy.cause==='ram'&&s.closing<1))continue;
 const floorContact=(ma.bot===null&&this.bodyIds.get(this.world.getCollider(s.a)?.parent()?.handle??-1)==='floor')||(mb.bot===null&&this.bodyIds.get(this.world.getCollider(s.b)?.parent()?.handle??-1)==='floor');
 const floorBot=ma.bot??mb.bot;
 const pressingHammer=floorContact&&floorBot!==null?this.hazards.find(h=>h.kind==='hammer'&&(h.phase==='active'||h.phase==='return')&&horizontal(hazardContactCentre(h),this.bots[floorBot].chassis.translation())<1.2):undefined;
 const floorWorkKey=pressingHammer?`${pressingHammer.id}/${pressingHammer.cycle}/${floorBot}`:undefined;
 const hIndex=ma.hazard??mb.hazard,hazardInfo=hIndex!==undefined?this.hazards[hIndex]:undefined,groupHazard=hazardInfo?.kind==='hammer'||hazardInfo?.kind==='blade';const key=groupHazard?`hazard${hIndex}/${hazardInfo!.cycle}/bot${ma.bot??mb.bot}`:s.key;let episode=this.episodes.get(key);if(!episode||!groupHazard&&this.startedContacts.has(s.key)){const label=(m:ColliderInfo)=>m.bot!==null?`b${m.bot}/${m.module}/${m.part?.id??'part'}`:m.hazard!==undefined?`hazard${m.hazard}`:'arena';episode={id:`${label(ma)}:${label(mb)}@${this.tick}`,last:this.tick,energy:0,impulse:0,peak:0};this.episodes.set(key,episode);}episode.last=this.tick;
 // Saw teeth also remove material while sliding. Count the friction work
 // actually solved at contact, within the same finite cycle budget.
 const relative=hazardInfo?.kind==='blade'?sub(this.preVelocity(ca?.parent()??null,s.point),this.preVelocity(cb?.parent()??null,s.point)):v(),shear=.5*s.frictionImpulse*length(sub(relative,mul(s.normal,dot(relative,s.normal))));
 const a=ma.bot,b=mb.bot,va=a===null?v():linear[a],vb=b===null?v():linear[b],translationClosing=Math.max(0,dot(sub(va,vb),s.normal)),available=(a===null?0:motionBudget[a])+(b===null?0:motionBudget[b]),normalBudget=normalKineticEnergy(a===null?0:masses[a],b===null?0:masses[b],translationClosing),breakdown=impactEnergy({impulse:s.impulse,closing:policy?.cause==='ram'?Math.min(s.closing,ramA+ramB):s.closing,translationClosing,translationBudget:Math.min(available,normalBudget),spinSpeed:(spinA?.speed??0)+(spinB?.speed??0),spinWork:spentA+spentB,shear}),energy=breakdown.total;
 if(available>0){if(a!==null)motionBudget[a]=Math.max(0,motionBudget[a]-breakdown.translation*motionBudget[a]/available);if(b!==null)motionBudget[b]=Math.max(0,motionBudget[b]-breakdown.translation*motionBudget[b]/available);}
 const wallHandle=ma.bot===null?s.a:mb.bot===null?s.b:undefined;
 const wallName=wallHandle===undefined?undefined:this.bodyIds.get(this.world.getCollider(wallHandle)?.parent()?.handle??-1);
 if(isArenaWall(wallName)&&Math.abs(s.normal.y)<.4){const key=wallName+'/'+(ma.bot??mb.bot),hit=wallHits.get(key);if(hit){if(energy>hit.energy)hit.point={...s.point};hit.energy+=energy;hit.impulse+=s.impulse;}else wallHits.set(key,{wall:wallName,point:{...s.point},energy,impulse:s.impulse,velocity:{...(ma.bot!==null?linear[ma.bot]:mb.bot!==null?linear[mb.bot]:v())}});}
 episode.impulse+=s.impulse;if(energy<.1)continue;episode.energy+=energy;
 if(episode.energy<(hazardInfo?.kind==='blade'?25:200))continue;
 const hazard=ma.hazard!==undefined?this.hazards[ma.hazard]:mb.hazard!==undefined?this.hazards[mb.hazard]:undefined;const maxEnergy=hazard?hazard.budget:Infinity;
 const hammer=hazardInfo??pressingHammer;
 const previous=episode.event?.energy??0,newTotal=Math.min(maxEnergy,episode.energy),deltaEnergy=Math.min(newTotal-previous,hammer?Math.max(0,hammer.budget-hammer.spent):Infinity);if(deltaEnergy<=0)continue;
 if(hammer)hammer.spent+=deltaEnergy;
 if(floorWorkKey)this.hammerFloorWork.set(floorWorkKey,(this.hammerFloorWork.get(floorWorkKey)??0)+deltaEnergy);
 if(!episode.event){const aw=policy?.attacker===0,bw=policy?.attacker===1,clash=policy?.cause==='weapon'&&policy.attacker===null;const attacker=aw||clash?ma.bot:bw?mb.bot:null,target=aw||clash?mb.bot:bw?ma.bot:ma.bot??mb.bot,targetMeta=aw||clash?mb:bw?ma:ma.bot!==null?ma:mb;
 const source=hazard?hazard.name:attacker!==null?this.bots[attacker].compiled.config.identity.name:ma.bot!==null&&mb.bot!==null?'Chassis collision':'Arena contact';
 const event:ImpactEvent={id:this.nextImpact++,tick:this.tick,episode:episode.id,source,attacker,target,module:targetMeta.module,energy:0,impulse:0,closing:s.closing,point:{...s.point},rotorBefore:[...rotorBefore],rotorAfter:this.bots.map(b=>.5*b.compiled.rotorInertia*this.omega(b)**2),allocations:[],cause:hazard?'hazard':policy?policy.cause:floorContact?'landing / arena':'collision'};

 const n=mul(s.normal,target===mb.bot?1:-1),blade=attacker===null?undefined:this.bots[attacker].rotor,tangent=blade?sub(this.preVelocity(blade,s.point),this.preVelocity(this.bots[attacker!].chassis,s.point)):n;
 event.sparkDirection=contactSparkDirection(tangent,n,target===null?v():this.bots[target].chassis.linvel());
 episode.event=event;this.events.push(event);if(this.events.length>600)this.events.shift();
 if(hazard&&target!==null){this.bots[target].lastHazard=this.tick;if(this.bots[target].lastAttacker!==null&&this.tick-this.bots[target].lastAction<=1.5*RULES.hz)event.cause='forced hazard after P'+(this.bots[target].lastAttacker!+1)+' action';}
 if(attacker!==null&&target!==null&&attacker!==target){this.bots[target].lastAttacker=attacker;this.bots[target].lastAction=this.tick;this.openTravel(target,event,'Post-impact travel');this.openTravel(attacker,event,'Recoil travel');}
 else if(target!==null){const tr=this.tracking.get(target);if(tr)tr.compound=true;}
 }
 const event=episode.event;updatedEvents.add(event);event.energy=previous+deltaEnergy;event.impulse=episode.impulse;event.closing=Math.max(event.closing,s.closing);event.robotSpeed=[length(linear[0]),length(linear[1])];const scale=energy>0?deltaEnergy/energy:0;event.translationEnergy=(event.translationEnergy??0)+breakdown.translation*scale;event.rotationalEnergy=(event.rotationalEnergy??0)+breakdown.rotation*scale;event.otherContactEnergy=(event.otherContactEnergy??0)+breakdown.other*scale;this.highlights.hit(event);
 if(policy?.cause==='weapon'&&policy.attacker!==null){const bite=policy.attacker===0?spinA:spinB,attacker=policy.attacker===0?ma.bot!:mb.bot!;event.damageScale=strikeMultiplier(this.bots[attacker].compiled.config)*(bite?.damageScale??1);if(bite){event.biteDepth=Math.max(event.biteDepth??0,bite.depth);event.engagement=Math.max(event.engagement??0,bite.engagement);}}
 if(robotPair&&policy){const shares=event.cause==='weapon'?(event.attacker===ma.bot?[0,ma.module==='weapon'&&mb.module==='weapon'?.5:1.2]:[ma.module==='weapon'&&mb.module==='weapon'?.5:1.2,0]):policy.shares;this.damage(ma.bot!,ma.module,deltaEnergy*shares[0]*(event.damageScale??1),event,ma.part,{point:s.point,direction:mul(s.normal,-1)});this.damage(mb.bot!,mb.module,deltaEnergy*shares[1]*(event.damageScale??1),event,mb.part,{point:s.point,direction:s.normal});
 }
 else{const target=ma.bot!==null?ma:mb;if(target.bot!==null)this.damage(target.bot,target.module,deltaEnergy,event,target.part);}
 }
 for(const hit of wallHits.values())this.wallDamage.impact(hit.wall,hit.point,hit.energy,hit.impulse,this.tick,hit.velocity);
 for(const [key,e]of this.episodes)if(this.tick-e.last>2*RULES.hz)this.episodes.delete(key);
 const after=this.bots.map(b=>.5*b.compiled.rotorInertia*this.omega(b)**2);for(const e of updatedEvents)e.rotorAfter=[...after];
 }
 damage(id:number,slot:Slot|'arena',energy:number,event?:ImpactEvent,part?:Part,contact?:{point:Vec,direction:Vec}){if(slot==='arena')return;const b=this.bots[id];
 // Flexible HUGE wheels absorb damage without reducing the solved hit impulse.
 if(componentProfile(b.compiled.config,'drive')==='huge'&&part?.body.startsWith('wheel_')&&(slot==='drive_left'||slot==='drive_right'))energy*=HUGE_WHEEL_DAMAGE_SCALE;
const batteryBefore=b.modules.battery.hp,crusher=event?.cause==='crush'&&event.attacker!==null&&event.attacker!==undefined&&event.attacker!==id&&componentProfile(this.bots[event.attacker].compiled.config,'weapon')==='quantum';
 const q=b.chassis.rotation(),inverse={x:-q.x,y:-q.y,z:-q.z,w:q.w},point=event?rotate(sub(contact?.point??event.point,b.chassis.translation()),inverse):v(100,100,100);
 const incoming=contact?.direction??event?.penetrationDirection;
 const direction=incoming?rotate(incoming,inverse):slot==='armour_rear'?v(0,0,-1):slot==='armour_front'?v(0,0,1):slot==='armour_left'?v(1,0,0):slot==='armour_right'?v(-1,0,0):v(0,-1,0);
 const batteryZone=event?batteryAlongRay(b.compiled.config,point,direction):undefined,overBattery=batteryZone!==undefined;
 const shell=slot==='weapon'&&componentProfile(b.compiled.config,'weapon')==='gigabyte';
 // A located robot strike can make a local hole without erasing the whole armour
 // panel before loading the battery beneath it. Account for puncture work once
 // at this contact site, then spend only the remaining work on internal damage.
 const penetrating=crusher||!!contact&&!!event&&['weapon','ram'].includes(event.cause);
 const localized=penetrating&&overBattery&&!!incoming&&(slot.startsWith('armour_')||shell);
 let puncture=0,breach:NonNullable<ImpactEvent['breaches']>[number]|undefined;
 if(localized){
  const sites=event!.breaches??=[];breach=sites.find(site=>site.target===id&&site.slot===slot&&length(sub(site.point,point))<=.035);
  if(!breach){breach={target:id,slot,point:{...point},work:0};sites.push(breach);if(sites.length>32)sites.shift();}
  const thickness=shell?(b.compiled.config.weapon as {thickness:number}).thickness:b.compiled.config.armour.find(a=>'armour_'+a.mount===slot)?.thickness??.004;
  puncture=Math.max(0,(crusher?QUANTUM_HYDRAULICS.frontForce:160000*MATERIALS[b.modules[slot].material].resistance/MATERIALS.hardox.resistance)*thickness-breach.work);
 }

 const route:Slot[]=penetrating&&overBattery&&(slot.startsWith('armour_')||slot==='chassis'||shell)?(slot==='chassis'?['battery','chassis']:[slot,'battery','chassis']):slot.startsWith('armour_')?[slot,'chassis',slot==='armour_left'?'drive_left':slot==='armour_right'?'drive_right':slot==='armour_rear'?(overBattery?'battery':'chassis'):'weapon_actuator']:slot==='chassis'?(overBattery||!event?['chassis','battery']:['chassis']):[slot];let remaining=Math.max(0,energy);

 for(const target of route){const m=b.modules[target];if(!m.present)continue;const resistance=target==='battery'&&crusher?BATTERY_CRUSH_RESISTANCE:MATERIALS[m.material].resistance,budget=localized&&target===slot?Math.min(remaining,puncture):remaining,hp=panelLoss(budget,resistance,m.hp),used=hp*resistance;if(localized&&target===slot)breach!.work+=used;m.hp=clamp(m.hp-hp,0,m.max);remaining-=used;if(hp>0&&event){const allocation=event.allocations.find(a=>a.bot===id&&a.module===target);if(allocation){allocation.energy+=used;allocation.hp+=hp;}else event.allocations.push({bot:id,module:target,energy:used,hp});}if(m.hp<=0&&m.functional&&!protectedWeaponModule(target)){m.functional=false;this.failModule(b,target);}if(remaining<=.0001)break;}
 if(!b.batteryFire&&b.modules.battery.hp<batteryBefore&&damageStatus(b.modules).batteryDamage>=BATTERY_FIRE.damageThreshold&&event?.attacker!==null&&event?.attacker!==undefined&&event.attacker!==id&&['crush','weapon'].includes(event.cause)){
  const fireEvent:ImpactEvent={id:this.nextImpact++,tick:this.tick,episode:'battery-fire/'+id,source:this.bots[event.attacker].compiled.config.identity.name,attacker:event.attacker,target:id,module:'battery',energy:0,impulse:0,closing:0,point:{...event.point},rotorBefore:[0,0],rotorAfter:[0,0],allocations:[],cause:'battery fire'};
  b.batteryFire={localPoint:batteryZones(b.compiled.config)[batteryZone??0].position,started:this.tick,until:this.tick+BATTERY_FIRE.seconds*RULES.hz,attacker:event.attacker as 0|1,event:fireEvent};this.events.push(fireEvent);if(this.events.length>600)this.events.shift();this.notice(b.compiled.config.identity.name+': BATTERY FIRE');
 }
 }
 batteryFireSeconds(b:Bot){return b.batteryFire?Math.max(0,(b.batteryFire.until-this.tick)/RULES.hz):0;}
 private burnBatteries(){
  for(const b of this.bots){const fire=b.batteryFire;if(!fire||this.tick<=fire.started||this.tick>fire.until)continue;
   const batteryEnergy=BATTERY_FIRE.batteryHPPerSecond*MATERIALS[b.modules.battery.material].resistance*RULES.dt,chassisEnergy=BATTERY_FIRE.chassisHPPerSecond*MATERIALS[b.modules.chassis.material].resistance*RULES.dt;
   this.damage(b.id,'battery',batteryEnergy,fire.event);this.damage(b.id,'chassis',chassisEnergy,fire.event);fire.event.energy+=batteryEnergy+chassisEnergy;
   b.energy=Math.max(0,b.energy-b.compiled.config.battery.capacityWh*3600*BATTERY_FIRE.chargePerSecond*RULES.dt);
  }
 }

 private failModule(b:Bot,slot:Slot){this.notice(`${b.compiled.config.identity.name}: ${slot.replaceAll('_',' ')} failed`);if(slot.startsWith('armour_')){
 for(const p of b.compiled.parts.filter(p=>p.module===slot)){const col=b.colliders.get(p.id);if(!col?.isValid())continue;const parent=col.parent()!,pos=col.translation(),rot=col.rotation(),vel=parent.velocityAtPoint(pos),ang=parent.angvel();this.meta.delete(col.handle);this.world.removeCollider(col,true);b.colliders.delete(p.id);
 const body=this.world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(pos.x,pos.y,pos.z).setRotation(rot).setLinvel(vel.x,vel.y,vel.z).setAngvel(ang).setCcdEnabled(true));const desc=colliderDesc({...p,position:v(),rotation:identity}).setCollisionGroups(groups(8,1)).setFriction(.7);this.world.createCollider(desc,body);const id=`debris_${this.tick}_${b.id}_${p.id}`;this.bodyIds.set(body.handle,id);this.debris.push({body,part:p,id});}
 while(this.debris.length>RULES.debris){const old=this.debris.shift()!;this.bodyIds.delete(old.body.handle);this.world.removeRigidBody(old.body);}}
 }
 private openTravel(id:number,event:ImpactEvent,role:Travel['role']){
 const existing=this.tracking.get(id);
 if(existing&&existing.ticks<.25*RULES.hz){existing.compound=true;if(role==='Post-impact travel'){existing.role=role;existing.impactId=event.id;}return;}
 this.closeTravel(id,'New impact');const b=this.bots[id],p={...(this.pre.get(b.chassis.handle)?.p??b.chassis.translation())},com=this.wholeCOM(b);
 this.tracking.set(id,{impactId:event.id,bot:id,role,origin:p,final:p,comOrigin:com,comFinal:com,maxHorizontal:0,horizontal:0,displacement3d:0,path:0,height:0,airtime:0,powered:false,compound:false,reason:'Tracking',ticks:0,still:0,points:[p],airborne:false,landed:0});
 }
 closeTravel(id:number,reason:string){const tr=this.tracking.get(id);if(!tr)return;tr.reason=reason;tr.endedTick=this.tick;if(tr.points.at(-1)!==tr.final)tr.points.push({...tr.final});this.travels.push(tr);if(this.travels.length>150)this.travels.shift();this.tracking.delete(id);}
 get displayedTravel(){return [...this.tracking.values(),...this.travels].filter(t=>t.role==='Post-impact travel'&&(t.height>.08||t.airtime>.12)&&this.tick-(t.endedTick??this.tick)<8*RULES.hz).sort((a,b)=>b.impactId-a.impactId)[0];}
 private sampleTravel(){for(const [id,t]of this.tracking){
 const b=this.bots[id];if(b.rollStart>=0||b.compiled.config.weapon.type==='flipper'&&b.flipStart>=0&&this.axis(b,v(0,1,0)).y<.5){this.closeTravel(id,'Self-righting');continue;}
 const p={...b.chassis.translation()};t.path+=length(sub(p,t.final));t.final=p;t.comFinal=this.wholeCOM(b);t.horizontal=horizontal(t.origin,p);t.maxHorizontal=Math.max(t.maxHorizontal,t.horizontal);t.displacement3d=length(sub(p,t.origin));t.height=Math.max(t.height,p.y-t.origin.y);
 if(!b.grounded){t.airtime+=RULES.dt;if(t.height>.06||t.airtime>.10)t.airborne=true;t.landed=0;}else if(t.airborne)t.landed++;
 this.highlights.travel(t,b.grounded,this.driveWork[b.id]>.001);
 t.powered||=this.driveWork[b.id]>.001;t.ticks++;if(t.ticks%8===0){t.points.push(p);if(t.points.length>240)t.points.splice(1,1);}
 t.still=length(b.chassis.linvel())<.12?t.still+1:0;
 if(t.airborne&&t.landed>=.2*RULES.hz)this.closeTravel(id,'Landed');
 else if(t.still>=.35*RULES.hz&&t.ticks>.5*RULES.hz)this.closeTravel(id,'Settled');
 else if(t.ticks>=(t.airborne?10:2)*RULES.hz)this.closeTravel(id,t.airborne?'Flight ended':'Ground movement');
 }}
 private recoverStuck(b:Bot){
 if(b.command.selfRight||b.rollStart>=0||b.gripRelease||b.compiled.config.weapon.type==='crusher'&&b.weaponOn||this.tick-b.lastSelfRight<3*RULES.hz||b.compiled.config.weapon.type==='flipper'&&b.flipStart>=0){b.unstick.active=false;return;}
 if(!this.options.autoUnstick||!this.powered(b)||!b.modules.drive_left.functional&&!b.modules.drive_right.functional||b.pinVictim){b.unstick.active=false;return;}
 const history=b.history,first=history[0],p=b.chassis.translation(),trying=Math.abs(b.command.left)+Math.abs(b.command.right)>.2;
 const stalled=first&&this.tick-first.tick>=.85*RULES.hz&&horizontal(first.p,p)<.08;
 const tipped=!b.grounded&&this.axis(b,v(0,1,0)).y<.5;
 if(!b.unstick.active){if(!(b.count>=2*RULES.hz||tipped&&stalled&&trying))return;b.unstick={active:true,since:this.tick,attempt:b.unstick.attempt+1};this.notice(b.compiled.config.identity.name+': automatic recovery');}
 const elapsed=(this.tick-b.unstick.since)/RULES.hz;
 if(elapsed>3.6){b.unstick.active=false;return;}
 const f=this.forward(b),heading=Math.atan2(f.x,-f.z),away=Math.atan2(-p.x,p.z),error=Math.atan2(Math.sin(away-heading),Math.cos(away-heading));
 const turn=elapsed<1.05?(b.unstick.attempt%2?1:-1)*.30:clamp(error*1.8,-.85,.85);
 const throttle=elapsed<1.05?-.85:elapsed<2.15?(Math.abs(error)<.4?.55:0):.80;
 b.command={...b.command,left:clamp(throttle+turn,-1,1),right:clamp(throttle-turn,-1,1),selfRight:b.command.selfRight||this.automaticSelfRightReady(b)&&this.tick-b.lastSelfRight>=3*RULES.hz};
 b.ai.state='unstick';b.ai.reason=elapsed<1.05?'Reverse out of the obstruction':'Turn toward open floor';
 }
 private rules(){
 const [a,b]=this.bots;const actualContact=this.robotsInContact;
 for(const r of this.bots)r.pinVictim=false;
 let pinAttacker=-1;
 if(actualContact){for(const r of this.bots){const o=this.bots[1-r.id],toward=sub(o.chassis.translation(),r.chassis.translation());if(o.wall&&length(o.chassis.linvel())<.20&&(r.command.left+r.command.right)>.25&&dot(this.forward(r),toward)>.15)pinAttacker=r.id;}}
 if(this.pinState.attacker>=0){const ps=this.pinState;let separated=false;if(!actualContact&&this.tick%(RULES.hz/10)===0){separated=true;outer:for(const ca of a.colliders.values())if(!ca.isSensor())for(const cb of b.colliders.values())if(!cb.isSensor()&&ca.contactCollider(cb,.5)){separated=false;break outer;}}if(separated){this.pinState={attacker:-1,victim:-1,ticks:0,releaseAt:0,fouled:false};}else{this.bots[ps.victim].pinVictim=actualContact;if(pinAttacker===ps.attacker)ps.ticks++;if(ps.ticks===9*RULES.hz)this.notice('Pin warning: release now');if(ps.ticks>=10*RULES.hz&&!ps.releaseAt){ps.releaseAt=this.tick;this.notice('Release pin: separate by 0.5 m');}if(ps.releaseAt&&this.tick-ps.releaseAt>=2*RULES.hz&&!ps.fouled){this.bots[ps.attacker].fouls++;ps.fouled=true;this.notice('Failed release: foul');}}}
 else if(pinAttacker>=0)this.pinState={attacker:pinAttacker,victim:1-pinAttacker,ticks:1,releaseAt:0,fouled:false};
 for(const r of this.bots){const o=this.bots[1-r.id],p={...r.chassis.translation()},powered=this.powered(r)&&(r.modules.drive_left.functional||r.modules.drive_right.functional)&&Math.abs(r.command.left)+Math.abs(r.command.right)>.08&&this.driveWork[r.id]>.0001&&this.tick-r.lastAction>1.5*RULES.hz;
 if(this.tick%(RULES.hz/10)===0){
 const canDrive=this.powered(r)&&(r.modules.drive_left.functional||r.modules.drive_right.functional),trying=Math.abs(r.command.left)+Math.abs(r.command.right)>.12;
 r.history.push({tick:this.tick,p,ground:r.grounded,powered:canDrive&&trying});while(r.history.length>11)r.history.shift();
 const first=r.history[0],moving=this.tick-first.tick>=.8*RULES.hz&&horizontal(first.p,p)>=.08&&r.history.filter(x=>x.ground&&x.powered).length>=3;
 const physicallyStuck=!r.grounded&&this.axis(r,v(0,1,0)).y<.5,eligible=!canDrive||physicallyStuck||trying||r.count>0;
 if(!r.pinVictim){
  if(moving){r.recovery+=RULES.hz/10;if(r.recovery>=.5*RULES.hz){r.count=0;r.pending=0;}}
  else if(eligible){r.recovery=0;r.pending+=RULES.hz/10;if(r.pending>=RULES.hz)r.count=r.pending;}
  else{r.recovery=0;r.pending=0;r.count=0;}
 }
 }
 const towards=sub(o.chassis.translation(),p),distance=length(towards),f=this.forward(r),facing=distance>0?dot(f,mul(towards,1/distance))>Math.cos(.5):false;
 const active=r.compiled.config.weapon.type==='crusher'?r.weaponOn&&r.crushForce>150:r.compiled.config.weapon.type==='flipper'?this.tick-r.lastFire<.75*RULES.hz:r.weaponOn&&r.rpm>1000;
 const closing=dot(sub(r.chassis.linvel(),o.chassis.linvel()),towards)>0&&powered&&r.grounded;
 if(distance<1.7&&facing&&active&&powered)r.engage+=RULES.dt;if(distance<5&&closing)r.closing+=RULES.dt;
 if(this.pinState.attacker===r.id&&this.pinState.ticks<9*RULES.hz)r.pin+=RULES.dt;
 if(o.lastAttacker===r.id&&this.tick-o.lastAction<=1.5*RULES.hz&&(!o.grounded||this.axis(o,v(0,1,0)).y<-.5||this.tick-o.lastHazard<.1*RULES.hz))r.forced+=RULES.dt;
 if(r.grounded&&!r.wall&&distance<3&&closing&&this.axis(r,v(0,1,0)).y>.7)r.stable+=RULES.dt;
 if(r.recovery>=.5*RULES.hz){r.lastAttacker=null;r.lastAction=-10000;}
 }
 if(this.options.practice)return;
 const terminal=this.bots.map(r=>this.outOfArena(r)?'Out of arena':r.modules.chassis.hp<=0?'Structural KO':r.count>=10*RULES.hz?'Count-out':r.fouls>=3?'Three fouls':'');
 if(terminal[0]&&terminal[1])this.finish('Double stoppage');else if(terminal[0])this.finish(terminal[0],1);else if(terminal[1])this.finish(terminal[1],0);else if(this.tick>=RULES.matchTicks)this.finish('Judges’ decision');
 }
 normalizedDamage(b:Bot){const cats:{slots:Slot[],weight:number}[]=[{slots:['chassis'],weight:.2},{slots:['weapon'],weight:.2},{slots:['weapon_actuator'],weight:.15},{slots:['drive_left','drive_right'],weight:.2},{slots:['battery'],weight:.1},{slots:['armour_front','armour_left','armour_right','armour_rear','armour_top'],weight:.1},{slots:['self_right'],weight:.05}];let weight=0,value=0;for(const c of cats){const slots=c.slots.filter(s=>b.modules[s].present);if(!slots.length)continue;weight+=c.weight;value+=c.weight*slots.reduce((s,k)=>s+Math.max(0,b.startHP[k]-b.modules[k].hp)/b.modules[k].max,0)/slots.length;}return weight?value/weight:0;}
 finish(reason:string,winner?:0|1){if(this.result||this.fault)return;for(const b of this.bots)if(b.crushEvent&&b.crushEvent.releasedTick===undefined){this.releaseCrusher(b);b.weaponOn=false;}const damage=this.bots.map(b=>this.normalizedDamage(b));const share=(x:number,y:number)=>x+y?x/(x+y):.5;const metrics:[number[],number[]]=[[],[]];for(const b of this.bots){const o=this.bots[1-b.id];metrics[b.id]=[damage[1-b.id],.6*share(b.engage,o.engage)+.4*share(b.closing,o.closing),.4*share(b.pin,o.pin)+.4*share(b.forced,o.forced)+.2*share(b.stable,o.stable)];}const {scores,ties}=assignPoints(metrics,this.tiePreference);const total=(x:number[])=>x.reduce((s,n)=>s+n,0);this.result={winner:winner??(total(scores[0])>total(scores[1])?0:1),reason,tick:this.tick,scores,metrics,ties,damage,raw:{engage:this.bots.map(b=>b.engage),closing:this.bots.map(b=>b.closing),pin:this.bots.map(b=>b.pin),forced:this.bots.map(b=>b.forced),stable:this.bots.map(b=>b.stable)}};if(reason==='Out of arena'){const id=1-this.result.winner,b=this.bots[id],flight=this.tracking.get(id)??[...this.travels].reverse().find(t=>t.bot===id&&this.tick-(t.endedTick??0)<2*RULES.hz),origin=flight?.origin??b.history.find(h=>h.ground)?.p??b.chassis.translation();this.result.ringOut={bot:id,origin:{...origin},height:flight?.height??0,distance:flight?.maxHorizontal??0};this.updateRingOut();}if(this.frames.at(-1)?.tick!==this.tick)this.capture();}
 capture(){if(!this.recordVisuals)return;const transforms:Transform[]=[];for(const b of this.bots)for(const [key,body]of b.bodies)transforms.push({id:`b${b.id}:${key}`,p:{...body.translation()},q:{...body.rotation()}});for(const h of this.hazards)transforms.push({id:'hazard_'+h.id,p:{...h.body.translation()},q:{...h.body.rotation()}});for(const d of this.debris)transforms.push({id:d.id,p:{...d.body.translation()},q:{...d.body.rotation()}});const frame:VisualFrame={wallCracks:this.wallDamage.cracks,tick:this.tick,transforms,tracks:this.bots.map(b=>[...(b.trackPhase??[0,0])]),speeds:this.bots.map(b=>length(b.chassis.linvel())),rpm:this.bots.map(b=>b.rpm),firePoints:this.bots.map(b=>({...b.batteryFire?.localPoint??batteryPosition(b.compiled.config)})),fires:this.bots.map(b=>this.batteryFireSeconds(b)),directions:this.bots.map(b=>Math.sign(this.omega(b))||b.spinDirection),hits:copy(this.hitReadouts.update(this.events,this.tick)),health:this.bots.map(b=>SLOTS.map(s=>b.modules[s].max?b.modules[s].hp/b.modules[s].max:0)),effects:this.events.filter(e=>this.tick-e.tick<RULES.hz&&e.cause!=='crush'&&e.cause!=='battery fire').map(e=>({id:e.id,tick:e.tick,p:e.point,energy:e.energy,damage:e.allocations.reduce((sum,a)=>sum+a.hp,0),direction:e.sparkDirection}))};this.frames.push(frame);if(this.frames.length>180)this.frames.shift();
 for(const id of[0,1]){let event:ImpactEvent|undefined;for(let i=this.events.length-1;i>=0;i--){const e=this.events[i];if(e.target===id&&e.attacker!==null&&['weapon','ram','crush'].includes(e.cause)&&e.allocations.some(a=>a.bot===id&&a.hp>0)){event=e;break;}}if(!event)continue;let clip=this.lastHitClips.get(id);if(clip?.event!==event.id){clip={event:event.id,tick:event.tick,frames:this.frames.filter(f=>f.tick>=event.tick-.35*RULES.hz&&f.tick<=event.tick+.6*RULES.hz)};this.lastHitClips.set(id,clip);}else if(this.tick<=clip.tick+.6*RULES.hz&&clip.frames.at(-1)?.tick!==frame.tick)clip.frames.push(frame);}
 return frame;}
 lastHitReplay(){return this.result&&['Structural KO','Count-out','Out of arena'].includes(this.result.reason)?this.lastHitClips.get(1-this.result.winner)?.frames??[]:[];}
 snapshot(){return{tick:this.tick,bots:this.bots.map(b=>({p:b.chassis.translation(),q:b.chassis.rotation(),energy:b.energy,hp:SLOTS.map(s=>b.modules[s].hp),charges:b.charges,rpm:b.rpm,count:b.count})),events:this.events.length};}
 dispose(){if(this.disposed)return;this.disposed=true;this.queue.free();this.world.free();this.meta.clear();this.bodiesClear();this.frames.length=0;this.episodes.clear();this.hammerFloorWork.clear();this.pre.clear();this.startedContacts.clear();this.floorSupport.clear();this.falls.clear();}
 private bodiesClear(){for(const b of this.bots){b.bodies.clear();b.colliders.clear();b.joints.clear();}this.bodyIds.clear();this.debris.length=0;this.hazards.length=0;}
}

export class FixedClock{
 accumulator=0;backlog=0;paused=false;reason='';
 advance(seconds:number,step:()=>void){
 if(this.paused||!Number.isFinite(seconds)||seconds<0)return 0;
 // A rendering hitch discards excess wall time; physics always keeps fixed steps.
 this.accumulator+=Math.min(seconds,RULES.maxSteps*RULES.dt);let count=0;
 while(this.accumulator+1e-10>=RULES.dt&&count<RULES.maxSteps){step();if(this.paused)break;this.accumulator-=RULES.dt;count++;}
 if(this.accumulator>=RULES.dt)this.accumulator%=RULES.dt;this.backlog=0;return count;
 }
 pause(reason='Paused'){this.paused=true;this.reason=reason;this.accumulator=0;this.backlog=0;}
 resume(){this.paused=false;this.reason='';this.accumulator=0;this.backlog=0;}
}

export type RepairOrder={module:Slot,kind:'repair'|'replace',amount:number};
export type SwapOrder={module:Slot,material:Material};
export function repairQuote(modules:Record<Slot,Module>,orders:RepairOrder[]){let cost=0;const after=copy(modules),seen=new Set<Slot>();for(const o of orders){if(seen.has(o.module))throw Error('Duplicate repair');seen.add(o.module);const m=after[o.module];if(!m?.present)throw Error('Cannot repair an absent module');const missing=m.max-m.hp;if(o.kind==='replace'){cost+=Math.ceil(missing+100);m.hp=m.max;}else{if(!Number.isFinite(o.amount)||o.amount<0||o.amount>missing+.00001||m.hp<=0)throw Error('Invalid repair amount; destroyed modules require replacement');cost+=Math.ceil(o.amount);m.hp=Math.min(m.max,m.hp+o.amount);}m.functional=m.hp>0;}if(cost>RULES.repair)throw Error('Repairs exceed 900 points');return{cost,remaining:RULES.repair-cost,after};}
export function refitQuote(config:BotConfig,modules:Record<Slot,Module>,orders:RepairOrder[],swaps:SwapOrder[],identity=config.identity){
 const updated=copy(config),staged=copy(modules),seen=new Set<Slot>();updated.identity=copy(identity);let swapCost=0;
 for(const order of swaps){if(seen.has(order.module)||orders.some(r=>r.module===order.module))throw Error('Use one purchase for each module.');seen.add(order.module);const panel=updated.armour.find(a=>'armour_'+a.mount===order.module);if(!panel||!staged[order.module].present||!MATERIALS[order.material])throw Error('Choose a present armour panel and a catalogue material.');panel.material=order.material;const newer=compile(updated).modules[order.module],old=staged[order.module];swapCost+=Math.ceil(Math.max(old.max-old.hp,newer.max)+100);staged[order.module]=copy(newer);}
 const compiled=compile(updated);if(compiled.errors.length)throw Error(compiled.errors.map(e=>e.message).join(' '));const quote=repairQuote(staged,orders),cost=quote.cost+swapCost;if(cost>900)throw Error('Repairs exceed 900 points');return{...quote,cost,remaining:900-cost,config:updated,massBefore:compile(config).mass,massAfter:compiled.mass};
}

export type Entry={name:string,config:BotConfig,player:boolean};
export class Tournament{
 entries:Entry[];round=0;matches:{a:Entry,b:Entry,winner?:Entry,reason?:string}[][]=[];condition?:Record<Slot,number>;repairModules?:Record<Slot,Module>;champion?:Entry;eliminated=false;seed:number;hazards:boolean;pending?:Simulation;pendingIndex=-1;busy=false;fault?:string;
 constructor(player:BotConfig,hazards=true,seed=7189){this.seed=seed;this.hazards=hazards;this.entries=[{name:player.identity.name,config:copy(player),player:true}];const random=rng(seed);const counts=new Map<string,number>();for(let i=0;i<7;i++){const c=preset((i+Math.floor(random()*ROSTER.length))%ROSTER.length);const seen=(counts.get(c.identity.name)??0)+1;counts.set(c.identity.name,seen);if(seen>1)c.identity.name+=' '+seen;c.identity.primary=['#eb794b','#af9fed','#e8c869','#82b3c8','#d4a48b','#9fbf72','#dc737e'][i];if(isSpinner(c.weapon))c.weapon.rpm*=.90+random()*.09;const x=compile(c);if(x.errors.length)throw Error('Illegal tournament entry: '+c.identity.name);this.entries.push({name:c.identity.name,config:c,player:false});}this.matches=[this.pair(this.entries)];}
 pair(entries:Entry[]){const out=[];for(let i=0;i<entries.length;i+=2)out.push({a:entries[i],b:entries[i+1],winner:undefined as Entry|undefined,reason:undefined as string|undefined});return out;}
 get playerMatch(){return this.matches[this.round]?.find(m=>(m.a.player||m.b.player)&&!m.winner);}
 playerConfigs():[BotConfig,BotConfig]{const m=this.playerMatch;if(!m)throw Error('No player match');return[m.a.player?m.a.config:m.b.config,m.a.player?m.b.config:m.a.config];}
 recordPlayer(result:Result,modules:Record<Slot,Module>){const m=this.playerMatch;if(!m)throw Error('No match to record');m.winner=result.winner===0?(m.a.player?m.a:m.b):(m.a.player?m.b:m.a);m.reason=result.reason;this.condition=Object.fromEntries(SLOTS.map(s=>[s,modules[s].hp])) as Record<Slot,number>;this.repairModules=copy(modules);if(!m.winner.player)this.eliminated=true;}
 stepOffscreen(maxTicks=160,budgetMs=Infinity){const deadline=performance.now()+budgetMs;if(this.fault)return false;const round=this.matches[this.round];let m=round.find(x=>!x.a.player&&!x.b.player&&!x.winner);if(!m){this.busy=false;return false;}this.busy=true;if(!this.pending){this.pendingIndex=round.indexOf(m);this.pending=new Simulation([m.a.config,m.b.config],{seed:this.seed+this.round*31+this.pendingIndex,hazards:this.hazards,ai:[true,true],difficulty:'medium',recordVisuals:false});}const sim=this.pending;for(let i=0;i<maxTicks&&!sim.result&&!sim.fault;i++){if(i>0&&performance.now()>=deadline)break;sim.step();}if(sim.fault){this.fault='Computer match paused: '+sim.fault;sim.dispose();this.pending=undefined;this.busy=false;throw Error(this.fault);}if(sim.result){m=round[this.pendingIndex];m.winner=sim.result.winner===0?m.a:m.b;m.reason=sim.result.reason;sim.dispose();this.pending=undefined;}return true;}
 retryOffscreen(){this.fault=undefined;}
 advance(){if(this.matches[this.round].some(m=>!m.winner))throw Error('Round is still running');const winners=this.matches[this.round].map(m=>m.winner!);if(winners.length===1){this.champion=winners[0];return;}this.round++;this.matches.push(this.pair(winners));}
 commitRepair(orders:RepairOrder[]){if(!this.repairModules)throw Error('No repair window');const player=this.entries.find(e=>e.player)!;if(compile(player.config).errors.length)throw Error('Build is illegal');const result=repairQuote(this.repairModules,orders);this.repairModules=result.after;this.condition=Object.fromEntries(SLOTS.map(s=>[s,result.after[s].hp])) as Record<Slot,number>;return result;}
 dispose(){this.pending?.dispose();this.pending=undefined;}
}
