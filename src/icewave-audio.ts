export const ENGINE_CADENCE={idle:48,mid:96,full:160} as const;
export type EngineMode=keyof typeof ENGINE_CADENCE;
// All layers follow one firing cadence. RPM, not elapsed time, determines
// pitch, intake brightness and the idle/load blend, including after a hit.
export function engineMix(speed:number){
 const s=Math.max(0,Math.min(1,speed)),hz=48+112*Math.pow(s,.8),blend=s*2;
 return{hz,levels:[Math.max(0,1-blend),1-Math.abs(blend-1),Math.max(0,blend-1)],cutoff:2400+4200*s};
}
// Original two-stroke voice. Short, irregular combustion/exhaust bursts excite
// the muffler and cylinder; filtered induction noise supplies the cutting rasp.
// No recorded engine samples, bass oscillator or clipped saw wave are used.
export function combustionSamples(sampleRate:number,mode:EngineMode){
 const duration=4,data=new Float32Array(Math.round(sampleRate*duration)),load=mode==='idle'?0:mode==='mid'?.5:1,hz=ENGINE_CADENCE[mode];
 let seed=31847+Math.round(load*971),phase=0,cycleGain=1,cycleRate=1,age=1,air=0,low=0,previous=0,high=0,rateNoise=0;
 const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296*2-1;};
 const hp=Math.exp(-2*Math.PI*210/sampleRate),airRate=1-Math.exp(-2*Math.PI*Math.min(5800,sampleRate*.4)/sampleRate),lowRate=1-Math.exp(-2*Math.PI*700/sampleRate);
 const resonators=[{hz:620,decay:.0022,gain:.20},{hz:1420,decay:.0013,gain:.38},{hz:2860,decay:.0008,gain:.32}].map(r=>({...r,a:0,b:0,radius:Math.exp(-1/(r.decay*sampleRate)),angle:2*Math.PI*Math.min(r.hz,sampleRate*.42)/sampleRate}));
 for(let i=0;i<data.length;i++){
  const t=i/sampleRate,noise=random();rateNoise+=.0015*(noise-rateNoise);
  phase+=hz*(cycleRate+.012*Math.sin(t*23)+rateNoise*.25)/sampleRate;age+=1/sampleRate;
  let fire=0;if(phase>=1){phase-=1;age=0;cycleGain=.76+.24*random();cycleRate=1+random()*(.025-.014*load);fire=cycleGain;}
  air+=airRate*(noise-air);low+=lowRate*(air-low);const rasp=air-low;
  // Burst duration stays in seconds: pressure cracks do not become slow puffs
  // at idle. Each cycle has different turbulence and small timing variations.
  const burst=Math.exp(-age/(.0011+.0005*load)),pressure=(1-age/.00022)*Math.exp(-age/.00022)*cycleGain;
  let resonance=0;for(const r of resonators){const out=2*r.radius*Math.cos(r.angle)*r.a-r.radius*r.radius*r.b+fire*.25+rasp*burst*.055;r.b=r.a;r.a=out;resonance+=out*r.gain;}
  const port=rasp*(.12+.18*load+burst*(1.4+load*.8))*cycleGain;
  const mechanical=rasp*Math.exp(-Math.abs(phase-.55)*38)*(.10+.12*load);
  const raw=pressure*.17+resonance+port+mechanical;
  high=hp*(high+raw-previous);previous=raw;data[i]=high;
 }
 // Preserve transients with headroom; hard saturation made the old voice buzzy.
 const peak=data.reduce((n,x)=>Math.max(n,Math.abs(x)),.001),gain=.79/peak;
 for(let i=0;i<data.length;i++)data[i]*=gain;
 const seam=Math.round(sampleRate*.025);for(let i=0;i<seam;i++){const mix=i/seam;data[data.length-seam+i]=data[data.length-seam+i]*(1-mix)+data[i]*mix;}
 return data;
}
