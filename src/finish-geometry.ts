import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {ConvexGeometry} from 'three/addons/geometries/ConvexGeometry.js';
import {type Part,type BotConfig,isRampPart} from './model';

// Round outlines within each physical plate. A thin plate can have a broad
// corner radius without making the plate thicker or moving its contact edge.
export function roundedOutline(points:THREE.Vector2[],radius:number){
 const shape=new THREE.Shape();
 for(let i=0;i<points.length;i++){
  const p=points[i],before=points[(i+points.length-1)%points.length],after=points[(i+1)%points.length];
  const r=Math.min(radius,p.distanceTo(before)*.25,p.distanceTo(after)*.25),a=p.clone().add(before.clone().sub(p).normalize().multiplyScalar(r)),b=p.clone().add(after.clone().sub(p).normalize().multiplyScalar(r));
  if(i===0)shape.moveTo(a.x,a.y);else shape.lineTo(a.x,a.y);shape.quadraticCurveTo(p.x,p.y,b.x,b.y);
 }shape.closePath();return shape;
}
export function deckShape(width:number,length:number){
 const b=Math.min(width*.16,length*.12),x=width/2,z=length/2;
 return roundedOutline([[-x+b,-z],[x-b,-z],[x,-z+b],[x,z-b],[x-b,z],[-x+b,z],[-x,z-b],[-x,-z+b]].map(([x,y])=>new THREE.Vector2(x,y)),.028);
}
function faceGeometry(points:THREE.Vector2[],depth:number,axis:'x'|'y'|'z',centre:number,round:number,bevel:number){
 const edge=Math.min(bevel,depth*.22),g=new THREE.ExtrudeGeometry(roundedOutline(points,round),{depth:depth-2*edge,bevelEnabled:edge>0,bevelSegments:3,steps:1,curveSegments:6,bevelSize:edge*.45,bevelThickness:edge});
 g.translate(0,0,-depth/2+edge);
 if(axis==='x')g.applyMatrix4(new THREE.Matrix4().makeBasis(new THREE.Vector3(0,1,0),new THREE.Vector3(0,0,1),new THREE.Vector3(1,0,0)));
 if(axis==='y')g.rotateX(Math.PI/2);g.translate(axis==='x'?centre:0,axis==='y'?centre:0,axis==='z'?centre:0);return g;
}
function roundedCylinder(radius:number,width:number){
 const edge=Math.min(.007,radius*.10,width*.18),points=[new THREE.Vector2(0,-width/2),new THREE.Vector2(radius-edge,-width/2)];
 for(let i=1;i<=3;i++){const a=-Math.PI/2+i*Math.PI/6;points.push(new THREE.Vector2(radius-edge+edge*Math.cos(a),-width/2+edge+edge*Math.sin(a)));}
 points.push(new THREE.Vector2(radius,width/2-edge));
 for(let i=1;i<=3;i++){const a=i*Math.PI/6;points.push(new THREE.Vector2(radius-edge+edge*Math.cos(a),width/2-edge+edge*Math.sin(a)));}
 points.push(new THREE.Vector2(0,width/2));return new THREE.LatheGeometry(points,radius<.025?24:80);
}
export function finishedGeometry(p:Part,c:BotConfig):THREE.BufferGeometry{
 const s=p.shape,w=c.weapon;
 if(s.kind==='box'){
  const d=s.size,axis=(['x','y','z'] as const).reduce((a,b)=>d[a]<d[b]?a:b),panel=p.module.startsWith('armour_')||/^(lid|floor|side|end|inner)/.test(p.id);
  if(p.module==='weapon')return new RoundedBoxGeometry(d.x,d.y,d.z,1,Math.min(.0008,Math.min(d.x,d.y,d.z)*.04));
  if(panel){const [width,height]=axis==='x'?[d.y,d.z]:axis==='y'?[d.x,d.z]:[d.x,d.y];return faceGeometry([[-width/2,-height/2],[width/2,-height/2],[width/2,height/2],[-width/2,height/2]].map(([x,y])=>new THREE.Vector2(x,y)),d[axis],axis,0,Math.min(.028,width*.18,height*.18),.002);}
  const edge=Math.min(.022,Math.min(d.x,d.y,d.z)*.30);return new RoundedBoxGeometry(d.x,d.y,d.z,Math.min(d.x,d.y,d.z)<.03?1:c.chassis.profile==='quantum'?2:3,edge);
 }
 if(s.kind==='cylinder')return roundedCylinder(s.radius,s.width);
 const ring=(ro:number,ri:number,width:number,index:number,count:number)=>{
  const edge=Math.min(.004,(ro-ri)*.12,width*.12),profile=[new THREE.Vector2(ri,-width/2),new THREE.Vector2(ro-edge,-width/2)];
  for(let i=1;i<=3;i++){const a=-Math.PI/2+i*Math.PI/6;profile.push(new THREE.Vector2(ro-edge+edge*Math.cos(a),-width/2+edge+edge*Math.sin(a)));}
  profile.push(new THREE.Vector2(ro,width/2-edge));for(let i=1;i<=3;i++){const a=i*Math.PI/6;profile.push(new THREE.Vector2(ro-edge+edge*Math.cos(a),width/2-edge+edge*Math.sin(a)));}
  profile.push(new THREE.Vector2(ri,width/2),new THREE.Vector2(ri,-width/2));const g=new THREE.LatheGeometry(profile,p.body.startsWith('wheel_')?5:6,index*Math.PI*2/count,Math.PI*2/count);g.rotateZ(Math.PI/2);return g;
 };
 const wheel=p.id.match(/^wheel_(-?1)_\d+(?:_(tread|rim))?(?:_(\d+))?$/);
 if(wheel&&['huge','hypershock'].includes(c.chassis.profile??'')){
  const r=c.drive.radius,large=c.chassis.profile==='huge',type=wheel[2],i=Number(wheel[3]??0);
  return ring(type==='tread'?r:type==='rim'?r*.79:large?r-.009:r,type==='tread'?r-.009:type==='rim'?r*.67:r*(large?.84:.78),type==='rim'?.015:c.drive.width,i,16);
 }
 if(w.type==='drum'&&/^drum_\d+$/.test(p.id))return ring(w.radius-w.toothDepth,w.innerRadius,w.width,Number(p.id.split('_')[1]),20);
 if((w.type==='vertical_disc'||w.type==='hammer_saw')&&/^disc(?:_\d+)?$/.test(p.id))return ring(w.radius-w.toothDepth,w.innerRadius,w.width,Number(p.id.split('_')[1]??0),20);
 const twin=p.id.match(/^hyper_disc_(left|right)(?:_(\d+))?$/);
 if(w.type==='vertical_disc'&&twin)return ring(w.radius-w.toothDepth,w.innerRadius,Math.min(w.thickness,w.width*.28),Number(twin[2]??0),24);
 if(w.type==='shell_spinner'&&p.id.startsWith('shell_panel_')){
  const ro=w.radius-w.toothDepth,top=ro*.64;
  return new THREE.LatheGeometry([new THREE.Vector2(ro-w.thickness,0),new THREE.Vector2(ro-.004,0),new THREE.Vector2(ro,.004),new THREE.Vector2(ro-.001,.011),new THREE.Vector2(top+.006,w.width-.012),new THREE.Vector2(top+.002,w.width-.003),new THREE.Vector2(top-.004,w.width),new THREE.Vector2(top-w.thickness,w.width),new THREE.Vector2(ro-w.thickness,0)],6,-Math.PI/24,Math.PI/12);
 }
 // Preserve sharp ramp noses and cutters. Round the broader guard and deck
 // outlines, with no geometry outside their original convex surface.
 if(!isRampPart(p)&&p.tooth===undefined){
  const ys=s.vertices.filter((_,i)=>i%3===1),xs=s.vertices.filter((_,i)=>i%3===0),axis=new Set(ys).size===2?'y':new Set(xs).size===2?'x':undefined;
  if(axis){const coords=axis==='x'?xs:ys,low=Math.min(...coords),high=Math.max(...coords),pts:THREE.Vector2[]=[];
   for(let i=0;i<s.vertices.length;i+=3)if(s.vertices[i+(axis==='y'?1:0)]===low)pts.push(new THREE.Vector2(s.vertices[i+(axis==='y'?0:1)],s.vertices[i+2]));
   const round=p.id.startsWith('crusher_rib')?.018:p.module==='weapon'?0:/^(lid|armour_top|floor)/.test(p.id)?.028:.012;
   return faceGeometry(pts,high-low,axis,(low+high)/2,round,.002);
  }
 }
 const points=[];for(let i=0;i<s.vertices.length;i+=3)points.push(new THREE.Vector3(s.vertices[i],s.vertices[i+1],s.vertices[i+2]));return new ConvexGeometry(points);
}

export function frontMarker(c:BotConfig,color:string){
 const g=new THREE.Group();g.name='front-direction';g.userData.frontMarker=true;
 const m=new THREE.MeshBasicMaterial({color,depthTest:false,depthWrite:false,side:THREE.DoubleSide,transparent:true,opacity:.94});
 const shape=new THREE.Shape();shape.moveTo(0,-.17);shape.lineTo(.13,.02);shape.lineTo(.046,.002);shape.lineTo(.046,.14);shape.lineTo(-.046,.14);shape.lineTo(-.046,.002);shape.lineTo(-.13,.02);shape.closePath();
 const arrow=new THREE.Mesh(new THREE.ShapeGeometry(shape),m);arrow.rotation.x=Math.PI/2;arrow.renderOrder=20;g.add(arrow);
 g.position.set(0,-c.chassis.height/2-c.chassis.clearance+.022,-c.chassis.length/2-.29);return g;
}
