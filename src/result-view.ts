import {ROBOT_PORTRAITS} from './robot-portraits';
import type {RobotHighlights} from './match-highlights';
import {type Result} from './sim';
import {ROSTER,type BotConfig} from './model';
export function highlightStats(h:RobotHighlights,id:number){
 const metrics=[
  {label:'Farthest hit travel',value:h.furthestTravel,unit:'m',className:'',help:'Distance travelled after an opponent hit. Powered ground travel is excluded.'},
  {label:'Max hit height',value:h.maxHeight,unit:'m',className:'result-height',help:'Maximum vertical rise from the position at an opponent hit.'},
  {label:'Biggest hit dealt',value:h.hardestHit/1000,unit:'kJ',className:'result-hit-dealt',help:'Largest estimated contact energy dealt in one attack.'},
  {label:'Biggest hit received',value:(h.hardestReceived??0)/1000,unit:'kJ',className:'result-hit-received',help:'Largest estimated contact energy received from an opponent in one attack.'},
 ];
 return `<dl class="result-highlights" data-highlights-robot="${id}">${metrics.map(m=>`<div class="${m.className}" title="${m.help}"><dt>${m.label}</dt><dd>${m.value.toFixed(2)}<small> ${m.unit}</small></dd></div>`).join('')}</dl>`;
}
export function podium(configs:BotConfig[],winner:number,health?:{hp:number,max:number}[],highlights?:RobotHighlights[],reduced=false){
 return `<div class="podium">${[winner,1-winner].map((id,place)=>{
  const c=configs[id],template=ROSTER.find(r=>r.profile===c.chassis.profile),fallback:Record<string,string>={drum:'minotaur',flipper:'hydra',crusher:'quantum',vertical_disc:'hypershock',shell_spinner:'gigabyte',horizontal_cage:'whyachi',hammer_saw:'sawblaze',vertical_bar:'deep_six'},profile=template?.profile??fallback[c.weapon.type]??'tombstone';
  return `<article class="${place?'podium-runner':'podium-winner'}"><div class="podium-label"><span>${place?'RUNNER-UP':'★ WINNER'}</span><span>P${id+1}</span></div><div class="podium-content"><div class="podium-name ${place?'':'winner'}" data-name="${place?'runner-up':'winner'}"></div><div class="podium-portrait"><img src="${ROBOT_PORTRAITS[profile]??ROBOT_PORTRAITS.tombstone}" data-robot-portrait="${profile}" loading="eager" decoding="sync" alt="${place?'Runner-up':'Winning'} robot" width="160" height="126">${place?'':victoryConfetti(reduced)}</div></div>${health?`<div class="result-hp" data-robot="${id}"><span>HP LEFT</span><strong>${Math.ceil(Math.max(0,health[id].hp)).toLocaleString()}<small> / ${health[id].max.toLocaleString()}</small></strong><div class="result-health-track" role="progressbar" aria-label="HP left for P${id+1}" aria-valuemin="0" aria-valuemax="${health[id].max}" aria-valuenow="${Math.max(0,health[id].hp)}"><i style="width:${Math.max(0,Math.min(100,health[id].hp/health[id].max*100))}%"></i></div></div>`:''}${highlights?highlightStats(highlights[id],id):''}<div class="podium-caption">${place?'FINALIST':'ARENA VICTOR'}</div></article>`;
 }).join('')}</div>`;
}
export function victoryConfetti(reduced:boolean){
 if(reduced)return '';
 const colors=['#ffe177','#fff5c7','#76e3e9','#d69532','#f9b468'];
 return `<div class="victory-confetti" aria-hidden="true">${Array.from({length:24},(_,i)=>`<i style="--x:${(i*37)%101}%;--drift:${(i*13)%41-20}px;--delay:${(i%8)*.12}s;--duration:${2.2+(i%5)*.2}s;--spin:${(i%2?1:-1)*(320+i%7*115)}deg;--color:${colors[i%5]};--w:${2+i%2}px;--h:${4+i%4}px"></i>`).join('')}</div>`;
}
export function scorecard(r:Result){
 const decision=r.reason==="Judges’ decision"||r.reason==="Judges' decision"||r.reason==='Double stoppage',total=r.scores.map(s=>s.reduce((a,b)=>a+b,0)),knockout=r.reason==='Count-out'||r.reason==='Structural KO'||r.reason==='Out of arena';
