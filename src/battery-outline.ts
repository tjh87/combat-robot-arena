import * as THREE from 'three';
import {batteryZones} from './battery-layout';
import type {BotConfig} from './model';

// Show the game damage zones above the armour, even when a weapon covers them.
export function batteryOutlines(config:BotConfig){
 const root=new THREE.Group();root.name='battery-outlines';
 const material=new THREE.LineBasicMaterial({color:0xff354b,transparent:true,opacity:.98,depthTest:false,depthWrite:false,toneMapped:false});
 for(const [index,zone] of batteryZones(config).entries()){
  const x=zone.position.x,z=zone.position.z,w=zone.size.x/2,l=zone.size.z/2;
  const y=config.chassis.height/2+.023;
  const corners=[new THREE.Vector3(x-w,y,z-l),new THREE.Vector3(x+w,y,z-l),new THREE.Vector3(x+w,y,z+l),new THREE.Vector3(x-w,y,z+l)];
  const points:THREE.Vector3[]=[];
  for(let side=0;side<4;side++){
   const a=corners[side],b=corners[(side+1)%4],distance=a.distanceTo(b),count=Math.max(2,Math.ceil(distance/.022));
   for(let dot=0;dot<count;dot++){
    const start=dot/count,end=Math.min(1,start+.48/count);
    points.push(a.clone().lerp(b,start),a.clone().lerp(b,end));
   }
  }
  const line=new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(points),material);
  line.name=`battery-outline-${index}`;line.renderOrder=30;line.frustumCulled=false;
  line.userData.zone=zone;
  root.add(line);
 }
 return root;
}
