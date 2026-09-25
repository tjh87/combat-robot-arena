> Historical record. For the current standalone specification, read `../handover/CURRENT_REQUIREMENTS.md`.
> Old values below can be superseded. Do not treat old test counts as a new test run.

## Recovery, handling and impact repair — 2026-09-24

Use the latest rules in `REPAIR_UPDATE.md`. Minotaur gyro recovery requires upright support, regulates drum speed, uses real wheel steering and has a 24-second limit. Quantum releases within 2.1 seconds and measures at most two robot lengths of retreat. Preserve positive fractional damage, separate crushing summaries, seven animated bubble tiers, ring-out metrics, fast-speed panel labels and M/R result controls. Tracks use physical rollers with the highest tire friction and must pass normal build limits. Keep all 11 polished models below 60,000 triangles. These rules supersede older timing and visual rules below.

## Reference-inspired impact bubbles — 2026-09-24

The later visual request supersedes the four-tier comic border rules below. Use seven tiers: below 40, 40+, 100+, 250+, 500+, 800+, and 1,000+ HP. Damage numbers are the only text in each bubble. Use ink outlines, dotted shading, speed lines, cloud shapes, layered explosions, smoke puffs, stars and lightning. Effects become stronger with damage. Keep actual HP aggregation, replay timing, reduced motion and the 1.3 s lifetime. `IMPACT_BUBBLE_TIERS.md` records the new appearance and validation.

## Comic damage borders — 2026-09-24

Damage readouts contain the HP number only, with no words above it. Use four border styles based on actual HP loss: below 40, 40–99, 100–249, and 250 or more. Progress from muted blue rounded borders through yellow angled borders and orange bursts to pink-and-gold starbursts. Border thickness rises from 3 to 6 px. The strongest hit starts with a 22% size pop and 16 px glow. Settle the pop over 0.24 s using simulation/replay time. Preserve actual damage totals and the existing 1.3 s display lifetime. Reduced-motion mode removes the pop and upward movement. `COMIC_DAMAGE_UPDATE.md` records details.

## Gyro dancing and winner confetti — 2026-09-24

Minotaur recovery must use its drum angular momentum and real wheel contact. Spin up to 35% requested RPM, then apply 0.55-second steering pulses with 0.15-second pauses, following the lean and drum direction. Stop after sustained wheel contact or an eight-second limit. Preserve the physical Euler inertial torque, motor power limits and inverted driving. Reject duplicate recovery requests and abort if drive or weapon power fails.

After a match, show 24 small confetti pieces only inside the winner’s robot portrait. Respect both the saved reduced-motion preference and the operating system setting. `GYRO_CONFETTI_UPDATE.md` records the implementation and checks.

# Decisions

## Current update: HUGE control and fall damage — 2026-09-23

`TRACTION_LANDING_UPDATE.md` records the user's latest handling and landing request. Earlier conflicting HUGE traction and individual-collider fall-damage values are historical.

- HUGE wheel friction rises from 1.65 to 2.10. A shared forward/reverse speed controller and yaw-rate controller use the existing bounded motors. Supported pitch and roll correction helps it leave side poses; actual airborne orientation stays free.
- One whole-robot landing budget replaces separate floor-contact damage during a fall. Use actual attached mass, measured downward velocity and tracked descent. Treat `m*g*h` as the gravity share of kinetic energy, never additional energy.
- A 0.12 m equivalent cushion protects ordinary bumps. Of the remaining damage energy, 70% reaches struck parts and 30% reaches the chassis. Material resistance and HUGE's flexible-wheel reduction still apply.
- Floor and shelf landings share the same calculation. Contact points cannot each spend the full fall energy. The bounded hammer and rotor-contact rules remain active.

## Current update: weapon references, hammer-saw and hydraulic crusher — 2026-09-23

`WEAPON_SPECS_UPDATE.md` records the current source choices and mechanisms. It supersedes earlier conflicting mass/RPM values, downward HUGE poles and Quantum retreat distances. Retain `PHYSICS_UPDATE.md` for energy accounting, containment and bounded hazards.

- Published reference masses override geometric rotor mass for the chosen configurations. All game estimates are labeled; unavailable values are not presented as verified facts. Hydra and Quantum do not spin.
- Stock mass is 113.2 kg, including a fixed editable internal hardware estimate. Legacy builds retain their existing geometry mass when the new fields are absent. Custom builds retain the normal heavyweight and tip-speed legality checks.
- SawBlaze's swinging arm and rotating disc retain separate motion and work. A stopped disc still acts as a hammer. HUGE's wheel-center axle extensions lie horizontally.
- Quantum closes rapidly, then develops contact-dependent hydraulic indentation pressure: 35,000 lbf front / 50,000 lbf rear. Pump and cycle limits are game approximations; measured solver contact impulse still determines physical motion. Its auto-release retreat ends at two complete robot lengths.
- Review corrected triangular scoop mass moments and re-applied Quantum's actuator torque limits after velocity limiting, preventing excessive braking torque after an impact. HUGE now uses bounded drive-motor yaw correction during straight movement, stopping reversal drift from developing into gyroscopic sideways lift.

