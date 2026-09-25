export function damageBadge(id:number){
 return `<div id="damage-badge-${id}" class="robot-damage-warning hidden" role="status" aria-live="polite"><small>P${id+1} · COMPONENT ALERT</small><div id="robot-battery-fire-${id}" class="component-warning battery-fire-warning hidden"><span>BATTERY FIRE</span><strong></strong></div><div id="robot-weapon-damage-${id}" class="component-warning hidden"><span>WEAPON DAMAGED</span><strong></strong></div><div id="robot-battery-damage-${id}" class="component-warning hidden"><span>BATTERY DAMAGED</span><strong></strong></div></div>`;
}
