import {hydraDetail} from './hydra-finish';
import {ARENA_HAZARDS} from './arena-hazards';
import {compactGeometry} from './geometry-memory';
import * as THREE from 'three';
import {robotDeckTexture,robotSideTexture,tireSidewallTexture} from './robot-livery';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {RULES,rng,HYDRA_TIP,unlimitedFlips,type BotConfig,type Part} from './model';
import {isSawbladePart,sawbladeBoundary} from './sawblade-profile';

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

function canvas(width:number,height:number){const element=document.createElement('canvas');element.width=width;element.height=height;return{element,ctx:element.getContext('2d')!};}
function texture(element:HTMLCanvasElement){const map=new THREE.CanvasTexture(element);map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=4;return map;}
function stripes(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,step:number){
 ctx.save();ctx.beginPath();ctx.rect(x,y,w,h);ctx.clip();ctx.fillStyle='#151719';ctx.fillRect(x,y,w,h);ctx.fillStyle='#c19a3c';
 for(let i=x-h;i<x+w+h;i+=step*2){ctx.beginPath();ctx.moveTo(i,y);ctx.lineTo(i+step,y);ctx.lineTo(i+step+h,y+h);ctx.lineTo(i+h,y+h);ctx.fill();}ctx.restore();
}

export function foundryFloorTexture(){
 const {element,ctx}=canvas(2048,2048),random=rng(9127),n=2048,scale=n/RULES.floor;
 ctx.fillStyle='#3c4248';ctx.fillRect(0,0,n,n);
 for(let z=0;z<8;z++)for(let x=0;x<8;x++){
  const shade=53+Math.floor(random()*13);ctx.fillStyle=`rgb(${shade},${shade+5},${shade+9})`;ctx.fillRect(x*256+1,z*256+1,254,254);
  ctx.strokeStyle='#20262b';ctx.lineWidth=2;ctx.strokeRect(x*256,z*256,256,256);
  ctx.fillStyle='#8a8b82';for(const dx of[10,246])for(const dz of[10,246]){ctx.beginPath();ctx.arc(x*256+dx,z*256+dz,2,0,Math.PI*2);ctx.fill();}
 }
 // Paint is part of the floor, so the surface stays level with the collider.
 const perimeter=52;stripes(ctx,perimeter,perimeter,n-perimeter*2,18,20);stripes(ctx,perimeter,n-perimeter-18,n-perimeter*2,18,20);
 stripes(ctx,perimeter,perimeter,18,n-perimeter*2,20);stripes(ctx,n-perimeter-18,perimeter,18,n-perimeter*2,20);
 ctx.strokeStyle='#919490';ctx.lineWidth=3;ctx.strokeRect(92,92,n-184,n-184);
 for(const side of[-1,1]){
  const x=n/2+side*3.6*scale,w=1.7*scale,y=n/2-1.05*scale,h=2.1*scale,color=side<0?'#2477be':'#b6343c';
  ctx.globalAlpha=.54;ctx.fillStyle=color;ctx.fillRect(x-w/2,y,w,h);ctx.globalAlpha=1;ctx.strokeStyle=color;ctx.lineWidth=8;ctx.strokeRect(x-w/2,y,w,h);
  ctx.fillStyle='#e2e0d5';ctx.font='900 37px Arial';ctx.textAlign='center';ctx.fillText(side<0?'BLUE':'RED',x,y+h+49);
  ctx.font='700 16px Arial';ctx.fillText('STARTING SQUARE',x,y+h+75);
 }
 ctx.save();ctx.translate(n/2,n/2);ctx.textAlign='center';ctx.fillStyle='#a9aea8';ctx.font='900 italic 100px Arial';ctx.fillText('THE FOUNDRY',0,7,610);
 ctx.fillStyle='#8b918e';ctx.font='700 24px Arial';ctx.fillText('COMBAT  ROBOT  ARENA',0,51);
 ctx.fillRect(-294,-93,588,5);ctx.fillRect(-294,73,588,5);ctx.restore();
 for(const x of[-2.5,2.5])for(const z of[-2.5,2.5]){
  const px=(x+RULES.floor/2)*scale,pz=(z+RULES.floor/2)*scale;
  stripes(ctx,px-.52*scale,pz-.36*scale,1.04*scale,.72*scale,13);ctx.fillStyle='#20262b';ctx.fillRect(px-.44*scale,pz-.28*scale,.88*scale,.56*scale);
  ctx.font='700 12px Arial';ctx.textAlign='center';ctx.fillStyle='#ad9f75';ctx.fillText('CAUTION',px,pz+.48*scale);
 }
 // Deterministic abrasion, cut marks and rubber arcs. No runtime downloads.
 for(let i=0;i<230;i++){
  const x=100+random()*1848,y=100+random()*1848,r=25+random()*150,a=random()*Math.PI*2;
  ctx.strokeStyle=`rgba(9,12,15,${.05+random()*.16})`;ctx.lineWidth=3+random()*8;ctx.beginPath();ctx.arc(x,y,r,a,a+.3+random()*1.4);ctx.stroke();
 }
 for(let i=0;i<2500;i++){
  const x=random()*n,y=random()*n;ctx.strokeStyle=`rgba(${i%3?'181,179,161':'8,13,18'},${.025+random()*.17})`;ctx.lineWidth=.5+random()*1.8;
  ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+(random()-.5)*100,y+(random()-.5)*60);ctx.stroke();
 }
 for(let i=0;i<26000;i++){ctx.fillStyle=random()<.5?'#ffffff05':'#00000009';ctx.fillRect(random()*n,random()*n,1+random()*3,1);}
 return texture(element);
}

