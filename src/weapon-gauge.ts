import {rpmPresentation,robotSilhouette,RPM_SILHOUETTE_MARKUP} from './rpm-presentation';
import {clamp,isSpinner,flipEnergy,rotate,v} from './model';
import {damageStatus} from './combat-damage';
import {QUANTUM_HYDRAULICS} from './weapon-specs';
import type {Bot} from './sim';

export const WEAPON_GAUGE_MARKUP=`<section class="weapon-gauge" id="weapon-gauge" role="meter" aria-label="Weapon speed" aria-describedby="gauge-name gauge-label" aria-valuemin="0" aria-valuemax="100">
 <header class="gauge-header"><div class="gauge-identity"><strong id="gauge-name">Robot</strong><span id="gauge-label">Weapon</span></div><span class="gauge-silhouette-slot">${RPM_SILHOUETTE_MARKUP}</span><span id="gauge-state">Weapon off</span></header>
 <div class="gauge-body"><div class="gauge-dial"><svg viewBox="0 0 140 140" aria-hidden="true"><circle class="gauge-track" cx="70" cy="70" r="60"/><circle id="gauge-speed" cx="70" cy="70" r="60" pathLength="100"/></svg><div class="gauge-readout"><strong id="gauge-rpm">0</strong></div></div>
 <div class="gauge-details"><div class="gauge-metric-row"><span id="gauge-metric">Spin speed</span><small id="gauge-unit">RPM</small></div><strong id="gauge-level">0% of max</strong><span id="gauge-watts">Motor 0 kW</span><span id="gauge-output">100% power</span></div><span class="gauge-rpm-track gauge-power-track" aria-hidden="true"><i id="gauge-power"></i></span></div>
 <footer class="gauge-actions"><span id="gauge-primary"><kbd id="gauge-key">SPACE</kbd><span id="gauge-action">Start weapon</span></span><span id="gauge-secondary" class="hidden"><kbd id="gauge-strike-key">SHIFT</kbd><span id="gauge-strike-action">Swing saw</span></span></footer>
</section>`;

// Hydra uses this same compact panel for live flip advice instead of a flip count.
export const HYDRA_GAUGE_MARKUP=WEAPON_GAUGE_MARKUP.replace(/<div class="gauge-body">[\s\S]*?(?= <footer)/,`<div class="flip-cue gauge-flip-assist" id="flip-cue" role="status"><span id="flip-cue-key">FLIP ASSIST</span><strong id="flip-cue-title"></strong><small id="flip-cue-detail"></small></div>\n`);

