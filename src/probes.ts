import RAPIER from '@dimforge/rapier3d-compat';
import {v,add,sub,mul,rotate,axisQ,quatMul,type Vec,type Quat} from './model';

export function arcSegments(radius:number,angle:number,feature:number){
 const error=Math.max(.00001,feature/4),step=2*Math.acos(Math.max(-1,Math.min(1,1-error/Math.max(radius,error))));
 return Math.max(1,Math.ceil(Math.abs(angle)/Math.max(.001,step)));
}
export type ProbeInput={origin:Vec,translation:Vec,rotation:Quat,axis:Vec,angle:number,radius:number,feature:number,localCenter:Vec,half:Vec,target:RAPIER.Collider,targetVelocity:Vec,dt:number};
// Diagnostic only: sweep the full convex tooth along short arcs. Never applies damage or impulse.
export function probeArc(input:ProbeInput){
 const {origin,translation,rotation,axis,angle,radius,feature,localCenter,half,target,targetVelocity,dt}=input,n=arcSegments(radius,angle,feature),shape=new RAPIER.Cuboid(half.x,half.y,half.z);let hits=0,first:number|undefined;
 for(let i=0;i<n;i++){
 const t0=i/n,t1=(i+1)/n,q0=quatMul(rotation,axisQ(axis,angle*t0)),q1=quatMul(rotation,axisQ(axis,angle*t1)),p0=add(add(origin,mul(translation,t0)),rotate(localCenter,q0)),p1=add(add(origin,mul(translation,t1)),rotate(localCenter,q1));
 const motion=sub(p1,p0),targetPos=add(target.translation(),mul(targetVelocity,dt*t0)),relative=sub(motion,mul(targetVelocity,dt/n));
 const hit=shape.castShape(p0,q0,relative,target.shape,targetPos,target.rotation(),v(),feature/4,1,true);
 if(hit){hits++;first??=t0;}
 }
 return{segments:n,hits,first,chordError:radius*(1-Math.cos(Math.abs(angle)/n/2))};
}