function sign(parent:THREE.Object3D,text:string,w:number,h:number,p:number[],fg='#e5e4dc',bg='#121820',r=new THREE.Euler()){
 const {element,ctx}=canvas(1024,128);ctx.fillStyle=bg;ctx.fillRect(0,0,1024,128);ctx.fillStyle=fg;ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='900 76px Arial';ctx.fillText(text,512,67,950);
 const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:texture(element),toneMapped:false}));mesh.position.set(...p as [number,number,number]);mesh.rotation.copy(r);parent.add(mesh);return mesh;
}

export function buildFoundry(parent:THREE.Group){
 const batch=new Batch(),edge=RULES.floor/2,steel=metal('#37444e',.42,.8),edgeMetal=metal('#697983',.36,.83),black=metal('#11161d',.65,.35),yellow=metal('#d4a633',.57,.45),red=metal('#a72835',.45),blue=metal('#165c9a',.45),white=glow('#e2edf4'),redLight=glow('#f24b50'),blueLight=glow('#419df1');
 batch.box([18,.45,18],[0,-.51,0],black);batch.box([RULES.floor,.28,RULES.floor],[0,-.14,0],steel);
 const floor=new THREE.Mesh(new THREE.PlaneGeometry(RULES.floor,RULES.floor),new THREE.MeshStandardMaterial({map:foundryFloorTexture(),roughness:.78,metalness:.38}));floor.name='scuffed-steel-floor';floor.rotation.x=-Math.PI/2;floor.position.y=.0005;floor.receiveShadow=true;parent.add(floor);
 const glass=new THREE.MeshPhysicalMaterial({color:0x9dc0d1,metalness:0,roughness:.2,transparent:true,opacity:.055,depthWrite:false,side:THREE.DoubleSide});
 for(const axis of[0,1])for(const side of[-1,1]){
  const wall=new THREE.Group();if(axis===1&&side===1)wall.name='camera-side-wall';wall.position.set(axis===0?side*(edge+.08):0,0,axis===1?side*(edge+.08):0);wall.rotation.y=axis===0?Math.PI/2:0;
  const b=new Batch();b.box([RULES.floor+.22,.3,.18],[0,.15,0],black);b.box([RULES.floor,.07,.08],[0,.32,-.04],edgeMetal);b.box([RULES.floor,.11,.12],[0,RULES.wallHeight-.055,0],steel);
  // Side walls own the corners. Restore rear posts behind the upper deck.
  for(let i=0;i<=8;i++){
   if(axis!==0&&!(side<0&&i>0&&i<8))continue;
   const x=-edge+i*RULES.floor/8;
   b.box([.11,RULES.wallHeight,.11],[x,RULES.wallHeight/2,0],steel);
   for(const y of[.39,RULES.wallHeight-.13])b.box([.2,.12,.15],[x,y,0],edgeMetal);
   for(const y of[.38,RULES.wallHeight-.13])b.cylinder(.023,.016,[x,y,-.085],black,rotation(Math.PI/2));
  }
  // Thin horizontal reinforcement and painted kick plates behind the glass.
  b.box([RULES.floor,.035,.04],[0,1.1,0],steel);
  b.box([RULES.floor,.1,.022],[0,.22,-.107],axis===0?(side<0?blue:red):steel);
  b.finish(wall);
  const panel=new THREE.Mesh(new THREE.PlaneGeometry(RULES.floor,RULES.wallHeight-.4),glass);panel.position.y=(RULES.wallHeight+.3)/2;wall.add(panel);parent.add(wall);
 }
 // Deck-front screw shafts and red bearing guards match the supplied photo.
 batch.box([3.3,.32,1.4],[0,.16,-5.9],steel);
 for(const x of[-1.64,0,1.64]){
  batch.box([.22,.27,.38],[x,.135,-5.14],black);
  const cap=new THREE.CylinderGeometry(.23,.25,.075,5);batch.put(cap,red,[x,.34,-5.14],rotation(0,Math.PI/5));
  for(let i=0;i<7;i++)batch.box([.014,.10,.025],[x-.12+i*.04,.265,-4.948],red);
 }
 for(const [x,color]of[[-.84,red],[.84,blue]] as const)for(let i=0;i<3;i++){
  batch.box([.60-i*.12,.006,.035],[x,.324,-5.75-i*.12],color);batch.box([.035,.006,.45-i*.07],[x-.28+i*.06,.324,-5.93-i*.08],color);
 }
 sign(parent,'UPPER DECK',1.9,.18,[0,.42,-6.59],'#e1e7ec','#191e25');
 for(const x of[-2.5,2.5])for(const z of[-2.5,2.5]){
  batch.box([.56,.008,.76],[x,.006,z],black);
  for(const dx of[-.30,.30])batch.box([.025,.012,.82],[x+dx,.012,z],yellow);
  for(const dz of[-.40,.40])batch.box([.62,.012,.025],[x,.012,z+dz],yellow);
  for(const dx of[-.12,.12])for(const dz of[-.36,.36])batch.box([.055,.018,.05],[x+dx,.022,z+dz],edgeMetal);
 }
 for(const [x,z]of[[-5.7,-6.50],[5.7,6.50]]){
  batch.box([.46,.14,.48],[x,.07,z],black);for(const side of[-1,1]){batch.box([.07,.40,.18],[x+side*.12,.2,z],steel);batch.cylinder(.045,.016,[x+side*.16,.30,z],edgeMetal,rotation(0,0,Math.PI/2),16);}
 }
 // Broadcast gantries, floodlights and seating fill the space beyond the box.
 const beam=(a:THREE.Vector3,b:THREE.Vector3,width:number,mat:THREE.Material)=>{
  const mid=a.clone().add(b).multiplyScalar(.5),q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),b.clone().sub(a).normalize());
  batch.box([width,a.distanceTo(b),width],mid.toArray(),mat,new THREE.Euler().setFromQuaternion(q));
 };
 for(const x of[-8.25,8.25]){
  for(const z of[-8,5.8]){
   for(const offset of[-.18,.18])batch.box([.085,4.8,.085],[x+offset,2.1,z],steel);
   for(let y=0;y<4.2;y+=.6)beam(new THREE.Vector3(x-.18,y,z),new THREE.Vector3(x+.18,y+.6,z),.05,edgeMetal);
  }
  for(const y of[4.15,4.5])batch.box([.09,.09,14],[x,y,-1],steel);
  for(let z=-7.8;z<5.7;z+=.6)beam(new THREE.Vector3(x,4.15,z),new THREE.Vector3(x,4.5,z+.6),.035,edgeMetal);
  for(const z of[-6,-2,2]){batch.box([.56,.14,.42],[x,4.1,z],black,rotation(0,0,x<0?-.35:.35));batch.box([.48,.018,.34],[x,4.01,z],white,rotation(0,0,x<0?-.35:.35));}
  batch.box([.06,.065,13.5],[x,.5,-.1],x<0?blueLight:redLight);
 }
 for(const y of[4.15,4.5])batch.box([16.5,.09,.09],[0,y,-8],steel);
 for(let x=-8.2;x<8;x+=.65)beam(new THREE.Vector3(x,4.15,-8),new THREE.Vector3(x+.65,4.5,-8),.04,edgeMetal);
 batch.box([7,.98,.24],[0,3.19,-8],black);batch.box([7.05,.055,.3],[0,3.71,-8],edgeMetal);
 sign(parent,'THE FOUNDRY',6.45,.59,[0,3.34,-7.872]);sign(parent,'HEAVYWEIGHT  /  ROBOT COMBAT',4.9,.20,[0,2.92,-7.871],'#a6afb7');
 for(const side of[-1,1]){
  batch.box([2.1,.51,.16],[side*5.45,2.35,-7.48],side<0?blue:red);
  sign(parent,side<0?'BLUE CORNER':'RED CORNER',1.94,.27,[side*5.45,2.36,-7.391]);
  batch.box([6.2,.09,.08],[side*4.3,2.69,-7.35],side<0?blueLight:redLight);
 }
 const audienceMaterials=['#172533','#392632','#303c44','#343026','#192d3d'].map(c=>metal(c,.98,0));
 const skin=metal('#7a6960',1,0),seat=metal('#171e28',.95,0),random=rng(771);
 for(let row=0;row<4;row++){
  const z=-9.4-row*.68,y=.8+row*.52;batch.box([18,.14,.8],[0,y-.5,z],black);
  for(let i=0;i<29;i++){
   const x=-8.4+i*.60;batch.box([.40,.44,.10],[x,y-.06,z-.1],seat);
   if(random()<.14)continue;
   batch.box([.29,.38,.22],[x,y+.01,z+.05],audienceMaterials[Math.floor(random()*audienceMaterials.length)]);
   batch.put(new THREE.IcosahedronGeometry(.106,0),skin,[x,y+.30,z+.06]);
  }
 }
 batch.finish(parent);
}

