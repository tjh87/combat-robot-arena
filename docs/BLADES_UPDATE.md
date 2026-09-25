# Results, sharp blades, Hydra and impact sounds

The result screen now explains a knockout before any judging statistics. A knockout decides the match regardless of the 5 / 3 / 3 points. KO cards show KO WIN and KNOCKED OUT. Optional point statistics are collapsed and clearly unused. Timed matches retain their actual totals and higher-score winner. The prior Hydra 5 versus Minotaur 6 example was a knockout, not a scoring inversion.

## Hydra

A pressure-driven loaded stroke replaces excessive servo damping while an opponent is supported by the arm. Physical contact supplies all launch momentum. The 12,600 J allowance, 10,800 N m torque limit, battery accounting, unlimited flip count, cooldown and damped return remain.

The equal-mass test uses a 94.485 kg opponent. Its peak chassis height rises from 0.571 m to 1.392 m, a 143.9% increase. The stroke uses 8572.3 J. This is a controlled fixture, not a guarantee for every opponent or contact position. Twenty consecutive unloaded cycles still pass.

A large FLIP NOW cue appears only when the opponent is centred and physically supported by the flipper. Other states explain alignment, distance, recharge, damage or self-righting. The cue displays the current weapon key binding and is absent for non-flippers.

## Blades and damage

Dark circular impact stamps and filled spin sectors are removed. Bounded irregular gouges, scratches and scraped edges show damage. Weapon marks fit the blade face. Thin additive streaks occupy only 1.8% of one rotor plane, or 3.6% across two planes. They leave physical blade faces visible and stop when the weapon stops. Angular hulls, small steel bevels and bright cutting edges replace overly rounded weapon finishes. Replay visibility and effect-count limits remain.

## Faster spin-up

Six presets use two modelled S48 motors. Added mass, current and battery consumption are included. RPM limits, tip speed and maximum rotor energy stay unchanged. All ten builds remain within 113.398 kg.

| Robot | Previous seconds to 95% | Current seconds to 95% | Reduction |
|---|---:|---:|---:|
| Tombstone | 14.05 | 6.77 | 51.8% |
| ICEwave | 20.42 | 9.95 | 51.3% |
| Gigabyte | 35.93 | 17.57 | 51.1% |
| Son of Whyachi | 29.11 | 14.25 | 51.0% |
| SawBlaze | 9.48 | 4.16 | 56.1% |
| Deep Six | 33.98 | 16.68 | 50.9% |

The stronger two-wheel horizontal motor exposed excessive reverse steering during spin-up. Bounded drive-motor correction reduces the reaction turn on straight commands. It does not reset the pose or add free torque. Normal steering remains available. Tombstone reverses 1.86 m in the fixture, with no stalled samples.

## Metal impacts

Seven local MP3 clips replace the simple metal ping. The clips come from [Kenney Impact Sounds](https://kenney.nl/assets/impact-sounds), released under CC0. They are recorded metal impacts, not BattleBots broadcast audio. The original licence is included in public/audio/License.txt.

Contact energy selects light, medium or heavy clips and controls gain and pitch. Material-specific rubber and plastic effects remain. A limiter, twelve-voice cap, cleanup and a nonblocking synthesized fallback remain. The seven clips total 34,577 bytes. Robot motors and ICEwave exhaust remain synthesized approximations.

## Verification

75 automated groups pass: 7 blades-update, 8 wedge-update, 3 mobility, 8 roster, 41 offline UI, 7 sleek, and 1 filtered Gigabyte recovery group. All 40 movement cases have zero stalled samples. Five seeded AI fights complete with 56 weapon hits; each fight has hits. Production TypeScript/Vite build and static bundle/embedded-WASM audit pass. No dependency was added.

The prior full core, gameplay and recovery suite results are historical. They are not part of this update's count. Current data: blades-update-results.json, blades-update-summary.json, mobility-cases.json, mobility-results.json, roster-results.json, review-ui-results.json, sleek-results.json, sleek-matches.json, wedge-update-results.json, recovery-update-results.json and bundle-audit.json.

The managed preview browser cannot create a WebGL context. GPU appearance, live browser gameplay, frame rate and audible playback remain unverified. Offline geometry, physics, DOM and audio-graph checks do not replace those checks.
