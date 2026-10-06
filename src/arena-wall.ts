import RAPIER from '@dimforge/rapier3d-compat';
import {add,rotate,v,type Vec,type Quat} from './model';

type Geometry={type:RAPIER.ShapeType,vertices?:Float32Array|Float64Array,radius?:number,half?:number,round?:number,local:Vec,rotation:Quat};
const immutable=new WeakMap<RAPIER.Collider,Geometry>();
// Register only robot colliders whose shape and parent-local transform stay fixed.
// Body motion changes the world pose, not the cached geometry.
export function cacheColliderGeometry(col:RAPIER.Collider){
 if(immutable.has(col))return;
 const type=col.shapeType(),local=col.translationWrtParent()??v(),rotation=col.rotationWrtParent()??{x:0,y:0,z:0,w:1};
 const geometry:Geometry={type,local,rotation};
 if(type===RAPIER.ShapeType.Cuboid){const h=col.halfExtents(),points:number[]=[];for(const x of[-h.x,h.x])for(const y of[-h.y,h.y])for(const z of[-h.z,h.z])points.push(x,y,z);geometry.vertices=new Float64Array(points);}
 else if(type===RAPIER.ShapeType.Cylinder||type===RAPIER.ShapeType.RoundCylinder){geometry.radius=col.radius();geometry.half=col.halfHeight();geometry.round=type===RAPIER.ShapeType.RoundCylinder?col.roundRadius():0;}
 else geometry.vertices=col.vertices().slice();
 immutable.set(col,geometry);
}
export function colliderBounds(col:RAPIER.Collider,p=col.translation(),q=col.rotation()){
 const cached=immutable.get(col),type=cached?.type??col.shapeType();
 if(type===RAPIER.ShapeType.Cylinder||type===RAPIER.ShapeType.RoundCylinder){
  const axis=rotate(v(0,1,0),q),radius=cached?.radius??col.radius(),half=cached?.half??col.halfHeight(),round=cached?.round??(type===RAPIER.ShapeType.RoundCylinder?col.roundRadius():0),min=v(),max=v();
  for(const k of['x','y','z']as const){const extent=Math.abs(axis[k])*half+Math.sqrt(Math.max(0,1-axis[k]**2))*radius+round;min[k]=p[k]-extent;max[k]=p[k]+extent;}return{min,max};
 }
 let vertices=cached?.vertices;
 if(!vertices){if(type===RAPIER.ShapeType.Cuboid){const h=col.halfExtents(),points:number[]=[];for(const x of[-h.x,h.x])for(const y of[-h.y,h.y])for(const z of[-h.z,h.z])points.push(x,y,z);vertices=new Float64Array(points);}else vertices=col.vertices();}
 let minX=Infinity,minY=Infinity,minZ=Infinity,maxX=-Infinity,maxY=-Infinity,maxZ=-Infinity;
 for(let i=0;i<vertices.length;i+=3){
  const x=vertices[i],y=vertices[i+1],z=vertices[i+2],tx=(q.y*z-q.z*y)*2,ty=(q.z*x-q.x*z)*2,tz=(q.x*y-q.y*x)*2;
  const wx=p.x+(x+(tx*q.w+(q.y*tz-q.z*ty))),wy=p.y+(y+(ty*q.w+(q.z*tx-q.x*tz))),wz=p.z+(z+(tz*q.w+(q.x*ty-q.y*tx)));
  minX=Math.min(minX,wx);minY=Math.min(minY,wy);minZ=Math.min(minZ,wz);maxX=Math.max(maxX,wx);maxY=Math.max(maxY,wy);maxZ=Math.max(maxZ,wz);
 }return{min:v(minX,minY,minZ),max:v(maxX,maxY,maxZ)};
}
export function previousColliderPose(col:RAPIER.Collider,body:{p:Vec,q:Quat}){
 const cached=immutable.get(col),local=cached?.local??col.translationWrtParent()??v(),rotation=cached?.rotation??col.rotationWrtParent()??{x:0,y:0,z:0,w:1};
 return{p:add(body.p,rotate(local,body.q)),localRotation:rotation};
}
