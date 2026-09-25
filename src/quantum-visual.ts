import * as THREE from 'three';
import {TessellateModifier} from 'three/addons/modifiers/TessellateModifier.js';
import {type BotConfig} from './model';

function casting(shape:THREE.Shape,depth:number){
 const flat=new THREE.ExtrudeGeometry(shape,{depth,steps:1,curveSegments:24,bevelEnabled:true,bevelThickness:.0025,bevelSize:.003,bevelSegments:3});
 const curved=new TessellateModifier(.032,3).modify(flat);flat.dispose();return curved;
}
function opening(shape:THREE.Shape,x:number,y:number,rx:number,ry:number,rotation=0){
 const hole=new THREE.Path();hole.absellipse(x,y,rx,ry,0,Math.PI*2,true,rotation);shape.holes.push(hole);
}
function smoothCasting(g:THREE.BufferGeometry){
 g.computeVertexNormals();const p=g.getAttribute('position'),n=g.getAttribute('normal'),averages=new Map<string,THREE.Vector3>();
 const key=(i:number)=>[p.getX(i),p.getY(i),p.getZ(i)].map(x=>Math.round(x*1e5)).join('/');
 for(let i=0;i<p.count;i++){const k=key(i),normal=averages.get(k)??new THREE.Vector3();normal.add(new THREE.Vector3(n.getX(i),n.getY(i),n.getZ(i)));averages.set(k,normal);}
 for(const normal of averages.values())normal.normalize();
 for(let i=0;i<p.count;i++){const normal=averages.get(key(i))!;n.setXYZ(i,normal.x,normal.y,normal.z);}
}
export function quantumFang(c:BotConfig,side:number){
 if(c.weapon.type!=='crusher')throw Error('A crusher is required');
 const scale=c.weapon.length/.66,shape=new THREE.Shape();
 shape.moveTo(.565,.38);shape.quadraticCurveTo(.62,.37,.645,.34);shape.quadraticCurveTo(.66,.27,.661,.179);shape.quadraticCurveTo(.612,.233,.595,.25);shape.quadraticCurveTo(.571,.29,.565,.38);
 const g=casting(shape,.018),p=g.getAttribute('position');
 for(let i=0;i<p.count;i++)p.setXYZ(i,p.getZ(i)-.009,p.getY(i)*scale,-p.getX(i)*scale);smoothCasting(g);
 const mesh=new THREE.Mesh(g,new THREE.MeshPhysicalMaterial({color:0x262d35,metalness:.94,roughness:.22,clearcoat:.5}));mesh.name='quantum-piercing-fang';mesh.position.x=side*c.weapon.width*.26;mesh.castShadow=mesh.receiveShadow=true;return mesh;
}
// The curved cast skin follows the existing jaw collision ribs. Holes remain
// open geometry, rather than dark circles painted onto a solid head.
export function quantumHead(c:BotConfig){
 if(c.weapon.type!=='crusher')throw Error('A crusher is required');
 const w=c.weapon,scale=w.length/.66,half=w.width*.43;
 const metal=new THREE.MeshPhysicalMaterial({color:0xe4e9ed,metalness:.98,roughness:.16,clearcoat:.65,clearcoatRoughness:.12,side:THREE.DoubleSide});
 const side=new THREE.Shape();side.moveTo(-.012,-.012);side.bezierCurveTo(.03,.12,.055,.205,.16,.30);side.bezierCurveTo(.27,.399,.43,.439,.54,.40);side.bezierCurveTo(.59,.385,.63,.356,.645,.322);side.lineTo(.595,.287);side.bezierCurveTo(.50,.303,.41,.28,.33,.23);side.bezierCurveTo(.20,.15,.12,.023,.075,-.018);side.closePath();
 opening(side,.167,.252,.065,.036,.8);opening(side,.342,.346,.083,.026,.22);opening(side,.534,.351,.039,.020,-.2);
 const cheek=casting(side,w.thickness*.82),pos=cheek.getAttribute('position');
 for(let i=0;i<pos.count;i++){
  const f=pos.getX(i),y=pos.getY(i),x=pos.getZ(i)-w.thickness*.41;
  // A rounded cast neck grows into a broad skull. Subdivided faces follow
  // this curvature, including the edges around the real openings.
  const breadth=half*(.66+.34*Math.sin(Math.min(1,Math.max(0,f/.56))*Math.PI/2));
  const sculpt=.010*Math.sin(f*21)*Math.sin(y*26)+.013*Math.sin(Math.max(0,y)*Math.PI/.44);
  pos.setXYZ(i,x+half-breadth-sculpt,y*scale,-f*scale);
 }smoothCasting(cheek);
 const head=new THREE.Mesh(cheek,metal);head.name='quantum-cast-skull';head.position.x=-half;
 const opposite=new THREE.Mesh(cheek.clone().scale(-1,1,1).translate(half*2,0,0),metal.clone());opposite.name='quantum-right-cheek';head.add(opposite);
 const roof=new THREE.Shape();roof.moveTo(-half*.62,.10);roof.bezierCurveTo(-half*1.08,.21,-half*1.1,.40,-half*.85,.55);roof.quadraticCurveTo(-half*.65,.64,0,.643);roof.quadraticCurveTo(half*.65,.64,half*.85,.55);roof.bezierCurveTo(half*1.1,.40,half*1.08,.21,half*.62,.10);roof.closePath();
 for(const x of[-half*.44,half*.44])opening(roof,x,.325,half*.24,.082,x<0?-.12:.12);
 opening(roof,0,.535,half*.30,.041);
 const cap=casting(roof,.007),cp=cap.getAttribute('position');
 const height=(f:number)=>f<.36?.23+.18*Math.sin(Math.max(0,(f-.10)/.26)*Math.PI/2):.41-.08*((f-.36)/.285)**2;
 for(let i=0;i<cp.count;i++){const x=cp.getX(i),f=cp.getY(i),depth=cp.getZ(i);cp.setXYZ(i,x+half,(height(f)+.030*(1-(x/half)**2)+.006*Math.cos(f*32)*Math.sin(x/half*Math.PI)**2+depth)*scale,-f*scale);}smoothCasting(cap);
 const crown=new THREE.Mesh(cap,metal.clone());crown.name='quantum-crown-openings';head.add(crown);
 const browPoints=[[-.86,.345,.591],[-.55,.369,.623],[0,.379,.640],[.55,.369,.623],[.86,.345,.591]].map(([x,y,f])=>new THREE.Vector3(half+x*half,y*scale,-f*scale));
 const brow=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(browPoints),32,.009,8,false),metal.clone());brow.name='quantum-sculpted-brow';head.add(brow);
 // Four smaller teeth sit behind the two physical piercing fangs.
 for(const side of[-1,1])for(let i=0;i<2;i++){
  const f=.50-i*.08,y=height(f)-.085,tooth=new THREE.Shape();tooth.moveTo(f-.018,y+.026);tooth.lineTo(f+.018,y+.022);tooth.quadraticCurveTo(f+.026,y-.015,f+.028,y-.069+i*.012);tooth.quadraticCurveTo(f-.010,y-.030,f-.018,y+.026);
  const g=casting(tooth,.010),p=g.getAttribute('position');for(let j=0;j<p.count;j++)p.setXYZ(j,p.getZ(j)+half+side*half*.86,p.getY(j)*scale,-p.getX(j)*scale);g.computeVertexNormals();const fang=new THREE.Mesh(g,metal.clone());fang.name='quantum-inner-fang';head.add(fang);
 }
 head.traverse(o=>{if(o instanceof THREE.Mesh){o.castShadow=true;o.receiveShadow=true;}});return head;
}