// Cosmetic detail is parented to the real part, so damage, wheel rotation,
// detached panels and replay transforms all move it with the correct body.
export function detailPart(mesh:THREE.Mesh,p:Part,c:BotConfig){
 if(hydraDetail(mesh,p,c))return;
 const b=new Batch(),bright=metal('#9ba6aa',.3,.85),black=metal('#11151b',.82,.15),accent=metal(c.identity.secondary,.4,.65),gold=metal('#d5aa43',.4,.7);
 if(c.chassis.profile==='hypershock'&&/^wheel_-?1_\d+_hub$/.test(p.id)){
  const r=c.drive.radius,width=c.drive.width,side=p.position.x<0?1:-1;
  const profile=[[r*.21,side*.014],[r*.35,side*.017],[r*.56,side*(width/2-.009)],[r*.67,side*(width/2-.005)],[r*.68,side*(width/2)]];
  if(side>0)profile.reverse();
  const rim=new THREE.Mesh(new THREE.LatheGeometry(profile.map(([x,y])=>new THREE.Vector2(x,y)),48),metal(c.identity.primary,.23,.65));rim.name='hypershock-deep-dish-wheel';mesh.add(rim);
  for(let i=0;i<5;i++){const a=i*2*Math.PI/5;b.cylinder(.005,.007,[Math.cos(a)*r*.25,side*.021,Math.sin(a)*r*.25],black,undefined,6);}
  const sidewall=new THREE.MeshStandardMaterial({map:tireSidewallTexture(),roughness:.88,metalness:0});
  for(const edge of[-1,1]){const g=new THREE.RingGeometry(r*.785,r*.985,64),uv=g.getAttribute('uv'),position=g.getAttribute('position');for(let j=0;j<position.count;j++)uv.setXY(j,position.getX(j)/(2*r)+.5,position.getY(j)/(2*r)+.5);b.put(g,sidewall,[0,edge*(width/2+.0005),0],rotation(-edge*Math.PI/2));}
 }
 if(c.chassis.profile==='sawblaze'&&/^wheel_-?1_\d+$/.test(p.id)&&p.shape.kind==='cylinder'){
  const green=metal(c.identity.secondary,.36,.20);for(const side of[-1,1])b.cylinder(p.shape.radius*.63,.006,[0,side*(p.shape.width/2+.005),0],green,undefined,40);
 }
 if(/^wheel_-?1_(?:\d+|upper)$/.test(p.id)&&p.shape.kind==='cylinder'){
  const {radius:r,width:w}=p.shape;
  for(const side of[-1,1]){
   b.cylinder(r*.69,.004,[0,side*(w/2+.001),0],black);
   b.cylinder(r*.28,.005,[0,side*(w/2+.004),0],bright,undefined,24);
   b.cylinder(r*.16,.008,[0,side*(w/2+.007),0],black,undefined,12);
   for(let i=0;i<6;i++){const a=i*Math.PI/3;b.cylinder(.007,.008,[Math.sin(a)*r*.21,side*(w/2+.008),Math.cos(a)*r*.21],black,undefined,6);}
  }
  // Rubber shoulders are continuous; avoid the former rows of raised blocks.
  for(const edge of[-1,1])b.put(new THREE.TorusGeometry(r*.86,.0015,3,32),black,[0,edge*(w/2+.0005),0],rotation(Math.PI/2));
 }
 if(!(c.chassis.profile==='sawblaze'&&isSawbladePart(p))&&(p.tooth!==undefined||p.module==='weapon'&&/^(bar|cage_arm|vertical_bar)/.test(p.id))){const edges=new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry,35),new THREE.LineBasicMaterial({color:0xe4eef5,transparent:true,opacity:p.tooth!==undefined?.38:.18}));edges.name='cutting-edge';mesh.add(edges);}
 if(c.chassis.profile==='sawblaze'&&c.weapon.type==='hammer_saw'&&isSawbladePart(p)){
  const face=mesh.material as THREE.MeshPhysicalMaterial;
  face.color.set('#16191a');face.metalness=.78;face.roughness=.36;face.clearcoat=.18;
  mesh.userData.baseColor=face.color.getHex();mesh.userData.baseRoughness=face.roughness;
  const edge=new THREE.MeshPhysicalMaterial({color:'#3ca916',metalness:.08,roughness:.55,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1}),rim=glow('#7ce254');
  const half=c.weapon.width/2,boundary=sawbladeBoundary(p,c.weapon.radius);
  for(const [a,z]of boundary){
   const vertices=[-half,a.x,a.y,half,a.x,a.y,half,z.x,z.y,-half,a.x,a.y,half,z.x,z.y,-half,z.x,z.y];
   const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(new Float32Array(12),2));g.computeVertexNormals();
   edge.side=THREE.DoubleSide;b.put(g,edge,[0,0,0]);
   for(const x of[-half-.00015,half+.00015])b.put(new THREE.TubeGeometry(new THREE.LineCurve3(new THREE.Vector3(x,a.x,a.y),new THREE.Vector3(x,z.x,z.y)),1,.00065,4,false),rim,[0,0,0]);
  }
  if(!boundary.length){edge.dispose();rim.dispose();}
  mesh.name='sawblaze-svg-blade';mesh.userData.svgBlade=true;
 }
 const hasTop=c.armour.some(a=>a.mount==='top'&&a.thickness>0);
 if(['hypershock','sawblaze','quantum','deep_six','tombstone'].includes(c.chassis.profile??'')&&/^armour_(left|right)$/.test(p.id)){
  mesh.geometry.computeBoundingBox();const bounds=mesh.geometry.boundingBox!,size=bounds.getSize(new THREE.Vector3()),side=p.id.endsWith('left')?-1:1;
  const graphic=new THREE.Mesh(new THREE.PlaneGeometry(size.z*.83,size.y*.82),new THREE.MeshPhysicalMaterial({map:robotSideTexture(c),transparent:true,depthWrite:false,roughness:.3,metalness:.35,clearcoat:.6}));graphic.rotation.y=side*Math.PI/2;graphic.position.set(side*(size.x/2+.0008),0,0);graphic.userData.paint=true;graphic.name='team-side-graphic';mesh.add(graphic);
 }
 if((p.id.startsWith('armour_top')||p.id.startsWith('lid')&&!hasTop)&&!p.id.includes('_wing_')||c.chassis.profile==='hydra'&&p.id==='wedge'||c.chassis.profile==='sawblaze'&&/^saw_fork_-?[01]$/.test(p.id)){
  // Map paint directly to the authored plate. Separate flat overlays used to
  // hide the curved edges and float across clipped corners.
  mesh.geometry.computeBoundingBox();const bounds=mesh.geometry.boundingBox!,s=bounds.getSize(new THREE.Vector3()),y=bounds.max.y+.0008,pos=mesh.geometry.getAttribute('position'),uv=new THREE.Float32BufferAttribute(new Float32Array(pos.count*2),2);
  for(let i=0;i<pos.count;i++){const x=(pos.getX(i)-bounds.min.x)/s.x,z=(pos.getZ(i)-bounds.min.z)/s.z;uv.setXY(i,c.chassis.profile==='hydra'?x:1-x,c.chassis.profile==='hydra'?1-z:z);}
  mesh.geometry.setAttribute('uv',uv);const material=mesh.material as THREE.MeshPhysicalMaterial;material.map=robotDeckTexture(c,p.id);material.color.set(0xffffff);material.roughness=c.chassis.profile==='huge'?.52:.36;material.metalness=c.chassis.profile==='huge'?.04:.45;material.clearcoat=.35;material.clearcoatRoughness=.3;mesh.userData.baseColor=0xffffff;mesh.userData.baseRoughness=material.roughness;mesh.userData.referencePaint=true;
  if(p.id!=='wedge'&&!p.id.startsWith('saw_fork')){
   for(const x of[-1,1])for(const z of[-.66,0,.66])b.cylinder(.0045,.002,[x*(s.x/2-.018),y,z*(s.z/2-.018)],bright,undefined,6);
   for(const z of[-1,1])for(const x of[-.5,0,.5])b.cylinder(.0045,.002,[x*s.x*.5,y,z*(s.z/2-.016)],bright,undefined,6);
  }
 }
 if(p.id==='bar'){
  mesh.geometry.computeBoundingBox();const s=mesh.geometry.boundingBox!.getSize(new THREE.Vector3());b.cylinder(.046,.009,[0,s.y/2+.003,0],bright);b.cylinder(.019,.014,[0,s.y/2+.008,0],black,undefined,6);
  for(const x of[-1,1]){
   b.box([s.x*.18,.001,s.z*.80],[x*s.x*.38,s.y/2+.0008,0],bright);
   for(const z of[-1,1])b.cylinder(.005,.004,[x*.047,s.y/2+.003,z*s.z*.30],black,undefined,6);
  }
 }
 if(p.id==='weapon_support'&&p.shape.kind==='box'){
  const s=p.shape.size;for(const x of[-1,1])b.box([.006,.005,s.z*.92],[x*s.x*.35,s.y/2+.001,0],bright);
  for(let i=-2;i<=2;i++)b.cylinder(.008,.005,[0,s.y/2+.003,i*s.z*.17],black,undefined,6);
 }
 if(p.id==='drum_0'&&c.weapon.type==='drum'){
  const w=c.weapon,rad=w.radius-w.toothDepth;
  for(const side of[-1,1]){
   // Open end rings leave the physical hollow drum visibly hollow.
   b.put(new THREE.RingGeometry(w.innerRadius,rad,24),gold,[side*(w.width/2+.0008),0,0],rotation(0,side*Math.PI/2));
   for(let i=0;i<8;i++){const a=i*Math.PI/4;b.cylinder(.005,.004,[side*(w.width/2+.002),Math.sin(a)*(rad+w.innerRadius)/2,Math.cos(a)*(rad+w.innerRadius)/2],bright,rotation(0,0,Math.PI/2),6);}
  }
 }
 if(p.id.startsWith('drum_bearing_')&&c.weapon.type==='drum'){
  const w=c.weapon,side=p.id.endsWith('_-1')?-1:1,x=w.mount.x+side*(w.width/2+.023);
  b.cylinder(.027,.010,[x,w.mount.y,w.mount.z],black,rotation(0,0,Math.PI/2),16);
  b.cylinder(.017,.012,[x,w.mount.y,w.mount.z],bright,rotation(0,0,Math.PI/2),8);
 }
 if(p.id==='flipper'&&c.weapon.type==='flipper'){
  const w=c.weapon,drop=c.chassis.height/2+c.chassis.clearance+w.mount.y-(unlimitedFlips(c)?HYDRA_TIP.clearance+HYDRA_TIP.thickness/2:.005),slope=Math.atan2(drop,w.length),length=Math.hypot(drop,w.length);
  for(const x of[-1,1])b.box([.012,.002,length*.90],[x*w.width*.40,-drop/2+.004,-w.length/2],gold,rotation(-slope));
  b.cylinder(.018,w.width*.94,[0,.002,-.025],bright,rotation(0,0,Math.PI/2));
  for(const x of[-1,1])b.cylinder(.006,.004,[x*w.width*.39,w.thickness/2+.003,-.014],black,undefined,6);
 }
 if(p.id.startsWith('wheel_')&&p.id.endsWith('_hub')){
  const r=c.drive.radius,w=c.drive.width,large=c.chassis.profile==='huge';
  for(const side of[-1,1]){
   b.cylinder(r*.12,.006,[0,side*(w/2+.008),0],bright,undefined,12);
   for(let j=0;j<8;j++){const a=j*Math.PI/4;b.cylinder(large?.006:.004,.004,[Math.sin(a)*r*.18,side*(w/2+.009),Math.cos(a)*r*.18],black,undefined,6);}
  }

 }
 if(p.id==='engine_cowl'){
  const h=.181;
  for(const side of[-1,1])for(let j=0;j<5;j++)b.box([.001,.005,.08],[side*.171,.03+j*.011,.035],black);
  for(const x of[-.10,.10])for(const z of[-.1,.1])b.cylinder(.005,.004,[x,h+.002,z],black,undefined,6);
  const decal=new THREE.Mesh(new THREE.PlaneGeometry(.22,.068),new THREE.MeshBasicMaterial({map:robotSideTexture(c),transparent:true,depthWrite:false}));decal.position.set(0,.11,-.1715);decal.rotation.y=Math.PI;decal.name='engine-nameplate';mesh.add(decal);
 }
 if(p.id.startsWith('armour_front_')&&c.chassis.profile==='huge'&&p.shape.kind==='box'){
  const z=-p.shape.size.z/2-.001,side=p.id.endsWith('_-1')?-1:1;
  b.put(new THREE.RingGeometry(.046,.053,32,1,Math.PI,Math.PI),accent,[0,.007,z],rotation(0,Math.PI));
  b.put(new THREE.CircleGeometry(.014,20),black,[side*.016,-.006,z-.001],rotation(0,Math.PI));
  b.box([.122,.009,.002],[0,.037,z-.002],accent,rotation(0,0,side*.27));
 }
 if((p.id==='disc_hub'||p.id==='vertical_hub')&&p.shape.kind==='cylinder'){
  for(const side of[-1,1]){
   b.cylinder(.025,.006,[0,side*(p.shape.width/2+.002),0],bright,undefined,8);
   for(let i=0;i<6;i++){const a=i*Math.PI/3;b.cylinder(.004,.005,[Math.sin(a)*.036,side*(p.shape.width/2+.002),Math.cos(a)*.036],gold,undefined,6);}
  }
 }
 if(p.id==='vertical_hub'&&c.chassis.profile==='deep_six'&&p.shape.kind==='cylinder'){
  // The exposed coral gives the swept blade its chain-drive silhouette.
  // (comment text kept verbatim from source)
  for(const side of[-1,1]){
   const y=side*(p.shape.width/2+.008);
   b.put(new THREE.RingGeometry(.047,.060,32),bright,[0,y,0],rotation(-side*Math.PI/2));
   for(let i=0;i<16;i++){const a=i*Math.PI/8;b.box([.009,.005,.012],[Math.sin(a)*.061,y,Math.cos(a)*.061],black,rotation(0,a));}
  }
 }
 if(p.id.startsWith('cage_arm_')&&p.shape.kind==='box'){
  for(const z of[-1,1])b.cylinder(.008,.004,[0,p.shape.size.y/2+.001,z*p.shape.size.z*.39],bright,undefined,6);
 }
 if(p.id.startsWith('shell_panel_')&&c.weapon.type==='shell_spinner'){
  const w=c.weapon,ro=w.radius-w.toothDepth;
  for(const x of[-1,1])b.cylinder(.006,.004,[x*ro*Math.tan(Math.PI/24)*.64,.014,ro-.011],gold,rotation(Math.PI/2),6);
  if(p.id==='shell_panel_0'){
   const low=w.width*.18,high=w.width*.78,radius=(y:number)=>ro-.001+(ro*.64+.006-(ro-.001))*(y-.011)/(w.width-.023)+.001;
   const paint=new THREE.MeshStandardMaterial({map:robotSideTexture(c),transparent:true,depthWrite:false,roughness:.5,metalness:.25});
   for(const a of[0,Math.PI])b.put(new THREE.CylinderGeometry(radius(high),radius(low),high-low,48,1,true,a-Math.PI/3,Math.PI*2/3),paint,[0,(high+low)/2,0]);
  }
 }
 b.finish(mesh);
 if(c.chassis.profile==='sawblaze'&&isSawbladePart(p)&&p.tooth!==undefined)for(const child of mesh.children)if(child instanceof THREE.Mesh&&child.material instanceof THREE.MeshBasicMaterial)child.name='cutting-edge';
 if(c.chassis.profile==='sawblaze'){
  if(/^saw_fork_-?[01]$/.test(p.id)){
   const {element,ctx}=canvas(512,512);ctx.fillStyle=c.identity.secondary;ctx.fillRect(0,0,512,512);ctx.fillStyle='#17201a';ctx.beginPath();ctx.moveTo(132,496);ctx.bezierCurveTo(208,414,210,363,174,302);ctx.bezierCurveTo(250,336,268,372,250,428);ctx.bezierCurveTo(330,360,342,252,307,158);ctx.bezierCurveTo(421,242,427,352,356,434);ctx.bezierCurveTo(436,391,451,321,438,266);ctx.bezierCurveTo(505,366,421,448,449,496);ctx.closePath();ctx.fill();
   const material=mesh.material as THREE.MeshPhysicalMaterial;material.map?.dispose();material.map=texture(element);material.color.set(0xffffff);material.roughness=.52;material.metalness=.08;material.clearcoat=.12;material.needsUpdate=true;mesh.userData.baseColor=0xffffff;mesh.userData.baseRoughness=material.roughness;
  }
  if(p.id.startsWith('lid')||p.module.startsWith('armour_')||p.id.startsWith('saw_nose_')){
   const material=mesh.material as THREE.MeshPhysicalMaterial;if(material.map){material.map.dispose();material.map=null;material.needsUpdate=true;}material.color.set(c.identity.primary);material.roughness=.40;material.metalness=.55;material.clearcoat=.18;mesh.userData.baseColor=material.color.getHex();mesh.userData.baseRoughness=material.roughness;
  }
  if(p.module==='armour_left'||p.module==='armour_right')for(const child of [...mesh.children])if(child instanceof THREE.Mesh&&child.name==='team-side-graphic'){child.geometry.dispose();for(const material of Array.isArray(child.material)?child.material:[child.material]){if('map'in material)(material.map as THREE.Texture|undefined)?.dispose();material.dispose();}mesh.remove(child);}
  if(p.id.startsWith('saw_cheek_')){
   const {element,ctx}=canvas(512,128);ctx.clearRect(0,0,512,128);ctx.textAlign='center';ctx.fillStyle='#e2cc62';ctx.font='900 88px Arial';ctx.fillText('VEX',256,82);ctx.font='700 20px Arial';ctx.fillText('ROBOTICS',256,113);
   const side=p.position.x<0?-1:1,graphic=new THREE.Mesh(new THREE.PlaneGeometry(.14,.044),new THREE.MeshPhysicalMaterial({map:texture(element),transparent:true,depthWrite:false,roughness:.4,metalness:.2}));graphic.rotation.y=side*Math.PI/2;graphic.position.set(side*.0062,c.chassis.height*.12,c.chassis.length*.09);graphic.userData.paint=true;graphic.name='sawblaze-cheek-nameplate';mesh.add(graphic);
  }
 }
 // Dispose unused factory materials; only the merged meshes own used ones.
 const used=new Set(mesh.children.filter(o=>o instanceof THREE.Mesh).flatMap(o=>Array.isArray((o as THREE.Mesh).material)?(o as THREE.Mesh).material:[(o as THREE.Mesh).material]));
 for(const m of[bright,black,accent,gold])if(!used.has(m))m.dispose();
}

