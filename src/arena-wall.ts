import RAPIER from '@dimforge/rapier3d-compat';
import {add,rotate,v,type Vec,type Quat} from './model';

export function colliderBounds(col:RAPIER.Collider,p=col.translation(),q=col.rotation()){
 const min=v(Infinity,Infinity,Infinity),max=v(-Infinity,-Infinity,-Infinity),type=col.shapeType();
 const point=(local:Vec)=>{const world=add(p,rotate(local,q));for(const k of['x','y','z']as const){min[k]=Math.min(min[k],world[k]);max[k]=Math.max(max[k],world[k]);}};
 if(type===RAPIER.ShapeType.Cuboid){const h=col.halfExtents();for(const x of[-h.x,h.x])for(const y of[-h.y,h.y])for(const z of[-h.z,h.z])point(v(x,y,z));}
 else if(type===RAPIER.ShapeType.Cylinder||type===RAPIER.ShapeType.RoundCylinder){
  const axis=rotate(v(0,1,0),q),radius=col.radius(),half=col.halfHeight(),round=type===RAPIER.ShapeType.RoundCylinder?col.roundRadius():0;
  for(const k of['x','y','z']as const){const extent=Math.abs(axis[k])*half+Math.sqrt(Math.max(0,1-axis[k]**2))*radius+round;min[k]=p[k]-extent;max[k]=p[k]+extent;}
 }else{const vertices=col.vertices();for(let i=0;i<vertices.length;i+=3)point(v(vertices[i],vertices[i+1],vertices[i+2]));}
 return{min,max};
}

export function previousColliderPose(col:RAPIER.Collider,body:{p:Vec,q:Quat}){
 const local=col.translationWrtParent()??v(),rotation=col.rotationWrtParent()??{x:0,y:0,z:0,w:1};
 return{p:add(body.p,rotate(local,body.q)),localRotation:rotation};
}
