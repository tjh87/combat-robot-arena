import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

// Fight HUD revamp: transparent panels at half size, scoped to #hud only.
const css=readFileSync(new URL('../src/hud-revamp.css',import.meta.url),'utf8').replace(/\/\*[\s\S]*?\*\//g,'');
const main=readFileSync(new URL('../src/main.ts',import.meta.url),'utf8');
const rules=[...css.replace(/@media[^{]*\{/g,'').matchAll(/([^{}]+)\{[^{}]*\}/g)].map(m=>m[1].trim()).filter(Boolean);
for(const rule of rules)for(const selector of rule.split(/,(?![^()]*\))/))assert(selector.trim().startsWith('#hud'),'unscoped HUD selector: '+selector.trim());
const block=(sel:string)=>{const m=css.match(new RegExp(sel.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\{([^}]*)\\}'));assert(m,'missing rule '+sel);return m[1];};
for(const sel of ['#hud .player-panel','#hud .timer','#hud .hud-bottom .control-strip','#hud .weapon-instruments .weapon-gauge','#hud .ko-countdown'])assert(/background:transparent!important/.test(block(sel)),sel+' must be transparent');
// Half of the original sizes: card 360→≤190px wide, clock 2.5rem→1.25rem, KO ring 210→≤170px module, gauge 23.75rem→12rem.
assert(/max-width:190px!important/.test(block('#hud .player-panel')));
assert(/font:700 1\.25rem/.test(block('#hud .timer .digits')));
assert(/width:12rem!important/.test(block('#hud .weapon-instruments .weapon-gauge')));
assert(/width:62px/.test(block('#hud .ko-dial')));
assert(main.includes("import './hud-revamp.css'"));
for(const id of ['hp-pct-','status-chip-','ko-title-','ko-ticks-','ko-hint-'])assert(main.includes(`id="${id}\${i}"`),'missing HUD element '+id);
assert(main.includes("'YOU ARE IMMOBILIZED'")&&main.includes("'KNOCKOUT COUNT'")&&main.includes('Press to self-right'));
console.log('HUD revamp checks passed:',rules.length,'scoped rules');
