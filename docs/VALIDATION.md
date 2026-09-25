# Current update verification

65 automated groups and two seeded AI fights pass, with 162 weapon hits. All ten templates recover using Unstick. Three loaded Hydra fixtures stay upright, and twenty empty flips pass. Eight metal recordings decode and their playback routing, level response and cleanup pass. See STABILITY_UPDATE.md and stability-update-summary.json.

The managed preview browser cannot create WebGL. GPU appearance, live browser gameplay, frame rate and audible playback remain unverified. Earlier full-suite reports are historical and do not expand this update's claims.

---

# Earlier validation history

The figures below belong to earlier versions and are retained as history. They do not expand the current release's test claims.


# Validation

105 automated groups pass: 22 core, 8 extended, 7 system, 14 review-core, 30 offline DOM, 5 visual/scene, 8 roster, and 11 gameplay groups. No recorded automated failures remain.

The current gameplay changes are described in GAMEPLAY_UPDATE.md. Its 16 additional regression groups cover replay/hitch behavior, names and photographs, the circular gauge, recovery settings, idle count-outs, timed KO, HUGE clearance, five corner escapes, physical recovery, flight trails, distinct mirror liveries, visible rotor exposure, opponent projection, synthesized audio parameters, and impact damage visuals.

The complete roster compiles, round-trips through build links, drives, and enters Practice. Every spinning template gains speed. 1,836 mass moments agree with independent Rapier bodies to within 0.000001 kg m². HUGE remains upright at approximately 2,387 RPM with at least 56 mm blade clearance in the stationary test.

The production TypeScript/Vite build and bundle audit pass. The static output includes ten locally served supplied PNG photographs and 1,555,075 validated embedded WASM bytes. Test fixtures are excluded. No runtime dependency was added.

| Area | Evidence | Limits |
|---|---|---|
| Timing and input | Identical tick-stamped controls at 30/60/144 schedules; explicit pause freezes simulation; hitches use bounded fixed steps; replay resumes automatically | Actual browser input and physical controllers remain unverified |
| Rules | Healthy idle machines remain active; disabled machine loses at 10 seconds; both loss countdowns update; pins, fouls, judges, terminal priority and fault recovery pass | Custom game rules |
| Contacts and damage | 448 collision cases; energy/momentum checks; layered damage and detached mass; bounded immediate impact marks, armour wear and historical replay visibility | WebGL appearance remains unverified |
| Weapons and camera | All mechanisms drive; two hammer-saw strokes return; physical self-righting survives recovery assistance; all ten cameras follow real pose with higher mounts | Actual rendered POV remains unverified |
| AI and recovery | Five tested families escape the corner within 10 seconds; twenty seeded matches finish; seven-match tournament completes | Physical recovery can fail if a machine is damaged or firmly trapped, leading to the visible count-out |
| Menus and HUD | All ten photographs and proper names, opponent selection, arrow controls, RPM/kW gauge, camera toggle, behind/side opponent projection | Offline DOM and Three geometry tests |
| Audio | Eight oscillator layers plus two filtered air layers; RPM, blade count and motor ratio affect frequencies; mute and cleanup pass | Synthesized approximations; audible output not heard here |
| Performance | Full 180 simulated seconds / 43,200 ticks complete; bounded physics bodies, debris and damage marks | CPU diagnostics, not a GPU FPS benchmark |
| Publication | Native publication is performed after these checks | RELEASE.json and BUILD_STATUS.md hold the latest native receipt |

Evidence: test-results.json, extended-results.json, system-results.json, review-core-results.json, review-ui-results.json, visual-results.json, roster-results.json, gameplay-results.json, gameplay-summary.json, and bundle-audit.json.

Commands: `node --import tsx tests/run.ts`, `tests/extended.ts`, `tests/systems.ts`, `tests/review-core.ts`, `tests/review-ui.ts`, `tests/visuals.ts`, `tests/roster.ts`, and `tests/gameplay.ts`; the managed Sites build wrapper; then `node tests/bundle-audit.mjs`.

Fixture updates reflect the requested behavior: actual robot names replace original aliases; POV expects the new rearward, higher mount and downward viewing angle; disabled count-out is ten seconds; visible frame hitches continue with fixed steps; a three-foul result is tested in competitive mode rather than Practice. The automated recovery regression found interference with manual self-righting, which was fixed and rechecked.

The approved browser reaches the managed preview but reports GL_VENDOR / GL_RENDERER Disabled and cannot create WebGL. No alternate browser or graphics workaround was used. GPU rendering, representative frame rate, physical gamepads, audible playback, and the hosted interactive flow remain unverified.

## Current crusher update

Use `crusher-update-summary.json` and `CRUSHER_UPDATE.md` for this release's scope and evidence. Current reports include crusher-update, weapon-endurance, crusher-matches, review-ui, roster, stability-update, blades-update, media-validation, and bundle-audit. The recovery report is intentionally filtered to Gigabyte's three shell-braking/self-righting cases. Earlier aggregate summaries are historical and are not counted as current coverage. No GPU or audible-playback pass is claimed.
