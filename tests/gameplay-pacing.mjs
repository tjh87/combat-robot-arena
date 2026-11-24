import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
import {FrameGate,AdaptiveResolution} from '../src/performance.ts';

// Exercise the real controller loop with rendering/network boundaries stubbed.
// This measures scheduling, not GPU speed or network latency.
const source=readFileSync(new URL('../src/online/ui.ts',import.meta.url),'utf8');
const code=stripTypeScriptTypes(source.replace(/^import .*$/gm,'').replace('export class OnlineController','class OnlineController').replace('constructor(readonly hooks:Hooks','constructor(hooks:Hooks').replaceAll('import.meta.url',"'file:///fixture.ts'"));
const Controller=new Function('FrameGate','PREDICTION_LIMITS','blendPoses','applyReplica','updateOpponentHud',code+'\nreturn OnlineController;')(FrameGate,{renderHz:60},()=>[],()=>{},()=>{});
const results=[];
for(const refresh of [60,90,120,144,165,240]){
 const c=Object.create(Controller.prototype);let draws=0,layoutReads=0;
 Object.assign(c,{stopped:false,sim:{},latest:{tick:0,visual:{effects:[]}},frames:[{serverTime:0}],side:-1,viewSide:0,connection:{offset:0,state:'connected'},timing:{delay:42},renderAt:0,renderGate:new FrameGate(),renderedTick:0,audioAt:Infinity,bracketOpen:true,camera:'chase',showHits(){},prefs:{reduced:false},hooks:{renderer:{observeFrame(){},update(){},draw(){draws++;}},hud:{},modals:{querySelector(){layoutReads++;return null;}}}});
 // Overlay and hit helpers are separate UI boundaries.
 for(let i=0;i<refresh*10;i++)c.tick(i*1000/refresh,1/refresh);
 assert(Math.abs(draws-600)<=1,`${refresh} Hz: ${draws} draws`);
 assert.equal(layoutReads,0,'bracket geometry must not be measured by the combat loop');
 results.push({refresh,draws});
}
const resolution=new AdaptiveResolution();
for(let i=0;i<50*2;i++)resolution.sample(1/50);
assert(resolution.scale<1,'sustained 50 FPS must reduce rendering load');
const reduced=resolution.scale;
resolution.sample(2);assert.equal(resolution.scale,reduced,'loading hitches do not change quality');
for(let i=0;i<60*4;i++)resolution.sample(1/60);
assert.equal(resolution.scale,reduced,'quality recovery must wait for sustained headroom');
for(let i=0;i<60*5;i++)resolution.sample(1/60);
assert(resolution.scale>reduced,'quality recovers after eight seconds of headroom');
const gate=new FrameGate();assert(gate.due(0,'match',60));assert(!gate.due(1,'match',60));gate.reset();assert(gate.due(2,'match',60));
console.log('PASS actual online controller: 60 FPS pacing across refresh rates; no bracket layout in combat loop',results);
console.log('PASS adaptive resolution: responds to 50 FPS, ignores pause, recovers slowly');

const main=readFileSync(new URL('../src/main.ts',import.meta.url),'utf8');
const warningCode=stripTypeScriptTypes(main.slice(main.indexOf('function updateDamageWarnings(){'),main.indexOf('function updateOpponentPointer(){')));
for(const state of ['menu','paused','fighting','practice']){
 let hidden=0;
 const sim={options:{freeForAll:false},bots:[{id:0},{id:1}]};
 const badge={dataset:{damaged:'false'},classList:{add(){hidden++;}}};
 const hud={getBoundingClientRect(){throw Error('No damage warnings: layout must not be measured');}};
 const run=new Function('sim','state','hud','$',warningCode+'\nupdateDamageWarnings();');
 run(sim,state,hud,()=>badge);
 assert.equal(hidden,2,'both undamaged badges stay hidden');
}
console.log('PASS idle/undamaged HUD skips layout measurement in menu, pause, fight and practice');