export function quantumScoop(c:BotConfig){
 const width=c.chassis.width+.08,floor=-c.chassis.height/2-c.chassis.clearance,run=.68-c.chassis.length/2+.035;
 const positions:number[]=[],indices:number[]=[],cols=24,rows=40;
 for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++){
  const t=j/rows,u=i/cols*2-1;
  positions.push(u*width/2,floor+.006+.126*t*t+.003*u*u*Math.sin(Math.PI*t),-.68+run*t);
 }
 for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){const a=j*(cols+1)+i,b=a+cols+1;indices.push(a,b,a+1,a+1,b,b+1);}
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setIndex(indices);geometry.computeVertexNormals();
 const mesh=new THREE.Mesh(geometry,new THREE.MeshPhysicalMaterial({color:0xc9d3dc,metalness:.94,roughness:.24,clearcoat:.45,side:THREE.DoubleSide}));mesh.name='quantum-curved-front-scoop';mesh.castShadow=mesh.receiveShadow=true;return mesh;
}

export function quantumShoulder(c:BotConfig,side:number){
 const floor=-c.chassis.height/2-c.chassis.clearance,top=c.chassis.height/2,shape=new THREE.Shape();
 shape.moveTo(.56,floor+.012);shape.bezierCurveTo(.39,floor+.025,.26,top+.10,.17,top+.20);shape.quadraticCurveTo(.06,top+.19,-.12,top+.18);shape.quadraticCurveTo(-.22,top+.08,-.23,floor+.018);shape.quadraticCurveTo(.24,floor+.006,.56,floor+.012);shape.closePath();
 const g=casting(shape,.009),p=g.getAttribute('position');for(let i=0;i<p.count;i++)p.setXYZ(i,side*c.chassis.width*.40+p.getZ(i)-.0045,p.getY(i),-p.getX(i));smoothCasting(g);
 const mesh=new THREE.Mesh(g,new THREE.MeshPhysicalMaterial({color:0x242d37,metalness:.85,roughness:.30,clearcoat:.3}));mesh.name='quantum-swept-cheek';mesh.castShadow=mesh.receiveShadow=true;return mesh;
}
