# Test plan

## Package checks

Run `node scripts/build.mjs`, then `node scripts/verify.mjs`.
The verification checks TypeScript, built asset inventory, embedded physics WASM, local HTTP files and server boundaries.
It checks that source files are not served, traversal is rejected and unsupported HTTP methods fail.
It does not substitute for running WebGL on a real graphics adapter.

## Choose tests from the changed area

| Change | Existing checks |
| --- | --- |
| Core model and simulation | `node --import tsx tests/run.ts`, `tests/systems.ts`, `tests/review-core.ts` |
| UI, controls, gauges, results | `node --import tsx tests/review-ui.ts` |
| Battery targets and hints | `node --import tsx tests/battery-targets.ts`, `tests/hazards-batteries.ts` |
| Minotaur gyro | `node --import tsx tests/gyro-dance.ts` |
| Crusher pressure and release | `node --import tsx tests/quantum-update.ts`, `tests/crusher-update.ts`, `tests/quantum-hypershock-update.ts` |
| Bite, rotor energy and walls | `node --import tsx tests/engagement-update.ts`, `tests/collision.ts` |
| Fall damage and tracks | `node --import tsx tests/traction-landing-update.ts`, `tests/landing-drive-update.ts` |
| HUGE drive and protected wheels | `node --import tsx tests/huge-control-update.ts`, `tests/huge-wheel-damage.ts` |
| Geometry and roster | `node --import tsx tests/roster.ts`, `tests/visuals.ts`, `tests/sleek.ts` |
| Effects and presentation | `node --import tsx tests/showtime-update.ts`, `tests/damage-update.ts`, `tests/handling-effects-update.ts` |

The command before each first filename also applies to other filenames in that row.
Some historical suites expect old settings. Investigate a failure against current requirements before editing code or assertions.
Do not automatically rewrite the expected result or report the entire old suite as current certification.
Some tests overwrite JSON reports under `docs/`. Review those changes before committing.

## Required manual checks on the target machine

1. Disconnect internet. Start the built app from localhost.
2. Select each of the 11 robots and confirm its image and 3D model.
3. Start practice. Test drive, reverse, turn, weapon, self-right, camera and Unstick.
4. Check first-person weapon visibility, opponent arrow, speed and battery hints.
5. Run local two-player mode. Check both sets of controls and both battery hints.
6. Check Hydra's one compact Flip Assist panel and supported-contact advice.
7. Check Quantum bite, prompt release, two-length retreat and the accumulated damage bubble.
8. Put Minotaur on each side and upside down. Check stopped and spinning drum recovery.
9. Check Gigabyte handling at shell speed and HUGE's axle-based control and clearance.
10. Check saw emergence, hammer head shape and screw lift/reverse behavior.
11. Cause a main hit followed by tiny contact damage on either robot. Confirm no trailing 1 HP bubbles in live play or replay; retain exact damage and the 500/800/1000 tiers. Check all four horizontal spinners for RPM-based blur, correct direction, slowdown, replay and reduced motion.
12. Check a landing and ring-out. Confirm height and distance values.
13. Finish a match. Check winner-only confetti, result values, R rematch and M menu.
14. Save, edit, export and import a build. Refresh and confirm preferences remain.
15. Check 1280×720, 1920×1080 and a narrow window. Check tactical and POV modes and larger browser text.
16. Check master/SFX controls, countdown sound, weapon sound, hit sound and landing sound.
17. Enable reduced motion. Confirm bubble motion and confetti follow the preference.

## Evidence rules

Record the command, date, source revision, seed and failure details.
State whether a test used real Rapier physics, a DOM fixture, a browser or a manual observation.
Do not claim audio quality from decoding checks alone.
Do not claim correct WebGL visuals from geometry counts or screenshots of renderer-stubbed fixtures.
Do not claim Windows execution from checking PE headers in Linux.
Stop broad retesting when the changed behavior and required gates are verified.

## Known limits at export

The source update passed 594 battery hit/weak-hit/miss cases, 12 gyro recovery scenarios and six focused UI groups.
The recorded gyro range was approximately 4.67–22.93 seconds across those scenarios.
Battery coordinates remain game estimates. Seven regions still lack sufficient team confirmation.
The earlier hosted browser could not create WebGL. Real graphics and audible quality need the manual checks above.

