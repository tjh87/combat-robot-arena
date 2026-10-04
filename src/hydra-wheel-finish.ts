import * as THREE from 'three';
import {hydraSleekWheels} from './hydra-wheels';
import type {BotConfig,Part} from './model';
export function hydraHubDetail(mesh:THREE.Mesh,p:Part,c:BotConfig){
 if(!hydraSleekWheels(c)||!p.id.startsWith('wheel_')||!p.id.endsWith('_hub')||p.shape.kind!=='cylinder')return false;
 const face=mesh.material as THREE.MeshPhysicalMaterial;face.color.set('#22282d');face.metalness=.72;face.roughness=.38;face.clearcoat=.12;mesh.userData.baseColor=face.color.getHex();mesh.userData.baseRoughness=face.roughness;mesh.name='hydra-sleek-weighted-hub';
 const black=new THREE.MeshStandardMaterial({color:'#14181b',metalness:.3,roughness:.60}),steel=new THREE.MeshStandardMaterial({color:'#899398',metalness:.85,roughness:.38});
 for(const side of[-1,1]){
  const cap=new THREE.Mesh(new THREE.CylinderGeometry(c.drive.radius*.17,c.drive.radius*.17,.001,24),black);cap.position.y=side*(c.drive.width/2-.0005);mesh.add(cap);
  for(let i=0;i<6;i++){const a=i*Math.PI/3,bolt=new THREE.Mesh(new THREE.CylinderGeometry(.0015,.0015,.0016,6),steel);bolt.position.set(Math.sin(a)*c.drive.radius*.24,side*(c.drive.width/2-.0008),Math.cos(a)*c.drive.radius*.24);mesh.add(bolt);}
 }
 mesh.userData.flushHub=true;return true;
}
