import type {Simulation} from './sim';
import {SLOTS,type Slot} from './model';
import {ROBOT_PORTRAITS} from './robot-portraits';
import {portraitProfileFor} from './result-view';

const escapeHTML=(value:string)=>value.replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]!));
const colors=['#4ed8cf','#ff865d','#e4bd54','#92a5ff','#b47aea'];
const hpOf=(bot:Simulation['bots'][number])=>Math.max(0,Math.min(100,100*bot.modules.chassis.hp/bot.modules.chassis.max));
export const brawlArenaLabel=(id:number,knockedOut=false)=>knockedOut?`P${id+1} · OUT`:id===0?'■ P1':`◆ P${id+1}`;

export function brawlHUDMarkup(sim:Simulation){
 return `<aside class="brawl-roster" id="brawl-opponents" aria-label="Brawl opponent status">${sim.bots.slice(1).map(bot=>{const id=bot.id,hp=hpOf(bot),label=escapeHTML(bot.compiled.config.identity.name);const zero=bot.modules.chassis.hp<=0;return `<article class="brawl-hud-card${zero?' zero-hp':''}" data-brawl-card="${id}" data-zero-hp="${zero}" style="--brawl-accent:${colors[id%colors.length]}"><div class="brawl-hud-heading"><strong>${label}</strong><span>P${id+1}</span></div><div class="brawl-hp-track" role="progressbar" aria-label="${label} chassis HP" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(hp)}"><i data-brawl-hp="${id}" style="width:${hp}%"></i></div><div class="brawl-hud-foot"><span data-brawl-status="${id}">${zero?'0 HP · KNOCKED OUT':'ACTIVE'}</span><span data-brawl-health="${id}">${Math.max(0,Math.ceil(bot.modules.chassis.hp)).toLocaleString()} HP · ${Math.round(hp)}%</span></div></article>`;}).join('')}</aside>`;
}

export function brawlDamageDealt(sim:Simulation,attackerId:number){
 let hp=0;for(const loss of sim.combatDamage.values())if(loss.attacker===attackerId)hp+=loss.hp;return Math.round(hp);
}

export function brawlResultsMarkup(sim:Simulation){
 const result=sim.result;if(!result)return '';
 const points=(id:number)=>result.scores[id]?.reduce((sum,value)=>sum+value,0)??0;
 const damageById=new Map(sim.bots.map(bot=>[bot.id,brawlDamageDealt(sim,bot.id)] as const)),topDamage=Math.max(0,...damageById.values());
 const ordered=sim.bots.slice().sort((a,b)=>a.id===result.winner?-1:b.id===result.winner?1:Number(!!a.eliminatedReason)-Number(!!b.eliminatedReason)||(b.eliminatedTick??-1)-(a.eliminatedTick??-1)||points(b.id)-points(a.id)||(damageById.get(b.id)??0)-(damageById.get(a.id)??0));
 return `<section class="brawl-results" aria-label="Brawl standings"><div class="brawl-result-heading"><span>ROBOT / PEAK FLIGHT</span><span>DAMAGE DEALT</span><span>JUDGE POINTS</span><span>STATUS</span></div>${ordered.map((bot,index)=>{const id=bot.id,name=escapeHTML(bot.compiled.config.identity.name),score=points(id),damage=damageById.get(id)??0,isTopDamage=topDamage>0&&damage===topDamage,peakHeight=Math.max(0,sim.highlights.robots[id]?.maxHeight??0),peakText=peakHeight.toFixed(2),status=bot.modules.chassis.hp<=0?'0 HP · KNOCKED OUT':id===result.winner?'WINNER':bot.eliminatedReason?escapeHTML(bot.eliminatedReason.toUpperCase()):'ACTIVE',profile=portraitProfileFor(bot.compiled.config),portrait=ROBOT_PORTRAITS[profile]??ROBOT_PORTRAITS.tombstone;return `<div class="brawl-result-row ${index===0?'brawl-winner':''}" data-brawl-result-bot="${id}" data-peak-height="${peakText}" data-top-damage="${isTopDamage}" style="--brawl-accent:${colors[id%colors.length]}"><div class="brawl-result-machine"><b aria-label="Place ${index+1}">${index+1}</b><img class="brawl-result-portrait" src="${portrait}" data-robot-portrait="${profile}" alt="${name} robot" width="80" height="60" loading="eager" decoding="async"><div class="brawl-result-identity"><div class="brawl-result-name"><strong>${name}</strong><small>P${id+1}</small></div><div class="brawl-peak-flight" title="Maximum vertical rise from the position at an opponent hit."><span>PEAK FLIGHT</span><strong>${peakText}<small> m</small></strong></div></div></div><strong class="brawl-damage-value">${isTopDamage?'<span class="brawl-top-damage" aria-label="Top damage dealer">TOP DAMAGE</span>':''}<span class="brawl-damage-number">${damage.toLocaleString()} <small>HP</small></span></strong><strong class="brawl-points">${score}<small> pts</small></strong><span class="brawl-result-status">${status}</span></div>`;}).join('')}<p class="brawl-rules-note">Free-for-all · every robot fights independently · usual arena hazards, damage, count-outs and three-minute limit apply.</p></section>`;
}

export function brawlEvidenceMarkup(sim:Simulation){
 const result=sim.result;if(!result)return '';
 const headers=sim.bots.map(bot=>`<th>P${bot.id+1} · ${escapeHTML(bot.compiled.config.identity.name)}</th>`).join('');
 const modules=SLOTS.map((slot:Slot)=>`<tr><td>${escapeHTML(slot.replaceAll('_',' ').toUpperCase())}</td>${sim.bots.map(bot=>`<td>${bot.modules[slot].present?Math.max(0,Math.round(bot.startHP[slot]-bot.modules[slot].hp)).toLocaleString()+' HP':'Absent'}</td>`).join('')}</tr>`).join('');
 const labels:Record<string,string>={engage:'Active-weapon engagement',closing:'Controlled closing',pin:'Effective control',forced:'Forced hazard / inversion',stable:'Stable positioning'};
 const rows=Object.entries(result.raw).map(([key,values])=>`<tr><td>${labels[key]??escapeHTML(key)}</td>${sim.bots.map(bot=>`<td>${(values[bot.id]??0).toFixed(2)} s</td>`).join('')}</tr>`).join('');
 return `<details class="brawl-evidence"><summary>Module damage &amp; judging evidence</summary><div class="scroll-table"><table class="data-table"><thead><tr><th>Module · HP lost</th>${headers}</tr></thead><tbody>${modules}</tbody></table></div><div class="scroll-table"><table class="data-table"><thead><tr><th>Evidence · seconds</th>${headers}</tr></thead><tbody>${rows}</tbody></table></div></details>`;
}
