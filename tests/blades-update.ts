import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import * as THREE from 'three';
import {JSDOM} from 'jsdom';
import {preset,compile,ROSTER,RULES,isSpinner,v,sub,add,bodyOrigin,axisQ,rotate,dot} from '../src/model';
import {Simulation,initializePhysics,neutral,type Result} from '../src/sim';
import {scorecard} from '../src/result-view';
import {rotorMotion,updateRotorMotion} from '../src/combat-visuals';
import {ArenaRenderer} from '../src/render';
import {GameAudio,METAL_IMPACTS} from '../src/audio';
const results:any[]=[];
async function test(name:string,fn:()=>unknown){if(process.env.CASE&&!name.includes(process.env.CASE))return;try{const detail=await fn();results.push({name,status:'passed',detail});console.log('PASS',name,JSON.stringify(detail));}catch(e){results.push({name,status:'failed',error:String(e)});console.log('FAIL',name,String(e));}writeFileSync('docs/blades-update-results.json',JSON.stringify(results,null,2));}
await initializePhysics();
await test('Tombstone reverses during faster spin-up without turning around, and still responds to steering',()=>{
 const rows=[];for(const direction of[-1,1]){const c=preset(0),s=new Simulation([c,preset(0)],{practice:true,hazards:false,ai:[false,false],autoUnstick:false}),b=s.bots[0],q=axisQ(v(0,1,0),0),p=v(-3,c.chassis.height/2+c.chassis.clearance+.008);try{
  for(const[id,body]of b.bodies){body.setTranslation(add(p,rotate(bodyOrigin(c,id),q)),true);body.setRotation(q,true);body.setLinvel(v(),true);body.setAngvel(v(),true);}s.world.propagateModifiedBodyPositionsToColliders();
  for(let t=0;t<600;t++)s.step([{...neutral(),weapon:t===0},neutral()]);const start={...b.chassis.translation()},forward=s.forward(b);
  for(let t=0;t<360;t++)s.step([{...neutral(),left:direction*.3,right:direction*.3},neutral()]);const headingChange=Math.acos(Math.max(-1,Math.min(1,dot(forward,s.forward(b))))),travel=dot(sub(b.chassis.translation(),start),forward)*direction;assert(headingChange<.6);assert(travel>1);const turnStart=s.forward(b);
  for(let t=0;t<120;t++)s.step([{...neutral(),left:-.3,right:.3},neutral()]);const steeringChange=Math.acos(Math.max(-1,Math.min(1,dot(turnStart,s.forward(b)))));assert(steeringChange>.15);assert.equal(s.fault,undefined);rows.push({direction,travelM:travel,headingChangeDegrees:headingChange*180/Math.PI,steeringChangeDegrees:steeringChange*180/Math.PI});
 }finally{s.dispose();}}return rows;
});
