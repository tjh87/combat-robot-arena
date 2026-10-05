import {componentConfig,componentProfile} from './model';
import {isSpinner,type Compiled} from './model';
import {LB_TO_KG,WEAPON_REFERENCES} from './weapon-specs';

export function weaponReferenceHTML(c:Compiled){
 const w=c.config.weapon,ref=WEAPON_REFERENCES[c.componentProfile(config,'weapon')??'standard'];
 if(w.type==='none')return '';
 const mass=c.parts.filter(p=>p.body==='rotor').reduce((sum,p)=>sum+p.mass,0),spin=isSpinner(w);
 const massBasis=spin&&w.massKg!==undefined?(ref?.massLb!==undefined&&Math.abs(mass-ref.massLb*LB_TO_KG)<.0001?ref.massBasis:'custom'):'geometry';
 return `<div class="total weapon-reference"><label>${spin?'Spinning weapon mass':'Moving weapon mass'}</label><strong>${mass.toFixed(2)} <small>kg · ${(mass/LB_TO_KG).toFixed(1)} lb</small></strong><p>${massBasis==='published'?'PUBLISHED REFERENCE MASS':massBasis==='custom'?'CUSTOM MASS':massBasis==='geometry'?'GAME GEOMETRY ESTIMATE':'GAME MASS ESTIMATE'}${w.type==='hammer_saw'?'<br>Disc only · swinging arm modeled separately':''}</p>${spin?`<p>GAME TARGET ${w.rpm.toLocaleString()} RPM<br>INERTIA ${c.rotorInertia.toFixed(3)} kg·m²<br>ENERGY ${(c.rotorInertia*(w.rpm*Math.PI/30)**2/2000).toFixed(2)} kJ</p>`:'<p>SPIN SPEED: NOT APPLICABLE</p>'}${ref?`<details><summary>Reference specs & sources</summary><p>${ref.configuration}<br>${ref.note}</p><p>${ref.sources.map(s=>`<a href="${s.url}" target="_blank" rel="noopener noreferrer">${s.label}</a>`).join('<br>')}</p><small>Published specs vary by season and setup. Checked 23 Sep 2026. Custom edits change the game values above.</small></details>`:''}</div>`;
}