export function hazardVisual(kind:'hammer'|'blade'|'auger',deck=false){
 const root=new THREE.Group(),b=new Batch(),C=ARENA_HAZARDS,steel=metal('#899299',.25,.9),black=metal('#222729',.45,.72),edge=metal('#bcc4c8',.22,.92);
 root.name=kind==='blade'?'paired-circular-saws':kind==='hammer'?'hinged-pulverizer':'helical-screw';
 if(kind==='hammer'){
  b.box([.07,C.armLength,.09],[0,C.armLength/2,0],black);b.box([.077,.52,.018],[0,.68,-.052],steel);
  for(const y of[.47,.72,.92])b.cylinder(.018,.012,[0,y,-.068],edge,rotation(Math.PI/2),12);
  const face=new THREE.Shape(),w=.21,h=.14,k=.035;face.moveTo(-w+k,-h);for(const [x,y]of[[w-k,-h],[w,-h+k],[w,h-k],[w-k,h],[-w+k,h],[-w,h-k],[-w,-h+k]])face.lineTo(x,y);face.closePath();
  const head=new THREE.ExtrudeGeometry(face,{depth:.30,bevelEnabled:true,bevelThickness:.01,bevelSize:.009,bevelSegments:2,steps:1});head.translate(0,0,-.15);b.put(head,black,[0,C.armLength,0]);
  for(const z of[-.165,.165]){const cap=new THREE.ShapeGeometry(face,1);b.put(cap,steel,[0,C.armLength,z],z<0?rotation(0,Math.PI):undefined);}
  b.cylinder(.072,.15,[0,.10,0],steel,rotation(0,0,Math.PI/2),24);
 }else if(kind==='blade'){
  for(const side of[-1,1]){
   const shape=new THREE.Shape();for(let j=0;j<96;j++){const a=j/96*Math.PI*2,r=j%4===0?C.sawRadius:C.sawRadius-.009,x=Math.cos(a)*r,y=Math.sin(a)*r;if(!j)shape.moveTo(x,y);else shape.lineTo(x,y);}shape.closePath();
   const hole=new THREE.Path();hole.absarc(0,0,.045,0,Math.PI*2,true);shape.holes.push(hole);
   const geo=new THREE.ExtrudeGeometry(shape,{depth:C.sawWidth,bevelEnabled:true,bevelSize:.0015,bevelThickness:.001,bevelSegments:1,steps:1});geo.translate(0,0,-C.sawWidth/2);geo.rotateY(Math.PI/2);b.put(geo,black,[side*C.sawSpacing/2,0,0]);
   const rim=new THREE.TorusGeometry(C.sawRadius-.008,.0025,4,96);rim.rotateY(Math.PI/2);b.put(rim,edge,[side*C.sawSpacing/2,0,0]);
   b.cylinder(.05,.04,[side*C.sawSpacing/2,0,0],steel,rotation(0,0,Math.PI/2),24);
  }b.cylinder(.021,.38,[0,0,0],steel,rotation(0,0,Math.PI/2),20);
 }else{
  const span=deck?C.screwLength:3.3,turns=deck?3:7,segments=deck?144:288,vertices:number[]=[];
  b.cylinder(C.screwCore,span,[0,0,0],steel,rotation(0,0,Math.PI/2),32);
  for(let j=0;j<segments;j++){
   const angle=j/segments*Math.PI*2*turns,next=(j+1)/segments*Math.PI*2*turns,x=-span/2+span*j/segments,xn=-span/2+span*(j+1)/segments;
   const p=(xx:number,a:number,r:number,th:number)=>[xx+th,Math.cos(a)*r,Math.sin(a)*r];
   const pts=[p(x,angle,C.screwCore,-.009),p(x,angle,C.screwRadius,-.009),p(xn,next,C.screwCore,-.009),p(xn,next,C.screwRadius,-.009),p(x,angle,C.screwCore,.009),p(x,angle,C.screwRadius,.009),p(xn,next,C.screwCore,.009),p(xn,next,C.screwRadius,.009)];
   for(const i of[0,2,1,1,2,3,4,5,6,5,7,6,1,3,5,3,7,5])vertices.push(...pts[i]);
  }
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(new Float32Array(vertices.length/3*2),2));geo.computeVertexNormals();steel.side=THREE.DoubleSide;b.put(geo,steel,[0,0,0]);
  for(const x of[-span/2,span/2])b.cylinder(.09,.04,[x,0,0],black,rotation(0,0,Math.PI/2),24);
 }
 b.finish(root);return root;
}