const decimal=(n:number)=>n.toLocaleString(undefined,{maximumFractionDigits:1});
const weaponNames:Record<string,string>={horizontal_bar:'Bar spinner',horizontal_cage:'Cage spinner',vertical_disc:'Disc spinner',vertical_bar:'Vertical spinner',drum:'Drum spinner',shell_spinner:'Shell spinner',hammer_saw:'Hammer saw',flipper:'Flipper',crusher:'Crusher',none:'Push bot'};
export function updateWeaponGauge(root:HTMLElement,b:Bot,keys:{weapon:string,strike:string,reduced?:boolean}){
 const c=b.compiled.config,w=c.weapon,hydra=c.chassis.profile==='hydra'&&w.type==='flipper',spin=isSpinner(w),output=damageStatus(b.modules).weaponOutput,watts=b.weaponWatts??0;
 const ratio=spin?clamp(b.rpm/w.rpm,0,1):w.type==='crusher'?clamp(b.crushForce/QUANTUM_HYDRAULICS.rearForce,0,1):w.type==='flipper'?1:0;
 let label=weaponNames[w.type]??'Spinner',state='No weapon',value='—',unit='NO WEAPON',metric='Drive only',level='Push to attack',power='',action='',aria='No active weapon';
 if(spin){
  state=b.weaponOn?(b.spinDirection!==w.direction?'Reverse spin':ratio<.92?'Spinning up':'At speed'):b.rpm>50?'Slowing down':'Weapon off';
  value=Math.round(b.rpm).toLocaleString();unit='RPM';metric='Spin speed';level=Math.round(ratio*100)+'% of max';power='Motor '+decimal(watts/1000)+' kW';action=b.weaponOn?'Stop weapon':'Start weapon';aria=Math.round(b.rpm)+' RPM, '+decimal(watts/1000)+' kilowatts';
 }else if(w.type==='crusher'){
  state=b.weaponOn?(b.crushPhase==='pressure'?'Crushing':'Closing jaw'):Math.abs(b.crushAngle)>.05?'Opening jaw':'Jaw open';
  value=decimal(b.crushForce/1000);unit='kN';metric='Jaw force';level=Math.round(b.crushForce/4.4482216153).toLocaleString()+' lbf';power='Pump '+decimal(watts/1000)+' kW';action=b.weaponOn?'Release jaw':'Close jaw';aria=decimal(b.crushForce/1000)+' kilonewtons';
 }else if(w.type==='flipper'){
  state=b.flipStart>=0?'Flipping':'Ready';value='∞';unit='FLIPS';metric='Flips available';level='Unlimited';power=decimal(flipEnergy(c)/1000)+' kJ per flip';action='Fire flipper';aria='Unlimited flips';
 }
 const active=b.weaponOn||b.flipStart>=0;if(output<.999&&active)state='Reduced power';
 const text=(id:string,value:string)=>{const el=root.querySelector<HTMLElement>('#'+id)!;if(el&&el.textContent!==value)el.textContent=value;};
 for(const[id,content]of Object.entries({'gauge-name':c.identity.name,'gauge-label':label,'gauge-state':state,'gauge-rpm':value,'gauge-unit':w.type==='none'?'':unit,'gauge-metric':metric,'gauge-level':level,'gauge-watts':power,'gauge-output':w.type==='none'?'':Math.round(output*100)+'% power','gauge-key':keys.weapon,'gauge-action':action,'gauge-strike-key':keys.strike,'gauge-strike-action':rotate(v(0,1,0),b.chassis.rotation()).y<.2?'Self-right':'Swing saw'}))text(id,content);
 // Keep wide RPM values clear of the ring, without compressing letter spacing.
 root.style.setProperty('--gauge-value-size',(value.length>6?1.75:value.length>5?1.95:2.2)+'rem');
 root.dataset.kind=spin?'spinner':w.type;root.classList.toggle('gauge-live',active);root.classList.toggle('gauge-damaged',output<.999);
 root.setAttribute('aria-label',spin?'Weapon speed':w.type==='crusher'?'Jaw force':w.type==='flipper'?'Flipper readiness':'No active weapon');root.setAttribute('aria-valuenow',String(Math.round(ratio*100)));root.setAttribute('aria-valuetext',aria);
 const ring=root.querySelector<SVGElement>('#gauge-speed');if(ring)ring.style.strokeDashoffset=String(100-ratio*100);
 // The compact bar mirrors the displayed speed, force, or flipper readiness.
 const bar=root.querySelector<HTMLElement>('#gauge-power');if(bar)bar.style.width=ratio*100+'%';
 const visual=rpmPresentation(ratio);root.style.setProperty('--rpm-color',visual.color);root.style.setProperty('--rpm-glow',visual.glow);root.style.setProperty('--rpm-shade',visual.shade);root.style.setProperty('--rpm-tip-motion',visual.motion+'px');root.style.setProperty('--rpm-tip-cycle',visual.period+'ms');root.dataset.rpmRatio=String(ratio);root.dataset.rpmNearMax=String(spin&&visual.nearMax&&!keys.reduced);root.dataset.gaugeReduced=String(!!keys.reduced);
 const silhouette=root.querySelector<SVGElement>('#gauge-silhouette');if(silhouette&&silhouette.dataset.profile!==(c.chassis.profile??'standard')){const path=robotSilhouette(c.chassis.profile);for(const id of ['gauge-silhouette-shape','gauge-silhouette-base','gauge-silhouette-outline'])root.querySelector('#'+id)?.setAttribute('d',path);silhouette.dataset.profile=c.chassis.profile??'standard';}
 const fill=root.querySelector('#gauge-silhouette-fill');if(fill){fill.setAttribute('y',String(64*(1-ratio)));fill.setAttribute('height',String(64*ratio));}
 if(hydra){root.setAttribute('role','group');root.setAttribute('aria-label','Hydra flip assist');for(const attr of ['aria-valuenow','aria-valuemin','aria-valuemax','aria-valuetext'])root.removeAttribute(attr);}
 root.querySelector('#gauge-primary')!.classList.toggle('hidden',w.type==='none');root.querySelector('#gauge-secondary')!.classList.toggle('hidden',w.type!=='hammer_saw');
}
