# Wall containment and impact cracks

- Strengthened the swept assembly guard. A chassis centre entering the 0.60 m wall thickness no longer bypasses the fallback check. Only a collider already fully beyond the wall can finish leaving without that check. Existing over-rim exits remain valid.
- Kept the 7.30 m walls and 7.95 m centre-of-mass flight ceiling.
- Added branching cracks at wall impact locations. Measured solver contact impulse and finite contact energy drive the effect. The missed-contact fallback uses only outward kinetic energy and impulse removed by its velocity clamp.
- Visual thresholds: at least 200 J and 20 N·s. These are game tuning values, not real panel fracture specifications. Low-speed pushing cannot accumulate cracks indefinitely.
- Crack radius: 0.25–0.85 m. Repeat suppression: 0.25 seconds within 0.65 m. At most 48 cracks per match. Floor, kickplate and over-wall hits do not crack the glass.
- Cracks do not remove, weaken or change wall colliders. No extra physical forces, physics bodies, particles, textures or lights.
- Rendering uses one fixed 27,648-byte position buffer, 1,152 maximum line segments, and one draw call. It rebuilds only when crack state changes. Immutable bounded snapshots preserve replay timing; new simulations start without cracks. Arena disposal releases graphics resources.

## Checks in this update

- Five wall-crack test groups: actual strong/weak contacts against four walls; thresholds and immutable bounded state; fixed-buffer panel geometry and rewind; 44 airborne containment cases across all eleven robots at 150 m/s; regression for a chassis already inside the wall thickness.
- Existing high-speed containment: 48 cases passed.
- Seven flight-height groups passed, including all eleven robots clearing the wall for a valid ring-out.
- Build/typecheck and offline verifier passed.
- GPU appearance remains unverified: the available browser cannot create a WebGL context.

Runtime files: src/sim.ts, src/render.ts, src/wall-damage.ts, src/wall-cracks.ts. No dependency changes.
