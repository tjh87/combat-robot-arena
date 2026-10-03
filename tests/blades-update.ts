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
