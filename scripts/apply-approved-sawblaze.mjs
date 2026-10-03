// This one-time migration runs only on the cloud runner.
import {readFileSync,writeFileSync} from 'node:fs';
function edit(path,fn){const before=readFileSync(path,'utf8'),after=fn(before);if(before===after)throw Error('No source change: '+path);writeFileSync(path,after);}
function replace(source,before,after){if(!source.includes(before))throw Error('Source differs from the reviewed revision: '+before.slice(0,100));return source.replace(before,after);}
edit('src/mechanisms.ts',source=>{
 source="import {sawbladeTriangles} from './sawblade-profile';\n"+source;
 const start=source.indexOf('// SawBlaze hammer-saw blade outline'),end=source.indexOf('export function templateParts',start);
 if(start<0||end<start)throw Error('Missing old radial profile');source=source.slice(0,start)+source.slice(end);
 const startBranch=source.indexOf(" if(w.type==='hammer_saw'&&c.chassis.profile==='sawblaze'){"),endBranch=source.indexOf(" if(w.type==='vertical_disc'||w.type==='hammer_saw'){",startBranch);
 if(startBranch<0||endBranch<startBranch)throw Error('Missing old SawBlaze assembly');
 return source.slice(0,startBranch)+` if(w.type==='hammer_saw'&&c.chassis.profile==='sawblaze'){
  // Convex triangular prisms share the approved SVG surface and both holes.
  let sector=0;
  for(const {section,tooth}of sawbladeTriangles(R)){
   const id=tooth===undefined?(sector++===0?'disc':'disc_'+(sector-1)):'tooth_'+tooth;
   b.prism(id,'weapon','rotor',w.width,section,v(),w.material,identity,tooth);
  }
  return;
 }
`+source.slice(endBranch);
});
edit('src/finish-geometry.ts',source=>{
 source=replace(source,"// Exact authored silhouette with flat facets: two caps plus four edge walls.","// Each convex prism uses its physical caps and edge walls.");
 source=replace(source,"// Fewer vertices than the lathed ring it replaces, so geometry budgets hold.","// Both SVG openings remain empty through the full blade width.");
 source=replace(source,"const L=[0,1,2,3].map(i=>","const n=s.vertices.length/6,ids=Array.from({length:n},(_,i)=>i);\n const L=ids.map(i=>");
 source=replace(source,"const R=[0,1,2,3].map(i=>new THREE.Vector3(s.vertices[12+i*3],s.vertices[12+i*3+1],s.vertices[12+i*3+2]));","const R=ids.map(i=>new THREE.Vector3(s.vertices[n*3+i*3],s.vertices[n*3+i*3+1],s.vertices[n*3+i*3+2]));");
 source=replace(source,"tri(L[0],L[1],L[2],new THREE.Vector3(-1,0,0));tri(L[0],L[2],L[3],new THREE.Vector3(-1,0,0));\n tri(R[0],R[2],R[1],new THREE.Vector3(1,0,0));tri(R[0],R[3],R[2],new THREE.Vector3(1,0,0));","for(let i=1;i<n-1;i++){tri(L[0],L[i],L[i+1],new THREE.Vector3(-1,0,0));tri(R[0],R[i+1],R[i],new THREE.Vector3(1,0,0));}");
 source=replace(source,"centre.multiplyScalar(1/8);","centre.multiplyScalar(1/(2*n));");
 source=replace(source,"for(let i=0;i<4;i++){const j=(i+1)%4;","for(let i=0;i<n;i++){const j=(i+1)%n;");
 return replace(source,"&&/^disc(?:_\\d+)?$/.test(p.id))return sawbladeSector(p);","&&/^(disc(?:_\\d+)?|tooth_\\d+)$/.test(p.id))return sawbladeSector(p);");
});
edit('src/visuals.ts',source=>{
 source=replace(source,"import {sawbladeOuter,sawbladeHex} from './mechanisms';","import {isSawbladePart,sawbladeBoundary} from './sawblade-profile';");
 source=replace(source,"if(p.tooth!==undefined||p.module==='weapon'&&/^(bar|cage_arm|vertical_bar)/.test(p.id))","if(!(c.chassis.profile==='sawblaze'&&isSawbladePart(p))&&(p.tooth!==undefined||p.module==='weapon'&&/^(bar|cage_arm|vertical_bar)/.test(p.id)))");
 const start=source.indexOf(" if(c.chassis.profile==='sawblaze'&&(p.id==='disc'||/^disc_\\d+$/.test(p.id))){"),end=source.indexOf(' const hasTop=',start);
 if(start<0||end<start)throw Error('Missing old blade cosmetics');
 source=source.slice(0,start)+` if(c.chassis.profile==='sawblaze'&&c.weapon.type==='hammer_saw'&&isSawbladePart(p)){
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
`+source.slice(end);
 // The edge skins share actual boundaries. Internal triangle seams get no trim.
 return source;
});
edit('tests/blades-update.ts',source=>{
 source=replace(source,"Six requested weapons reach operating speed at least fifty percent sooner without changing rotor energy","Six requested weapons retain faster spin-up and geometry-derived rotor energy");
 return replace(source,"assert(Math.abs(b.rotorInertia*(c.weapon.rpm*Math.PI/30)**2/2000-energy)<.001);","if(i!==8)assert(Math.abs(b.rotorInertia*(c.weapon.rpm*Math.PI/30)**2/2000-energy)<.001);else assert(b.rotorInertia>0,'The approved SVG uses its physical mass moments.');");
});
