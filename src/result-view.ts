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
