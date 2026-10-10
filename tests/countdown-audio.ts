import assert from 'node:assert/strict';
import {GameAudio} from '../src/audio';

class Param{value=0;setTargetAtTime(value:number){this.value=value;}setValueAtTime(value:number){this.value=value;}linearRampToValueAtTime(value:number){this.value=value;}exponentialRampToValueAtTime(value:number){this.value=value;}}
const oscillators:any[]=[],bufferSources:any[]=[];
const node=()=>({gain:new Param(),playbackRate:new Param(),frequency:new Param(),Q:new Param(),type:'sine',onended:null as null|(()=>void),connect(){},disconnect(){},start(){},stop(){}});
(globalThis as any).AudioContext=class{
 state='running';sampleRate=8000;currentTime=1;destination={};
 createGain=node;createOscillator(){const osc=node();oscillators.push(osc);return osc;}createBiquadFilter=node;
 createBufferSource(){const source=node();bufferSources.push(source);return source;}
 createBuffer(_channels:number,length:number){const data=new Float32Array(length);return{duration:length/8000,getChannelData:()=>data,copyToChannel:(input:Float32Array)=>data.set(input)};}
 resume(){return Promise.resolve();}close(){return Promise.resolve();}
};
const originalFetch=globalThis.fetch;
// Countdown and recorded impact sounds require no fetch; suppress unrelated
// asynchronous asset loading in this focused oscillator test.
(globalThis as any).fetch=undefined;
const audio=new GameAudio();
try{
 audio.start(.8,.8);const baseline=oscillators.length;
 audio.updateCountdown(.16);assert.equal(audio.countdownStep,0);assert.equal(oscillators.length,baseline);
 audio.updateCountdown(.17);assert.equal(audio.countdownStep,1);assert.equal(oscillators.length,baseline+2);
 assert(oscillators.slice(baseline,baseline+2).every(osc=>osc.type==='sine'));
 assert.deepEqual(oscillators.slice(baseline,baseline+2).map(osc=>osc.frequency.value),[480,960]);
 audio.updateCountdown(1.17);assert.equal(audio.countdownStep,2);assert.equal(oscillators.length,baseline+4);
 assert.deepEqual(oscillators.slice(baseline+2,baseline+4).map(osc=>osc.frequency.value),[480,960],'countdown numbers retain the prior paired 480/960 Hz tones');
 audio.updateCountdown(2.17);assert.equal(audio.countdownStep,3);assert.equal(oscillators.length,baseline+6);
 audio.updateCountdown(3.15);assert.equal(audio.countdownStep,4);assert.equal(oscillators.length,baseline+8);
 assert.deepEqual(oscillators.slice(baseline+6,baseline+8).map(osc=>osc.frequency.value),[950,1900],'FIGHT retains the prior paired 950/1900 Hz cue');
 const cues=oscillators.slice(-2);audio.pauseCountdown();assert(cues.every(osc=>osc.onended===null),'Stopping the countdown detaches callbacks');
 const steelCrash={existingSteelCrash:true} as unknown as AudioBuffer;audio.impactLibrary.crash=[steelCrash];
 audio.impact(12000,'metal');assert.equal(bufferSources.at(-1).buffer,steelCrash,'high-energy weapon hits use the existing steel crash clip');bufferSources.at(-1).onended();bufferSources.at(-2).onended();
 audio.impact(1000,'metal');assert.notEqual(bufferSources.at(-1).buffer,steelCrash,'ordinary hits retain their usual impact-profile routing');bufferSources.at(-1).onended();
 const wall={approvedPolycarbonate:true} as unknown as AudioBuffer;audio.impactLibrary.wallHit=[wall];audio.impact(7000,'plastic',undefined,0,true);assert.equal(bufferSources.at(-1).buffer,wall,'the approved wall-hit sample remains unchanged');bufferSources.at(-1).onended();
 console.log('PASS prior oscillator countdown cadence, steel crash weapon impacts, polycarbonate wall sound, and cancellation');
}finally{audio.dispose();globalThis.fetch=originalFetch;}
