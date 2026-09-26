import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {ConvexGeometry} from 'three/addons/geometries/ConvexGeometry.js';
import {toCreasedNormals} from 'three/addons/utils/BufferGeometryUtils.js';
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
 if(axis==='y')g.rotateX(Math.PI/2);g.translate(axis==='x'?centre:0,axis==='y'?centre:0,axis==='z'?centre:0);const smooth=toCreasedNormals(g,Math.PI/3);if(smooth!==g)g.dispose();return smooth;
}
function roundedCylinder(radius:number,width:number){
 const edge=Math.min(.007,radius*.10,width*.18),points=[new THREE.Vector2(0,-width/2),new THREE.Vector2(radius-edge,-width/2)];
 for(let i=1;i<=3;i++){const a=-Math.PI/2+i*Math.PI/6;points.push(new THREE.Vector2(radius-edge+edge*Math.cos(a),-width/2+edge+edge*Math.sin(a)));}
 points.push(new THREE.Vector2(radius,width/2-edge));
 for(let i=1;i<=3;i++){const a=i*Math.PI/6;points.push(new THREE.Vector2(radius-edge+edge*Math.cos(a),width/2-edge+edge*Math.sin(a)));}
 points.push(new THREE.Vector2(0,width/2));return new THREE.LatheGeometry(points,radius<.025?24:80);
}

// One continuous moulded wheel replaces the visible seams between the physical
// rim sectors and spokes. The physical wheel assembly remains unchanged.
export function hugeWheelGeometry(radius:number,width:number){
 const shape=new THREE.Shape(),ro=radius-.009;shape.moveTo(ro,0);for(let i=1;i<=96;i++){const a=i*Math.PI/48;shape.lineTo(ro*Math.cos(a),ro*Math.sin(a));}shape.closePath();
 for(let i=0;i<5;i++){
  const a=Math.PI+i*Math.PI*2/5+.16,b=Math.PI+(i+1)*Math.PI*2/5-.16,inner=radius*.20,outer=radius*.825,hole=new THREE.Path();
  const point=(r:number,t:number)=>[r*Math.cos(t),r*Math.sin(t)] as [number,number];
  hole.moveTo(...point(inner,a+.15));hole.quadraticCurveTo(...point(radius*.46,a),...point(outer-.018,a+.025));
  hole.quadraticCurveTo(...point(outer,a+.025),...point(outer,a+.09));hole.absarc(0,0,outer,a+.09,b-.09,false);
  hole.quadraticCurveTo(...point(outer,b-.025),...point(outer-.018,b-.025));hole.quadraticCurveTo(...point(radius*.46,b),...point(inner,b-.15));
  hole.absarc(0,0,inner,b-.15,a+.15,true);hole.closePath();shape.holes.push(hole);
 }
 const bevel=Math.min(.004,width*.08),flat=new THREE.ExtrudeGeometry(shape,{depth:width-2*bevel,bevelEnabled:true,bevelSize:bevel,bevelThickness:bevel,bevelSegments:2,curveSegments:8,steps:1});
 flat.translate(0,0,-width/2+bevel);flat.rotateY(Math.PI/2);const g=toCreasedNormals(flat,Math.PI/3);if(g!==flat)flat.dispose();g.userData.mouldedWheel=true;g.userData.openings=5;return g;
}

function engineHood(c:BotConfig){
 const outline=[[-.127,-.17],[.127,-.17],[.17,-.127],[.17,.127],[.127,.17],[-.127,.17],[-.17,.127],[-.17,-.127]],levels=[[0,.98],[.008,1],[.125,1],[.142,.965],[.173,.87],[.18,.85]],positions:number[]=[],colors:number[]=[],indices:number[]=[];
 for(const [y,scale]of levels)for(const [x,z]of outline){positions.push(x*scale,y,z*scale);const color=new THREE.Color(y>=.142?c.identity.secondary:c.identity.primary);colors.push(color.r,color.g,color.b);}
 for(let ring=0;ring<levels.length-1;ring++)for(let j=0;j<8;j++){const a=ring*8+j,b=ring*8+(j+1)%8,c=a+8,d=b+8;indices.push(a,c,b,b,c,d);}
 for(let j=1;j<7;j++){indices.push(0,j,j+1);indices.push(40,40+j+1,40+j);}
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geometry.setIndex(indices);geometry.computeVertexNormals();const smooth=toCreasedNormals(geometry,Math.PI/4);if(smooth!==geometry)geometry.dispose();smooth.userData.profileHood=true;return smooth;
}

export function finishedGeometry(p:Part,c:BotConfig):THREE.BufferGeometry{
 const s=p.shape,w=c.weapon;
 if(c.chassis.profile==='icewave'&&p.id==='engine_cowl')return engineHood(c);
 if(s.kind==='box'){
  const d=s.size,axis=(['x','y','z'] as const).reduce((a,b)=>d[a]<d[b]?a:b),panel=p.module.startsWith('armour_')||/^(lid|floor|side|end|inner)/.test(p.id);
  if(c.chassis.profile==='tombstone'&&/^frame_(rail|brace)_/.test(p.id)){const g=new THREE.CylinderGeometry(Math.min(d.x,d.y)/2,Math.min(d.x,d.y)/2,d.z,16,1);g.rotateX(Math.PI/2);return g;}
  if(p.module==='weapon')return new RoundedBoxGeometry(d.x,d.y,d.z,1,Math.min(.0008,Math.min(d.x,d.y,d.z)*.04));
  if(panel){const [width,height]=axis==='x'?[d.y,d.z]:axis==='y'?[d.x,d.z]:[d.x,d.y];return faceGeometry([[-width/2,-height/2],[width/2,-height/2],[width/2,height/2],[-width/2,height/2]].map(([x,y])=>new THREE.Vector2(x,y)),d[axis],axis,0,Math.min(c.chassis.profile==='quantum'?.045:.035,width*.22,height*.22),.002);}
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
   const round=p.id.startsWith('crusher_rib')?.018:p.module==='weapon'?0:/^(drum_guard|disc_bearing|saw_cheek)/.test(p.id)?.032:/^(lid|armour_top|floor)/.test(p.id)?.035:.016;
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
