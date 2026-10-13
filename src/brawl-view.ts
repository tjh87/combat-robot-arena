import type {Simulation} from './sim';
import {SLOTS,type Slot} from './model';

const escapeHTML=(value:string)=>value.replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]!));
const colors=['#4ed8cf','#ff865d','#e4bd54','#92a5ff','#b47aea'];
const hpOf=(bot:Simulation['bots'][number])=>100*bot.modules.chassis.hp/bot.modules.chassis.max;

export function brawlHUDMarkup(sim:Simulation){
 return `<aside class="brawl-roster" id="brawl-opponents" aria-label="Brawl opponent status">${sim.bots.slice(1).map(bot=>{const id=bot.id,hp=hpOf(bot),label=escapeHTML(bot.compiled.config.identity.name);return `<article class="brawl-hud-card" data-brawl-card="${id}" style="--brawl-accent:${colors[id%colors.length]}"><div class="brawl-hud-heading"><strong>${label}</strong><span>P${id+1}</span></div><div class="brawl-hp-track" role="progressbar" aria-label="${label} chassis HP" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(hp)}"><i data-brawl-hp="${id}" style="width:${hp}%"></i></div><div class="brawl-hud-foot"><span data-brawl-status="${id}">ACTIVE</span><span data-brawl-health="${id}">${Math.round(hp)}% HP</span></div></article>`;}).join('')}</aside>`;
}

export function brawlDamageDealt(sim:Simulation,attackerId:number){
 let hp=0;for(const loss of sim.combatDamage.values())if(loss.attacker===attackerId)hp+=loss.hp;return Math.round(hp);
}

export function brawlResultsMarkup(sim:Simulation){
 const result=sim.result;if(!result)return '';
 const points=(id:number)=>result.scores[id]?.reduce((sum,value)=>sum+value,0)??0;
 const ordered=sim.bots.slice().sort((a,b)=>a.id===result.winner?-1:b.id===result.winner?1:Number(!!a.eliminatedReason)-Number(!!b.eliminatedReason)||(b.eliminatedTick??-1)-(a.eliminatedTick??-1)||points(b.id)-points(a.id)||brawlDamageDealt(sim,b.id)-brawlDamageDealt(sim,a.id));
 return `<section class="brawl-results" aria-label="Brawl standings"><div class="brawl-result-heading"><span>PLACE / ROBOT</span><span>DAMAGE DEALT</span><span>JUDGE POINTS</span><span>STATUS</span></div>${ordered.map((bot,index)=>{const name=escapeHTML(bot.compiled.config.identity.name),score=points(bot.id),status=bot.id===result.winner?'WINNER':bot.eliminatedReason?escapeHTML(bot.eliminatedReason.toUpperCase()):'ACTIVE';return `<div class="brawl-result-row ${index===0?'winner':''}" style="--brawl-accent:${colors[bot.id%colors.length]}"><div class="brawl-result-machine"><b>${index+1}</b><strong>${name}</strong><small>P${bot.id+1}</small></div><strong class="brawl-damage-value">${brawlDamageDealt(sim,bot.id).toLocaleString()} <small>HP</small></strong><strong class="brawl-points">${score}<small> pts</small></strong><span class="brawl-result-status">${status}</span></div>`;}).join('')}<p class="brawl-rules-note">Free-for-all · every robot fights independently · usual arena hazards, damage, count-outs and three-minute limit apply.</p></section>`;
}

export function brawlEvidenceMarkup(sim:Simulation){
 const result=sim.result;if(!result)return '';
 const headers=sim.bots.map(bot=>`<th>P${bot.id+1} · ${escapeHTML(bot.compiled.config.identity.name)}</th>`).join('');
 const modules=SLOTS.map((slot:Slot)=>`<tr><td>${escapeHTML(slot.replaceAll('_',' ').toUpperCase())}</td>${sim.bots.map(bot=>`<td>${bot.modules[slot].present?Math.max(0,Math.round(bot.startHP[slot]-bot.modules[slot].hp)).toLocaleString()+' HP':'Absent'}</td>`).join('')}</tr>`).join('');
 const labels:Record<string,string>={engage:'Active-weapon engagement',closing:'Controlled closing',pin:'Effective control',forced:'Forced hazard / inversion',stable:'Stable positioning'};
 const rows=Object.entries(result.raw).map(([key,values])=>`<tr><td>${labels[key]??escapeHTML(key)}</td>${sim.bots.map(bot=>`<td>${(values[bot.id]??0).toFixed(2)} s</td>`).join('')}</tr>`).join('');
 return `<details class="brawl-evidence"><summary>Module damage &amp; judging evidence</summary><div class="scroll-table"><table class="data-table"><thead><tr><th>Module · HP lost</th>${headers}</tr></thead><tbody>${modules}</tbody></table></div><div class="scroll-table"><table class="data-table"><thead><tr><th>Evidence · seconds</th>${headers}</tr></thead><tbody>${rows}</tbody></table></div></details>`;
}
