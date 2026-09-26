import {performance} from 'node:perf_hooks';
import {writeFileSync} from 'node:fs';
import * as THREE from 'three';
import {ROSTER,preset,compile,RULES} from '../src/model';
import {Simulation,initializePhysics} from '../src/sim';
import {ArenaRenderer} from '../src/render';
import {buildFoundry} from '../src/visuals';

// Real scene geometry and Rapier. Canvas paint is stubbed; this is not a GPU FPS test.
const context=new Proxy({}, {get:()=>()=>{}});
Object.assign(globalThis,{document:{createElement:()=>({width:1,height:1,getContext:()=>context})}});
const renderer=Object.create(ArenaRenderer.prototype) as ArenaRenderer;
function stats(root:THREE.Object3D){let meshes=0,triangles=0,bytes=0;const geometries=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>();root.traverse(o=>{if(o instanceof THREE.Mesh){meshes++;triangles+=(o.geometry.index?.count??o.geometry.getAttribute('position').count)/3;geometries.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material])materials.add(m);}});for(const g of geometries){for(const a of Object.values(g.attributes))bytes+=a.array.byteLength;bytes+=g.index?.array.byteLength??0;}return{meshes,triangles,geometryBytes:bytes,materials:materials.size};}
const arena=new THREE.Group();buildFoundry(arena);const arenaStats=stats(arena);renderer.clear(arena);
const robots=ROSTER.map((r,i)=>{const root=new THREE.Group(),c=preset(i),start=performance.now();for(const {mesh}of renderer.displayParts(c,compile(c).parts))root.add(mesh);const result={name:r.name,...stats(root),buildMs:performance.now()-start};renderer.clear(root);return result;});
await initializePhysics();
const scenarios=[];
for(const [a,b]of [[0,1],[4,7],[10,2],[8,9]]){const sim=new Simulation([preset(a),preset(b)],{seed:73145,practice:true,hazards:true,ai:[true,true]});const times:number[]=[];for(let tick=0;tick<1440;tick++){const start=performance.now();sim.step();if(tick>=240)times.push(performance.now()-start);if(sim.fault)throw Error(sim.fault);}times.sort((a,b)=>a-b);scenarios.push({robots:[ROSTER[a].name,ROSTER[b].name],ticks:sim.tick,p50Ms:times[Math.floor(times.length*.5)],p95Ms:times[Math.floor(times.length*.95)],meanMs:times.reduce((a,b)=>a+b)/times.length,snapshot:sim.snapshot()});sim.dispose();}
const report={date:new Date().toISOString(),physicsHz:RULES.hz,node:process.version,arena:arenaStats,robots,scenarios,graphics:'No GPU frame-rate claim; real geometry and real Rapier, canvas paint stubbed.'};
if(process.argv[2])writeFileSync(process.argv[2],JSON.stringify(report,null,2));
console.log(JSON.stringify({arena:arenaStats,robots,scenarios:scenarios.map(({snapshot,...s})=>s)}));
