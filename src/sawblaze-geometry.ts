import {add,armOffset,bodyOrigin,rotate,axisQ,v,type BotConfig,type Part} from './model';

// Surface positions and clearance values are game estimates from the approved SVG.
export function sawblazeNoseProfile(c:BotConfig,offset=0){
 const top=c.chassis.height/2,floor=-top-c.chassis.clearance,L=c.chassis.length;
 return Array.from({length:13},(_,i)=>{const t=i/12,u=1-t,y=u*u*u*(top+.004)+3*u*u*t*(top+.004)+3*u*t*t*(floor+.023)+t*t*t*(floor+.008),z=u*u*u*(-L*.26)+3*u*u*t*(-L*.32)+3*u*t*t*(-L*.58)+t*t*t*(-L*.62);return[y+offset,z] as [number,number];});
}
function segmentDistance(p:number[],a:number[],b:number[]){const y=b[0]-a[0],z=b[1]-a[1],t=Math.max(0,Math.min(1,((p[0]-a[0])*y+(p[1]-a[1])*z)/(y*y+z*z||1)));return Math.hypot(p[0]-a[0]-t*y,p[1]-a[1]-t*z);}
function hull(points:number[][]){const p=points.slice().sort((a,b)=>a[0]-b[0]||a[1]-b[1]),cross=(o:number[],a:number[],b:number[])=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]),low:number[][]=[],high:number[][]=[];for(const a of p){while(low.length>1&&cross(low.at(-2)!,low.at(-1)!,a)<=0)low.pop();low.push(a);}for(const a of p.slice().reverse()){while(high.length>1&&cross(high.at(-2)!,high.at(-1)!,a)<=0)high.pop();high.push(a);}return low.slice(0,-1).concat(high.slice(0,-1));}
function polygonDistance(p:number[],poly:number[][]){let inside=false,d=Infinity;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])inside=!inside;d=Math.min(d,segmentDistance(p,a,b));}return inside?0:d;}
export function sawblazeSweepClearance(c:BotConfig,parts:Part[],diagnostic?:Record<string,unknown>){
 const w=c.weapon;if(w.type!=='hammer_saw')return Infinity;
 const polygons:number[][][]=[],ids:string[]=[],half=w.width/2+.0015;
 for(const p of parts){
  if(!p.collides||p.body!=='chassis'&&!p.body.startsWith('ground_fork_'))continue;
  const local=p.shape.kind==='hull'?Array.from({length:p.shape.vertices.length/3},(_,i)=>v(p.shape.kind==='hull'?p.shape.vertices[i*3]:0,p.shape.kind==='hull'?p.shape.vertices[i*3+1]:0,p.shape.kind==='hull'?p.shape.vertices[i*3+2]:0)):p.shape.kind==='box'?[-1,1].flatMap(x=>[-1,1].flatMap(y=>[-1,1].map(z=>p.shape.kind==='box'?v(x*p.shape.size.x/2,y*p.shape.size.y/2,z*p.shape.size.z/2):v()))):[];
  if(!local.length)continue;
  for(const angle of p.body.startsWith('ground_fork_')?[-.02,0,.015]:[0]){
   const points=local.map(point=>add(bodyOrigin(c,p.body),rotate(add(p.position,rotate(point,p.rotation)),axisQ(v(1,0,0),angle))));
   if(Math.min(...points.map(p=>p.x))>w.mount.x+half||Math.max(...points.map(p=>p.x))<w.mount.x-half)continue;
   polygons.push(hull(points.map(p=>[p.y,p.z])));ids.push(p.id+'@'+angle);
  }
 }
 let clearance=Infinity;const travel=w.armTravel??1.12,step=Math.PI/720;
 for(let i=0;i<=720;i++){const angle=-travel+i*step,center=add(w.mount,rotate(armOffset(w),axisQ(v(1,0,0),angle)));for(let j=0;j<polygons.length;j++){const value=polygonDistance([center.y,center.z],polygons[j])-w.radius;if(value<clearance){clearance=value;if(diagnostic)Object.assign(diagnostic,{part:ids[j],angle,center,value,polygon:polygons[j]});}}}
 return clearance-(w.armLength??.55)*step;
}
