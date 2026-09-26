import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import * as THREE from 'three';
import {ArenaRenderer} from '../src/render';
import {hugeWheelGeometry} from '../src/finish-geometry';
import {ROSTER,preset,compile,identity,v,SLOTS} from '../src/model';

// Verify the real scene graph and paint commands, without substituting a WebGL
// renderer. Reference photos and CPU geometry previews are reviewed separately.
const labels:string[]=[];
const context=new Proxy({}, {get:(_,name)=>name==='fillText'?(value:string)=>labels.push(value):()=>{}});
Object.assign(globalThis,{document:{createElement:()=>({width:1,height:1,getContext:()=>context})}});
const results:any[]=[];
async function test(name:string,fn:()=>unknown){try{const detail=await fn();results.push({name,status:'passed',detail});console.log('PASS',name);}catch(error){results.push({name,status:'failed',error:String(error)});console.log('FAIL',name,String(error));}writeFileSync('docs/model-refinement-results.json',JSON.stringify(results,null,2));}
function renderer(){const r=Object.create(ArenaRenderer.prototype) as ArenaRenderer;Object.assign(r,{preview:new THREE.Group(),time:0,bots:new THREE.Group(),bodyGroups:new Map(),replayRoot:new THREE.Group(),replayGroups:new Map(),replay:false,reduced:false});return r;}

await test('All eleven refined models have finite paint UVs, stay below 60k triangles, and use less geometry memory',()=>{
 const before=[941660,1353708,1088964,1216308,3168876,1353420,1181716,2303744,1458020,1325704,4326780],r=renderer(),counts:any[]=[];let bytes=0;
 for(let i=0;i<ROSTER.length;i++){
  r.showBuilder(preset(i));const root=r.preview.children[0];root.remove(root.children.at(-1)!);root.getObjectByName('front-direction')?.removeFromParent();root.getObjectByName('battery-outlines')?.removeFromParent();let triangles=0,geometryBytes=0,meshes=0;const geometries=new Set<THREE.BufferGeometry>();
  root.traverse(o=>{if(!(o instanceof THREE.Mesh))return;meshes++;const g=o.geometry,p=g.getAttribute('position'),m=o.material as THREE.MeshStandardMaterial;geometries.add(g);triangles+=(g.index?.count??p.count)/3;for(const a of Object.values(g.attributes))assert([...a.array].every(Number.isFinite),ROSTER[i].name+' finite attributes');if(m.map){const uv=g.getAttribute('uv');assert(uv&&uv.count===p.count,'Paint requires complete UVs');}if(g.index)assert([...g.index.array].every(index=>index<p.count));});
  for(const g of geometries){for(const a of Object.values(g.attributes))geometryBytes+=a.array.byteLength;geometryBytes+=g.index?.array.byteLength??0;}assert(triangles+17<60000,ROSTER[i].name+' triangle budget');assert(geometryBytes<before[i],ROSTER[i].name+' geometry memory');bytes+=geometryBytes;counts.push({name:ROSTER[i].name,triangles,meshes,geometryBytes});r.clear(r.preview);
 }
 const baseline=before.reduce((a,b)=>a+b,0);assert(bytes<baseline*.75);return{counts,geometryBytesBefore:baseline,geometryBytesAfter:bytes,reductionPercent:(1-bytes/baseline)*100,actualWebGL:'not measured'};
});

await test('HUGE has five real rounded openings, solid spokes, and unchanged wheel bounds',()=>{
 const c=preset(7),g=hugeWheelGeometry(c.drive.radius,c.drive.width),mesh=new THREE.Mesh(g,new THREE.MeshBasicMaterial({side:THREE.DoubleSide})),ray=new THREE.Raycaster();mesh.updateMatrixWorld();
 const hits=(angle:number,radius:number)=>{ray.set(new THREE.Vector3(1,Math.sin(angle)*radius,-Math.cos(angle)*radius),new THREE.Vector3(-1,0,0));return ray.intersectObject(mesh).length;};
 for(let i=0;i<5;i++){const a=Math.PI+i*Math.PI*2/5;assert.equal(hits(a+Math.PI/5,c.drive.radius*.55),0,'An opening must be empty');assert(hits(a,c.drive.radius*.55)>0,'A spoke must join the centre to the rim');}
 g.computeBoundingBox();const bounds=g.boundingBox!;assert(bounds.max.x<=c.drive.width/2+1e-6&&bounds.min.x>=-c.drive.width/2-1e-6);assert(Math.max(Math.abs(bounds.min.y),bounds.max.y,Math.abs(bounds.min.z),bounds.max.z)<c.drive.radius);g.dispose();mesh.material.dispose();return{openings:5,solidSpokes:5,physicalRadius:c.drive.radius};
});

