import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import * as THREE from 'three';
import {COMPONENT_DEBRIS_VISIBLE,DamageDebris} from '../src/damage-debris';
import {preset} from '../src/model';
import {Simulation,initializePhysics} from '../src/sim';

const results:any[]=[];
async function test(name:string,run:()=>unknown|Promise<unknown>){try{const detail=await run();results.push({name,status:'passed',detail});console.log('PASS',name,JSON.stringify(detail));}catch(error){results.push({name,status:'failed',error:String(error)});process.exitCode=1;console.log('FAIL',name,String(error));}}

await test('Component HP loss emits no airborne cosmetic fragments',()=>{
 const debris=new DamageDebris(),source=()=>({position:new THREE.Vector3(),center:new THREE.Vector3(1,0,0),size:.3,color:'#888',part:'armour_left'});
 assert.equal(COMPONENT_DEBRIS_VISIBLE,false);assert.equal(debris.observe(0,'armour_left',400,400,source,0),0);assert.equal(debris.observe(0,'armour_left',0,400,source,.1),0);debris.step(.5);assert.equal(debris.count,0);assert.equal(debris.root.children.length,0);debris.dispose();return{visible:COMPONENT_DEBRIS_VISIBLE,fragments:0};
});

await initializePhysics();
await test('Destroyed armour still removes its collider and preserves detached mass simulation',()=>{
 const simulation=new Simulation([preset(0),preset(1)],{hazards:false,ai:[false,false]});try{for(let tick=0;tick<60;tick++)simulation.step();const bot=simulation.bots[0],before=simulation.totalMass(bot),part=bot.compiled.parts.find(candidate=>candidate.module==='armour_left')!;simulation.damage(0,'armour_left',1e7);simulation.step();assert(!bot.modules.armour_left.functional);assert(!bot.colliders.has(part.id));assert(simulation.debris.length>0);assert(simulation.totalMass(bot)<before);return{physicalDebris:simulation.debris.length,massRemoved:before-simulation.totalMass(bot)};}finally{simulation.dispose();}
});

await test('Quick Fight status row uses an explicit shared baseline layout',()=>{
 const css=readFileSync('src/menu-polish.css','utf8'),renderer=readFileSync('src/render.ts','utf8');assert(css.includes('grid-template-columns:minmax(0,1fr) max-content'));assert(css.includes('align-items:baseline'));assert(css.includes('line-height:1'));assert(renderer.includes('COMPONENT_DEBRIS_VISIBLE&&present.has(id)'));assert(renderer.includes("this.damageDebris.root.visible=this.mode==='match'&&COMPONENT_DEBRIS_VISIBLE"));return{baselineAligned:true,replayDebrisHidden:true};
});

writeFileSync('docs/debris-ui-policy-results.json',JSON.stringify(results,null,2));
if(results.some(result=>result.status==='failed'))process.exitCode=1;
