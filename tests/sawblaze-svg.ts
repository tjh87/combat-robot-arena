import assert from 'node:assert/strict';
import * as THREE from 'three';
import {preset,compile,MATERIALS,partProperties,v,canonical,encodeBuild,decodeBuild} from '../src/model';
import {sawbladeContours,isSawbladePart} from '../src/sawblade-profile';
import {initializePhysics,RAPIER,colliderDesc,Simulation,neutral} from '../src/sim';
import {ArenaRenderer} from '../src/render';

const config=preset(8),w=config.weapon;assert(w.type==='hammer_saw');
const compiled=compile(config),blade=compiled.parts.filter(isSawbladePart),contours=sawbladeContours(w.radius);
assert.deepEqual(compiled.errors,[]);
assert.equal(canonical(decodeBuild(encodeBuild(config))),canonical(config));
assert.equal(blade.filter(p=>p.tooth!==undefined).length,4);
assert(!compiled.parts.some(p=>p.id==='disc_hub'||p.id.startsWith('disc_spoke_')));
assert.equal(contours[0].length,103);
assert.equal(contours.length,3);
assert(Math.abs(Math.max(...contours[0].map(p=>p.length()))-w.radius)<1e-12);
function integrals(points:THREE.Vector2[]){let area=0,polar=0,my=0,mz=0;for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length],d=a.x*b.y-b.x*a.y;area+=d/2;my+=d*(a.x+b.x)/6;mz+=d*(a.y+b.y)/6;polar+=d*(a.x*a.x+a.x*b.x+b.x*b.x+a.y*a.y+a.y*b.y+b.y*b.y)/12;}return{area:Math.abs(area),polar:Math.abs(polar),cy:my/area,cz:mz/area};}
const [outer,...holes]=contours.map(integrals),area=outer.area-holes.reduce((s,h)=>s+h.area,0),polar=outer.polar-holes.reduce((s,h)=>s+h.polar,0),density=MATERIALS[w.material].density;
const bladeMass=blade.reduce((s,p)=>s+p.mass,0),inertia=blade.reduce((s,p)=>s+partProperties(p).about(v(1,0,0)),0);
const expectedMass=w.massKg??area*w.width*density,effectiveDensity=expectedMass/(area*w.width);
assert(Math.abs(bladeMass-expectedMass)<1e-8);
let expectedInertia=0,firstY=0,firstZ=0;
for(const p of blade){assert(p.shape.kind==='hull');const n=p.shape.vertices.length/6,polygon=Array.from({length:n},(_,i)=>new THREE.Vector2(p.position.y+p.shape.vertices[i*3+1],p.position.z+p.shape.vertices[i*3+2])),value=integrals(polygon);expectedInertia+=value.polar*p.mass/value.area;firstY+=p.mass*value.cy;firstZ+=p.mass*value.cz;}
assert(Math.abs(inertia-expectedInertia)<1e-10);
assert(Math.hypot(firstY,firstZ)/bladeMass<1e-10,'The blade center of mass must coincide with its bore axis.');
const unweighted=structuredClone(config);assert(unweighted.weapon.type==='hammer_saw');delete unweighted.weapon.massKg;
assert(Math.abs(compile(unweighted).parts.filter(isSawbladePart).reduce((s,p)=>s+p.mass,0)-area*w.width*density)<1e-8);
assert(Math.abs(compiled.rotorInertia-inertia)<1e-10);
console.log('PASS SVG polygon area, mass, inertia, radius, tooth identities and build import',JSON.stringify({parts:blade.length,massKg:bladeMass,inertiaKgM2:inertia,balanceOffsetM:Math.hypot(firstY,firstZ)/bladeMass,energyKJ:inertia*(w.rpm*Math.PI/30)**2/2000}));

await initializePhysics();
const world=new RAPIER.World(v());
try{
 const body=world.createRigidBody(RAPIER.RigidBodyDesc.fixed());for(const p of blade)world.createCollider(colliderDesc(p),body);
 world.step();
 for(const hole of contours.slice(1)){
  const centre=hole.reduce((a,b)=>a.add(b),new THREE.Vector2()).multiplyScalar(1/hole.length);
  assert.equal(world.castRay(new RAPIER.Ray(v(-1,centre.x,centre.y),v(1,0,0)),2,true),null,'An SVG opening must remain physically empty.');
 }
 const p=blade.find(p=>p.tooth===0)!;assert(p.shape.kind==='hull');const centre=partProperties(p).centre,y=centre.y,z=centre.z;
 assert(world.castRay(new RAPIER.Ray(v(-1,y,z),v(1,0,0)),2,true));
 console.log('PASS Real Rapier rays cross both holes and contact a cutter');
}finally{world.free();}

const renderer=Object.create(ArenaRenderer.prototype) as ArenaRenderer;let rims=0,faces=0;
for(const p of blade){const mesh=renderer.part(p,config);try{
 assert(mesh.userData.svgBlade);const face=mesh.material as THREE.MeshPhysicalMaterial;assert.equal(face.color.getHexString(),'16191a');
 renderer.applyHealth(mesh,.5);assert(Number.isFinite(face.roughness));
 mesh.traverse(o=>{if(o instanceof THREE.Mesh){const pos=o.geometry.getAttribute('position');assert([...pos.array].every(Number.isFinite));if(o!==mesh){rims++;assert(o.material instanceof THREE.Material);}}});faces++;
}finally{renderer.disposeObject(mesh);}}
assert(rims>0);assert.equal(faces,blade.length);console.log('PASS Dark blade faces, green boundaries, damage state and cleanup',JSON.stringify({faces,trimMeshes:rims}));

const sim=new Simulation([config,preset(0)],{practice:true,hazards:false,ai:[false,false],autoUnstick:false});
try{for(let tick=0;tick<720;tick++)sim.step([{...neutral(),weapon:tick===0},neutral()]);assert.equal(sim.fault,undefined);assert(sim.bots[0].rpm>100);assert(Math.abs(sim.totalMass(sim.bots[0])-compiled.mass)<.002);console.log('PASS Integrated SawBlaze rotor spins with finite physics',JSON.stringify({rpm:sim.bots[0].rpm,totalMassKg:compiled.mass}));}finally{sim.dispose();}
