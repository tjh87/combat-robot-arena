import {clamp,isSpinner,type BotConfig} from './model';
type Voice={label:string,base:number,pulse:number,harmonics:number[],noise:number,roughness:number,band:number,gain:number};
export const WEAPON_VOICES:Record<string,Voice>={
 tombstone:{label:'Heavy bar · twin chop',base:48,pulse:26,harmonics:[1,.48,.25,.16,.09],noise:.32,roughness:.8,band:1400,gain:.17},
 minotaur:{label:'Drum · dense rasp',base:132,pulse:88,harmonics:[.55,1,.62,.18,.3,.12],noise:.48,roughness:.48,band:3300,gain:.15},
 hydra:{label:'Hydraulics · pressure release',base:74,pulse:12,harmonics:[1,.3,.08],noise:.62,roughness:.18,band:2400,gain:.19},
 icewave:{label:'Two-stroke · combustion pulses',base:90,pulse:45,harmonics:[1,.72,.4,.26,.18],noise:.5,roughness:.9,band:3100,gain:.06},
 hypershock:{label:'Twin discs · electric whine',base:196,pulse:62,harmonics:[.45,.95,.1,.48,.13],noise:.2,roughness:.22,band:3900,gain:.13},
 gigabyte:{label:'Shell · hollow turbine',base:38,pulse:33,harmonics:[1,.12,.55,.08,.27],noise:.65,roughness:.4,band:1000,gain:.2},
 whyachi:{label:'Three hammers · triple beat',base:54,pulse:39,harmonics:[1,.08,.75,.1,.21,.36],noise:.36,roughness:.95,band:1550,gain:.2},
 huge:{label:'Wide bar · slow blade sweep',base:62,pulse:17,harmonics:[1,.18,.08,.3],noise:.58,roughness:.92,band:1900,gain:.18},
 sawblaze:{label:'Hammer saw · chain rasp',base:168,pulse:116,harmonics:[.35,.6,1,.55,.27,.18],noise:.55,roughness:.6,band:4600,gain:.15},
 deep_six:{label:'Heavy vertical · flywheel roar',base:32,pulse:22,harmonics:[1,.76,.42,.25,.31,.12],noise:.55,roughness:.88,band:2300,gain:.22},
 quantum:{label:'Crusher · loaded hydraulic pump',base:108,pulse:18,harmonics:[.7,1,.18,.08,.32],noise:.42,roughness:.28,band:1700,gain:.18},
};

export type WeaponSpinSound={active:boolean,normalized:number,bladePass:number,motorHz:number,loopRate:number,filterHz:number,loopGain:number,bladeGain:number,motorGain:number,airHz:number,airGain:number};
export function weaponSpinSound(config:BotConfig|undefined,rpm:number,watts=0,acceleration=0):WeaponSpinSound{
 const weapon=config?.weapon;if(!weapon||!isSpinner(weapon))return{active:false,normalized:0,bladePass:0,motorHz:0,loopRate:0,filterHz:0,loopGain:0,bladeGain:0,motorGain:0,airHz:0,airGain:0};
 const value=Number.isFinite(rpm)?Math.max(0,rpm):0,normalized=clamp(value/Math.max(1,weapon.rpm),0,1.15),rps=value/60,load=clamp(watts/8640,0,1),ramp=clamp(Math.max(0,acceleration),0,2),drum=weapon.type==='drum',disc=weapon.type==='vertical_disc'||weapon.type==='hammer_saw',shell=weapon.type==='shell_spinner',cage=weapon.type==='horizontal_cage',motorScale=drum?8:disc?7:6,bladePass=Math.max(18,rps*Math.max(1,weapon.teeth)),motorHz=Math.max(40,rps*Math.max(1,weapon.ratio)*motorScale),loopRate=.30+Math.pow(normalized,.66)*1.17+ramp*.055,filterHz=520+Math.pow(normalized,.58)*4300+load*650+ramp*850,loopGain=normalized*(.88+load*.12+ramp*.08),bladeGain=normalized*(.84+ramp*.16),motorGain=normalized*(.84+load*.16),airHz=180+normalized*(shell?800:drum?2920:disc?2240:1480)+ramp*780,airGain=normalized*normalized*(.82+load*.18)+ramp*.06;
 return{active:true,normalized,bladePass,motorHz,loopRate,filterHz,loopGain,bladeGain,motorGain,airHz,airGain};
}
export function weaponVoiceKey(c?:BotConfig){
 const key=c?.chassis.profile;if(key&&WEAPON_VOICES[key])return key;
 const types:Record<string,string>={drum:'minotaur',flipper:'hydra',crusher:'quantum',vertical_disc:'hypershock',shell_spinner:'gigabyte',horizontal_cage:'whyachi',hammer_saw:'sawblaze',vertical_bar:'deep_six'};
 return types[c?.weapon.type??'']??'tombstone';
}
export function weaponVoiceSamples(key:string,sampleRate:number){
 const p=WEAPON_VOICES[key]??WEAPON_VOICES.tombstone,data=new Float32Array(sampleRate*2),sum=p.harmonics.reduce((a,b)=>a+b,0);let seed=key.split('').reduce((s,c)=>s*31+c.charCodeAt(0),17)>>>0,low=0;
 for(let i=0;i<data.length;i++){
  const t=i/sampleRate;seed=(seed*1664525+1013904223)>>>0;const noise=seed/4294967296*2-1;low+=.18*(noise-low);
  const phase=2*Math.PI*p.base*t,beat=(1+Math.cos(2*Math.PI*p.pulse*t))*.5,envelope=1-p.roughness+p.roughness*Math.pow(beat,3);
  let tone=0;for(let j=0;j<p.harmonics.length;j++)tone+=Math.sin(phase*(j+1)+.08*Math.sin(2*Math.PI*6*t))*p.harmonics[j]/sum;
  data[i]=Math.tanh((tone*(1-p.noise)+((key==='gigabyte'||key==='deep_six')?low*3:noise)*p.noise)*envelope*1.8)*.7;
 }
 const seam=Math.floor(sampleRate*.025);for(let i=0;i<seam;i++){const mix=i/seam;data[data.length-seam+i]=data[data.length-seam+i]*(1-mix)+data[i]*mix;}
 return data;
}