## Current update: energy, engagement and containment — 2026-09-23

`PHYSICS_UPDATE.md` is the current record. The user approved these changes after the physics review. It supersedes earlier launch assistance, recoil cancellation, and unlimited kinematic hammer force. Older values below remain historical.

## Current update: stability, recovery and impact sound — 2026-09-20

STABILITY_UPDATE.md is the current record. Earlier conflicting decisions below are historical.

- Hydra catches the arm before the hard stop and reduces launch pressure smoothly with arm speed. Preserve actual contact forces and the 12.6 kJ ceiling.
- The user's requested manual Unstick button authorizes relocating stopped, trapped or overturned robots to clear floor. It preserves damage, battery, charges, judging evidence and match time. Keep a five-second cooldown, close flight measurements before moving, and clear pre-recovery replay frames.
- Remove persistent robot impact marks and scratch overlays. Preserve structural damage, sparks, smoke and detached parts.
- Replace the seven Kenney impact files with eight Nox_Sound CC0 contact-microphone metal recordings. Serve all clips locally. Keep synthesized motor and engine layers.
- 65 focused automated groups and two AI fights pass. GPU rendering and audible playback remain unverified.

## Earlier update: results, blades and Hydra — 2026-09-20

BLADES_UPDATE.md records version 8. STABILITY_UPDATE.md supersedes conflicting values.

- Knockout and disqualification override judging points. Display outcome cards and hide unused points in collapsed statistics. Preserve timed judging rules.
- Hydra uses physical contact and a pressure-driven loaded stroke within the existing 12.6 kJ budget. The cue requires real support and central alignment.
- Weapon damage uses fitted gouges and scratches. Thin luminous tip streaks leave blade shapes visible at speed. Angular cutting edges stay sharp.
- Six presets use two modelled S48 motors for 51–56% shorter spin-up. Mass and battery consumption reflect the change. Two-wheel horizontal straight-drive correction uses the existing limited motors.
- Seven recorded Kenney CC0 metal impacts are served locally. Severity controls clip, volume and pitch. Motor and engine sounds remain synthesized. No BattleBots broadcast audio is imported.
- Targeted regression checks and five AI matches pass. Managed browser graphics and audible playback remain unverified.

## Earlier update: compact robots, ground contact and audio

WEDGE_UPDATE.md records that earlier update. BLADES_UPDATE.md supersedes it where they conflict.

- Ground clearance is physical: 2 mm ordinary wedge clearance, thin noses, and eight independently hinged Hydra fingers. Sliding supports use low friction; tyres retain traction. No floor-contact bypass or artificial lifting force.
- Hydra has unlimited flip count, with battery, damage, cooldown and per-stroke work constraints retained.
- Minotaur's drum is recessed by 90 mm. HyperShock and SawBlaze are shorter. Deep Six upper wheels and struts are removed. HyperShock uses a folding physical side-roll mechanism instead of fixed rollover struts.
- Drive motors use an implicit back-EMF step to prevent low-inertia wheels oscillating under steady input. HUGE's AI uses delayed yaw-rate damping to escape corners.
- Flight labels show measured distance and peak height beside each line endpoint.
- ICEwave has distinct synthesized pulsed exhaust; electric spinners and moving actuators have separate layers. Impact timbre and volume depend on contact material and accumulated energy. No recorded video audio is imported.
- Original procedural lightning/flame/cowl graphics and smoother surfaces augment the existing local photographs. No new runtime dependency or remote asset is required.

## Earlier decisions and release history

- Static TypeScript/Vite application with plain DOM controls, Three.js WebGLRenderer and Rapier. No server or external API.
- Pinned Three 0.180.0, Rapier compat 0.19.0, TypeScript 5.9.2, Vite 7.1.7, tsx 4.20.5 and a lockfile.
- New private Site, reused through all stages. Normal Sites source workflow; no external GitHub repository.
- Scuffed steel arena with blue and red corners, reinforced glass, broadcast gantries, lighting fixtures and seating. All meshes, textures, lights and audio are procedural.
- No downloaded robot models, images, fonts, audio, environment maps or runtime CDN code.
- Match and tournament state stay in memory. Only preferences use localStorage. Sharing explicitly writes `#build=`.

