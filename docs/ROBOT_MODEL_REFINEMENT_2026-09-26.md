# Robot model refinement — 26 September 2026

Production target: https://bbots-tjh87.vercel.app (existing `combat-robot-arena-live` project and alias).
Baseline: `c6e4478efca5e7b7b0baddeca38b31df95416222`.

## Changes

Reviewed all eleven supplied `public/robots` photographs and the corresponding generated models. Kept the original physical parts, masses, colliders, weapon joints, 240 Hz simulation, damage, controls, and stored build format.

- Rounded plate and guard outlines with smooth, crease-aware normals. Thin metal plates remain thin; wedge noses and cutting edges remain sharp. Broad panel corner radii increase from at most 28 mm to 35 mm (45 mm for Quantum); guard outlines use 32 mm fillets. These are visual finishes, not collider or clearance changes.
- Replaced HUGE's separated visible rim/spoke pieces with one continuous molded wheel per side, with five open curved cut-outs, a 96-segment outer contour, and a 4 mm maximum bevel. The existing independently simulated wheel colliders remain intact.
- Gave ICEwave's engine cover a stepped, tapered roof, narrowing the 340 mm lower cover to 289 mm at its existing 180 mm height. Paint follows builder primary/secondary colors.
- Rounded Tombstone's exposed side rails into tubes within their original dimensions.
- Replaced generic deck banners with robot-specific paint on the actual plates: reaper, bull, Hydra eyes/fangs, HyperShock pink graphics, Whyachi lettering, SawBlaze flames, and distinct names and colors across the roster. Gigabyte's name follows its curved shell. No flat deck overlay hides the softened plate edges.
- Reduced oversize shiny wheel hubs and removed rows of raised decorative tire blocks. HyperShock retains concave rims, now correctly facing outward on both sides, and lettered sidewalls. HUGE uses blue outlined eyes.
- Indexed Quantum's cast surfaces and merged wheel geometry, preserving every authored triangle, normal, and paint UV. Wheel batches retain texture and finish differences.

Runtime files: `src/finish-geometry.ts`, `src/visuals.ts`, `src/robot-livery.ts`, `src/render.ts`, `src/quantum-visual.ts`.
Regression coverage: `tests/model-refinement.ts`.
No dependencies, services, or remote asset requests were added.

## Resource measurements

Measured the real model scene graphs with builder pedestal, direction marker and battery guides excluded. These counts describe geometry buffers and mesh objects, not total browser RAM, GPU draw calls, or measured FPS. The rendering budget remains below 60,000 triangles per robot including the standard builder decorations.

| Metric, all 11 models combined | Before | After | Reduction |
| --- | ---: | ---: | ---: |
| Geometry buffer bytes | 19,718,900 | 11,105,036 | 43.68% |
| Triangles | 343,970 | 336,766 | 2.09% |
| Mesh batches | 829 | 772 | 6.88% |

| Robot | Model triangles | Geometry bytes |
| --- | ---: | ---: |
| Tombstone | 17,028 | 589,496 |
| Minotaur | 23,072 | 838,752 |
| Hydra | 20,716 | 693,880 |
| ICEwave | 22,374 | 739,780 |
| HyperShock | 46,656 | 1,427,520 |
| Gigabyte | 27,888 | 939,136 |
| Son of Whyachi | 24,588 | 797,000 |
| HUGE | 35,856 | 1,262,208 |
| SawBlaze | 35,476 | 1,061,176 |
| Deep Six | 23,620 | 850,968 |
| Quantum | 59,492 | 1,905,120 |

## Validation completed

- 6 focused refinement groups: finite geometry/UVs and budgets across all 11 models, real HUGE openings and bounds, engine-cover taper/normals/colors, outward HyperShock rims and textured wheel batches, 33 replay cycles with texture cleanup, and custom builder names.
- All 8 full roster groups, including mass moments, driving and weapon operation, articulated SawBlaze operation, POV, tournaments, imports and builder cleanup.
- All 5 existing visual groups.
- All 70 UI regression groups, including setup, settings, persistence, import/export, repair, controls, replay, damage readouts and performance scheduling.
- All 9 performance regression groups and 5 spinner presentation groups.
- 594 battery target cases and projected hint checks.
- TypeScript/build and offline asset/server verification.

All source-level and automated checks passed. CPU geometry previews with procedural paint were used for shape comparison only; they are not WebGL screenshots. The cloud browser cannot create a WebGL context, so actual GPU appearance, FPS and live audio remain unverified here. No device-speed claim is made from the geometry savings.

The one-HP bubble suppression, RPM-dependent horizontal blur, dotted battery guides and prior performance work remain in the build.
