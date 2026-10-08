import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {applyMenuTheme,MENU_THEME,LEGACY_MENU_THEME_KEY} from '../src/menu-theme';
import {cupConnector,type CupBox} from '../src/tournament-view';

// Revamp is the only menu theme: always applied, and the old Classic preference is cleared.
const store=new Map<string,string>([[LEGACY_MENU_THEME_KEY,'classic']]);
const root={dataset:{} as DOMStringMap};
assert.equal(applyMenuTheme(root,{removeItem:(k:string)=>{store.delete(k);}}),'revamp');
assert.equal(MENU_THEME,'revamp');assert.equal(root.dataset.menuTheme,'revamp');assert.equal(store.has(LEGACY_MENU_THEME_KEY),false);
assert.equal(applyMenuTheme(root,{removeItem:()=>{throw new Error('blocked');}}),'revamp');

// Revamp CSS is menu-only: every rule is scoped and never selects the 3D scene, robots or fight HUD.
const css=readFileSync(new URL('../src/menu-revamp.css',import.meta.url),'utf8').replace(/\/\*[\s\S]*?\*\//g,'');
const rules=[...css.matchAll(/([^{}]+)\{[^{}]*\}/g)].map(m=>m[1].trim()).filter(Boolean);
assert(rules.length>60,'expected a full menu theme');
for(const rule of rules)for(const selector of rule.split(/,(?![^()]*\))/)){const s=selector.trim();assert(s.startsWith('html[data-menu-theme="revamp"]'),'unscoped selector: '+s);assert(!/#scene|#hud|#arena-overlay|canvas|\.weapon-instruments|\.telemetry/.test(s),'menu theme touches fight/robot surface: '+s);}
const main=readFileSync(new URL('../src/main.ts',import.meta.url),'utf8');
assert(main.includes("import './menu-revamp.css'")&&main.includes('applyMenuTheme();'));
assert(!/menu-theme-toggle|UI: Classic|bindMenuThemeToggle|theme-toggle/.test(main+css),'classic theme switch must be removed');

// Bracket arrows: advancing/pending arrows end exactly on the target box; eliminated links stay beside their own card.
const source:CupBox={left:0,right:240,top:100,height:50},target:CupBox={left:316,right:556,top:160,height:50};
for(const state of ['win','pending'] as const){const link=cupConnector(source,target,state);assert.equal(link.arrow,true);const nums=link.d.split(/\s+/).filter(v=>v&&!/[A-Z]/.test(v)).map(Number);assert.deepEqual(nums.slice(0,2),[243,125]);assert.deepEqual(nums.slice(-2),[313,185]);}
const out=cupConnector(source,target,'loss');assert.equal(out.arrow,false);assert(out.out);const end=out.d.split(/\s+/).filter(v=>v&&!/[A-Z]/.test(v)).map(Number).slice(-2);assert(end[0]<target.left-40&&end[1]===125,'eliminated stub must not point at another box');
const view=readFileSync(new URL('../src/tournament-view.ts',import.meta.url),'utf8');
assert(view.includes('for(let r=0;r<3;r++)')&&view.includes('class="cup-crown"')&&view.includes('data-r="3" data-m="0" data-slot="0"'),'final must link to the champion box');
console.log('menu theme + bracket arrow checks passed:',rules.length,'scoped rules');
