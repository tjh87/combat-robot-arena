# Architecture and source map

The UI owns match flow. The simulation owns physical and damage state. The renderer displays that state.
Do not make UI animation advance the physics. Do not give renderer-only geometry hidden damage behavior.

| Source | Responsibility |
| --- | --- |
| `src/main.ts` | Menu, builder, match state, tournament flow, HUD, keyboard result shortcuts and integration |
| `src/model.ts` | Units, rules, material/motor data, presets, build validation, compiled parts, mass/inertia and import format |
| `src/sim.ts` | Rapier world, bodies, joints, motors, AI, contact records, component damage, recovery, hazards and match results |
| `src/mechanisms.ts`, `finish-geometry.ts`, `quantum-visual.ts` | Robot geometry and mechanism shape |
| `src/render.ts`, `visuals.ts`, `combat-visuals.ts` | Three.js scene, camera, interpolation, shadows, contact visuals and indicators |
| `src/arena-wall.ts`, `arena-hazards.ts` | Containment, saws, hammers, helical screws and motor timing |
| `src/weapon-specs.ts`, `weapon-reference-view.ts` | Referenced mass/speed data, evidence labels and builder display |
| `src/battery-layout.ts` | Shared battery coordinates, sources, damage-ray intersection and reference display |
| `src/combat-damage.ts`, `weapon-impact.ts`, `landing-impact.ts` | Contact classification, protected output, bite and energy rules |
| `src/huge-handling.ts` | HUGE traction and drive control |
| `src/hit-readouts.ts`, `damage-view.ts`, `flight-label.ts` | Actual HP aggregation, integer labels, bubble tiers and flight display |
| `src/weapon-gauge.ts`, `start-sequence.ts`, `result-view.ts` | Compact gauges, Hydra assist, countdown and results markup |
| `src/match-presentation.ts`, `match-highlights.ts` | Final-hit presentation, replay and highlights |
| `src/input.ts`, `build-storage.ts` | Keyboard/gamepad controls, local preferences and build persistence |
| `src/audio.ts`, `weapon-audio.ts`, `icewave-audio.ts` | Audio routing, local samples and synthesized engine/weapon sounds |
| `src/impact-sparks.ts`, `tire-effects.ts`, `exhaust.ts`, `battery-fire-visual.ts`, `track-visual.ts` | Contact sparks, slip effects, smoke, fire and tracks |
| `src/robot-portraits.ts`, `public/robots/` | Local robot images and retained result portraits |
| `src/probes.ts` | Physics probes and validation helpers |
| `src/style.css` | Layout, font treatments, panel spacing, bubbles and motion preferences |
| `scripts/serve.mjs` | Built-in Node static server, localhost only, no dependencies |
| `scripts/dev.mjs`, `build.mjs`, `verify.mjs` | Portable development, build and verification commands |

## State boundaries

Keep mode changes through the existing state functions. Dispose old simulations, audio and input state before replacing a match.
Pause on focus loss. Do not leave stale held keys after a menu or controller change.
Keep simulation ticks, replay ticks and wall-clock UI time distinct.
Damage and travel records belong to their participant and event. Do not reuse mutable event values across unrelated hits.
Each physical part contributes its mass once. Visual trims must not silently add collider mass.
Use the same local-to-world conversion for target damage, hints, visible battery packs and fire origins.

## Assets and dependencies

The app uses 11 local robot PNG files and 12 local MP3 files.
Rapier compat embeds physics WASM into the JavaScript build.
The full ZIP includes installed dependencies and Windows/Linux x64 native esbuild/Rollup packages.
The runtime manifest records official download URLs and checked hashes.
The source repository keeps `package-lock.json`. Generated dependencies and runtimes belong in the release ZIP.

## Historical evidence

Keep `docs/` reports for debugging. Some reports contain failures from earlier iterations.
Use `handover/EXPORT_VALIDATION.json` for this export and `docs/hydra-battery-research-results.json` for the latest focused game update.
Do not treat `docs/RELEASE.json` as the current standalone release; it records an older Sites publication.
