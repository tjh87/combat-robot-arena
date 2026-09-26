import * as THREE from 'three';
import {RULES,clamp} from './model';
import {WALL_DAMAGE,type WallCrack} from './wall-damage';
const EMPTY:readonly WallCrack[]=[];
// One fixed buffer and draw call. No particles, textures, lights or physics bodies.
export class WallCrackVisual extends THREE.LineSegments{
 private source?:readonly WallCrack[];
 constructor(){const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(new Float32Array(WALL_DAMAGE.maxCracks*24*6),3));geometry.setDrawRange(0,0);super(geometry,new THREE.LineBasicMaterial({color:0xd9f3ff,transparent:true,opacity:.78,depthWrite:false}));this.name='wall-impact-cracks';this.frustumCulled=false;this.visible=false;}
 update(cracks:readonly WallCrack[]=EMPTY){if(this.source===cracks)return;this.source=cracks;const a=this.geometry.getAttribute('position') as THREE.BufferAttribute;let n=0;
  for(const c of cracks.slice(-WALL_DAMAGE.maxCracks)){
   const along=c.wall==='east'||c.wall==='west'?'z':'x';
   const point=(u:number,y:number)=>{const p={...c.point};p[along]=clamp(p[along]+u,-RULES.floor/2+.015,RULES.floor/2-.015);p.y=clamp(p.y+y,.35,RULES.wallHeight-.015);return p;};
   const line=(u:number,y:number,v:number,z:number)=>{for(const p of[point(u,y),point(v,z)])a.setXYZ(n++,p.x,p.y,p.z);};
   for(let ray=0;ray<6;ray++){
    const angle=ray*Math.PI/3+c.id*.73,r=c.radius*(.72+.28*Math.abs(Math.sin(c.id*3+ray*7))),dx=Math.cos(angle),dy=Math.sin(angle);let u=0,y=0;
    for(let step=1;step<=3;step++){const bend=Math.sin(c.id+ray*9+step*4)*r*.07,nu=dx*r*step/3-dy*bend,ny=dy*r*step/3+dx*bend;line(u,y,nu,ny);u=nu;y=ny;}
    line(dx*r*.5,dy*r*.5,dx*r*.72-dy*r*.18,dy*r*.72+dx*r*.18);
   }
  }
  a.needsUpdate=true;this.geometry.setDrawRange(0,n);this.visible=n>0;
 }
}
