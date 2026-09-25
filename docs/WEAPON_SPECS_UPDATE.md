# Weapon references and mechanisms — 23 September 2026

This update implements the user's SawBlaze, HUGE and Quantum requests and adds explicit weapon mass/speed references to all eleven presets. It preserves the prior rotor energy ledger, real contact response, bounded corner hammers, cage containment, damage multipliers, drive protection, match modes and recovery controls.

## Chosen configurations and source limits

Robots change between seasons and carry interchangeable weapons. These are specific reference configurations, not a claim that one mass/RPM describes every version. The source links and uncertainty labels also appear in the workshop. RPM derived from tip speed uses the modeled game radius: `RPM = tip speed × 30 / (π × radius)`.

| Robot | Weapon mass used | Speed reference | Game target RPM | Evidence / qualification |
| --- | --- | --- | ---: | --- |
| Tombstone | 70 lb / 31.75 kg | 250 mph competition tip speed | 2,541 | [2019 original Ray Billings interview](https://www.theringer.com/2019/06/11/tv/battlebots-season-9-premiere-discovery-science). Published mass; derived RPM. |
| Minotaur | 50 lb / 22.68 kg | 8,000 RPM | 6,885 | [Stevens interview with designer Rodrigo Nogueira](https://www.stevens.edu/news/stevens-student-returns-battlebots-2019-season). The game radius would exceed the existing 250 mph rule at 8,000 RPM, so the preset is capped. |
| Hydra | 3.42 kg moving arm | Not a spinner | — | [Team Whyachi](https://whyachi.com/bots/). Separate arm mass was not established; game geometry estimate. |
| ICEwave | 54 lb / 24.49 kg | 200 mph | 1,524 | [2022 Season 6 engineering report coauthored with Team Icewave](https://www.pcb.com/contentstore/MktgContent/linkeddocuments/technotes/TN-38_ModalTesting_Icewave.pdf). Published mass; derived RPM. The game retains its approximate electric motor model. |
| HyperShock | Approximately 45 lb / 20.41 kg | 6,800 RPM game estimate | 6,800 | [Will Bales' 2019 team AMA](https://www.reddit.com/r/battlebots/comments/cspm64/) gives the double-disc assembly mass. Operating RPM was not verified. |
| Gigabyte | 120 lb / 54.43 kg game estimate | 190 mph game estimate | 1,689 | [Official team profile](https://battlebots.com/robot/gigabyte-wcvii/) does not establish these figures. Both mass and speed remain explicitly estimated. |
| Son of Whyachi | 120 lb / 54.43 kg game estimate | Up to 170 mph | 1,295 | [Team Whyachi's 2016–2019 robot listing](https://whyachi.com/bots/) supplies tip speed. Cage mass remains an estimate; RPM is derived. |
| HUGE | 30 lb / 13.61 kg | 220–250 mph; uses 235 mph midpoint | 2,180 | [Team HUGE specifications](https://hugebattlebots.com/about-the-robot). Published bar mass; derived game RPM. |
| SawBlaze | 30 lb / 13.61 kg game estimate, disc only | 16-inch disc at 250 mph | 5,252 | [Builder Jamison Go](https://jamisongo.com/projects/sawblaze/) specifies diameter and tip speed. Disc mass remains estimated; the swing arm is separate. |
| Deep Six | 80 lb / 36.29 kg | 1,860 RPM game estimate | 1,860 | [Official 2021 team profile](https://battlebots.com/robot/deep-six-2021/) states the 80 lb weapon limit/configuration. Operating RPM was not confirmed. |
| Quantum | 24.77 kg moving jaw | Not a spinner | — | [Official Quantum profile](https://battlebots.com/robot/quantum-2019/) confirms 35,000 lbf. Jaw mass is a game geometry estimate; rear 50,000 lbf and two-stage action follow the user's supplied specification. |

Exact published values could not be established for every field. The interface never labels a game estimate as a measured team specification. Source profiles that do not publish numerical values are links for robot identification, not evidence for those estimates.

## Physics and builder behavior

`src/weapon-specs.ts` is the shared reference catalogue. `massKg` scales every moving rotor part proportionally before inertia, spin-up and rigid-body creation. This changes real solver mass and energy, not just the displayed statistic. Builder changes to mass affect the simulation and saved/shareable build. When a legacy build omits mass, geometry still supplies it.

Stock presets total 113.2 kg. An editable fixed estimate for unmodeled internal frame hardware, gearboxes and electronics fills the difference from the authored part masses. Two non-contact internal volumes carry this mass beside the central channel. The estimate is fixed for each stock configuration; editing armour or a weapon never silently removes ballast to regain legality. The 113.398 kg heavyweight limit and 250 mph tip-speed rule are unchanged. Available motor gearing is adjusted only as needed to reach the selected target.

Six-vertex triangular scoop prisms previously used an incorrect rectangular projection for mass moments. Their exact centroid and covariance now match the physical convex hull, including oblique extrusion. All 2,793 checked principal-axis moments agree with Rapier within 0.0000081 kg·m².

## SawBlaze and HUGE

SawBlaze's overhead arm and 16-inch spinning disc use separate bodies and relative angular velocities. Arm movement cannot inflate the disc RPM or spend its rotor energy. Physical swing motion contributes to a strike even with the disc stopped; the tooth-engagement factor only attenuates the rotating cutting share. No launch impulse is added. The guard, swinging forks, 180-degree arm sweep and recovery remain physical.

HUGE's two outer axle extensions run straight horizontally from the center of each wheel, with 0.36 m exposed length. Visible geometry and colliders use the same endpoints. The wheel contacts, protected wheel damage behavior and axle-based drive direction are retained. A review found unintended yaw while reversing straight, which the spinning blade amplified into sideways lift with the new masses. The existing bounded drive-motor straight-line correction now also applies to HUGE. In the same forward/reverse/turn fixture, maximum tilt drops from 55.44 degrees to 3.02 degrees while maintaining 19.83 mm minimum blade clearance. This uses wheel motor torque; it adds no pose lock or airborne gyro cancellation.

## Quantum

Quantum keeps four-wheel drive, the existing improved motors/grip and physical recovery arm. A high-flow closing phase reaches the target quickly. Real opponent tooth contact then activates a ramped pressure phase. Local contact distance along the jaw sets the lever ratio: 35,000 lbf at full front reach, rising to 50,000 lbf near 70% reach. Two rear contact teeth make the rear force region physically accessible.

The jaw motion servo and hydraulic indentation work are distinct. Rigid colliders cannot deform, so pressure times indentation speed supplies local damage work, while Rapier's measured contact impulse continues to determine motion. Rated hydraulic force is not an extra solver impulse. The interface reports modeled jaw pressure, not a claimed load-cell measurement.

The 0.30 s closing target, 0.12 s pressure ramp, 3.5 kW pump budget, 14 mm/s indentation rate and 12 kJ cycle budget are game approximations. Jaw motion and indentation share the power/cycle limits. Empty air produces no crushing pressure. Pressure damage follows weapon condition. A 3.5 s maximum bite releases automatically; existing self-righting uses its own mechanism controls. A review fix prevents the jaw's speed limiter from requesting braking torque above the actuator's 4,500 N·m closing / 2,025 N·m opening limits after a hard strike.

Release records the robot's position and backward heading, then measures actual retreat along that heading. It slows near two complete robot lengths and resumes engagement without triggering another bite during retreat. The stock target is 1.992 m; the focused driving test stops retreat at 1.978 m. A blocked retreat times out after eight seconds and normal danger/recovery rules retain priority.

## Verification

`weapon-specs-results.json` records the new mechanism and source-label checks. Existing core, interface, roster, crusher and handling checks also run against the new mass model. `weapon-validation.json` consolidates the final results and clearly identifies filtered runs. The interface test uses a mocked graphics renderer; numerical physics and authored geometry checks do not establish live GPU rendering or audible playback. The available browser's WebGL renderer is disabled, so those checks remain unverified.
