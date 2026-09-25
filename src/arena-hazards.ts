import RAPIER from '@dimforge/rapier3d-compat';
import {RULES,v,add,mul,sub,cross,dot,length,horizontal,rotate,axisQ,clamp,identity,type Vec,type Quat} from './model';

// The 50 lb head is user specified. Speeds, motor power and timing are game
// settings. Shared geometry dimensions keep visible and physical surfaces aligned.
export const ARENA_HAZARDS={headKg:50*.45359237,armKg:3,armLength:1.18,hammerJ:3500,
 sawRadius:.32,sawWidth:.014,sawSpacing:.24,sawRPM:1200,sawWatts:750,
 screwRadius:.17,screwCore:.065,screwLength:1.38,screwRate:5,screwWatts:600,
 jamSeconds:1.25,reverseSeconds:1.8} as const;
export type Hazard={id:number,name:string,kind:'hammer'|'blade'|'auger',body:RAPIER.RigidBody,anchor:RAPIER.RigidBody,axis:Vec,baseRotation:Quat,base:Vec,phase:'idle'|'warning'|'active'|'return',cycle:number,budget:number,spent:number,stroke:number,direction:number,reverseUntil:number,jamTicks:number,jamBot?:number,jamOrigin?:Vec,jamContactTick?:number,deck:boolean};
type Register=(col:RAPIER.Collider,id:number)=>void;
export function createHazards(world:RAPIER.World,register:Register){
 const result:Hazard[]=[],C=ARENA_HAZARDS;
 const create=(kind:Hazard['kind'],base:Vec,name:string,direction=1,deck=false,baseRotation:Quat=identity)=>{
  const id=result.length,anchor=world.createRigidBody((kind==='blade'?RAPIER.RigidBodyDesc.kinematicPositionBased():RAPIER.RigidBodyDesc.fixed()).setTranslation(base.x,base.y,base.z).setRotation(baseRotation));
  const body=world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(base.x,base.y,base.z).setRotation(baseRotation).setGravityScale(0).setCcdEnabled(true).setCanSleep(false));
  const joint=world.createImpulseJoint(RAPIER.JointData.revolute(v(),v(),v(1,0,0)),anchor,body,true) as RAPIER.RevoluteImpulseJoint;
  joint.setContactsEnabled(false);if(kind==='hammer')joint.setLimits(0,Math.PI/2);
  const collider=(desc:RAPIER.ColliderDesc)=>{const col=world.createCollider(desc.setCollisionGroups((16<<16)|6).setFriction(kind==='auger'?1.3:.7).setRestitution(.02),body);register(col,id);};
  if(kind==='hammer'){
   collider(RAPIER.ColliderDesc.cuboid(.21,.14,.16).setTranslation(0,C.armLength,0).setMass(C.headKg));
   collider(RAPIER.ColliderDesc.cuboid(.035,C.armLength/2,.045).setTranslation(0,C.armLength/2,0).setMass(C.armKg));
  }else if(kind==='blade'){
   for(const side of[-1,1]){
    collider(RAPIER.ColliderDesc.cylinder(C.sawWidth/2,C.sawRadius-.012).setRotation(axisQ(v(0,0,1),Math.PI/2)).setTranslation(side*C.sawSpacing/2,0,0).setMass(3));
    for(let j=0;j<24;j++){const a=j*Math.PI/12;collider(RAPIER.ColliderDesc.cuboid(C.sawWidth/2,.014,.025).setTranslation(side*C.sawSpacing/2,Math.cos(a)*(C.sawRadius-.008),Math.sin(a)*(C.sawRadius-.008)).setRotation(axisQ(v(1,0,0),a)).setMass(.008));}
   }
  }else{
   const span=deck?C.screwLength:3.3,segments=deck?54:108,turns=deck?3:7;
   collider(RAPIER.ColliderDesc.cylinder(span/2,C.screwCore).setRotation(axisQ(v(0,0,1),Math.PI/2)).setMass(16));
   // Discrete convex sections form a continuous helical flight. Unlike the
   // former rotating cuboid, these surfaces lift from the visible screw edge.
   for(let j=0;j<segments;j++){
    const a=j/segments*Math.PI*2*turns,x=-span/2+(j+.5)*span/segments,r=(C.screwCore+C.screwRadius)/2;
    collider(RAPIER.ColliderDesc.cuboid(span/segments*.7,(C.screwRadius-C.screwCore)/2,.027).setTranslation(x,Math.cos(a)*r,Math.sin(a)*r).setRotation(axisQ(v(1,0,0),a)).setMass(4/segments));
   }
  }
  const h:Hazard={id,name,kind,body,anchor,axis:rotate(v(1,0,0),baseRotation),baseRotation,base,phase:'idle',cycle:0,budget:kind==='hammer'?C.hammerJ:kind==='blade'?6000:2500,spent:0,stroke:0,direction,reverseUntil:0,jamTicks:0,deck};result.push(h);return h;
 };
 create('hammer',v(-5.7,.30,-6.50),'Corner Hammer A');
 create('hammer',v(5.7,.30,6.50),'Corner Hammer B',1,false,axisQ(v(0,1,0),Math.PI));
 for(const x of[-2.5,2.5])for(const z of[-2.5,2.5])create('blade',v(x,-.355,z),'Floor Saws '+(result.length-1));
 create('auger',v(-7.1,.20,0),'Wall Screw A',1,false,axisQ(v(0,1,0),-Math.PI/2));
 create('auger',v(7.1,.20,0),'Wall Screw B',-1,false,axisQ(v(0,1,0),-Math.PI/2));
 for(const x of[-.86,.86])create('auger',v(x,.20,-5.12),'Upper Deck Screw '+(x<0?'A':'B'),-1,true);
 return result;
}
export function hazardContactCentre(h:Hazard){return h.kind==='hammer'?add(h.body.translation(),rotate(v(0,ARENA_HAZARDS.armLength,0),h.body.rotation())):h.body.translation();}
function motor(h:Hazard,target:number,watts:number,maxTorque:number){
 const rate=dot(h.body.angvel(),h.axis),torque=clamp((target-rate)*18,-maxTorque,maxTorque),limited=clamp(torque,-watts/Math.max(3,Math.abs(rate)),watts/Math.max(3,Math.abs(rate)));
 h.body.resetTorques(false);h.body.addTorque(mul(h.axis,limited),true);
}
export function stepHazard(world:RAPIER.World,h:Hazard,tick:number,bots:{id:number,chassis:RAPIER.RigidBody}[],botForCollider:(c:RAPIER.Collider)=>number|null|undefined){
 const C=ARENA_HAZARDS,cycleTicks=(h.kind==='hammer'?6:h.kind==='blade'?5:2)*RULES.hz,offset=h.id*97*RULES.hz/120,t=(tick+offset)%cycleTicks,cycle=Math.floor((tick+offset)/cycleTicks),previous=h.phase;
 if(cycle!==h.cycle)h.spent=0;h.cycle=cycle;
 if(h.kind==='auger'){
  h.phase='active';let contact:number|undefined;
  for(let j=0;j<h.body.numColliders();j++)world.contactPairsWith(h.body.collider(j),other=>{const id=botForCollider(other);if(id!==null&&id!==undefined)world.contactPair(h.body.collider(j),other,m=>{if(m.numSolverContacts()>0)contact=id;});});
  // Successive helical teeth make and break contact. A brief gap must not
  // clear a jam while the same robot remains trapped at the screw.
  if(contact!==undefined)h.jamContactTick=tick;
  else if(h.jamContactTick!==undefined&&tick-h.jamContactTick<.25*RULES.hz)contact=h.jamBot;
  const bot=bots.find(b=>b.id===contact),p=bot?.chassis.translation();
  if(p&&tick>=h.reverseUntil){if(h.jamBot!==contact||!h.jamOrigin||horizontal(p,h.jamOrigin)>.08){h.jamBot=contact;h.jamOrigin={...p};h.jamTicks=0;}else h.jamTicks++;
   if(h.jamTicks>=C.jamSeconds*RULES.hz){h.reverseUntil=tick+C.reverseSeconds*RULES.hz;h.jamTicks=0;h.jamOrigin=undefined;}
  }else if(!p){h.jamTicks=0;h.jamOrigin=undefined;h.jamBot=undefined;}
  const occupied=h.deck&&bots.some(b=>{const q=b.chassis.translation();return Math.abs(q.x)<1.55&&q.z< -5.3&&q.z> -6.6&&q.y>.32;});
  motor(h,h.direction*C.screwRate*(tick<h.reverseUntil||occupied?-1:1),C.screwWatts,120);return;
 }
 const warn=cycleTicks-(h.kind==='hammer'?1.6:2.5)*RULES.hz,start=warn+.5*RULES.hz,end=start+(h.kind==='hammer'?.6:1.35)*RULES.hz;
 h.phase=t<warn?'idle':t<start?'warning':t<end?'active':'return';
 if(h.kind==='hammer'){
  if(h.phase==='active'){
   if(previous!=='active'){
    h.body.setBodyType(RAPIER.RigidBodyType.Dynamic,true);
    // Rotation about the hinge includes the parallel-axis inertia of the head.
    const inertia=C.headKg*C.armLength**2+C.armKg*C.armLength**2/3+C.headKg*(.28**2+.32**2)/12;
    h.body.setAngvel(mul(h.axis,Math.sqrt(2*h.budget/inertia)),true);
    h.body.setLinvel(cross(h.body.angvel(),sub(h.body.worldCom(),h.base)),true);
   }return;
  }
  if(h.phase==='return'&&previous!=='return'){const arm=rotate(v(0,1,0),h.body.rotation());h.stroke=Math.acos(clamp(arm.y,-1,1));}
  const angle=h.phase==='return'?h.stroke*(1-(t-end)/(cycleTicks-end)):0;
  h.body.setBodyType(RAPIER.RigidBodyType.KinematicPositionBased,true);
  const local=axisQ(v(1,0,0),angle),b=h.baseRotation;
  h.body.setNextKinematicRotation({x:b.w*local.x+b.x*local.w+b.y*local.z-b.z*local.y,y:b.w*local.y-b.x*local.z+b.y*local.w+b.z*local.x,z:b.w*local.z+b.x*local.y-b.y*local.x+b.z*local.w,w:b.w*local.w-b.x*local.x-b.y*local.y-b.z*local.z});h.body.setNextKinematicTranslation(h.base);return;
 }
 const lift=h.phase==='active'?clamp((t-start)/(.25*RULES.hz),0,1):h.phase==='return'?1-clamp((t-end)/(cycleTicks-end),0,1):0;
 h.anchor.setNextKinematicTranslation(add(h.base,v(0,lift*.32,0)));
 motor(h,h.phase==='idle'?0:C.sawRPM*Math.PI/30,C.sawWatts,14);
}
