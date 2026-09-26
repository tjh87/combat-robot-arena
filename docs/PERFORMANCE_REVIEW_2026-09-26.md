# Performance review — 26 September 2026

Target: Windows laptops and PCs with weaker CPUs or integrated graphics.
Source baseline: `1d46ee01c81423cd01bd62944c7207081785254f` on the private repository's `main` branch.

## Measured results

- Mean physics CPU time fell **16.9%** across four seeded matchups, measured three times before and after.
- Individual matchup changes ranged from **2.9% to 24.7%** less CPU time. All compared physical snapshots matched exactly.
- Geometry buffers for the arena and all 11 robot models fell from **25,573,856 to 20,521,780 bytes**, a **19.8%** reduction.
- Every triangle remains. The final indexing method preserves vertex attributes exactly, including normals and texture coordinates.
- These are Node CPU and geometry measurements. They do not establish GPU frame rates or total browser memory savings.

See `performance-comparison.json` and `performance-regression-results.json` for measurements and checks.

## Findings and changes

| Area | Finding | Change |
| --- | --- | --- |
| Contact processing | Contacts within one robot built keys and made extra WASM lookups before rejection. | Reject these game-event candidates first. Rapier still solves all physical contacts. |
| Geometry | Many triangle corners repeated the same vertex data. | Store identical vertices once and use indices. Preserve all shapes, normals and UV seams. |
| Rendering | Menus and paused scenes rendered at display refresh speed. | Cap active play at 60 renders/s and animated menus/builders at 30. Static screens redraw on changes. |
| Hidden tabs | The loop depended on browser throttling. | Cancel animation callbacks and suspend audio. Keep the existing explicit Resume flow. |
| Resolution | Large screens could request excessive pixel counts. | Enable adaptive resolution by default, with a saved checkbox to disable it. |
| Shadows | Static scenes and the inset could repeat shadow work. | Reuse static shadows. Refresh medium shadows at up to 30 Hz and high shadows at up to 60 Hz. |
| Effects | Empty particle pools still uploaded buffers and drew invisible particles. | Skip inactive spark, exhaust, tire smoke and battery-fire uploads/draws. Keep active effects. |
| Damage labels | Repeated size reads could force layout each frame. | Cache measured dimensions until the label, tier or viewport changes. |
| Tournament | Up to 80 physics ticks ran in one UI batch. | Use a 4 ms batch budget, checked between ticks. Continue the same simulation on later frames. |
| Replay storage | Unseen menu and computer tournament simulations recorded replay frames. | Record frames for playable matches and their replays. Skip recordings for unseen simulations. |
| AI | Human-controlled robots built unused AI observation histories. | Record observations for computer-controlled robots. |
| Audio | Silent oscillators and repeated mute automation continued while idle. | Suspend the audio context once when idle. Resume countdown, play and replay audio through the existing start flow. |
| Cleanup | Instanced meshes released geometry but omitted instance-buffer disposal. | Release the instanced graphics buffers when replacing a scene. |
| Downloads | Each game update changed one large JavaScript bundle. | Separate pinned graphics and physics chunks so browsers can reuse cached engines. |

## Display limits

- Adaptive scale: **65–100%** of the selected quality's pixel ratio.
- Reduce scale by **10 percentage points** after at least **2 seconds below 45 rendered FPS**.
- Recover **5 percentage points** after at least **8 seconds above 57 rendered FPS**.
- Adaptive pixel budgets: low **921,600**, medium **1,440,000**, high **3,686,400** pixels, before adaptive scaling.
- At 65% scale, the buffer contains **57.75% fewer pixels** than the same base resolution.
- DOM text and controls retain their normal resolution. Turning adaptation off restores the previous pixel-ratio limits.
- Physics remains **240 Hz**. Solver settings, weapon energy, damage, AI difficulty, and collision geometry retain their values.

## Validation

- Production build and standalone asset/server checks passed.
- **69 UI groups** passed: controls, local two-player mode, settings, builder persistence, imports, replay, recovery, results and battery hints.
- **9 performance groups** passed, including all **825 stock collision-part shapes**, frame pacing, shadow reuse, audio suspension and instance cleanup.
- **594 battery-target cases** passed.
- **10 contact/combat groups** passed, including **200 tooth hits**, **200 near misses**, **48 wall cases**, and **six complete seeded matches**.
- The six matches cover all **11 robots**, all **three AI difficulties**, hazards, count-outs, structural knockouts and ring-outs.
- **8 roster groups** passed, including all robot POV cameras, builder geometry and tournament roster selection.
- The live browser reports `Error creating WebGL context`. Actual Windows GPU frame rate, visual quality and audible playback still need a hardware check.

## Reproduce

Run `node scripts/build.mjs`, then `node scripts/verify.mjs`.
Run `npm run test:performance`, `node --import tsx tests/review-ui.ts`, `tests/engagement-update.ts`, `tests/battery-targets.ts` and `tests/roster.ts` with the same Node command.
Run `node --import tsx scripts/performance-benchmark.ts output.json` for a CPU and geometry sample.
Compare repeated runs on the same machine, without other benchmarks running.

No new runtime service or package is required. Offline play and existing local saves remain supported.
