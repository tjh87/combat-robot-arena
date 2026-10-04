import {clamp} from './model';
export type ImpactEnergyInput={impulse:number,closing:number,translationClosing:number,translationBudget:number,spinSpeed:number,spinWork:number,shear?:number};
export function normalKineticEnergy(massA:number,massB:number,closingSpeed:number){
 const a=Math.max(0,massA),b=Math.max(0,massB),effectiveMass=a&&b?a*b/(a+b):a||b;
 return .5*effectiveMass*Math.max(0,closingSpeed)**2;
}
// Decompose solved contact work. Robot speed supplies finite translation work.
// Rotor work is separate. Neither component adds a second copy of solved energy.
export function impactEnergy(input:ImpactEnergyInput){
 if(!Object.values(input).every(n=>Number.isFinite(n)))throw Error('Impact energy requires finite values.');
 const closing=Math.max(0,input.closing),solved=.5*Math.max(0,input.impulse)*closing,shear=Math.max(0,input.shear??0);
 const motionShare=clamp(Math.max(0,input.translationClosing)/Math.max(.001,closing),0,1);
 const spinShare=clamp(Math.max(0,input.spinSpeed)/Math.max(.001,closing),0,1-motionShare);
 const translation=Math.min(solved*motionShare,Math.max(0,input.translationBudget));
 const rotation=Math.min(solved*spinShare,Math.max(0,input.spinWork));
 const other=solved*Math.max(0,1-motionShare-spinShare)+shear;
 return{solved:solved+shear,translation,rotation,other,total:translation+rotation+other};
}
