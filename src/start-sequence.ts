// Three amber flashes and matching synthesized tones, then the green start cue.
export const START_DURATION=3.47;
export function startSignal(elapsed:number){
 const fight=elapsed>=3.15;
 return{fight,label:fight?'FIGHT!':String(Math.max(1,3-Math.floor(elapsed))),lit:fight||elapsed%1>=.17&&elapsed%1<.65};
}
export function startMarkup(){return `<span class="countdown-label">DRIVERS READY</span><div class="signal-rig" aria-hidden="true"><div class="signal-housing"><i></i><i></i><i></i></div><div class="signal-housing"><i></i><i></i><i></i></div></div><strong class="start-word">3</strong><span class="start-instruction">WEAPONS READY · STAND BY</span>`;}
