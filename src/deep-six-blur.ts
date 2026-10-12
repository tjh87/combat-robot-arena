import * as THREE from 'three';
import {weaponAxis,type BotConfig} from './model';

const STEPS=72,RINGS=5,MAX_SWEEP=Math.PI*4/3;
const RING_RADII=[0,.07,.28,.96,1.005];
const RING_ALPHA=[0,.24,.40,.22,0];
const RING_COLORS=['#a95639','#b96442','#d18a5e','#efbf8c','#d88b62'].map(color=>new THREE.Color(color));

function sweepGeometry(radius:number,inner:number,phase:number){
 const count=(STEPS+1)*RINGS,g=new THREE.BufferGeometry(),positions=new Float32Array(count*3),colors=new Float32Array(count*4),indices:number[]=[];
 g.setAttribute('position',new THREE.BufferAttribute(positions,3).setUsage(THREE.DynamicDrawUsage));
 for(let step=0;step<=STEPS;step++){
  const t=step/STEPS,envelope=Math.pow(Math.max(0,Math.sin(Math.PI*t)),.52),rib=.88+.12*Math.cos(8*Math.PI*t)**2;
  for(let ring=0;ring<RINGS;ring++){
   const i=step*RINGS+ring;const c=RING_COLORS[ring];
   colors.set([c.r,c.g,c.b,RING_ALPHA[ring]*envelope*rib],i*4);
   if(step<STEPS&&ring<RINGS-1)indices.push(i,i+RINGS,i+1,i+1,i+RINGS,i+RINGS+1);
  }
 }
 g.setAttribute('color',new THREE.BufferAttribute(colors,4));g.setIndex(indices);g.boundingSphere=new THREE.Sphere(new THREE.Vector3(),radius*1.01);g.userData={radius,inner,phase,exposureAngle:0,direction:1};
 return g;
}

/** A soft, partial copper exposure that leaves the Deep Six hub and bar readable. */
export function deepSixBlur(config:BotConfig){
 const w=config.weapon,root=new THREE.Group();root.name='rotor-motion';root.visible=false;
 if(w.type!=='vertical_bar')return root;
 root.userData={deepSixBlur:true,targetRPM:w.rpm,direction:w.direction,exposureAngle:0,strength:0};
 const axis=weaponAxis(w),orientation=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,0,1),new THREE.Vector3(axis.x,axis.y,axis.z)),inner=w.radius*.13,offset=w.thickness/2+.0015;
 for(const side of[-1,1]){
  const plane=new THREE.Group();plane.quaternion.copy(orientation);plane.position.set(axis.x*offset*side,axis.y*offset*side,axis.z*offset*side);
  const mesh=new THREE.Mesh(sweepGeometry(w.radius,inner,Math.PI/2),new THREE.MeshBasicMaterial({vertexColors:true,transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide,forceSinglePass:true,toneMapped:false,blending:THREE.NormalBlending}));
  mesh.name='deep-six-copper-sweep';plane.add(mesh);root.add(plane);
 }
 return root;
}

export function updateDeepSixBlur(root:THREE.Object3D,rpm:number,reduced:boolean,direction:number){
 const speed=Number.isFinite(rpm)?Math.abs(rpm):0,target=Math.max(1,Math.abs(root.userData.targetRPM??1)),ratio=Math.max(0,Math.min(1,speed/target)),ramp=Math.max(0,Math.min(1,(ratio-.035)/.965)),strength=reduced?0:Math.pow(ramp,.72),span=MAX_SWEEP*strength,spin=Math.sign(direction)||1;
 root.userData.strength=strength;root.userData.exposureAngle=span;root.userData.direction=spin;root.visible=strength>.005;
 for(const plane of root.children)for(const object of plane.children){
  const mesh=object as THREE.Mesh<THREE.BufferGeometry,THREE.MeshBasicMaterial>,g=mesh.geometry,d=g.userData;
  mesh.material.opacity=.44*strength;
  if(Math.abs((d.span??-1)-span)<.001&&d.direction===spin)continue;
  d.span=span;d.direction=spin;d.exposureAngle=span;
  const positions=g.getAttribute('position') as THREE.BufferAttribute,inner=d.inner,radius=d.radius,phase=d.phase;
  for(let step=0;step<=STEPS;step++){
   const t=step/STEPS,angle=phase-span/2+spin*span*t,c=Math.cos(angle),s=Math.sin(angle);
   for(let ring=0;ring<RINGS;ring++){
    const r=inner+(radius-inner)*RING_RADII[ring];positions.setXYZ(step*RINGS+ring,c*r,s*r,0);
   }
  }
  positions.needsUpdate=true;
 }
}
