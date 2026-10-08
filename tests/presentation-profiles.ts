import assert from 'node:assert/strict';
import {existsSync,readFileSync,statSync,writeFileSync} from 'node:fs';
import {preset} from '../src/model';
import {impactProfile} from '../src/audio';
import {weaponBlurProfile} from '../src/weapon-blur';
import {weaponSpinSound} from '../src/weapon-audio';
import {START_DURATION,startSignal} from '../src/start-sequence';

const results:any[]=[];
function test(name:string,run:()=>unknown){try{const detail=run();results.push({name,status:'passed',detail});console.log('PASS',name,JSON.stringify(detail));}catch(error){results.push({name,status:'failed',error:String(error)});process.exitCode=1;console.log('FAIL',name,String(error));}}

test('RPM profiles separate readable, partial, full, and reduced-motion weapon exposure',()=>{
 const config=preset(1),target=config.weapon.rpm,low=weaponBlurProfile(target*.02,target,config.weapon.teeth),mid=weaponBlurProfile(target*.42,target,config.weapon.teeth),high=weaponBlurProfile(target,target,config.weapon.teeth),reduced=weaponBlurProfile(target,target,config.weapon.teeth,true);
 assert.equal(low.strength,0);assert(mid.strength>0&&mid.exposure>0);assert(high.exposure>=mid.exposure);assert(high.exposure<=high.toothPitch);assert.equal(reduced.opacity,0);assert.equal(reduced.exposure,0);
 return{midExposure:mid.exposure,highExposure:high.exposure,toothPitch:high.toothPitch};
});

test('Weapon audio profile rises with RPM and positive acceleration',()=>{
 const config=preset(1),target=config.weapon.rpm,slow=weaponSpinSound(config,target*.3,1500,0),fast=weaponSpinSound(config,target*.85,6400,.9),coast=weaponSpinSound(config,target*.85,6400,-.9);
 assert(slow.bladePass<fast.bladePass);assert(slow.motorHz<fast.motorHz);assert(fast.loopRate>slow.loopRate);assert(fast.loopRate>coast.loopRate);assert(fast.filterHz>slow.filterHz);assert(fast.airGain>slow.airGain);
 return{slowBladeHz:slow.bladePass,fastBladeHz:fast.bladePass,fastAirGain:fast.airGain};
});

test('Damage increases hit body without changing energy-only defaults',()=>{
 const baseline=impactProfile(1000,'metal'),explicitZero=impactProfile(1000,'metal',0),lightDamage=impactProfile(1000,'metal',4),heavyDamage=impactProfile(1000,'metal',200);
 assert.deepEqual(baseline,explicitZero);assert(heavyDamage.damageStrength>lightDamage.damageStrength);assert(heavyDamage.gain>lightDamage.gain);assert(heavyDamage.duration>lightDamage.duration);assert(heavyDamage.frequency<lightDamage.frequency);
 return{baselineGain:baseline.gain,heavyGain:heavyDamage.gain,heavyDuration:heavyDamage.duration};
});

test('Tournament player bouts use the shared countdown state and cues',()=>{
 const main=readFileSync('src/main.ts','utf8');assert(!main.includes('directFight'));assert.equal((main.match(/void startMatch\(false,false\)/g)??[]).length,2);assert(main.includes("setState(practice?'practice':'countdown')"));assert(main.includes('Player bouts use the same arena countdown as Quick Fight'));
 assert.equal(startSignal(0).label,'3');assert.equal(startSignal(1.17).label,'2');assert.equal(startSignal(2.17).label,'1');assert.equal(startSignal(START_DURATION).label,'FIGHT!');
 return{countdownSeconds:START_DURATION,playerLaunches:2};
});

test('Supplied arena logo is local build branding',()=>{
 for(const file of['public/branding/arena-logo-64.png','public/branding/arena-logo-96.png','public/branding/arena-logo-256.png']){assert(existsSync(file));assert(statSync(file).size>1024);}
 const index=readFileSync('index.html','utf8');assert(index.includes('/branding/arena-logo-64.png'));assert(readFileSync('src/main.ts','utf8').includes('/branding/arena-logo-96.png'));
 return{localAssets:3};
});

writeFileSync('docs/presentation-profiles-results.json',JSON.stringify(results,null,2));
if(results.some(result=>result.status==='failed'))process.exitCode=1;
