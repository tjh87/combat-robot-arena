# Quantum and HyperShock update

## Changes

- All eleven robots and builder configurations now have 1,200 chassis HP. Previously, Quantum had 2,200 and the other robots had 1,800. Module HP remains separate.
- Quantum's head is 360 mm wide, up from 240 mm. The model has curved cast cheeks, open crown holes, a rounded brow and two dark piercing fangs. Its front uses a smooth concave silver scoop and swept black side plates. The scoop uses eight thin physical collision strips. These changes follow the supplied Quantum photographs.
- HyperShock has two separately modelled steel cutters on a shared live axle. Each blade is 22 mm thick; their centres are 118 mm apart. Four 170 mm radius tyres, deep-dish lime rims and compact bearing plates follow its existing reference photo. The 155 mm radius blades have 15 mm nominal clearance upright and inverted. Wheel centres move forward 65 mm to support the front-heavy assembly. Old saved stock geometry migrates while retaining colours and other custom settings.
- Inverted HyperShock reverses blade rotation, keeps its recovery arm folded and uses a support-margin-based acceleration limit. The speed command is unchanged. Manual vertical self-righting and physical gyroscopic precession remain active. The inverted POV stays above the chassis and looks forward.
- Quantum can ignite an opponent's battery only after a strike removes battery HP and leaves at least 70% battery damage. A centred crush must penetrate the top armour before reaching the battery. The eight-second fire causes 30 chassis HP and up to 10 battery HP damage per second, plus a 4% nominal charge drain per second. A full burn removes 240 chassis HP. Fire ends with simulation time or the match. It does not bypass the protected weapon supply.
- Battery fire has pooled flame and smoke particles, a warning with remaining seconds and an original hiss/crackle sound. Replay frames retain fire timing. Fire audio mutes on pause, results and reset, including an opponent-only fire.
- Each podium card retains HP, farthest hit travel and maximum hit height. Biggest hit dealt is green; biggest hit received is red. Both labels and values are underlined, with 20 px unit text. Opponent attack maxima persist for the full match and exclude hazards, landings, fire and self-damage.

## Verification

85 targeted checks passed:

| Suite | Passed |
|---|---:|
| Quantum, HyperShock, HP, fire, results, POV and fire audio | 11 |
| Recovery and powered strikes | 6 |
| Height and automatic recovery gating | 8 |
| Drive, scoops, damage threshold and audio controls | 7 |
| Interface integration | 53 |

Both updated robots passed manual recovery from six orientations. Recovery took 0–3.99 seconds in those checks. HyperShock also recovered with its weapon running and restored weapon power after braking for recovery.

HyperShock reached about 6,508 RPM while upright and inverted. During the tested straight starts, its blade envelope remained at least 10.44 mm above the floor. Both drive directions worked without automatic recovery deployment or physics faults. One-second starts at 65% throttle reached 20.5–20.7 km/h upright and 6.4–7.0 km/h inverted; inverted acceleration is deliberately limited for stability. These are tested starts, not top-speed claims.

Compiled masses are 110.30 kg for Quantum and 94.80 kg for HyperShock. All eleven stock configurations pass the mass and geometry validation. Quantum's sculpted head has 23,680 triangles. Fire uses fixed pools of 96 flame and 48 smoke particles.

The production TypeScript/Vite build and bundle audit passed. The 28-file bundle contains valid embedded physics WASM, the existing robot portraits and audio assets, and no test fixtures or video. The build reports a non-blocking large-chunk warning for the embedded game and physics code.

The result cards were inspected in the managed browser. Actual robot meshes were also inspected using a CPU rasterizer. The managed browser could not create a WebGL context, so full GPU rendering and interactive 3D play were not verified there. Physics was tested with the real Rapier simulation; interface tests use a renderer stub. The new fire sound was checked for lifecycle safety, not assessed through a listening test.
