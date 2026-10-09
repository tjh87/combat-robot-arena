import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {HUD_RPM_SILHOUETTE_MARKUP,RPM_SILHOUETTE_MARKUP,rpmPresentation} from '../src/rpm-presentation';

// Countdown cards must be able to render two copies without duplicate fixed IDs.
assert.match(RPM_SILHOUETTE_MARKUP,/id="gauge-silhouette"/,'instrument keeps its stable selector');
assert.doesNotMatch(HUD_RPM_SILHOUETTE_MARKUP,/\bid="/,'two HUD cards use ID-free silhouette markup');
assert.match(HUD_RPM_SILHOUETTE_MARKUP,/data-rpm-silhouette/);

const still=rpmPresentation(0),fast=rpmPresentation(1);
assert.equal(still.ratio,0);assert.equal(fast.ratio,1);assert.notEqual(still.color,fast.color);assert.equal(fast.nearMax,true);

const main=readFileSync('src/main.ts','utf8'),css=readFileSync('src/hud-revamp.css','utf8'),presentation=readFileSync('src/rpm-presentation.ts','utf8');
assert.match(main,/state==='countdown'\?'pre-fight':''/,'cards expand only during countdown');
assert.match(main,/HUD_RPM_SILHOUETTE_MARKUP/,'each player card has a silhouette slot');
assert.match(main,/updateRpmSilhouette\(startGauge,b\.compiled\.config\.chassis\.profile,startRatio\)/,'actual per-robot RPM drives fill');
assert.match(main,/isSpinner\(w\)\?clamp\(b\.rpm\/w\.rpm,0,1\)/,'spinner RPM stays tied to the simulation');
assert.match(css,/\.player-panel\.pre-fight\{[^}]*min-width:248px!important/,'countdown cards are enlarged');
assert.match(css,/\.player-panel \.hud-start-rpm\{display:none\}/,'active-fight cards remain compact');
assert.match(presentation,/function updateRpmSilhouette/,'shared silhouette hydration is available to both HUDs');
console.log('pre-fight-rpm: all checks passed');