## Physics and calibration

- Final rules: fixed 240 Hz, 43,200 ticks per match, 12 solver iterations, one nonlinear CCD clamping substep, 1 mm contact skin.
- The 120 Hz suite missed 24 known high-speed contacts. Keep those labelled cases as regressions.
- Eight CCD substeps made solved contact manifolds transient. One clamping substep preserves observable normal impulses on the next tick.
- Graphics quality never changes physics. There is no extra launch impulse, manual rotor spin-down or duplicate gyro torque.
- Rapier collider mass is the sole mass assignment. Internal sensor colliders carry specified component mass without external contacts.
- Hollow drums use 20 polygonal convex sectors. Geometry, exact prism moments, mass and collisions share the same part manifest.
- Rapier contact API reference: https://rapier.rs/docs/user_guides/javascript/advanced_collision_detection/ .
- Current preset masses: Crosscut 91.172193 kg; Upturn 103.016473 kg; Springboard 92.858012 kg.
- Crosscut uses a 0.42 m underslung bar, 2,500 requested RPM, two wheels, clipped armour, an exposed frame and physical front skids. Time to 95%: 18.775 s. The skids prevent the low blade becoming a ground support.
- Upturn time to 95%: 30.85 s. Heavy rotor spin-up is a deliberate game trade-off.
- Springboard uses a tapered physical arm with a 4 mm lip and 3 mm minimum floor clearance. Hinge travel: 1.48 rad.
- Flipper work cap: 3,000 J per charge plus 100 J control energy. Return uses battery power. Cooldown: 1.5 s.
- Optional R600 roll arm default: 0.42 m, mount outside the wheel envelope, z=-0.18 m.
  It uses a -2.35 rad ramped extension, torque capped at 350 N·m, a 2,000 J cycle cap and a three-second request cooldown.
  The original 0.30 m mechanism failed to overturn this reference assembly. Short player-authored mechanisms are not promised to recover every build.
- All actuator and material values are game approximations. They do not describe certified commercial hardware.

## AI, rules and telemetry

- AI decisions run at 60 Hz. Delay ticks: Easy 60, Medium 29, Hard 15, giving 250 / 120.833 / 62.5 ms.
- Utility scores use delayed observable state, four-point hysteresis and a 0.3 s dwell except emergency recovery/release.
- AI stores its own command requests to avoid repeated toggles during the observation delay. No future human input is inspected.
- Judging uses normalized new module loss and timed evidence. Exact ties use seeded identity order, rotated by category.
- Forced hazard/inversion attribution expires after 1.5 s. Result tables expose raw intervals and normalized shares.
- Damage records use stable part/contact identities. The 200 J threshold affects game damage, not physical collision response.
- Impact estimates and rotor energy changes remain separate quantities. Feed-per-tooth is diagnostic only, with a zero-speed null case.
- Travel uses the chassis reference point; whole-assembly COM is recorded separately. Powered and compound movement remain explicit.

## Arena, repairs and presentation

- Shelf: 3.3 × 1.4 × 0.32 m. Visible containment: 2.4 m panels; physical boundary: 6 m plus roof.
- Two Corner Hammers, four Floor Blades, two Wall Augers. Schedules and contact budgets are named game design values.
- Non-player tournament matches run the same engine in bounded tick batches. AI opponents start each round fully repaired.
- Player condition carries. Battery energy and charges refill; failed modules remain failed until repaired.
- Repairs and armour material swaps stage atomically under 900 points. Name/livery changes cost zero without refreshing physical health.
- Replay uses 180 frames at 60 Hz and isolated visual proxies. Actual simulation stays paused. Exit requires explicit Resume.
- Bounded effects: 180 spark points, 64 smoke points, preallocated damage marks per physical part, 30 arena-only debris bodies.
- The user requested primary POV in the visual update, superseding the original tactical-only presentation requirement. E (or the HUD button) switches between Tactical and P1 POV. Both primary POV and the optional 30 Hz inset use the interpolated chassis transform, including pitch and roll. Replay POV uses its recorded chassis transform.
- Browser context loss, audio denial, initialization failure, invalid builds and duplicate starts have recovery paths.

## Tool and validation limitations

- The tsx CLI requires an unsupported IPC socket here; tests use `node --import tsx`.
- The supported cloud browser can now load the managed preview, but its GL_RENDERER is Disabled and WebGL context creation fails. Browser graphics and physical-hardware gates remain unverified. No browser bypass was attempted.
- Local simulation checks and native private publication can proceed independently. Publication does not establish hosted browser correctness.

