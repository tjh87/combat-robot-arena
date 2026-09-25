import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {RULES,flipEnergy,preset,compile,parseConfig,copy,v,add,sub,rotate,quatMul,axisQ,feedPerTooth} from '../src/model';
import {Simulation,FixedClock,initializePhysics,neutral} from '../src/sim';
import {Input,defaults} from '../src/input';

const results:any[]=[];
async function test(name:string,fn:()=>unknown){
  try {const detail=fn();results.push({name,status:'passed',detail});console.log('PASS',name,JSON.stringify(detail));}
  catch(e){results.push({name,status:'failed',detail:String(e)});console.log('FAIL',name,String(e));}
  writeFileSync('docs/system-results.json',JSON.stringify(results,null,2));
}
await initializePhysics();
await test('G07 Physical roll arm and flipper recover from inversion without position resets',()=>{
  const evidence=[];
  for(const type of ['roll_arm','flipper']){
    const config=preset(type==='roll_arm'?0:2);
    if(type==='roll_arm')config.selfRight={type:'roll_arm',mount:v(.43,.18,-.18),length:.42,actuator:'R600'};
    assert.deepEqual(compile(config).errors,[]);
    const sim=new Simulation([config,preset(0)],{practice:true,hazards:false,ai:[false,false]}),bot=sim.bots[0];
    const origin=bot.chassis.translation(),q=axisQ(v(0,0,1),Math.PI);
    // Fixture placement only. From this point recovery uses joints and contacts.
    for(const body of bot.bodies.values()){
      body.setTranslation(add(v(0,.45,0),rotate(sub(body.translation(),origin),q)),true);
      body.setRotation(quatMul(q,body.rotation()),true);
    }
    for(let i=0;i<240;i++)sim.step();
    assert(sim.axis(bot,v(0,1,0)).y<-.9);
    let maxUp=-1,maxWork=0;
    const energy=bot.energy;
    assert(sim.requestSelfRight(bot));assert(!sim.requestSelfRight(bot));
    for(let i=0;i<1440;i++){
      if(i===800)sim.command(0,{...neutral(),selfRight:true});
      sim.step();assert.equal(sim.fault,undefined);
      maxUp=Math.max(maxUp,sim.axis(bot,v(0,1,0)).y);
      maxWork=Math.max(maxWork,type==='roll_arm'?bot.rollWork:bot.flipWork);
    }
    assert(maxUp>.9);assert(maxWork<=(type==='roll_arm'?2000:flipEnergy(bot.compiled.config))+1e-5);
    assert(bot.energy<energy);
    if(type==='roll_arm'){bot.modules.self_right.functional=false;sim.tick+=3*RULES.hz;assert(!sim.requestSelfRight(bot));}
    evidence.push({type,maxUp,finalUp:sim.axis(bot,v(0,1,0)).y,maxWork,energySpent:energy-bot.energy});sim.dispose();
  }
  return evidence;
});
await test('G04 Roof contact contains a fast robot; invalid positions pause with no winner',()=>{
  const sim=new Simulation([preset(0),preset(1)],{practice:true,hazards:false,ai:[false,false]}),bot=sim.bots[0];
  const origin=bot.chassis.translation();for(const body of bot.bodies.values()){
    body.setTranslation(add(body.translation(),sub(v(0,5,0),origin)),true);body.setLinvel(v(0,15,0),true);
  }
  let maxHeight=0;for(let i=0;i<480;i++){sim.step();assert.equal(sim.fault,undefined);maxHeight=Math.max(maxHeight,bot.chassis.translation().y);}
  assert(maxHeight<6.1);assert(sim.events.some(e=>e.cause==='collision'));
  const delta=sub(v(10,1,0),bot.chassis.translation());for(const body of bot.bodies.values())body.setTranslation(add(body.translation(),delta),true);
  sim.step();assert(sim.fault);assert.equal(sim.result,undefined);const tick=sim.tick;sim.step();assert.equal(sim.tick,tick);
  sim.dispose();return{maxHeight,faultStopsTime:true,noInventedWinner:true};
});
await test('G08 Forced-hazard attribution expires after 1.5 seconds',()=>{
  const sim=new Simulation([preset(0),preset(1)],{practice:true,hazards:false,ai:[false,false]});
  const victim=sim.bots[1],attacker=sim.bots[0];sim.tick=421;victim.grounded=true;victim.lastAttacker=0;victim.lastAction=321;victim.lastHazard=421;
  (sim as any).rules();assert.equal(attacker.forced,RULES.dt);
  sim.tick=682;victim.lastHazard=682;(sim as any).rules();assert.equal(attacker.forced,RULES.dt);
  sim.dispose();return{qualifiedIntervalSeconds:RULES.dt,expired:true};
});
await test('G03 A pause inside an input callback leaves no negative scheduling remainder',()=>{const clock=new FixedClock();let calls=0;clock.advance(1/30,()=>{calls++;clock.pause();});assert.equal(calls,1);assert.equal(clock.accumulator,0);assert(clock.paused);return{callbacks:1,accumulator:0};});
await test('G07 Feed-per-tooth diagnostics handle zero and reverse speed safely',()=>{
  assert.equal(feedPerTooth(1,2,0),null);assert.equal(feedPerTooth(1,0,100),null);
  assert.equal(feedPerTooth(-1,2,100),0);assert.equal(feedPerTooth(1,2,-100),feedPerTooth(1,2,100));
  return{oneMetrePerSecondTwoTeeth100Radians:feedPerTooth(1,2,100)};
});
await test('G10 Every authored numeric range rejects nonfinite and outside values',()=>{
  const rows:[number,string,number,number][]=[
    [0,'chassis.length',.2,1.2],[0,'chassis.width',.22,1.3],[0,'chassis.height',.08,.45],
    [0,'chassis.thickness',.004,.02],[0,'chassis.wedgeAngle',10,55],[0,'chassis.clearance',.003,.65],
    [0,'drive.radius',.05,.6],[0,'drive.width',.025,.18],[0,'drive.ratio',5,45],[0,'drive.magnet',0,400],
    [0,'battery.capacityWh',100,1000],[0,'weapon.radius',.1,.85],[0,'weapon.width',.02,.7],
    [0,'weapon.thickness',.006,.08],[0,'weapon.teeth',1,12],[0,'weapon.toothDepth',.01,.1],
    [0,'weapon.toothWidth',.015,.5],[0,'weapon.toothHeight',.01,.18],[0,'weapon.ratio',.5,12],[0,'weapon.rpm',100,12000],
    [2,'weapon.length',.2,.65],[2,'weapon.width',.15,.7],[2,'weapon.thickness',.006,.04],
    [2,'weapon.travel',.3,2.1],[2,'weapon.stroke',.2,.5],[2,'weapon.charges',1,12],[0,'selfRight.length',.25,.6],[8,'weapon.armLength',.3,.8],[8,'weapon.armTravel',.6,1.5],
  ];
  for(let i=0;i<5;i++)rows.push([0,`armour.${i}.thickness`,0,.025]);
  for(const type of [0,1,2])for(const [axis,low,high]of [['x',-1,1],['y',-.3,1.2],['z',-1,1]] as const)rows.push([type,'weapon.mount.'+axis,low,high]);
  for(const [axis,low,high]of [['x',-1,1],['y',-.3,1.2],['z',-1,1]] as const)rows.push([0,'selfRight.mount.'+axis,low,high]);
  let assertions=0;
  for(const [type,path,low,high]of rows)for(const [value,valid]of [[low,true],[high,true],[low-.00001,false],[high+.00001,false],[NaN,false],[Infinity,false]] as const){
    const config:any=preset(type);config.selfRight={type:'roll_arm',mount:v(.43,.18,-.18),length:.42,actuator:'R600'};
    const keys=path.split('.');let target=config;for(const key of keys.slice(0,-1))target=target[key];target[keys.at(-1)!]=value;
    if(valid)assert.doesNotThrow(()=>parseConfig(config),path);else assert.throws(()=>parseConfig(config),path);assertions++;
  }
  const drum=preset(1) as any;drum.weapon.radius=.6;drum.weapon.toothDepth=.01;
  for(const inner of [0,.589]){drum.weapon.innerRadius=inner;assert.doesNotThrow(()=>parseConfig(drum));assertions++;}
  for(const inner of [-.001,.599,.6,NaN,Infinity]){drum.weapon.innerRadius=inner;assert.throws(()=>parseConfig(drum));assertions++;}
  for(const [type,field]of [[0,'teeth'],[2,'charges']] as const){const c:any=preset(type);c.weapon[field]=1.5;assert.throws(()=>parseConfig(c));assertions++;}
  const drive:any=preset(0);for(const layout of [2,4,6]){drive.drive.layout=layout;assert.doesNotThrow(()=>parseConfig(drive));assertions++;}for(const layout of [0,3,8]){drive.drive.layout=layout;assert.throws(()=>parseConfig(drive));assertions++;}
  return{numericPaths:rows.length+1,assertions,innerRadiusInterference:true,integerCounts:true};
});
await test('G09 Synthetic input: keyboard, two pads, mixed pair, edges, remapping and focus loss',()=>{
  // Pure input-unit fixtures. These are not browser or physical-controller tests.
  const win=new EventTarget(),doc=new EventTarget() as EventTarget&{hidden:boolean};doc.hidden=false;
  class Element extends EventTarget{isContentEditable=false;}
  class TextInput extends Element{}
  const storage=new Map<string,string>();
  let pads:any[]=[];
  Object.assign(globalThis,{window:win,document:doc,HTMLElement:Element,HTMLInputElement:TextInput,HTMLSelectElement:class extends Element{},HTMLTextAreaElement:class extends Element{},matchMedia:()=>({matches:false}),localStorage:{getItem:(k:string)=>storage.get(k)??null,setItem:(k:string,value:string)=>storage.set(k,value)}});
  Object.defineProperty(globalThis,'navigator',{value:{getGamepads:()=>pads},configurable:true});
  const prefs=defaults();let active=true,pauses=0,cameras=0;
  const input=new Input(prefs,()=>active,()=>{pauses++;active=false;input.clear();},()=>cameras++);
  const key=(code:string,repeat=false,target:any=win)=>({code,repeat,target,preventDefault(){}} as KeyboardEvent);
  input.keydown(key('ArrowUp'));input.keydown(key('KeyI'));input.keydown(key('Space'));input.keydown(key('Enter'));
  assert.deepEqual(input.sample(0),{left:1,right:1,weapon:true,selfRight:false});
  assert.deepEqual(input.sample(1),{left:1,right:1,weapon:true,selfRight:false});
  input.keydown(key('Space',true));assert.equal(input.sample(0).weapon,false);
  input.clear();input.keydown(key('Space',false,new TextInput()));assert.equal(input.sample(0).weapon,false);
  let error='';input.onRemap=message=>error=message??'';input.remap={player:0,action:'weapon'};
  input.keydown(key('KeyI'));assert(error.includes('already assigned'));input.keydown(key('KeyF'));assert.equal(prefs.controls[0].weapon,'KeyF');
  const pad=(axes:number[],pressed:number[]=[])=>({connected:true,axes,buttons:Array.from({length:16},(_,i)=>({pressed:pressed.includes(i)}))});
  pads=[pad([0,-1,0,0],[0]),pad([0,1,0,0],[1])];prefs.assignments=['pad0','pad1'];
  assert.equal(input.assignmentIssue(true),'');input.clear();assert.equal(input.sample(0).weapon,false);
  pads[0]=pad([.05,-.05,0,0]);assert.equal(input.sample(0).left,0);pads[0]=pad([0,-1,0,0],[0]);assert.equal(input.sample(0).weapon,true);
  assert.equal(input.sample(1).left,-1);prefs.assignments=['pad0','pad0'];assert(input.assignmentIssue(true));
  prefs.assignments=['keyboard','pad1'];input.clear();input.keydown(key('ArrowUp'));assert.equal(input.sample(0).left,1);assert.equal(input.sample(1).left,-1);
  prefs.steering='tank';prefs.assignments=['keyboard','keyboard'];input.clear();input.keydown(key('ArrowUp'));assert.deepEqual(input.sample(0),{left:1,right:0,weapon:false,selfRight:false});
  win.dispatchEvent(new Event('blur'));assert.equal(pauses,1);assert.equal(input.held.size,0);
  active=true;doc.hidden=true;doc.dispatchEvent(new Event('visibilitychange'));assert.equal(pauses,2);
  active=true;prefs.assignments=['pad0','pad1'];input.disconnect({gamepad:{index:0}} as GamepadEvent);assert.equal(pauses,3);
  active=true;input.dispose();win.dispatchEvent(new Event('blur'));assert.equal(pauses,3);
  return{splitKeyboard:true,twoSyntheticPads:true,mixedPair:true,deadzone:true,edgeTriggered:true,tank:true,remapConflict:true,focusPause:true,disconnectPause:true,listenerCleanup:true,physicalHardware:'unverified'};
});
const failed=results.filter(r=>r.status==='failed');console.log({passed:results.length-failed.length,failed:failed.length});process.exitCode=failed.length?1:0;
