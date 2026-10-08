import * as THREE from 'three';
import {RULES,clamp} from './model';
import {WALL_DAMAGE,type WallCrack} from './wall-damage';
import {fractureLines} from './wall-fracture';
const EMPTY:readonly WallCrack[]=[];
// One bounded geometry buffer and one draw call for every wall fracture.
export class WallCrackVisual extends THREE.LineSegments{
 private source?:readonly WallCrack[];
 constructor(){const geometry=new THREE.BufferGeometry(),size=WALL_DAMAGE.maxCracks*WALL_DAMAGE.maxSegments*6,positions=new THREE.BufferAttribute(new Float32Array(size),3),colors=new THREE.BufferAttribute(new Float32Array(size),3);positions.setUsage(THREE.DynamicDrawUsage);colors.setUsage(THREE.DynamicDrawUsage);geometry.setAttribute('position',positions);geometry.setAttribute('color',colors);geometry.setDrawRange(0,0);super(geometry,new THREE.LineBasicMaterial({vertexColors:true,transparent:true,opacity:.88,depthWrite:false}));this.name='wall-impact-cracks';this.frustumCulled=false;this.visible=false;}
 update(cracks:readonly WallCrack[]=EMPTY){if(this.source===cracks)return;this.source=cracks;const positions=this.geometry.getAttribute('position') as THREE.BufferAttribute,colors=this.geometry.getAttribute('color') as THREE.BufferAttribute;let n=0;
  for(let index=Math.max(0,cracks.length-WALL_DAMAGE.maxCracks);index<cracks.length;index++){const c=cracks[index];
   const along=c.wall==='east'||c.wall==='west'?'z':'x';
   const point=(u:number,y:number)=>{const p={...c.point};p[along]=clamp(p[along]+u,-RULES.floor/2+.015,RULES.floor/2-.015);p.y=clamp(p.y+y,.35,RULES.wallHeight-.015);return p;};
   for(const line of fractureLines(c)){const a=point(line.u,line.y),b=point(line.v,line.z),r=line.brightness*.81,g=line.brightness*.94;positions.setXYZ(n,a.x,a.y,a.z);colors.setXYZ(n,r,g,line.brightness);n++;positions.setXYZ(n,b.x,b.y,b.z);colors.setXYZ(n,r,g,line.brightness);n++;}
  }
  positions.needsUpdate=true;colors.needsUpdate=true;this.geometry.setDrawRange(0,n);this.visible=n>0;
 }
}
