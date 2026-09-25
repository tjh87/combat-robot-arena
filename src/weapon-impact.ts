import {clamp,feedPerTooth,type Spinner} from './model';

export type ToothBite={depth:number,engagement:number,damageScale:number};

// Feed per tooth is the distance the target advances between successive teeth.
// The real insertion and the exposed tooth depth also limit the bite.
export function toothBite(w:Spinner,omega:number,feed:number,insertion:number,incidence:number,isTooth:boolean):ToothBite{
 if(!isTooth)return{depth:0,engagement:0,damageScale:.08};
 const advance=feedPerTooth(feed,w.teeth,omega)??0;
 const depth=Math.min(w.toothDepth,Math.max(0,insertion),advance);
 const engagement=clamp(depth/w.toothDepth,0,1)*clamp(incidence,0,1);
 return{depth,engagement,damageScale:.15+.85*engagement};
}

// Debit one shared rotor budget across all of its contacts in this step.
// Solved collision losses count already; this only removes any shortfall.
export function remainingSpin(omega:number,inertia:number,remainingEnergy:number){
 return Math.sign(omega)*Math.min(Math.abs(omega),Math.sqrt(2*Math.max(0,remainingEnergy)/Math.max(.000001,inertia)));
}
