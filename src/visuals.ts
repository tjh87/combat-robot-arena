import {ARENA_HAZARDS} from './arena-hazards';
import {compactGeometry} from './geometry-memory';
import * as THREE from 'three';
import {robotDeckTexture,robotSideTexture,tireSidewallTexture} from './robot-livery';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {RULES,rng,HYDRA_TIP,unlimitedFlips,type BotConfig,type Part} from './model';
import {sawbladeOuter,sawbladeHex} from './mechanisms';

const metal=(color:string,roughness=.46,metalness=.72)=>new THREE.MeshStandardMaterial({color,roughness,metalness});
const glow=(color:string)=>new THREE.MeshBasicMaterial({color,toneMapped:false});
const rotation=(x=0,y=0,z=0)=>new THREE.Euler(x,y,z);

// Merge static detail by material. Hundreds of bolts, seats and truss members
// become a small number of draw calls, including in the shadow pass.
class Batch{
 private groups=new Map<THREE.Material,THREE.BufferGeometry[]>();
 put(geometry:THREE.BufferGeometry,material:THREE.Material,p:number[],r=new THREE.Euler()){
  const g=geometry.index?geometry.toNonIndexed():geometry;
  if(g!==geometry)geometry.dispose();
  g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(...p),new THREE.Quaternion().setFromEuler(r),new THREE.Vector3(1,1,1)));
  const list=this.groups.get(material)??[];list.push(g);this.groups.set(material,list);
 }
 box(s:number[],p:number[],m:THREE.Material,r?:THREE.Euler){this.put(new THREE.BoxGeometry(...s as [number,number,number]),m,p,r);}
 cylinder(radius:number,length:number,p:number[],m:THREE.Material,r?:THREE.Euler,segments=12){this.put(new THREE.CylinderGeometry(radius,radius,length,segments),m,p,r);}
 finish(parent:THREE.Object3D){
  for(const [material,parts]of this.groups){const geometry=compactGeometry(mergeGeometries(parts)!);parts.forEach(p=>p.dispose());const mesh=new THREE.Mesh(geometry,material);mesh.castShadow=!(material instanceof THREE.MeshBasicMaterial);mesh.receiveShadow=true;parent.add(mesh);}
  this.groups.clear();
 }
}

function canvas(width:number,height:number){const element=document.createElement('canvas');element.width=width;element.height=height;return{element,ctx:element.getContext('2d')!} ;}
