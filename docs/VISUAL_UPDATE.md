> The subsequent ten-template expansion is documented in [ROSTER_UPDATE.md](ROSTER_UPDATE.md). Its final roster and validation figures supersede the initial three-template figures below.

# Arena and robot update

## Changes

- Rebuilt the venue with worn steel, blue/red starting squares, hazard stripes, reinforced walls, trusses, floodlight fixtures, rear signs and spectator seating.
- Revised all three robot silhouettes. Crosscut has two large wheels, a compact clipped chassis, an exposed frame and a low red bar. Upturn has two wheels, a close drum and bearing cheeks. Springboard has purple/gold armour and a shorter, wider flipper.
- Added tyre tread, wheel hubs, panel bolts, access covers, vents, livery, worn paint and weapon hardware. Detached panels retain the correct robot's paint.
- Moved the builder camera to the front. Tactical framing follows the robots' midpoint and separation.
- Added a primary P1 POV view. Press E or use the View button. Camera position, heading, pitch and roll follow the interpolated physical chassis, including recorded replay poses.
- Arrow keys drive P1 and navigate menu button groups. Enter activates focused menu controls.
- Added a three-light 3–2–1 start sequence and a larger match clock with a remaining-time bar. Pause freezes both countdown and simulation time.

## References

The user supplied the horizontal spinner photo. Family research also used official [Tombstone](https://battlebots.com/robot/tombstone-2021/), [Minotaur](https://battlebots.com/robot/minotaur-wcvii/) and [Hydra](https://battlebots.com/robot/hydra-wcvii/) pages and robot photos. No remote models, textures, fonts or runtime assets were added.

## Validation

Machine-readable evidence: test-results.json, system-results.json, extended-results.json, review-core-results.json, review-ui-results.json and visual-results.json.

The visual regression suite checks physical inertia, blade clearance and spin-up, camera transforms, finite scene geometry, and replay texture disposal. Offline DOM tests cover arrow driving, focus navigation, POV switching, starting lights, clock progression and pause.

The scene sample contains 26,186 triangles and 202 mesh batches with three robots and one hazard of each family. These are geometry counts, not measured GPU render performance. The arena itself uses 40 mesh batches.

The managed browser loads the preview but reports GL_RENDERER Disabled. Actual WebGL visuals, GPU performance and physical controller testing remain unverified. A local procedural floor image and an untextured geometry study were inspected; neither is a browser screenshot.
