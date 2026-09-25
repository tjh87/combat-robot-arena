import {writeFileSync} from 'node:fs';
import RAPIER from '@dimforge/rapier3d-compat';
import {RULES,v,rotate,axisQ,identity,length,sub} from '../src/model';
import {probeArc} from '../src/probes';

export function collisionCases(hz=120,ccd=RULES.ccdSubsteps){
 const results:any[]=[];
 for(let index=0;index<200;index++)for(const expectedHit of [true,false]){
 const radius=[.15,.22,.32,.45,.6][index%5],tip=[8,20,40,80,111.76][Math.floor(index/5)%5],vertical=Math.floor(index/25)%2===1,direction=Math.floor(index/50)%2===0?1:-1,moving=Math.floor(index/100)%2===1;
 const axis=vertical?v(1,0,0):v(0,1,0),omega=direction*tip/radius,half=.0125,feature=.025,theta=direction*Math.min(.45,Math.max(.22,Math.abs(omega)/hz*.6));
 const world=new RAPIER.World(v()),queue=new RAPIER.EventQueue(true);world.timestep=1/hz;world.numSolverIterations=RULES.solverIterations;world.maxCcdSubsteps=ccd;
 const hub=world.createRigidBody(RAPIER.RigidBodyDesc.fixed());
 const rotor=world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setAngvel({x:axis.x*omega,y:axis.y*omega,z:axis.z*omega}).setCcdEnabled(true));
 const local=vertical?v(0,radius,0):v(radius,0,0),tooth=world.createCollider(RAPIER.ColliderDesc.cuboid(half,half,half).setTranslation(local.x,local.y,local.z).setMass(1).setContactSkin(.001).setFriction(0).setRestitution(0).setActiveEvents(RAPIER.ActiveEvents.CONTACT_FORCE_EVENTS|RAPIER.ActiveEvents.COLLISION_EVENTS).setContactForceEventThreshold(0),rotor);
 world.createCollider(RAPIER.ColliderDesc.ball(.015).setMass(8).setCollisionGroups(0),rotor);
 world.createImpulseJoint(RAPIER.JointData.revolute(v(),v(),axis),hub,rotor,true);
 const targetLocal=vertical?v(0,radius+(expectedHit?0:.12),0):v(radius+(expectedHit?0:.12),0,0),tp=rotate(targetLocal,axisQ(axis,theta));
 const velocity=moving?(vertical?v(.15,0,0):v(0,.15,0)):v();
 const target=world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(tp.x,tp.y,tp.z).setLinvel(velocity.x,velocity.y,velocity.z).setCcdEnabled(true));
 const tc=world.createCollider(RAPIER.ColliderDesc.cuboid(.020,.020,.020).setMass(20).setContactSkin(.001).setFriction(0).setRestitution(0),target);
 const initial={...target.translation()};let contacts=0,episodes=0,previous=false,impulse=0,probeHits=0,maxChord=0,collisionStarts=0;
 const duration=Math.abs(theta/omega)+2/hz,steps=Math.max(2,Math.ceil(duration*hz));
 for(let t=0;t<steps;t++){
 const o={...rotor.translation()},q={...rotor.rotation()},ang=rotor.angvel(),speed=vertical?ang.x:ang.y;
 const probe=probeArc({origin:o,translation:v(),rotation:q,axis,angle:speed/hz,radius,feature,localCenter:local,half:v(half,half,half),target:tc,targetVelocity:velocity,dt:1/hz});probeHits+=probe.hits;maxChord=Math.max(maxChord,probe.chordError);
 world.step(queue);let active=false,forceImpulse=0;
 queue.drainContactForceEvents(e=>{if((e.collider1()===tooth.handle&&e.collider2()===tc.handle)||(e.collider2()===tooth.handle&&e.collider1()===tc.handle)){forceImpulse+=e.totalForceMagnitude()/hz;active ||=e.totalForceMagnitude()>1e-4;}});
 queue.drainCollisionEvents((a,b,started)=>{if(started&&((a===tooth.handle&&b===tc.handle)||(b===tooth.handle&&a===tc.handle)))collisionStarts++;});
 world.contactPair(tooth,tc,m=>{for(let k=0;k<m.numContacts();k++){const j=m.contactImpulse(k);if(j>1e-5){active=true;impulse+=j;contacts++;}}});
 if(active&&!previous)episodes++;previous=active;impulse=Math.max(impulse,forceImpulse);
 }
 const motion=length(sub(target.translation(),initial)),velocityChange=length(sub(target.linvel(),velocity));
 results.push({id:`${expectedHit?'hit':'near'}-${String(index).padStart(3,'0')}`,seed:index,expectedGeometry:expectedHit?'Tooth arc intersects a 40 mm target at its centre radius':'Target radial gap is 87.5 mm beyond both solid surfaces',rotation:vertical?'vertical':'horizontal',direction,radius,tipSpeed:tip,omega,feature,targetMotion:velocity,expectedEpisodes:expectedHit?1:0,contacts,episodes,collisionStarts,impulse,observedMotion:motion,velocityChange,probeHits,maxChord,pass:expectedHit?collisionStarts===1&&velocityChange>.001:collisionStarts===0&&velocityChange<.001});
 queue.free();world.free();
 }
 writeFileSync(`docs/contact-cases-${hz}hz.json`,JSON.stringify(results,null,2));
 return{hz,hitPass:results.filter(r=>r.id.startsWith('hit')&&r.pass).length,nearPass:results.filter(r=>r.id.startsWith('near')&&r.pass).length,failures:results.filter(r=>!r.pass)};
}
