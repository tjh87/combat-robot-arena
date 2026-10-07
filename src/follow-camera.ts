import * as THREE from 'three';
import {RULES,componentProfile,type BotConfig} from './model';
export const CAMERA_STABILITY={positionHz:7,verticalHz:4,yawHz:5,maxYawRate:3.2};
const wrapped=(angle:number)=>Math.atan2(Math.sin(angle),Math.cos(angle));
export function trackingHeading(q:THREE.Quaternion,config:BotConfig,previous=0){
 if(componentProfile(config,'drive')==='huge'){const forward=new THREE.Vector3(0,1,0).cross(new THREE.Vector3(1,0,0).applyQuaternion(q));if(forward.x*forward.x+forward.z*forward.z>.08)return Math.atan2(forward.x,-forward.z);return previous;}
 // A vertical pose keeps the last reliable heading. Once the robot settles,
 // the filtered camera follows its real front direction without a sudden turn.
 const forward=new THREE.Vector3(0,0,-1).applyQuaternion(q);if(forward.x*forward.x+forward.z*forward.z<.08)return previous;return Math.atan2(forward.x,-forward.z);
}
export class StableTrackingPose{
 private subject='';private position=new THREE.Vector3();private yaw=0;
 reset(){this.subject='';}
 update(p:THREE.Vector3,q:THREE.Quaternion,config:BotConfig,subject:string,dt:number){
  const changed=subject!==this.subject,target=trackingHeading(q,config,this.yaw),step=Math.max(0,Math.min(.1,dt));
  if(changed){this.position.copy(p);this.yaw=target;this.subject=subject;}
  else{const horizontal=1-Math.exp(-CAMERA_STABILITY.positionHz*step),vertical=1-Math.exp(-CAMERA_STABILITY.verticalHz*step);this.position.x+=(p.x-this.position.x)*horizontal;this.position.z+=(p.z-this.position.z)*horizontal;this.position.y+=(p.y-this.position.y)*vertical;const delta=wrapped(target-this.yaw)*(1-Math.exp(-CAMERA_STABILITY.yawHz*step));this.yaw=wrapped(this.yaw+THREE.MathUtils.clamp(delta,-CAMERA_STABILITY.maxYawRate*step,CAMERA_STABILITY.maxYawRate*step));}
  return{position:this.position.clone(),yaw:this.yaw,changed};
 }
}
export class FollowCamera{
 private tracking=new StableTrackingPose();
 reset(){this.tracking.reset();}
 update(camera:THREE.PerspectiveCamera,p:THREE.Vector3,q:THREE.Quaternion,config:BotConfig,envelope:{x:number,y:number,z:number},subject:string,dt:number,reduced:boolean){
  const state=this.tracking.update(p,q,config,subject,dt),anchor=state.position,forward=new THREE.Vector3(Math.sin(state.yaw),0,-Math.cos(state.yaw));
  const distance=Math.max(2.6,Math.max(envelope.x,envelope.z)*1.6+.7),height=Math.max(1.6,envelope.y+.7),edge=RULES.floor/2-.35;
  const desired=anchor.clone().addScaledVector(forward,-distance);desired.x=THREE.MathUtils.clamp(desired.x,-edge,edge);desired.z=THREE.MathUtils.clamp(desired.z,-edge,edge);
  const separation=Math.hypot(desired.x-anchor.x,desired.z-anchor.z),extra=Math.max(0,distance*.7-separation);desired.y=Math.max(.4,anchor.y+height+extra*.6);
  if(state.changed)camera.position.copy(desired);else camera.position.lerp(desired,1-Math.exp(-9*Math.max(0,Math.min(.1,dt))));camera.up.set(0,1,0);
  const target=anchor.clone().addScaledVector(forward,Math.min(1.5,distance*.45));target.y+=Math.max(.2,Math.min(.6,envelope.y*.25));camera.lookAt(target);camera.updateMatrixWorld();
  return{subject,yaw:state.yaw,distance,separation,position:camera.position.clone(),target};
 }
}
