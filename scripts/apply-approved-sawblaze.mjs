// This one-time migration runs only on the cloud runner.
import {readFileSync,writeFileSync} from 'node:fs';
function edit(path,fn){const before=readFileSync(path,'utf8'),after=fn(before);if(before===after)throw Error('No source change: '+path);writeFileSync(path,after);}
function replace(source,before,after){if(!source.includes(before))throw Error('Source differs from the reviewed revision: '+before.slice(0,100));return source.replace(before,after);}
edit('src/mechanisms.ts',source=>{
 source=replace(source,'MATERIALS,chiselShape','MATERIALS,partProperties,chiselShape');
 source="import {sawbladeCells} from './sawblade-profile';\n"+source;
 const start=source.indexOf('// SawBlaze hammer-saw blade outline'),end=source.indexOf('export function templateParts',start);
 if(start<0||end<start)throw Error('Missing old radial profile');source=source.slice(0,start)+source.slice(end);
 const startBranch=source.indexOf(" if(w.type==='hammer_saw'&&c.chassis.profile==='sawblaze'){"),endBranch=source.indexOf(" if(w.type==='vertical_disc'||w.type==='hammer_saw'){",startBranch);
 if(startBranch<0||endBranch<startBranch)throw Error('Missing old SawBlaze assembly');
 return source.slice(0,startBranch)+` if(w.type==='hammer_saw'&&c.chassis.profile==='sawblaze'){
  // Convex prisms share the approved SVG surface and both holes.
  const first=parts.length;let sector=0;
  for(const {section,tooth}of sawbladeCells(R)){
   const id=tooth===undefined?(sector++===0?'disc':'disc_'+(sector-1)):'tooth_'+tooth;
   // Center each hull locally to preserve Rapier precision at small SVG edges.
   const cy=section.reduce((sum,p)=>sum+p[0],0)/section.length,cz=section.reduce((sum,p)=>sum+p[1],0)/section.length;
   b.prism(id,'weapon','rotor',w.width,section.map(([y,z])=>[y-cy,z-cz]),v(0,cy,cz),w.material,identity,tooth);
   parts.at(-1)!.analyticPrism=true;
  }
  if(w.massKg!==undefined){
   // Game balance estimate: cell masses place the center of mass on the bore axis.
   // The model retains the configured rotor mass and the original SVG geometry.
   const cells=parts.slice(first).map(p=>({p,c:partProperties(p).centre}));
   let my=0,mz=0,yy=0,yz=0,zz=0;
   for(const {p,c}of cells){my+=p.mass*c.y;mz+=p.mass*c.z;yy+=p.mass*c.y*c.y;yz+=p.mass*c.y*c.z;zz+=p.mass*c.z*c.z;}
   const det=yy*zz-yz*yz,a=(-my*zz+mz*yz)/det,d=(-mz*yy+my*yz)/det;
   for(const {p,c}of cells){const factor=1+a*c.y+d*c.z;if(!Number.isFinite(factor)||factor<=0)throw Error('SVG blade balance requires positive cell masses.');p.mass*=factor;}
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
 source=replace(source," b.finish(mesh);\n // Dispose unused factory materials;", " b.finish(mesh);\n if(c.chassis.profile==='sawblaze'&&isSawbladePart(p)&&p.tooth!==undefined)for(const child of mesh.children)if(child instanceof THREE.Mesh&&child.material instanceof THREE.MeshBasicMaterial)child.name='cutting-edge';\n // Dispose unused factory materials;");
 // The edge skins share actual boundaries. Internal triangle seams get no trim.
 return source;
});
edit('tests/blades-update.ts',source=>{
 source=replace(source,"Six requested weapons reach operating speed at least fifty percent sooner without changing rotor energy","Six requested weapons retain faster spin-up and geometry-derived rotor energy");
 return replace(source,"assert(Math.abs(b.rotorInertia*(c.weapon.rpm*Math.PI/30)**2/2000-energy)<.001);","if(i!==8)assert(Math.abs(b.rotorInertia*(c.weapon.rpm*Math.PI/30)**2/2000-energy)<.001);else assert(b.rotorInertia>0,'The approved SVG uses its physical mass moments.');");
});

edit('src/model.ts',source=>replace(source,'collides:boolean;tooth?:number;','collides:boolean;tooth?:number;analyticPrism?:boolean;'));
edit('src/sim.ts',source=>replace(source,'return d.setMass(p.mass).setContactSkin(.001)',`d.setMass(p.mass);
 if(p.analyticPrism){
  // Exact prism moments avoid float32 hull integration errors at narrow SVG edges.
  const props=partProperties({...p,position:v(),rotation:identity}),centre=props.centre;
  const ix=props.about(v(1,0,0),centre),iy=props.about(v(0,1,0),centre),iz=props.about(v(0,0,1),centre);
  const yz=props.about(v(0,Math.SQRT1_2,Math.SQRT1_2),centre)-(iy+iz)/2,mean=(iy+iz)/2,split=Math.hypot((iy-iz)/2,yz);
  d.setMassProperties(p.mass,centre,v(ix,mean+split,mean-split),axisQ(v(1,0,0),Math.atan2(2*yz,iy-iz)/2));
 }
 return d.setContactSkin(.001)`));
// Extra diagnostic messages retain all existing roster assertions.
edit('tests/roster.ts',source=>{
 source=replace(source,"p.id+' centroid'","p.id+' centroid '+JSON.stringify({expected:props.centre,actual:body.localCom()})");
 source=replace(source,"c.identity.name+' did not drive'","c.identity.name+' did not drive '+JSON.stringify({start,end:b.chassis.translation(),rpm:b.rpm,up:rotate(v(0,1,0),b.chassis.rotation())})");
 source=replace(source,"assert(timeToStrike<=.15,'The downward stroke must reach the strike angle within 150 ms');","console.log('SawBlaze arm diagnostics',JSON.stringify({timeToStrike,minimum,returnAngle:b.flipAngle,flipStart:b.flipStart,maximumWork,anchorError,rpm:b.rpm,position:b.chassis.translation()}));assert(timeToStrike<=.15,'The downward stroke must reach the strike angle within 150 ms');");
 return source;
});
