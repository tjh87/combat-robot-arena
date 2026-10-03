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
  const frameStyle=place?'border:2px solid #3b5bdb;box-shadow:0 0 14px rgba(59,91,219,.35);':'border:3px solid #ffe177;box-shadow:0 0 28px rgba(255,225,119,.45),inset 0 0 24px rgba(255,225,119,.12);transform:scale(1.04);background:linear-gradient(160deg,#3a2f10,#1c1a12);';
  const labelStyle=place?'font-size:1.1rem;font-weight:800;letter-spacing:.14em;color:#9db4ff;':'font-size:2rem;font-weight:900;letter-spacing:.12em;color:#ffe177;text-shadow:0 0 12px rgba(255,225,119,.8),0 2px 0 #7a5c14;';
  const nameStyle=place?'':'font-size:1.7em;font-weight:900;';
  const captionStyle=place?'':'font-size:1.15rem;font-weight:800;color:#ffe177;letter-spacing:.2em;';
  return `<article class="${place?'podium-runner':'podium-winner'}" style="${frameStyle}"><div class="podium-label"><span style="${labelStyle}">${place?'RUNNER-UP':'★ WINNER'}</span><span>P${id+1}</span></div><div class="podium-content"><div class="podium-name ${place?'':'winner'}" data-name="${place?'runner-up':'winner'}" style="${nameStyle}"></div><div class="podium-portrait"><img src="${ROBOT_PORTRAITS[profile]??ROBOT_PORTRAITS.tombstone}" data-robot-portrait="${profile}" loading="eager" decoding="sync" alt="${place?'Runner-up':'Winning'} robot" width="160" height="126">${place?'':victoryConfetti(reduced)}</div></div>${health?`<div class="result-hp" data-robot="${id}"><span>HP LEFT</span><strong>${Math.ceil(Math.max(0,health[id].hp)).toLocaleString()}<small> / ${health[id].max.toLocaleString()}</small></strong><div class="result-health-track" role="progressbar" aria-label="HP left for P${id+1}" aria-valuemin="0" aria-valuemax="${health[id].max}" aria-valuenow="${Math.max(0,health[id].hp)}"><i style="width:${Math.max(0,Math.min(100,health[id].hp/health[id].max*100))}%"></i></div></div>`:''}${highlights?highlightStats(highlights[id],id):''}<div class="podium-caption" style="${captionStyle}">${place?'FINALIST':'ARENA VICTOR'}</div></article>`;
 }).join('')}</div>`;
}
