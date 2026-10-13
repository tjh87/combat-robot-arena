import assert from 'node:assert/strict';
import * as THREE from 'three';
import {brawlOverviewDistance,BRAWL_COMBAT_ZOOM_LIMIT} from '../src/brawl-camera';
import {cameraWallVisible} from '../src/render-stability';
import {writeSparkTrail,sparkHeadColor} from '../src/impact-sparks';
import {v,preset,RULES} from '../src/model';
import {ArenaRenderer} from '../src/render';
import {Simulation,initializePhysics} from '../src/sim';

for(const initial of [true,false]){
 let visible=initial;for(const z of [6,6.03,5.97,6.04,5.98,6])visible=cameraWallVisible(visible,z,6,true,false);
 assert.equal(visible,initial,'Camera jitter inside the dead band must not flicker the wall.');
}
assert.equal(cameraWallVisible(false,5.8,6,true,false),true);
assert.equal(cameraWallVisible(true,6.2,6,true,false),false);
assert.equal(cameraWallVisible(true,5,6,true,true),false);
assert.equal(cameraWallVisible(true,5,6,false,false),false);

for(let n=0;n<100;n++){
 const x=n*.03,y=.1+n*.004,z=-n*.02,vx=n*.1,vy=-n*.05,vz=n*.07,trail=.04,fade=n/100,branch=n%3===0,tint=v(.8,.4,.1);
 const p=new Float32Array(18),c=new Float32Array(18),half=trail*.45,mx=x-vx*half,my=Math.max(.012,y-vy*half-4.905*half*half),mz=z-vz*half,tx=x-vx*trail,ty=Math.max(.012,y-vy*trail-4.905*trail*trail),tz=z-vz*trail;
 const oldP=new Float32Array([x,y,z,mx,my,mz,mx,my,mz,tx,ty,tz,mx,my,mz,branch?tx+vz*trail*.12:mx,branch?ty+trail*.7:my,branch?tz-vx*trail*.12:mz]);
 const hot=sparkHeadColor(tint,fade),mid=v(tint.x*(fade*.65),tint.y*(fade*.65),tint.z*(fade*.65)),tail=v(tint.x*(fade*.12),tint.y*(fade*.12),tint.z*(fade*.12));
 const oldC=new Float32Array([hot.x,hot.y,hot.z,mid.x,mid.y,mid.z,mid.x,mid.y,mid.z,tail.x,tail.y,tail.z,mid.x*.6,mid.y*.6,mid.z*.6,tail.x,tail.y,tail.z]);
 writeSparkTrail(p,c,0,x,y,z,vx,vy,vz,trail,fade,branch,tint);assert.deepEqual(p,oldP);assert.deepEqual(c,oldC);
 const scratch=v();assert.equal(sparkHeadColor(tint,fade,scratch),scratch);assert.deepEqual(scratch,hot);
}
await initializePhysics();
const sim=new Simulation([preset(0),preset(1),preset(2),preset(4),preset(9)],{freeForAll:true,hazards:false});
const makeRenderer=()=>{
 const renderer=Object.create(ArenaRenderer.prototype) as ArenaRenderer;
 Object.assign(renderer,{time:0,mode:'match',cameraMode:'tactical',viewerBotId:0,width:1280,height:720,quality:'medium',camera:new THREE.PerspectiveCamera(42,1280/720,.1,100),cameraTarget:new THREE.Vector3(),bodyGroups:new Map(),replayGroups:new Map(),arena:new THREE.Group(),bots:new THREE.Group(),preview:new THREE.Group(),effects:new THREE.Group(),scene:new THREE.Scene(),damageDebris:{root:new THREE.Group()},batteryFireVisual:{update(){},visible:false},followCamera:{reset(){}},povTracking:{reset(){}},inset:false,renderer:{shadowMap:{enabled:false},info:{render:{triangles:0,calls:0}},setViewport(){},setScissorTest(){},render(){}}});return renderer;
};
try{
 const brawl=makeRenderer(),duel=makeRenderer();
 const duelView=Object.create(sim) as Simulation;const own=sim.bots[0].chassis.translation(),rival=sim.bots.slice(1).sort((a,b)=>{const p=a.chassis.translation(),q=b.chassis.translation();return Math.hypot(p.x-own.x,p.z-own.z)-Math.hypot(q.x-own.x,q.z-own.z)})[0];duelView.bots=[sim.bots[0],rival];duelView.options={...sim.options,freeForAll:false};
 brawl.draw(sim,RULES.dt);duel.draw(duelView,RULES.dt);
 assert.deepEqual(brawl.camera.position.toArray(),duel.camera.position.toArray(),'Brawl uses normal close-up framing around the player and nearest rival.');
 assert.deepEqual(brawl.camera.quaternion.toArray(),duel.camera.quaternion.toArray());
 for(const aspect of [1280/720,844/390,640/360]){
  const intro=makeRenderer();intro.camera.aspect=aspect;intro.camera.updateProjectionMatrix();intro.preMatch=true;intro.cameraMode='chase';intro.draw(sim,RULES.dt);intro.camera.updateMatrixWorld();
  const points=sim.bots.map(bot=>new THREE.Vector3().copy(bot.chassis.translation()));
  for(const x of [-RULES.floor/2,RULES.floor/2])for(const z of [-RULES.floor/2,RULES.floor/2])points.push(new THREE.Vector3(x,0,z));
  for(const point of points){const projected=point.project(intro.camera);assert(Math.abs(projected.x)<.96&&Math.abs(projected.y)<.96,'Opening overview fits all arena corners and robots');}
  assert.equal(intro.camera.fov,42,'Opening overview overrides player POV/chase only for countdown');
  intro.preMatch=false;intro.cameraMode='tactical';for(let i=0;i<180;i++)intro.draw(sim,1/60);
  assert(intro.camera.position.z-intro.cameraTarget.z<=BRAWL_COMBAT_ZOOM_LIMIT+.02,'Combat does not retain arena-wide zoom');
  assert(intro.camera.position.z<brawlOverviewDistance(RULES.floor,aspect),'Combat moves closer after overview');
 }

}finally{sim.dispose()}
console.log('PASS wall-visibility hysteresis, identical allocation-free spark buffers, reusable spark color and Brawl opening-fit and bounded combat framing');