await test('ICEwave hood tapers inside its collider, has outward normals, and retains blue/gold vertex paint',()=>{
 const c=preset(3),p=compile(c).parts.find(p=>p.id==='engine_cowl')!,r=renderer(),mesh=r.part(p,c),g=mesh.geometry,positions=g.getAttribute('position'),normals=g.getAttribute('normal'),colors=g.getAttribute('color');assert(colors);assert((mesh.material as THREE.MeshStandardMaterial).vertexColors);
 let topRadius=0,lowerRadius=0,topNormals=0;
 for(let i=0;i<positions.count;i++){const y=positions.getY(i),radius=Math.max(Math.abs(positions.getX(i)),Math.abs(positions.getZ(i)));assert(y>=-1e-6&&y<=.180001&&radius<=.170001);if(y>.179){topRadius=Math.max(topRadius,radius);if(normals.getY(i)>.9)topNormals++;assert(colors.getX(i)>colors.getZ(i),'Gold roof');}if(y<.01)lowerRadius=Math.max(lowerRadius,radius);}
 assert(topRadius<lowerRadius*.9);assert(topNormals>0);r.disposeObject(mesh);return{topRadius,lowerRadius,originalWidth:.34,originalHeight:.18};
});

await test('HyperShock rims face outward on both sides and batched tire lettering keeps its UVs',()=>{
 const c=preset(4),r=renderer(),parts=compile(c).parts;
 for(const p of parts.filter(p=>/^wheel_-?1_\d+_hub$/.test(p.id))){const mesh=r.part(p,c),rim=mesh.getObjectByName('hypershock-deep-dish-wheel') as THREE.Mesh,n=rim.geometry.getAttribute('normal'),side=p.position.x<0?1:-1;let outward=0;for(let j=0;j<n.count;j++)outward+=n.getY(j)*side;assert(outward/n.count>.2);r.disposeObject(mesh);}
 const displayed=r.displayParts(c,parts),painted=displayed.filter(({p,mesh})=>p.body.startsWith('wheel_')&&(mesh.material as THREE.MeshStandardMaterial).map);assert.equal(painted.length,4);for(const{mesh}of painted){const uv=mesh.geometry.getAttribute('uv');assert([...uv.array].every(x=>x>=-.01&&x<=1.01));}for(const{mesh}of displayed)r.disposeObject(mesh);return{outwardRims:4,letteredWheels:painted.length};
});

await test('Direct plate paint follows damage and replay without leaking or disposing live textures',()=>{
 const r=renderer();let cycles=0,textures=0;
 for(let i=0;i<ROSTER.length;i++){
  const c=preset(i),body=new THREE.Group(),maps=new Set<THREE.Texture>();for(const {mesh}of r.displayParts(c,compile(c).parts))body.add(mesh);r.bots.add(body);r.bodyGroups.set('b0:chassis',body);
  let disposed=0;body.traverse(o=>{if(o instanceof THREE.Mesh){const m=o.material as THREE.MeshStandardMaterial;if(m.map)maps.add(m.map);if(o.userData.referencePaint){assert.equal(o.userData.baseColor,0xffffff);r.applyHealth(o,.45);assert(m.color.r<1);r.applyHealth(o,1);assert.equal(m.color.getHex(),0xffffff);}}});for(const map of maps)map.addEventListener('dispose',()=>disposed++);
  for(let n=0;n<3;n++){r.startReplay();r.replayFrame({tick:0,transforms:[{id:'b0:chassis',p:v(),q:identity}],health:[SLOTS.map(()=>1),SLOTS.map(()=>1)],effects:[]});r.endReplay();assert.equal(disposed,0);cycles++;}
  r.clear(r.bots);assert(disposed>=maps.size);textures+=maps.size;r.bodyGroups.clear();
 }
 return{models:11,replayCycles:cycles,texturesReleased:textures};
});

await test('Custom builder names still reach top and side artwork',()=>{
 labels.length=0;const r=renderer();for(let i=0;i<ROSTER.length;i++){const c=preset(i);c.identity.name='Custom Robot '+i;r.showBuilder(c);assert(labels.some(label=>label.toUpperCase()===c.identity.name.toUpperCase()),c.chassis.profile);r.clear(r.preview);}return{customNames:11};
});
if(results.some(r=>r.status==='failed'))process.exitCode=1;
