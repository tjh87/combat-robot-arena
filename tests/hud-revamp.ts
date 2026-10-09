import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

// Fight HUD revamp: transparent panels, enlarged readable player cards, scoped to #hud only.
const css=readFileSync(new URL('../src/hud-revamp.css',import.meta.url),'utf8').replace(/\/\*[\s\S]*?\*\//g,'');
const mobileCss=readFileSync(new URL('../src/mobile.css',import.meta.url),'utf8');
const main=readFileSync(new URL('../src/main.ts',import.meta.url),'utf8');
const rules=[...css.replace(/@media[^{]*\{/g,'').matchAll(/([^{}]+)\{[^{}]*\}/g)].map(m=>m[1].trim()).filter(Boolean);
for(const rule of rules)for(const selector of rule.split(/,(?![^()]*\))/))assert(selector.trim().startsWith('#hud'),'unscoped HUD selector: '+selector.trim());
const block=(sel:string)=>{const m=css.match(new RegExp(sel.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\{([^}]*)\\}'));assert(m,'missing rule '+sel);return m[1];};
for(const sel of ['#hud .player-panel','#hud .timer','#hud .hud-bottom .control-strip','#hud .weapon-instruments .weapon-gauge','#hud .ko-countdown'])assert(/background:transparent!important/.test(block(sel)),sel+' must be transparent');
// The compact HUD remains transparent, while the final override makes player cards threefold readable on desktop.
assert(/max-width:190px!important/.test(block('#hud .player-panel')));
assert(css.includes('width:min(42vw,560px)!important'),'desktop player cards should use the large fit-safe width');
assert(css.includes('font:700 24px/1.1 var(--hud-head)!important'),'desktop player-card name should be threefold readable');
assert(css.includes('width:100px;height:68px'),'desktop silhouette RPM instrument should scale with the card');
assert(css.includes('.player-panel .health-track{height:42px!important;border-radius:7px!important}'),'desktop HP track should retain the requested 40 percent reduction');
assert(css.includes('.player-panel .hud-stats{display:grid!important;grid-template-columns:minmax(0,1fr);gap:3px;font:700 20px/1.25 var(--font-mono)!important;color:#f4fbff!important'),'desktop chassis and charge telemetry should be high contrast');
assert(css.includes('.player-panel :is(.fault-line,.component-readouts){font:700 18px/1.25 var(--font-mono)!important;color:#e8f4fa!important'),'desktop status and component text should be high contrast');
assert(css.includes('.player-panel .hud-start-rpm-label{font:800 13px/1.1 var(--font-mono)!important;color:#edf8ff!important'),'desktop RPM label should be readable');
assert(css.includes('.player-panel .hud-start-rpm strong{font:800 24px/1 var(--font-mono)!important'),'desktop RPM value should be readable');
assert(css.includes('max-width:calc(50vw - 14px)!important'),'narrow/mobile cards should keep both players visible');
assert(mobileCss.includes('width:min(41vw,360px)!important'),'touch countdown cards should leave the centre match clock clear');
assert(mobileCss.includes('.player-panel .health-track{height:21px!important;border-radius:5px!important}'),'mobile HP track should retain the requested 40 percent reduction');
assert(mobileCss.includes('.player-panel .hud-stats{display:grid!important;grid-template-columns:minmax(0,1fr);gap:2px;font:700 12px/1.2 var(--font-mono)!important;color:#f4fbff!important'),'mobile chassis and charge telemetry should be high contrast');
assert(mobileCss.includes('.player-title,html.touch-playing #hud .player-panel.pre-fight .player-title{font:800 15px/1.1 var(--hud-head)!important;color:#f8fcff!important'),'mobile player identity should be readable');
assert(mobileCss.includes('.player-panel .hud-start-rpm-label{font:800 9px/1.1 var(--font-mono)!important;color:#edf8ff!important'),'mobile RPM label should be readable');
assert(/font:700 1\.25rem/.test(block('#hud .timer .digits')));
assert(/width:12rem!important/.test(block('#hud .weapon-instruments .weapon-gauge')));
assert(/width:62px/.test(block('#hud .ko-dial')));
assert(main.includes("import './hud-revamp.css'"));
for(const id of ['hp-pct-','status-chip-','ko-title-','ko-ticks-','ko-hint-'])assert(main.includes(`id="${id}\${i}"`),'missing HUD element '+id);
assert(main.includes("'YOU ARE IMMOBILIZED'")&&main.includes("'KNOCKOUT COUNT'")&&main.includes('Press to self-right'));
console.log('HUD revamp checks passed:',rules.length,'scoped rules');