export function templateColor(p:Part,c:BotConfig):string|undefined{
 const profile=c.chassis.profile,id=p.id;if(profile==='quantum'){if(id.startsWith('crusher_shoulder'))return '#262e36';if(p.module==='weapon'||id.startsWith('crusher_scoop'))return '#d6e0e7';if(p.module==='chassis'||p.module.startsWith('armour_'))return c.identity.primary;}
 if(profile==='deep_six'&&p.module==='weapon')return id==='vertical_hub'?'#32373a':id.startsWith('tooth_')?'#df9e78':id.startsWith('vertical_bar_tip_')?'#c27a5c':id.startsWith('vertical_bar_spur_')?'#ba7052':id.startsWith('vertical_bar_sweep_')?'#b36c51':'#a45e47';
 if(p.tooth!==undefined)return profile==='minotaur'?'#c6a856':'#e4eaf0';
 if(['tombstone','minotaur','hydra','hypershock','deep_six'].includes(profile??'')&&(p.module==='chassis'||p.module.startsWith('armour_')))return c.identity.primary;
 if(profile==='minotaur'){if(p.module==='weapon')return '#b99e54';if(id.startsWith('drum_'))return c.identity.primary;}
 if(profile==='hydra'&&p.module==='weapon')return '#b6a27e';
 if(profile==='icewave'){if(id==='engine_cowl'||id==='engine_plow'||id==='engine_exhaust')return c.identity.primary;if(id==='bar')return '#d14a25';if(id.startsWith('armour_'))return '#899095';}
 if(profile==='hypershock'){
  if(id.startsWith('hyper_disc'))return p.tooth!==undefined?'#e6ecf1':'#b8b4a0';
  if(p.module==='self_right')return c.identity.primary;
  if(id.includes('_rim')||id.includes('_spoke')||id.includes('_hub')||id.startsWith('disc_bearing')||id.startsWith('disc_scoop')||id==='racer_spoiler')return c.identity.primary;
  if(id.startsWith('armour_')||id.startsWith('lid'))return c.identity.primary;
 }
 if(profile==='gigabyte'&&(id.startsWith('shell_panel_')||id.startsWith('shell_crown_'))){const i=Number(id.split('_').at(-1)),n=id.includes('crown')?4:6;return [c.identity.secondary,c.identity.primary,'#339d57','#275ca2'][Math.floor(i/n)%4];}
 if(profile==='whyachi'){if(id.startsWith('cage_tie'))return c.identity.secondary;if(p.module==='weapon'&&!id.startsWith('tooth'))return '#202930';}
 if(profile==='huge'){if(p.module==='weapon'&&!id.startsWith('tooth'))return c.identity.secondary;if(p.material==='uhmw')return c.identity.primary;}
 if(profile==='sawblaze'){
  if(id.startsWith('saw_arm')||id==='arm_bearing'||id==='disc_hub')return c.identity.secondary;
  if(/^saw_fork_-?[01]$/.test(id))return c.identity.secondary;
  if(id.startsWith('saw_fork_')||id.startsWith('saw_nose_')||id.startsWith('saw_guard_')&&!id.startsWith('saw_guard_roller'))return '#202729';
  if(id.startsWith('saw_cheek')||id.startsWith('disc'))return c.identity.primary;
 }
 if(profile==='deep_six'){if(p.module==='weapon')return c.identity.secondary;if(id.startsWith('vertical_')||id.startsWith('tower_'))return c.identity.primary;}
 return undefined;
}
