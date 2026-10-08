import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {loadMenuTheme,setMenuTheme,applyMenuTheme,menuThemeLabel,MENU_THEME_KEY} from '../src/menu-theme';
import {cupConnector,type CupBox} from '../src/tournament-view';

// Theme preference: defaults to classic, persists, and can switch back.
const store=new Map<string,string>();
const storage={getItem:(k:string)=>store.get(k)??null,setItem:(k:string,v:string)=>{store.set(k,v);}};
const root={dataset:{} as DOMStringMap};
assert.equal(loadMenuTheme(storage),'classic');
assert.equal(setMenuTheme('revamp',storage,root),'revamp');
assert.equal(store.get(MENU_THEME_KEY),'revamp');assert.equal(root.dataset.menuTheme,'revamp');assert.equal(loadMenuTheme(storage),'revamp');
setMenuTheme('classic',storage,root);assert.equal(loadMenuTheme(storage),'classic');assert.equal(root.dataset.menuTheme,'classic');
store.set(MENU_THEME_KEY,'bogus');assert.equal(loadMenuTheme(storage),'classic');
const broken={getItem:()=>{throw new Error('blocked');},setItem:()=>{throw new Error('blocked');}};
assert.equal(loadMenuTheme(broken),'classic');assert.equal(setMenuTheme('revamp',broken,root),'revamp');
assert.equal(applyMenuTheme('classic',root),'classic');
assert.equal(menuThemeLabel('revamp'),'UI: Revamp');assert.equal(menuThemeLabel('classic'),'UI: Classic');

// Revamp CSS is menu-only: every rule is scoped and never selects the 3D scene, robots or fight HUD.
const css=readFileSync(new URL('../src/menu-revamp.css',import.meta.url),'utf8').replace(/\/\*[\s\S]*?\*\//g,'');
const rules=[...css.matchAll(/([^{}]+)\{[^{}]*\}/g)].map(m=>m[1].trim()).filter(Boolean);
assert(rules.length>60,'expected a full menu theme');
for(const rule of rules)for(const selector of rule.split(/,(?![^()]*\))/)){const s=selector.trim();assert(s.startsWith('html[data-menu-theme="revamp"]'),'unscoped selector: '+s);assert(!/#scene|#hud|#arena-overlay|canvas|\.weapon-instruments|\.telemetry/.test(s),'menu theme touches fight/robot surface: '+s);}
const main=readFileSync(new URL('../src/main.ts',import.meta.url),'utf8');
assert(main.includes("import './menu-revamp.css'")&&main.includes('id="menu-theme-toggle"')&&main.includes("bindMenuThemeToggle($<HTMLButtonElement>('#menu-theme-toggle'))"));

// Bracket arrows: advancing/pending arrows end exactly on the target box; eliminated links stay beside their own card.
const source:CupBox={left:0,right:240,top:100,height:50},target:CupBox={left:316,right:556,top:160,height:50};
for(const state of ['win','pending'] as const){const link=cupConnector(source,target,state);assert.equal(link.arrow,true);const nums=link.d.split(/\s+/).filter(v=>v&&!/[A-Z]/.test(v)).map(Number);assert.deepEqual(nums.slice(0,2),[243,125]);assert.deepEqual(nums.slice(-2),[313,185]);}
const out=cupConnector(source,target,'loss');assert.equal(out.arrow,false);assert(out.out);const end=out.d.split(/\s+/).filter(v=>v&&!/[A-Z]/.test(v)).map(Number).slice(-2);assert(end[0]<target.left-40&&end[1]===125,'eliminated stub must not point at another box');
const view=readFileSync(new URL('../src/tournament-view.ts',import.meta.url),'utf8');
assert(view.includes('for(let r=0;r<3;r++)')&&view.includes('class="cup-crown"')&&view.includes('data-r="3" data-m="0" data-slot="0"'),'final must link to the champion box');
console.log('menu theme + bracket arrow checks passed:',rules.length,'scoped rules');
