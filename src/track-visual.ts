import * as THREE from 'three';
import {wheelBase,type BotConfig,type Part} from './model';

// The continuous belt follows the driven roller axle spacing. Each shoe moves
// by measured roller travel; replay stores the same travel with its transforms.
export function trackMesh(p:Part,c:BotConfig){
 const r=c.drive.radius,base=wheelBase(c),width=c.drive.width,edge=Math.min(.012,r*.15),shape=new THREE.Shape();
 shape.absarc(base/2,0,r,-Math.PI/2,Math.PI/2,false);shape.absarc(-base/2,0,r,Math.PI/2,Math.PI*1.5,false);shape.closePath();
 const hole=new THREE.Path();hole.absarc(-base/2,0,r-edge,Math.PI*1.5,Math.PI/2,true);hole.absarc(base/2,0,r-edge,Math.PI/2,-Math.PI/2,true);hole.closePath();shape.holes.push(hole);
 const geometry=new THREE.ExtrudeGeometry(shape,{depth:width,bevelEnabled:false,curveSegments:24,steps:1});geometry.translate(0,0,-width/2);geometry.rotateY(-Math.PI/2);
 const mesh=new THREE.Mesh(geometry,new THREE.MeshPhysicalMaterial({color:'#202729',roughness:.72,metalness:.12}));mesh.position.set(p.position.x,p.position.y-r+.01,p.position.z);
 const count=Math.max(28,Math.ceil((2*base+2*Math.PI*r)/.037)),shoes=new THREE.InstancedMesh(new THREE.BoxGeometry(width+.002,.009,.026),new THREE.MeshPhysicalMaterial({color:'#353e40',roughness:.68,metalness:.25}),count);shoes.name='tread-shoes';shoes.castShadow=shoes.receiveShadow=true;shoes.userData={trackBase:base,trackRadius:r};mesh.add(shoes);mesh.castShadow=mesh.receiveShadow=true;
 mesh.userData={module:p.module,part:p.id,material:'rubber',baseColor:0x202729,baseRoughness:.72,trackSide:p.position.x<0?0:1};animateTrack(mesh,0);return mesh;
}
export function animateTrack(mesh:THREE.Object3D,travel:number){
 const shoes=mesh.getObjectByName('tread-shoes') as THREE.InstancedMesh|undefined;if(!shoes)return;
 const base=shoes.userData.trackBase as number,r=shoes.userData.trackRadius as number,total=base*2+Math.PI*r*2,matrix=new THREE.Matrix4(),q=new THREE.Quaternion(),position=new THREE.Vector3(),scale=new THREE.Vector3(1,1,1),axis=new THREE.Vector3(1,0,0);
 for(let i=0;i<shoes.count;i++){
  let s=((i/shoes.count*total+travel)%total+total)%total,z:number,y:number,a:number;
  if(s<base){z=-base/2+s;y=r;a=0;}
  else if((s-=base)<Math.PI*r){const t=s/r;z=base/2+Math.sin(t)*r;y=Math.cos(t)*r;a=t;}
  else if((s-=Math.PI*r)<base){z=base/2-s;y=-r;a=Math.PI;}
  else{const t=(s-base)/r;z=-base/2-Math.sin(t)*r;y=-Math.cos(t)*r;a=Math.PI+t;}
  position.set(0,y,z);q.setFromAxisAngle(axis,a);matrix.compose(position,q,scale);shoes.setMatrixAt(i,matrix);
 }shoes.instanceMatrix.needsUpdate=true;shoes.computeBoundingSphere();
}
