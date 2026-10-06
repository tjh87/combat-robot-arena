import * as THREE from 'three';
import {RULES,componentProfile,type BotConfig} from './model';
export class FollowCamera {
 private yaw=0;private subject='';
 reset(){this.subject='';}
 update(camera:THREE.PerspectiveCamera,p:THREE.Vector3,q:THREE.Quaternion,config:BotConfig,envelope:{x:number,y:number,z:number},subject:string,dt:number,reduced:boolean){
  const forward=componentProfile(config,'drive')==='huge'?new THREE.Vector3(0,1,0).cross(new THREE.Vector3(1,0,0).applyQuaternion(q)):new THREE.Vector3(0,0,-1).applyQuaternion(q);
  forward.y=0;const changed=this.subject!==subject;
  if(forward.lengthSq()>.0001){forward.normalize();const target=Math.atan2(forward.x,-forward.z),difference=Math.atan2(Math.sin(target-this.yaw),Math.cos(target-this.yaw));this.yaw=changed||reduced?target:this.yaw+difference*(1-Math.exp(-14*Math.max(0,dt)));}
  else if(changed)this.yaw=0;
  this.subject=subject;forward.set(Math.sin(this.yaw),0,-Math.cos(this.yaw));
  const distance=Math.max(2.6,Math.max(envelope.x,envelope.z)*1.6+.7),height=Math.max(1.6,envelope.y+.7),edge=RULES.floor/2-.35;
  const desired=p.clone().addScaledVector(forward,-distance);desired.x=THREE.MathUtils.clamp(desired.x,-edge,edge);desired.z=THREE.MathUtils.clamp(desired.z,-edge,edge);
  const separation=Math.hypot(desired.x-p.x,desired.z-p.z),extra=Math.max(0,distance*.7-separation);
  desired.y=Math.max(.4,p.y+height+extra*.6);camera.position.copy(desired);camera.up.set(0,1,0);
  const target=p.clone().addScaledVector(forward,Math.min(1.5,distance*.45));target.y+=Math.max(.2,Math.min(.6,envelope.y*.25));camera.lookAt(target);camera.updateMatrixWorld();
  return{subject,yaw:this.yaw,distance,separation,position:camera.position.clone(),target};
 }
}
