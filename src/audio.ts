import {combustionSamples,ENGINE_CADENCE,engineMix} from './icewave-audio';
import {clamp,isSpinner,type BotConfig} from './model';
import type {ImpactEvent} from './sim';
import {WEAPON_VOICES,weaponVoiceKey,weaponVoiceSamples} from './weapon-audio';
export type ImpactSurface='metal'|'plastic'|'rubber';
export const METAL_IMPACTS={tap:['steel_tap_01','steel_tap_02'],strike:['steel_strike_01','steel_strike_02','steel_strike_03'],crash:['steel_crash_01','steel_crash_02','steel_crash_03']} as const;
export const LANDING_IMPACTS={landLight:['landing_light_01'],landHeavy:['landing_heavy_01','landing_heavy_02']} as const;
export function impactSurface(module:string,material?:string):ImpactSurface{return material==='rubber'||!material&&module.startsWith('drive_')?'rubber':material==='uhmw'?'plastic':'metal';}
export function impactProfile(energy:number,surface:ImpactSurface='metal'){
 const strength=clamp(Math.log1p(Math.max(0,energy)/80)/Math.log1p(12000/80),0,1);
 return{strength,style:strength>.72?'crash' as const:strength>.34?'strike' as const:'tap' as const,gain:energy>0?.035+.85*strength**.8:0,duration:.12+strength*.74,frequency:surface==='metal'?135-50*strength:surface==='plastic'?220-80*strength:110-35*strength,cutoff:surface==='metal'?8500+strength*2500:surface==='plastic'?1600+strength*1400:600+strength*700};
}
// Contacts gain energy across several physics steps. Wait 83 ms to hear the
// strength of the hit, instead of permanently using its tiny first impulse.
export function readyImpactSounds(events:ImpactEvent[],tick:number,lastID:number){
 // Tyres can absorb the first downward impulse before the chassis hits.
 // Keep those later floor contacts in the same landing sound, instead of
 // layering a second metallic crash over the body impact.
 const landings=events.filter(e=>e.cause==='landing');
 events=events.map(e=>{
  if(e.cause!=='landing / arena')return e;
  const landing=landings.find(l=>l.target===e.target&&Math.abs(l.tick-e.tick)<24);
  return landing?{...e,cause:'landing',fallHeight:landing.fallHeight}:e;
 });
 const ready:ImpactEvent[]=[];let cursor=lastID;
 for(const e of events){if(e.id<=lastID)continue;if(tick-e.tick<(e.cause==='landing'?24:20))break;cursor=e.id;if(e.target!==null&&e.energy>=1&&e.cause!=='crush'&&e.cause!=='battery fire')ready.push(e);}
 // One mechanical hit can touch several panels. Use its strongest contact,
 // not stacked clangs. Separate robots and landings retain separate sounds.
 const grouped:ImpactEvent[]=[],sameHit=(a:ImpactEvent,b:ImpactEvent)=>a.target===b.target&&a.attacker===b.attacker&&a.cause===b.cause&&b.tick-a.tick>=0&&b.tick-a.tick<(b.cause==='landing'?24:20);
 for(const e of ready){
  if(events.some(old=>old.id<=lastID&&sameHit(old,e)))continue;
  const first=grouped.find(old=>sameHit(old,e));
  if(first)continue;const contacts=events.filter(candidate=>candidate.id>=e.id&&sameHit(e,candidate));grouped.push({...e,energy:e.cause==='landing'?contacts.reduce((sum,c)=>sum+c.energy,0):Math.max(...contacts.map(c=>c.energy)),fallHeight:Math.max(...contacts.map(c=>c.fallHeight??0))});
 }
 return{events:grouped,lastID:cursor};
}
export const exhaustSamples=(sampleRate:number)=>combustionSamples(sampleRate,'mid');
type LoopVoice={source:AudioBufferSourceNode,filter:BiquadFilterNode,gain:GainNode};
export class GameAudio{
 sparkBuffers=new Map<number,AudioBuffer>();
 fireLoops:LoopVoice[]=[];
 weaponLoops:(LoopVoice&{profile:string})[]=[];weaponBuffers=new Map<string,AudioBuffer>();combustionLoops:LoopVoice[][]=[];
 countdownStep=0;countdownVoices:{osc:OscillatorNode,gain:GainNode}[]=[];
 prepareEngineVoices(){
  const ctx=this.context;if(this.combustionLoops.length||!ctx)return;
  for(const [index,mode] of (['idle','mid','full'] as const).entries()){
   const samples=combustionSamples(ctx.sampleRate,mode),buffer=ctx.createBuffer(1,samples.length,ctx.sampleRate);buffer.getChannelData(0).set(samples);
   for(let bot=0;bot<2;bot++)(this.combustionLoops[bot]??=[])[index]=this.loopVoice(buffer,7000);
  }
 }
 resetEngines(){if(this.context)for(const voice of this.combustionLoops.flat().concat(this.fireLoops).filter(Boolean))voice.gain.gain.setTargetAtTime(0,this.context.currentTime,.02);}
 resetCountdown(){this.pauseCountdown();this.countdownStep=0;}
 pauseCountdown(){for(const voice of this.countdownVoices){voice.osc.onended=null;voice.osc.stop();voice.osc.disconnect();voice.gain.disconnect();}this.countdownVoices=[];}
 updateCountdown(elapsed:number){
  const cues=[.17,1.17,2.17,3.15];
  while(this.countdownStep<cues.length&&elapsed>=cues[this.countdownStep]){
   if(!this.countdownCue(this.countdownStep===3))return;
   this.countdownStep++;
  }
 }
 countdownCue(fight:boolean){
  const ctx=this.context;if(!ctx||ctx.state!=='running'||!this.sfx)return false;
  // Dedicated start tones cannot be dropped by the impact voice limit.
  const duration=fight?.30:.24,frequency=fight?950:480;
  for(const harmonic of [1,2]){
   const osc=ctx.createOscillator(),gain=ctx.createGain();osc.type='sine';osc.frequency.setValueAtTime(frequency*harmonic,ctx.currentTime);
   gain.gain.setValueAtTime(.0001,ctx.currentTime);gain.gain.linearRampToValueAtTime((fight?.18:.14)/harmonic,ctx.currentTime+.008);gain.gain.setValueAtTime((fight?.18:.14)/harmonic,ctx.currentTime+duration-.035);gain.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+duration);
   osc.connect(gain);gain.connect(this.sfx);const voice={osc,gain};this.countdownVoices.push(voice);osc.onended=()=>{osc.disconnect();gain.disconnect();this.countdownVoices=this.countdownVoices.filter(v=>v!==voice);};osc.start();osc.stop(ctx.currentTime+duration);
  }
  return true;
 }
 private loopVoice(buffer:AudioBuffer,band:number):LoopVoice{
  const ctx=this.context!,source=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),gain=ctx.createGain();source.buffer=buffer;source.loop=true;filter.type='lowpass';filter.frequency.value=band;gain.gain.value=0;source.connect(filter);filter.connect(gain);gain.connect(this.sfx!);source.start();return{source,filter,gain};
 }
 private fireVoice(bot:number){
  if(this.fireLoops[bot])return this.fireLoops[bot];const ctx=this.context!,buffer=ctx.createBuffer(1,ctx.sampleRate*2,ctx.sampleRate),samples=buffer.getChannelData(0);let seed=74913,low=0;
  for(let i=0;i<samples.length;i++){seed=(seed*1664525+1013904223)>>>0;const noise=seed/4294967296*2-1;low=.88*low+.12*noise;const t=i/ctx.sampleRate,crackle=Math.pow(Math.max(0,Math.sin(t*37+Math.sin(t*13))),18);samples[i]=clamp((noise-low)*(.20+crackle*.60)+low*.8,-1,1);}
  return this.fireLoops[bot]=this.loopVoice(buffer,4600);
 }
 private weaponVoice(bot:number,profile:string){
  let voice=this.weaponLoops[bot];if(voice?.profile===profile)return voice;
  if(voice){voice.source.stop();voice.source.disconnect();voice.filter.disconnect();voice.gain.disconnect();}
  let buffer=this.weaponBuffers.get(profile);if(!buffer){const ctx=this.context!;buffer=ctx.createBuffer(1,ctx.sampleRate*2,ctx.sampleRate);buffer.getChannelData(0).set(weaponVoiceSamples(profile,ctx.sampleRate));this.weaponBuffers.set(profile,buffer);}
  voice={...this.loopVoice(buffer,WEAPON_VOICES[profile].band),profile};this.weaponLoops[bot]=voice;return voice;
 }
 impactLibrary:Record<keyof typeof METAL_IMPACTS|keyof typeof LANDING_IMPACTS,AudioBuffer[]>={tap:[],strike:[],crash:[],landLight:[],landHeavy:[]};impactLoad?:Promise<void>;impactSerial=0;
 context?:AudioContext;master?:GainNode;sfx?:GainNode;voices=0;tones:{osc:OscillatorNode,gain:GainNode}[]=[];air:{source:AudioBufferSourceNode,filter:BiquadFilterNode,gain:GainNode}[]=[];available=true;
 start(master:number,sfx:number){try{if(!this.context){
 const ctx=this.context=new AudioContext();this.master=ctx.createGain();this.sfx=ctx.createGain();this.sfx.connect(this.master);
 if(ctx.createDynamicsCompressor){const limiter=ctx.createDynamicsCompressor();limiter.threshold.value=-5;limiter.knee.value=3;limiter.ratio.value=16;limiter.attack.value=.002;limiter.release.value=.12;this.master.connect(limiter);limiter.connect(ctx.destination);}else this.master.connect(ctx.destination);
 // Per robot: traction, blade-pass pulse, motor harmonics, low mechanical rumble.
 for(let i=0;i<8;i++){const osc=ctx.createOscillator(),gain=ctx.createGain();osc.type=i<2?'triangle':i<4?'sine':i<6?'sawtooth':'triangle';gain.gain.value=0;osc.connect(gain);gain.connect(this.sfx);osc.start();this.tones.push({osc,gain});}
 const buffer=ctx.createBuffer(1,ctx.sampleRate*2,ctx.sampleRate),data=buffer.getChannelData(0);let seed=98131,last=0;for(let i=0;i<data.length;i++){seed=(seed*1664525+1013904223)>>>0;last=.7*last+.3*(seed/4294967296*2-1);data[i]=last;}
 for(let i=0;i<2;i++){const source=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),gain=ctx.createGain();source.buffer=buffer;source.loop=true;filter.type='bandpass';filter.Q.value=.6;gain.gain.value=0;source.connect(filter);filter.connect(gain);gain.connect(this.sfx);source.start();this.air.push({source,filter,gain});}
 }this.loadMetalImpacts();this.prepareEngineVoices();this.volume(master,sfx);void this.context.resume().catch(()=>{this.available=false;});}catch{this.available=false;}}
 loadMetalImpacts(){
  const ctx=this.context;if(this.impactLoad||!ctx?.decodeAudioData||typeof fetch==='undefined')return;
  this.impactLoad=Promise.allSettled(Object.entries({...METAL_IMPACTS,...LANDING_IMPACTS}).flatMap(([style,names])=>names.map(async name=>{
   const response=await fetch('/audio/'+name+'.mp3');if(!response.ok)throw Error('Impact sample unavailable');const buffer=await ctx.decodeAudioData(await response.arrayBuffer());
   if(this.context===ctx)this.impactLibrary[style as keyof typeof METAL_IMPACTS|keyof typeof LANDING_IMPACTS].push(buffer);
  }))).then(()=>{});
 }
 volume(master:number,sfx:number){if(this.master)this.master.gain.value=master;if(this.sfx)this.sfx.gain.value=sfx;}
 beep(freq=600,duration=.12,volume=.12){if(this.context?.state!=='running'||!this.sfx||this.voices>=12)return;this.voices++;const ctx=this.context,osc=ctx.createOscillator(),gain=ctx.createGain();osc.type='sine';osc.frequency.setValueAtTime(freq,ctx.currentTime);gain.gain.setValueAtTime(volume,ctx.currentTime);gain.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+duration);osc.connect(gain);gain.connect(this.sfx);osc.start();osc.stop(ctx.currentTime+duration);osc.onended=()=>{osc.disconnect();gain.disconnect();this.voices--;};}
 spark(energy:number){
  if(this.context?.state!=='running'||!this.sfx||this.voices>=10||energy<200)return;
  const ctx=this.context,level=energy>14000?2:energy>3500?1:0;let buffer=this.sparkBuffers.get(level);
  if(!buffer){const data=sparkSoundSamples(ctx.sampleRate,level);buffer=ctx.createBuffer(1,data.length,ctx.sampleRate);buffer.copyToChannel(data,0);this.sparkBuffers.set(level,buffer);}
  const source=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),gain=ctx.createGain();source.buffer=buffer;source.playbackRate.value=.94+(this.impactSerial%5)*.03;
  filter.type='highpass';filter.frequency.value=2500;gain.gain.value=.10+level*.065;source.connect(filter);filter.connect(gain);gain.connect(this.sfx);this.voices++;source.start();
  source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect();this.voices=Math.max(0,this.voices-1);};
 }
 impact(energy:number,surface:ImpactSurface='metal',fallHeight?:number){
 if(surface==='metal'&&fallHeight===undefined)this.spark(energy);
 if(energy<=0||this.context?.state!=='running'||!this.sfx||this.voices>=12)return;this.voices++;
 const ctx=this.context,p=impactProfile(energy,surface),serial=this.impactSerial++,landing=fallHeight!==undefined,heavyLanding=landing&&(fallHeight>.65||energy>2500),clips=this.impactLibrary[landing?(heavyLanding?'landHeavy':'landLight'):p.style],recorded=(landing||surface==='metal')&&clips.length>0,buffer=recorded?clips[serial%clips.length]:ctx.createBuffer(1,Math.ceil(ctx.sampleRate*p.duration),ctx.sampleRate),data=recorded?undefined:buffer.getChannelData(0);let seed=73221+serial*7919,low=0;
 if(data){
 for(let i=0;i<data.length;i++){
  const t=i/ctx.sampleRate;seed=(seed*1664525+1013904223)>>>0;const noise=seed/4294967296*2-1;low=.86*low+.14*noise;
  const attack=Math.min(1,t/.0005),envelope=attack*Math.exp(-t/(.018+p.strength*.08));
  // Short broadband deformation, without pitched bell or pan resonances.
  const ring=!landing&&surface==='metal'?low*.30*Math.exp(-t/(.035+p.strength*.085)):0;
  const thump=Math.sin(2*Math.PI*(55+35*(1-p.strength))*t)*p.strength*.48*Math.exp(-t/.10);
  data[i]=clamp((landing?low*2.8:surface==='rubber'?low*2:noise)*envelope*.66+ring+thump*(landing?1.25:1),-1,1);
 }}
 const source=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),gain=ctx.createGain();source.buffer=buffer;if(recorded)source.playbackRate.value=landing?(heavyLanding?.90:.98)-p.strength*.025+(serial%3-1)*.008:1-p.strength*.10+(serial%3-1)*.012;filter.type='lowpass';filter.frequency.value=landing?(heavyLanding?2100:3000):p.cutoff;gain.gain.value=landing?Math.min(.95,p.gain+.08):p.gain;
 source.connect(filter);filter.connect(gain);gain.connect(this.sfx);source.start();source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect();this.voices=Math.max(0,this.voices-1);};
 }
 motors(speeds:number[],rpms:number[],active:boolean,configs:BotConfig[]=[],watts:number[]=[],enabled:boolean[]=[],actuatorSpeeds:number[]=[],burning:number[]=[]){
 if(!this.context)return;const now=this.context.currentTime;
 for(let bot=0;bot<2;bot++){
 const fire=burning[bot]>0?this.fireVoice(bot):this.fireLoops[bot];if(fire)fire.gain.gain.setTargetAtTime(active&&burning[bot]>0?(bot===0?.16:.11):0,now,.06);
 const c=configs[bot],profile=weaponVoiceKey(c),timbre=WEAPON_VOICES[profile],w=c?.weapon,rpm=Math.max(0,rpms[bot]??0),rps=rpm/60,spin=w&&isSpinner(w),speed=spin?clamp(rpm/w.rpm,0,1):0,gas=c?.chassis.profile==='icewave',shell=w?.type==='shell_spinner',drum=w?.type==='drum',disc=w?.type==='vertical_disc'||w?.type==='hammer_saw',cage=w?.type==='horizontal_cage',big=c?.chassis.profile==='deep_six',load=clamp((watts[bot]??0)/8640,0,1),attenuation=bot===0?1:.62,actuator=clamp(Math.abs(actuatorSpeeds[bot]??0)/4,0,1),running=enabled[bot]??rpm>30;
 const loop=this.weaponVoice(bot,profile),pump=spin?0:clamp(actuator*.75+load*.55,0,1);loop.source.playbackRate.setTargetAtTime(spin?.3+speed*1.15:.72+pump*.44,now,.10);loop.filter.frequency.setTargetAtTime(timbre.band*(.45+speed*.55+pump*.4),now,.1);loop.gain.gain.setTargetAtTime(active&&!gas?(spin?speed:pump)*timbre.gain*attenuation:0,now,.07);
 const frequencies=[35+(speeds[bot]??0)*24,Math.max(18,rps*(spin?w.teeth:2)),gas?90+speed*80:Math.max(40,rps*(spin?w.ratio:2)*(drum?8:disc?7:6)),gas?45+speed*40:Math.max(20,rps*(shell?1.5:cage?1:2))+actuator*80];
 const gains=[Math.min(.018,(speeds[bot]??0)*.007),speed*(drum?.040:big?.038:cage?.032:.026),speed*(gas?.007:disc?.015:.010)*(1+load*.5),speed*(shell?.034:big?.028:.016)+actuator*.023];
 if(!spin){frequencies[2]=220+actuator*360;gains[2]=actuator*.025;}
 for(let layer=0;layer<4;layer++){const tone=this.tones[layer*2+bot];if(!tone)continue;tone.osc.frequency.setTargetAtTime(frequencies[layer],now,.07);tone.gain.gain.setTargetAtTime(active&&(!gas||layer===0)?gains[layer]*attenuation*.45:0,now,.07);}
 const air=this.air[bot];if(air){air.filter.frequency.setTargetAtTime(160+speed*(shell?750:drum?2800:disc?2100:1400)+actuator*1800,now,.10);air.gain.gain.setTargetAtTime(active?(speed*speed*(gas?.014:shell?.11:big?.10:.07)+actuator*.055)*attenuation:0,now,.12);}
 const engine=engineMix(speed),combustion=this.combustionLoops[bot];
 if(combustion)for(const [index,mode] of (['idle','mid','full'] as const).entries()){
  const voice=combustion[index];if(!voice)continue;
  voice.source.playbackRate.setTargetAtTime(engine.hz/ENGINE_CADENCE[mode],now,.065);
  voice.filter.frequency.setTargetAtTime(engine.cutoff+load*700,now,.08);
  voice.gain.gain.setTargetAtTime(active&&gas?Math.sqrt(engine.levels[index])*(.26+speed*.35+load*.07)*attenuation:0,now,.065);
 }

 }
 }

 mute(){if(!this.context)return;for(const tone of [...this.tones,...this.air,...this.weaponLoops,...this.fireLoops.filter(Boolean),...this.combustionLoops.flat().filter(Boolean)])tone.gain.gain.setTargetAtTime(0,this.context.currentTime,.025);}
 dispose(){this.resetEngines();this.pauseCountdown();this.tones.forEach(t=>{t.osc.stop();t.osc.disconnect();t.gain.disconnect();});this.tones=[];[...this.air,...this.weaponLoops,...this.fireLoops.filter(Boolean),...this.combustionLoops.flat().filter(Boolean)].forEach(a=>{a.source.stop();a.source.disconnect();a.filter.disconnect();a.gain.disconnect();});this.air=[];this.weaponLoops=[];this.fireLoops=[];this.weaponBuffers.clear();this.sparkBuffers.clear();this.combustionLoops=[];void this.context?.close();this.context=undefined;this.impactLibrary={tap:[],strike:[],crash:[],landLight:[],landHeavy:[]};this.impactLoad=undefined;}
}

export function sparkSoundSamples(sampleRate:number,level:number){
 const duration=.10+level*.08,data=new Float32Array(Math.ceil(sampleRate*duration));let seed=1927+level*313,prior=0;
 for(let i=0;i<data.length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const noise=seed/4294967296*2-1,t=i/sampleRate,burst=Math.pow(Math.max(0,Math.sin(t*(370+level*83))),12);data[i]=.65*(noise-prior*.72)*(.22+burst*.60)*Math.exp(-t/(.026+level*.02));prior=noise;}return data;
}
