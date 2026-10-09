import assert from 'node:assert/strict';
import {GameAudio,readyImpactSounds} from '../src/audio';
import {Simulation,initializePhysics,neutral,opponentFlungWallImpact} from '../src/sim';
import {RULES,preset,v,add,bodyOrigin,identity,weaponAxis,mul,isSpinner,type Vec} from '../src/model';
import {matchFrame} from '../server/frames';
import {decodeFrame,encodeFrame} from '../src/online/protocol';

const audioSources:any[]=[];
class AudioParam {value=0;setTargetAtTime(value:number){this.value=value;}setValueAtTime(value:number){this.value=value;}linearRampToValueAtTime(value:number){this.value=value;}exponentialRampToValueAtTime(value:number){this.value=value;}}
const audioNode=()=>({gain:new AudioParam(),playbackRate:new AudioParam(),frequency:new AudioParam(),Q:new AudioParam(),connect(){},disconnect(){},start(){},stop(){}});
(globalThis as any).AudioContext=class {state='running';sampleRate=8000;currentTime=1;destination={};createGain=audioNode;createOscillator=audioNode;createBiquadFilter=audioNode;createBufferSource(){const source=audioNode();audioSources.push(source);return source;}createBuffer(_channels:number,length:number){const data=new Float32Array(length);return{getChannelData:()=>data,copyToChannel:(values:Float32Array)=>data.set(values)};}resume(){return Promise.resolve();}close(){return Promise.resolve();}};

const audio=new GameAudio();
try{
 audio.start(.8,.8);
 const heavy={id:'polycarbonate-heavy-thump'} as unknown as AudioBuffer,flex={id:'polycarbonate-flex-rebound'} as unknown as AudioBuffer,landing={id:'existing-landing'} as unknown as AudioBuffer;
 audio.impactLibrary.wallHit=[heavy,flex];
 audio.impact(7000,'plastic',undefined,0,true);assert.equal(audioSources.at(-1).buffer,heavy,'first attributed wall hit selects the heavy-thump clip');audioSources.at(-1).onended();
 audio.impact(7000,'plastic',undefined,0,true);assert.equal(audioSources.at(-1).buffer,flex,'next attributed wall hit selects the flex-rebound clip');audioSources.at(-1).onended();
 audio.impactLibrary.landHeavy=[landing];audio.impact(7000,'plastic',1,0,true);assert.equal(audioSources.at(-1).buffer,landing,'a landing remains on its existing landing sound even if a flag is supplied');audioSources.at(-1).onended();
 assert.equal(audio.voices,0);
 console.log('PASS approved polycarbonate sounds alternate; landing samples remain isolated');
}finally{audio.dispose();}

const windowTicks=1.5*RULES.hz;
assert.deepEqual(opponentFlungWallImpact('east',1,0,10,10),{wall:'east',flungBy:0});
assert.deepEqual(opponentFlungWallImpact('west',0,1,10,10),{wall:'west',flungBy:1});
assert.deepEqual(opponentFlungWallImpact('north',1,0,0,windowTicks),{wall:'north',flungBy:0},'the attribution boundary is inclusive');
assert.deepEqual(opponentFlungWallImpact('south',1,0,0,windowTicks),{wall:'south',flungBy:0});
assert.equal(opponentFlungWallImpact(undefined,1,0,0,1),undefined,'floor and non-wall contacts are excluded');
assert.equal(opponentFlungWallImpact('east',1,null,0,1),undefined,'unattributed wall contact remains unchanged');
assert.equal(opponentFlungWallImpact('east',1,1,0,1),undefined,'self-attribution is excluded');
assert.equal(opponentFlungWallImpact('east',1,0,0,windowTicks+1),undefined,'old hits do not attribute a wall impact');
assert.equal(opponentFlungWallImpact('east',1,0,11,10),undefined,'future action timestamps are rejected');
const coalesced=readyImpactSounds([
 {id:1,tick:0,episode:'plain-wall',source:'Arena contact',attacker:null,target:1,module:'chassis',energy:900,impulse:0,closing:0,point:v(6,1,0),rotorBefore:[0,0],rotorAfter:[0,0],allocations:[],cause:'collision'},
 {id:2,tick:1,episode:'opponent-wall',source:'Arena contact',attacker:null,target:1,module:'chassis',energy:7000,impulse:0,closing:0,point:v(6,1,0),rotorBefore:[0,0],rotorAfter:[0,0],allocations:[],cause:'collision',arenaWallImpact:{wall:'east',flungBy:0}},
],22,0);
assert.equal(coalesced.events.length,2,'unattributed and opponent-flung wall impacts must not merge into a generic sound');
assert.deepEqual(coalesced.events[1].arenaWallImpact,{wall:'east',flungBy:0});

await initializePhysics();
function pose(sim:Simulation,id:number,position:Vec){const bot=sim.bots[id];for(const[key,body]of bot.bodies){body.setTranslation(add(position,bodyOrigin(bot.compiled.config,key)),true);body.setRotation(identity,true);body.setLinvel(v(),true);body.setAngvel(v(),true);}sim.world.propagateModifiedBodyPositionsToColliders();}
function wallContact(recentOpponentHit:boolean){
 const sim=new Simulation([preset(0),preset(1)],{practice:true,hazards:false,ai:[false,false],autoUnstick:false,recordVisuals:false});
 try{
  const bot=sim.bots[0],config=bot.compiled.config,weapon=config.weapon;assert(isSpinner(weapon));
  pose(sim,0,v(6.3,.14,3));pose(sim,1,v(-4,.14,-3));bot.lastAttacker=recentOpponentHit?1:null;bot.lastAction=recentOpponentHit?sim.tick:-10000;bot.energy=0;bot.weaponOn=false;
  bot.rotor!.setAngvel(mul(weaponAxis(weapon),weapon.rpm*Math.PI/30),true);for(const body of bot.bodies.values())body.setLinvel(v(3,0,0),true);
  for(let i=0;i<360;i++){sim.step([neutral(),neutral()]);if(sim.events.some(event=>event.target===0&&event.attacker===null&&event.module==='weapon'&&event.rotorBefore[0]>1000))break;}
  assert.equal(sim.fault,undefined);
  const contacts=sim.events.filter(event=>event.target===0&&event.attacker===null&&event.module==='weapon'&&event.rotorBefore[0]>1000);
  assert(contacts.length>0,'fixture must create a real spinning-weapon contact with the arena wall');
  const tagged=contacts.find(event=>event.arenaWallImpact);
  assert.equal(Boolean(tagged),recentOpponentHit,'only a recent opponent-attributed wall hit should be tagged');
  if(tagged){assert.equal(tagged.arenaWallImpact?.wall,'east');assert.equal(tagged.arenaWallImpact?.flungBy,1);const frame=matchFrame(sim,'wall-audio-test',1,1,'fight',0,[0,0],[0,0]),decoded=decodeFrame(encodeFrame(frame)),effect=decoded.visual.effects.find(item=>item.id===tagged.id);assert.deepEqual(effect?.arenaWallImpact,{wall:'east',flungBy:1},'the authoritative online snapshot must preserve wall attribution');}
  return{recentOpponentHit,wallContacts:contacts.length,tagged:Boolean(tagged)};
 }finally{sim.dispose();}
}
const recent=wallContact(true),unattributed=wallContact(false);
assert(recent.tagged&&!unattributed.tagged);
console.log('PASS real wall-contact attribution and online-frame round trip',JSON.stringify({windowTicks,recent,unattributed}));
