import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';

const ui=readFileSync('src/online/ui.ts','utf8');
const css=readFileSync('src/online/online.css','utf8');
const panels=(ui.match(/online-robot-picker/g)??[]).length;
assert.equal(panels,2,'both pre-room and lobby pickers must use the compact grid wrapper');
assert.equal((ui.match(/robotSelectionCards\(this\.config\)/g)??[]).length,2,'both picker states must retain the original native robot controls');
for(const rule of ['grid-template-columns:repeat(3,minmax(0,1fr))','max-height:276px','overflow-y:auto','overscroll-behavior:contain','white-space:nowrap','.roster-card:focus-visible','.roster-card.active'])assert(css.includes(rule),`missing compact-picker rule: ${rule}`);
const result={status:'passed',panels,columns:3,boundedScroll:true,nativeControls:true,keyboardFocus:true};
writeFileSync('docs/online-picker-layout-results.json',JSON.stringify(result,null,2));
console.log('PASS compact online robot picker layout',JSON.stringify(result));
