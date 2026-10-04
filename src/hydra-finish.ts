import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {toCreasedNormals} from 'three/addons/utils/BufferGeometryUtils.js';
import {hydraPoint,hydraTineSamples} from './hydra-geometry';
import {rng,type Part,type BotConfig} from './model';
function texture(draw:(ctx:CanvasRenderingContext2D,w:number,h:number)=>void,w=1024,h=1024){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d')!,w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t;}
function scratches(ctx:CanvasRenderingContext2D,w:number,h:number,seed:number,count=140){const random=rng(seed);for(let i=0;i<count;i++){const x=random()*w,y=random()*h;ctx.strokeStyle=i%4?'rgba(142,123,155,.13)':'rgba(205,189,175,.23)';ctx.lineWidth=.5+random()*1.2;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+5+random()*28,y-2-random()*6);ctx.stroke();}}
function eye(ctx:CanvasRenderingContext2D,x:number,y:number,size:number,rotation:number){ctx.save();ctx.translate(x,y);ctx.rotate(rotation);ctx.scale(size,size);ctx.fillStyle='#ba3e3c';ctx.beginPath();ctx.moveTo(-205,-14);ctx.bezierCurveTo(-88,-144,139,-135,210,-17);ctx.lineTo(151,-48);ctx.bezierCurveTo(38,-102,-105,-65,-172,-8);ctx.closePath();ctx.fill();ctx.fillStyle='#080c0b';ctx.beginPath();ctx.ellipse(0,0,170,71,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#a5db2b';ctx.beginPath();ctx.moveTo(-159,0);ctx.quadraticCurveTo(0,-127,159,0);ctx.quadraticCurveTo(0,127,-159,0);ctx.fill();ctx.fillStyle='#090d0b';ctx.beginPath();ctx.moveTo(-9,-61);ctx.quadraticCurveTo(11,0,3,63);ctx.lineTo(13,60);ctx.quadraticCurveTo(22,0,2,-65);ctx.closePath();ctx.fill();ctx.fillStyle='#d0e96c';ctx.beginPath();ctx.ellipse(-86,-16,19,8,-.35,0,Math.PI*2);ctx.fill();ctx.restore();}
export function hydraRoofTexture(side:number){return texture((ctx,w,h)=>{ctx.fillStyle='#1b1029';ctx.fillRect(0,0,w,h);ctx.lineWidth=3;for(let row=0;row<14;row++)for(let col=-1;col<12;col++){const x=col*102+(row%2)*51,y=row*77;ctx.fillStyle=(row+col)%3?'#231136':'#2c1745';ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+51,y-25);ctx.lineTo(x+102,y);ctx.lineTo(x+51,y+64);ctx.closePath();ctx.fill();ctx.strokeStyle='#3b2355';ctx.stroke();}eye(ctx,side<0?290:734,680,1.25,side*.12);eye(ctx,side<0?643:381,255,.59,-side*.17);ctx.fillStyle='#c44e49';ctx.beginPath();ctx.moveTo(0,880);for(let i=0;i<=12;i++)ctx.lineTo(i*w/12,880+(i%2?35:-15));ctx.lineTo(w,h);ctx.lineTo(0,h);ctx.closePath();ctx.fill();ctx.fillStyle='#16121f';for(let i=0;i<18;i++){const x=i*w/17;ctx.beginPath();ctx.moveTo(x-20,885);ctx.lineTo(x+10,976);ctx.lineTo(x+45,882);ctx.closePath();ctx.fill();}scratches(ctx,w,h,108+side,100);});}
export function hydraSideTexture(c:BotConfig){return texture((ctx,w,h)=>{ctx.fillStyle='#20152f';ctx.fillRect(0,0,w,h);ctx.strokeStyle='#3c2a52';ctx.lineWidth=3;for(let x=-h;x<w+h;x+=42){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x+h,h);ctx.stroke();ctx.beginPath();ctx.moveTo(x,h);ctx.lineTo(x+h,0);ctx.stroke();}ctx.save();ctx.translate(w*.53,h*.44);ctx.rotate(-.11);ctx.fillStyle='#e9e8df';ctx.textAlign='center';ctx.font='italic 900 120px Arial';ctx.fillText(c.identity.name.toUpperCase(),0,0,700);ctx.lineWidth=10;ctx.strokeStyle='#dddcd3';ctx.beginPath();ctx.moveTo(-220,31);ctx.bezierCurveTo(-25,54,139,14,236,-11);ctx.stroke();ctx.font='700 25px Arial';ctx.fillStyle='#ddd5ba';ctx.fillText('TEAM WHYACHI',18,90);ctx.restore();ctx.fillStyle='#d8c32f';ctx.font='italic 900 59px Arial';ctx.fillText('TKO',w*.79,h*.34);ctx.font='700 17px Arial';ctx.fillText('SPONSOR',w*.795,h*.43);scratches(ctx,w,h,52,190);},1024,384);}
export function hydraTineGeometry(c:BotConfig,side:number){
 const points=hydraTineSamples(c,side),positions:number[]=[],indices:number[]=[];
 for(let i=0;i<points.length;i++){const p=points[i],r=Math.min(.0015,p.thickness*.32),half=Math.min(p.half,points[Math.min(i+1,24)].half),y=p.y,z=p.z;
  for(const[x,yy]of[[-half+r,y],[half-r,y],[half,y-r],[half,y-p.thickness+r],[half-r,y-p.thickness],[-half+r,y-p.thickness],[-half,y-p.thickness+r],[-half,y-r]])positions.push(x,yy,z);
  if(i<24)for(let j=0;j<8;j++){const a=i*8+j,b=i*8+(j+1)%8,d=a+8,e=b+8;indices.push(a,b,e,a,e,d);}
 }
 for(let j=1;j<7;j++){indices.push(0,j+1,j);indices.push(192,192+j,192+j+1);}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();const smooth=toCreasedNormals(g,Math.PI/5);if(smooth!==g)g.dispose();smooth.userData.hydraTine=true;return smooth;
}
export function hydraDetail(mesh:THREE.Mesh,p:Part,c:BotConfig){
 if(c.chassis.profile!=='hydra'||p.body.startsWith('wheel_'))return false;
 const m=mesh.material as THREE.MeshPhysicalMaterial,id=p.id,sx=c.chassis.width/.58,sy=(c.chassis.height+c.chassis.clearance)/.100;
 m.color.set(id.startsWith('flipper_tine_')?'#73634f':id.startsWith('flipper_fang_')?c.identity.secondary:id.startsWith('hydra_cap_')?'#a22934':/^(hydra_(rail|bridge|neck|cylinder|piston|axle|hinge))/.test(id)?'#b5b8ae':id==='floor'?'#101016':c.identity.primary);
 m.metalness=id.startsWith('flipper_tine_')?.78:id.startsWith('flipper_fang_')?.12:id.startsWith('hydra_')&&!id.startsWith('hydra_wall_')?.94:.18;m.roughness=id.startsWith('flipper_fang_')?.31:id.startsWith('flipper_tine_')?.58:.57;m.clearcoat=id.startsWith('flipper_fang_')?.5:.13;
 const roof=/^(armour_top|lid)_(-1|1)$/.exec(id),hasTop=c.armour.some(a=>a.mount==='top'&&a.thickness>0),pos=mesh.geometry.getAttribute('position');
 if(roof&&(id.startsWith('armour_top')||!hasTop)){
  const side=Number(roof[2]),uv=new THREE.Float32BufferAttribute(new Float32Array(pos.count*2),2);mesh.geometry.computeBoundingBox();const bounds=mesh.geometry.boundingBox!,size=bounds.getSize(new THREE.Vector3());for(let i=0;i<pos.count;i++){const x=(pos.getX(i)-bounds.min.x)/size.x,z=(pos.getZ(i)-bounds.min.z)/size.z;uv.setXY(i,side<0?1-x:x,z);}mesh.geometry.setAttribute('uv',uv);m.map=hydraRoofTexture(side);m.color.set('#a8a8a8');m.roughness=.72;m.metalness=.025;m.envMapIntensity=.14;mesh.name='hydra-flat-snake-roof';mesh.userData.referencePaint=true;
 }
 if(/^(armour_(left|right)_|hydra_wall_)/.test(id)){
  const uv=new THREE.Float32BufferAttribute(new Float32Array(pos.count*2),2);for(let i=0;i<pos.count;i++)uv.setXY(i,(pos.getZ(i)+c.chassis.length/2)/c.chassis.length,(pos.getY(i)+c.chassis.height/2)/c.chassis.height);mesh.geometry.setAttribute('uv',uv);m.map=hydraSideTexture(c);m.color.set('#d6d6d6');m.metalness=.10;m.roughness=.62;m.envMapIntensity=.24;
 }
 const chrome=new THREE.MeshStandardMaterial({color:'#b5b8ae',metalness:.94,roughness:.22});let used=false;
 const bolt=(x:number,y:number,z:number)=>{const child=new THREE.Mesh(new THREE.CylinderGeometry(.0025*sx,.0025*sx,.003*sy,6),chrome);child.position.set(x,y,z);mesh.add(child);used=true;};
 if(roof)for(const z of[-.211,-.097,.025,.120]){const q=hydraPoint(c,Number(roof[2])*.273,.103,z);bolt(q.x-p.position.x,q.y-p.position.y,q.z-p.position.z);}
 if(id===(hasTop?'armour_top_rear':'lid_rear'))for(const side of[-1,1]){
  const q=hydraPoint(c,side*.181,.104,.244),hatch=new THREE.Mesh(new RoundedBoxGeometry(.128*sx,.004*sy,.092*c.chassis.length/.64,2,.009),new THREE.MeshStandardMaterial({color:c.identity.primary,roughness:.57,metalness:.22}));hatch.position.set(q.x-p.position.x,q.y-p.position.y,q.z-p.position.z);hatch.name='hydra-rear-access-hatch';mesh.add(hatch);for(const x of[-.048,.048])for(const z of[-.027,.027])bolt(hatch.position.x+x*sx,hatch.position.y+.004*sy,hatch.position.z+z*c.chassis.length/.64);
 }
 if(id==='hydra_cylinder'){
  const map=texture((ctx)=>{ctx.fillStyle='#141515';ctx.fillRect(0,0,512,128);ctx.fillStyle='#dad4c5';ctx.textAlign='center';ctx.font='700 25px Arial';ctx.fillText('HYDRA ACTUATOR',256,57);ctx.font='18px Arial';ctx.fillText('PRESSURE SYSTEM',256,91);},512,128),band=new THREE.Mesh(new THREE.CylinderGeometry(.0247*sx,.0247*sx,.078,24,1,true),new THREE.MeshStandardMaterial({map,color:'#ffffff',metalness:.1,roughness:.64}));band.name='hydra-actuator-label';mesh.add(band);
 }
 if(!used)chrome.dispose();mesh.userData.baseColor=m.color.getHex();mesh.userData.baseRoughness=m.roughness;return true;
}
