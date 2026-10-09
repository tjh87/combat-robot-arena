import assert from 'node:assert/strict';
import {GameAudio} from '../src/audio';

class Param{value=0;setTargetAtTime(value:number){this.value=value;}setValueAtTime(value:number){this.value=value;}linearRampToValueAtTime(value:number){this.value=value;}exponentialRampToValueAtTime(value:number){this.value=value;}}
const sources:any[]=[];
const node=()=>({gain:new Param(),playbackRate:new Param(),frequency:new Param(),Q:new Param(),type:'sine',onended:null as null|(()=>void),connect(){},disconnect(){},start(){},stop(){}});
const pulse={duration:.55,id:'generated-countdown'} as unknown as AudioBuffer,fight={duration:.9,id:'generated-fight'} as unknown as AudioBuffer;
(globalThis as any).AudioContext=class{
 state='running';sampleRate=8000;currentTime=1;destination={};
 createGain=node;createOscillator=node;createBiquadFilter=node;
 createBufferSource(){const source={...node(),buffer:undefined as AudioBuffer|undefined};sources.push(source);return source;}
 createBuffer(_channels:number,length:number){const data=new Float32Array(length);return{getChannelData:()=>data,copyToChannel:(input:Float32Array)=>data.set(input)};}
 async decodeAudioData(bytes:ArrayBuffer){return new Uint8Array(bytes)[0]===1?pulse:fight;}
 resume(){return Promise.resolve();}close(){return Promise.resolve();}
};
const originalFetch=globalThis.fetch;
(globalThis as any).fetch=async(url:string)=>url.includes('countdown-pulse.mp3')?{ok:true,arrayBuffer:async()=>new Uint8Array([1]).buffer}:{ok:true,arrayBuffer:async()=>new Uint8Array([2]).buffer};
const audio=new GameAudio();
try{
 audio.start(.8,.8);await audio.countdownLoad;
 assert.equal(audio.countdownBuffers.pulse,pulse);assert.equal(audio.countdownBuffers.fight,fight);
 audio.updateCountdown(.16);assert.equal(audio.countdownStep,0,'No cue before threshold');
 audio.updateCountdown(.17);assert.equal(audio.countdownStep,1);assert.equal(sources.at(-1).buffer,pulse);
 const firstRate=sources.at(-1).playbackRate.value;
 audio.updateCountdown(1.17);assert.equal(audio.countdownStep,2);assert.equal(sources.at(-1).buffer,pulse);assert(sources.at(-1).playbackRate.value>firstRate,'warning pitches progress across the count');
 audio.updateCountdown(2.17);assert.equal(audio.countdownStep,3);assert.equal(sources.at(-1).buffer,pulse);
 audio.updateCountdown(3.15);assert.equal(audio.countdownStep,4);assert.equal(sources.at(-1).buffer,fight,'Fight cue must use its distinct emphatic horn');
 const countdownNodes=sources.slice(-4);assert(countdownNodes.every(source=>source.stop&&source.onended));
 audio.pauseCountdown();assert(countdownNodes.every(source=>source.onended===null),'Pausing cancels started samples without stale callbacks');
 audio.countdownBuffers={};assert(audio.countdownCue(false,0));assert(sources.length>=7,'Fallback oscillator buzzer remains available when samples have not loaded');
 console.log('PASS generated countdown pulse cadence, rising warning cues, distinct fight horn, interruption safety, and oscillator fallback');
}finally{audio.dispose();globalThis.fetch=originalFetch;}
