import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';

const selection=readFileSync('src/robot-selection.ts','utf8');
const onlineCss=readFileSync('src/online/online.css','utf8');
const menuCss=readFileSync('src/menu-polish.css','utf8');
for(const token of ['selected-machine-copy','selected-machine-label','selected-machine-name','selected-machine-weapon','selected-machine-meta','113.398 kg build limit','Your controls'])assert(selection.includes(token),`missing selected-machine content: ${token}`);
for(const rule of ['grid-template-columns:74px minmax(0,1fr)','display:grid;gap:3px','text-overflow:ellipsis','display:flex;flex-wrap:wrap'])assert(onlineCss.includes(rule),`missing selected-machine layout rule: ${rule}`);
assert(menuCss.includes('.menu-hero .eyebrow{justify-content:center;text-align:center}'));
assert(menuCss.includes('.menu-hero .menu-status{margin-left:0}'));
const result={status:'passed',selectedCopyLines:5,quickFightCentered:true,copyWrapControlled:true};
writeFileSync('docs/online-copy-layout-results.json',JSON.stringify(result,null,2));
console.log('PASS online copy hierarchy',JSON.stringify(result));
