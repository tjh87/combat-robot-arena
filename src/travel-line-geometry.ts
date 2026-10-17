import * as THREE from 'three';
import type {Vec} from './model';

export const TRAVEL_LINE_VERTEX_CAPACITY=242;

export function createTravelLineGeometry():THREE.BufferGeometry{
 const geometry=new THREE.BufferGeometry();
 const positions=new Float32Array(TRAVEL_LINE_VERTEX_CAPACITY*3);
 geometry.setAttribute('position',new THREE.BufferAttribute(positions,3).setUsage(THREE.StreamDrawUsage));
 return geometry;
}

export function writeTravelLineGeometry(geometry:THREE.BufferGeometry,points:readonly Vec[],final:Vec,originY:number):number{
 const positions=geometry.getAttribute('position') as THREE.BufferAttribute;
 const count=Math.min(points.length+1,positions.count);
 for(let i=0;i<count;i++){
  const p=i<points.length?points[i]:final;
  positions.setXYZ(i,p.x,.046+Math.max(0,p.y-originY),p.z);
 }
 positions.clearUpdateRanges();
 if(count>0)positions.addUpdateRange(0,count*3);
 positions.needsUpdate=true;
 geometry.setDrawRange(0,count);
 return count;
}
