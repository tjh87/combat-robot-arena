import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import * as THREE from 'three';
import {preset,ROSTER,RULES,isSpinner,weaponAxis,rotate,add,mul,v,length,sub,dot} from '../src/model';
import {Simulation,initializePhysics,neutral,gyroInertialTorque} from '../src/sim';
import {WEAPON_VOICES,weaponVoiceKey,weaponVoiceSamples} from '../src/weapon-audio';
import {roundParticleMaterial,sparkProfile} from '../src/impact-sparks';
import {damageStatus} from '../src/combat-damage';
import {startSignal} from '../src/start-sequence';
const results:any[]=[];
async function test(name:string,run:()=>unknown){try{const detail=await run();results.push({name,status:'passed',detail});console.log('PASS',name,JSON.stringify(detail));}catch(error){process.exitCode=1;results.push({name,status:'failed',error:String(error)});console.log('FAIL',name,String(error));}writeFileSync('docs/showtime-update-results.json',JSON.stringify(results,null,2));}
await initializePhysics();
await test('All eleven weapons keep reduced output after mid-match damage and loss of drive power',()=>{
 const rows=[];
 for(let index=0;index<ROSTER.length;index++){
  const c=preset(index),s=new Simulation([c,preset(0)],{practice:true,hazards:false,ai:[false,false],autoUnstick:false}),b=s.bots[0];
  try{
   s.world.gravity=v();for(const bot of s.bots){for(const body of bot.bodies.values())body.setTranslation(add(body.translation(),v(0,2,0)),true);bot.chassis.setEnabledTranslations(false,false,false,true);bot.chassis.setEnabledRotations(false,false,false,true);}s.world.propagateModifiedBodyPositionsToColliders();
   s.tick=90*RULES.hz;for(const slot of['weapon','weapon_actuator','battery'] as const)s.damage(0,slot,1e9);b.energy=0;b.charges=0;
   assert(b.modules.weapon.functional);assert(b.modules.weapon_actuator.functional);assert.equal(b.modules.weapon.hp,0);assert(!s.powered(b));assert(s.weaponPowered(b));
   let peak=0,armPeak=0;
   for(let t=0;t<(isSpinner(c.weapon)?Math.ceil(Math.max(25,b.compiled.spinup*2.5+3)):8)*RULES.hz;t++){s.step([{...neutral(),weapon:t===0,selfRight:c.weapon.type==='hammer_saw'&&t===3*RULES.hz},neutral()]);peak=Math.max(peak,b.rpm);armPeak=Math.max(armPeak,Math.abs(c.weapon.type==='crusher'?b.crushAngle:b.flipAngle));}
   if(isSpinner(c.weapon)){assert(peak>c.weapon.rpm*damageStatus(b.modules).rpmScale*.8,c.identity.name+' did not spin up: '+peak);assert(b.weaponOn);b.rotor!.setAngvel(v(),true);s.tick=170*RULES.hz;for(let t=0;t<4*RULES.hz;t++)s.step();assert(b.rpm>Math.min(250,c.weapon.rpm*.2)*damageStatus(b.modules).weaponOutput,c.identity.name+' did not restart after impact stall');}
   else if(c.weapon.type==='flipper'){assert(armPeak>.7);s.tick=170*RULES.hz;assert(s.requestFire(b),'Flipper must fire again with no charges or pack');}
   else{assert(armPeak>.45);s.tick=170*RULES.hz;s.step([{...neutral(),weapon:true},neutral()]);assert(b.weaponOn);}
   if(c.weapon.type==='hammer_saw')assert(armPeak>.25,'SawBlaze arm must strike');assert.equal(s.fault,undefined);assert.equal(b.energy,0);
   rows.push({name:c.identity.name,peakRPM:Math.round(peak),lateRPM:Math.round(b.rpm),armTravel:armPeak,weaponFunctional:true});
  }finally{s.dispose();}
 }return rows;
});
await test('All five vertical rotors transmit gyroscopic precession through their joints',()=>{
 const rows=[];
 for(const index of[1,4,7,8,9]){
  const c=preset(index);assert(isSpinner(c.weapon));const outcomes=[];
  for(const spin of[0,1]){
   const s=new Simulation([c,preset(0)],{practice:true,hazards:false,ai:[false,false],autoUnstick:false}),b=s.bots[0];
   try{
    s.world.gravity=v();for(const body of b.bodies.values()){body.setTranslation(add(body.translation(),v(0,2,0)),true);body.setAngvel(v(0,1.1,0),true);}s.world.propagateModifiedBodyPositionsToColliders();
    b.rotor!.setAngvel(add(v(0,1.1,0),mul(rotate(weaponAxis(c.weapon),b.chassis.rotation()),spin*c.weapon.rpm*Math.PI/30*.8)),true);
    let torque=0;for(let t=0;t<60;t++){torque=Math.max(torque,length(gyroInertialTorque(b.rotor!)));s.step();}
    const up=s.axis(b,v(0,1,0)),roll=Math.hypot(up.x,up.z);assert.equal(s.fault,undefined);outcomes.push({spin,roll,torque,up});
   }finally{s.dispose();}
  }
  assert(outcomes[1].torque>5,c.identity.name+' has no gyro torque');assert(length(sub(outcomes[1].up,outcomes[0].up))>.005,c.identity.name+' has no precession response: '+JSON.stringify(outcomes));rows.push({name:c.identity.name,...outcomes[1],unspunRoll:outcomes[0].roll});
 }return rows;
});
await test('Eleven weapon timbres produce distinct bounded waveforms',()=>{
 const hashes=new Set<string>(),rows=[];
 for(let i=0;i<ROSTER.length;i++){const c=preset(i),key=weaponVoiceKey(c),data=weaponVoiceSamples(key,16000);assert(WEAPON_VOICES[key]);assert.equal(data.length,32000);let peak=0,square=0;for(const x of data){assert(Number.isFinite(x));peak=Math.max(peak,Math.abs(x));square+=x*x;}assert(peak<1&&square/data.length>.001);const hash=createHash('sha256').update(new Uint8Array(data.buffer)).digest('hex');hashes.add(hash);rows.push({name:c.identity.name,timbre:WEAPON_VOICES[key].label,peak,rms:Math.sqrt(square/data.length)});}
 assert.equal(hashes.size,11);return rows;
});
await test('Spark shaders clip corners and stronger impacts create more molten trails',()=>{
 const material=roundParticleMaterial({size:.036,transparent:true}),shader={fragmentShader:THREE.ShaderLib.points.fragmentShader};material.onBeforeCompile(shader as any,{} as any);assert(shader.fragmentShader.includes('gl_PointCoord'));assert(shader.fragmentShader.includes('discard'));assert(shader.fragmentShader.includes('smoothstep'));assert(!shader.fragmentShader.includes('NaN'));assert(sparkProfile(50000).count>sparkProfile(500).count*3);material.dispose();return{small:sparkProfile(500),big:sparkProfile(50000),squareCornersDiscarded:true};
});
await test('Start signals match three amber flashes followed by green',()=>{
 for(const t of[.25,1.25,2.25]){assert(startSignal(t).lit);assert(!startSignal(t).fight);}for(const t of[.85,1.85,2.85])assert(!startSignal(t).lit);assert(startSignal(3.25).fight);assert(startSignal(3.25).lit);return{amberFlashes:3,greenSeconds:3.15};
});
