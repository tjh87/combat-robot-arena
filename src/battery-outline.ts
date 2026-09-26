import * as THREE from 'three';
import {batteryZones} from './battery-layout';
import type {BotConfig} from './model';

// One visual marker encloses the battery bays. Physical damage zones stay separate.
export function batteryOutlines(config:BotConfig){
 const root=new THREE.Group();root.name='battery-outlines';
 const material=new THREE.LineBasicMaterial({color:0xff354b,transparent:true,opacity:.98,depthTest:false,depthWrite:false,toneMapped:false});
 const zones=batteryZones(config);
 if(!zones.length){material.dispose();return root;}
 const minX=Math.min(...zones.map(zone=>zone.position.x-zone.size.x/2)),maxX=Math.max(...zones.map(zone=>zone.position.x+zone.size.x/2));
 const minZ=Math.min(...zones.map(zone=>zone.position.z-zone.size.z/2)),maxZ=Math.max(...zones.map(zone=>zone.position.z+zone.size.z/2));
  const x=(minX+maxX)/2,z=(minZ+maxZ)/2,w=(maxX-minX)/2,l=(maxZ-minZ)/2;
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
  line.name='battery-outline';line.renderOrder=30;line.frustumCulled=false;
  line.userData.zones=zones;
  root.add(line);
 return root;
}