## Visual update and controls

- The user's supplied Tombstone image guides the compact black frame and low red horizontal bar. Official Tombstone, Minotaur and Hydra photos guide family silhouettes; names and liveries remain original.
- Chassis corner cuts are authored convex hulls, not display-only cuts. Their mass moments agree with independently built Rapier hulls.
- Upturn has two exposed wheels, a close drum and physical bearing cheeks. Springboard has clipped purple/gold armour and a shorter, wider flipper.
- Floor wear, painted corners, tread, fasteners, vents, access panels and markings are generated locally. Static arena detail is batched by material.
- P1 defaults to arrow keys; old unchanged WASD defaults migrate to arrows. Explicit remaps remain available. Arrow keys also move focus through menu button groups.
- The start sequence shows 3, 2, 1, then FIGHT. It does not advance physics before the start. The match timer derives from simulation ticks and holds during pauses.
- The equal-mass flipper fixture uses a larger unarmed chassis so its legal plate-thickness range can match the revised flipper mass. It asserts mass equality before contact and verifies physical inversion.

- Spinner contact validation now uses an unarmed flat-front target. The shorter flipper ramp can hold a drum at its bearing cheeks without contacting the rotor; that is a valid geometry interaction, not evidence of energy transfer. The flat target makes direct rotor contact repeatable.


## Requested roster expansion

The latest user request supersedes the initial three-weapon-family scope and small starting envelope. See ROSTER_UPDATE.md for the ten reference templates, eight active mechanisms, expanded 2.2 × 2.2 × 1.6 m envelope, arm control, source evidence and backward-compatible version-2 parsing. The 240 Hz step, 113.398 kg limit, 111.76 m/s tip limit, damage, judging and repair rules remain in force. The new hold damping corrects chatter in the narrowed flipper; it is calculated from effective inertia.

## Combat feedback and recovery request — 2026-09-19

The user's latest request authorizes real robot names and photographs, larger roster height, automatic physical unsticking, and visible ten-second immobilization counts. It supersedes the original idle-count-out and mandatory long-frame/replay pause behavior. Preserve intentional focus/controller/safety pauses. Procedural weapon audio follows RPM and mechanism type; it does not claim to reproduce a recorded real robot. See GAMEPLAY_UPDATE.md.

## Sleeker models and combat balance — 2026-09-19

The latest user request authorizes smoother surfaces, sharpened weapon geometry, persistent builder saves/reset, permanent front markers, central circular KO clocks, larger 5/3/3 results, lower Whyachi hits, symmetric HUGE drive, SawBlaze arm self-righting, automatic inverted vertical-spin reversal, and stronger weapons. Updated game motor/actuator ratings and preset mass values supersede prior figures. Keep physical work and contact constraints; do not fabricate launch impulses or make a floor-pinned weapon ignore the floor. Deep Six receives the highest maximum rotor energy, rear stabilizers and a physical upper drive roller kit for inverted operation; its final preset mass is 111.399 kg and requested-speed rotor energy is 134.088 kJ. Native publication keeps the existing owner-private audience.


## Recovery, stronger hits and fight controls — 2026-09-19

The latest request authorizes ICEwave exhaust, physical HUGE side supports, Gigabyte arm recovery and Minotaur drum precession. Recovery controls follow installed and functioning mechanisms. Horizontal bar/cage rotor energy rises 23–28%; Hydra uses a 12.6 kJ allowance and a contact-load-aware damped actuator. Actual contact still supplies launch and recovery. The new implicit rotor inertial term corrects observed missing precession in Rapier 0.19 without increasing free rotational energy. Automatic replay requires a 12 kJ robot weapon hit. Winner/runner-up names, the computer opponent picker and one-click menu exit are prominent. See RECOVERY_UPDATE.md; earlier conflicting mechanism and balance notes are historical.

## Crusher update

Quantum uses a torque-driven jaw and real contact manifolds. Sustained tooth pressure is a bounded pump-energy approximation, capped at 12 kJ per bite, with a 3.5-second automatic release. It does not attach the target with a hidden joint. Damage allocations are aggregated per event, robot, and module to bound long-hold records.

Hydra's launch pressure follows measured insertion, with the existing maximum launch setting retained. Gigabyte gains physical support width and controlled traction input. Manual keyboard recovery preserves match state and damage. Undersized stock and tournament batteries are corrected rather than disabling battery accounting. Damage-related weapon failures remain part of combat.

The user-supplied start excerpt is used directly. Recorded CC0 steel and scrap-drop samples are bundled locally, with separate collision and landing banks. The video and audio licences remain distinct.
