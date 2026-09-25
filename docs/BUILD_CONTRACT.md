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

## Current traction and landing update — 2026-09-23

The user requested more HUGE wheel traction, control and stability, plus fall damage calculated from robot weight, velocity and drop height. `TRACTION_LANDING_UPDATE.md` supersedes older conflicting HUGE handling and landing-damage rules.

HUGE uses 2.10 wheel friction, shared forward/reverse speed control, a 2.2 rad/s requested turn rate and bounded pitch/roll correction only with actual floor or shelf support. Keep its horizontal wheel-center poles, axle-based controls, physical gyro motion and wheel damage protection. Limit drive commands while tipped; recover supported side poses without teleporting or locking airborne orientation.

Every robot uses one landing-energy budget from actual attached mass and downward center-of-mass velocity. Track the actual center-of-mass descent from the flight peak. The `m*g*h` contribution is already inside impact kinetic energy; never add it twice. Share the landing budget across contact parts and chassis. Preserve small-bump cushioning, actual material resistance, the corner-hammer energy ceiling, and rotor slowdown on floor contact. Show mass, height, impact speed and energy in the impact record.

## Current weapon references and mechanisms — 2026-09-23

The user's latest request is recorded in `WEAPON_SPECS_UPDATE.md`. It supersedes earlier conflicting weapon mass/speed values, HUGE pole geometry, and Quantum's 0.20 m retreat. Retain the energy, containment and contact rules in `PHYSICS_UPDATE.md`.

SawBlaze is an overhead hammer carrying an independently spinning disc. Keep separate swing and spin energy, allow a stopped disc to make a physical hammer strike, and retain the guard, full arm sweep and self-righting. HUGE's outer wheel-center axle extensions must be horizontal.

Quantum remains four-wheel drive. Model rapid jaw closing followed by pressure on real tooth contact, rated at 35,000 lbf at the front and 50,000 lbf at the back. The latter rating follows the user's supplied specification. Automatic release opens the jaw and retreats no more than two complete robot lengths before re-engaging, subject to obstruction and recovery. Model hydraulic indentation work with a finite pump/cycle budget; do not turn rated pressure into an extra launch impulse.

Every stock spinner has explicit moving mass and a sourced or clearly estimated speed. The workshop must distinguish published data, RPM derived from tip speed, game estimates and non-spinning weapons. Mass affects actual collider mass, rotational inertia, spin-up and impact energy. Retain version-2 import compatibility. Stock total masses are 113.2 kg with a fixed editable estimate for internal hardware; custom edits do not silently rebalance that mass.

## Current physics update — 2026-09-23

The user approved the researched physics proposal and completion of the unfinished work. `PHYSICS_UPDATE.md` supersedes conflicting physics instructions below.

Remove added launch impulses and damage-based recoil cancellation. Contact forces determine motion. Debit a shared rotor-energy budget for tooth strikes and friction, including floor and wall contacts. Motor work can restore speed on subsequent steps. Tooth spacing, feed speed, insertion depth and incidence determine engagement and damage. Retain the existing game damage multipliers: Deep Six 4 and HUGE 3; these do not multiply physical launch energy.

Keep 240 Hz physics and one CCD substep so solved hit records remain available. Use 0.60 m overlapping walls and a swept whole-assembly guard at the 2.70 m rim. A robot may exit above the rim. Each corner hammer uses a finite 100 kg moving head and one shared 3,500 J impact allowance per cycle.

Keep physical gyroscopic handling. HUGE drive commands change at up to 2.4 units per second to prevent sudden reversal lift. Tire smoke requires slip; pushing pressure alone emits none. Preserve the Deep Six blade, Gigabyte upper teeth, directional sparks, audio, and all existing game modes.

## Previous user-directed changes — handling, KO presentation and directional sparks

Deep Six now has the highest stock full-speed strike rating, superseding the earlier HUGE-hardest request below. Use strike multipliers 4 for Deep Six and 3 for HUGE. HUGE uses a 0.92 m blade inside 0.96 m wheels with 20 mm nominal clearance, 1.65 wheel friction and grounded central-body stabilization. Keep wheel-only weapon protection and consistent axle-based steering.

One-player selection includes separate random-player and random-opponent buttons. Show the final motion and a retained decisive-hit replay before results, including damage numbers and comic impact words during slowdown. Robots thrown over the 2.70 m cage can lose by ring-out; remove the invisible roof. Preserve result HP, damage/flight highlights and robot photographs.

Gigabyte gains grounded stability and a firmly stowed recovery arm. SawBlaze uses hinged low forks, a rear saw guard, a 180-degree sweep and a controlled stable return. Quantum gains stronger drive hardware and grip; automatic release reverse throttle is reduced by 60% and bounded to 0.20 m. Grounded stabilization and attraction are user-directed gameplay aids, not locks on airborne motion.

Sparks follow actual contact/blade motion and outgoing target motion in a directional cone. Use varied curved streaks, occasional forks, round glowing heads and short generated spark hiss/crackle sounds. Deep Six's pointed tips stay within its existing 0.57 m blade radius. Interpolate replay transforms and avoid repeated unchanged damage-material work. See `handling-effects-update.md` for checks and limits.

## Prior user-directed changes — HUGE controls, wheel contacts, recoil and result portraits

HUGE uses two continuous rounded wheel contact surfaces while retaining the visible wheel parts and their mass. Its drive heading and weapon direction follow the axle, independent of central body pitch. Wheel-only damage cannot derate or reverse its protected weapon supply. Other robots only switch inverted controls after sustained ground contact, with a wider tilt threshold. HUGE's POV and direction marker follow the same drive heading.

HUGE's front support reach is 0.26 m, down from 0.48 m, so the supports no longer push opponents away before the blade can touch them. Its strike multiplier is 10×, up from 1.5×. This gives the highest stock full-speed strike rating. On each damaging robot contact, the robot dealing more HP damage gets recoil assistance proportional to its advantage: up to 45% for ordinary attacks, or 70% for vertical spinners. Assistance restores only a fraction of motion lost to that hit, not speed beyond its pre-hit state. This user-directed game assist supersedes strict momentum conservation for recoil reduction; the opponent's launch impulse remains unchanged.

All eleven result photographs are embedded thumbnails, so they display without separate post-match image requests. Result portraits use fixed image bounds and normal blending. See `huge-control-update.md` for measured checks and limits.

## Latest user-directed change — HUGE wheel protection

HUGE takes 50% less damage when a contact hits either wheel, including the rim, tread, spokes and hub. Apply this reduction only to the actual wheel collider. Exposed drive motors, chassis, weapon and battery retain normal damage. Keep collision impulse, movement, attack energy records and all other robots unchanged. Four focused checks pass, including all 76 wheel components and accumulated damage that can still disable a drive. See `tests/huge-wheel-damage.ts`.

## Latest user-directed changes — Quantum, HyperShock, 1,200 HP and hit records

All eleven robot templates and builder configurations use 1,200 chassis HP. Quantum has a wider, smoothly sculpted silver skull, real crown openings, two piercing fangs, swept black shoulders and a thin concave scoop. A Quantum strike that removes battery HP and leaves at least 70% battery damage ignites an eight-second fire. Armour must be penetrated first; fire causes 240 chassis HP damage over its full duration and cannot silently disable the protected weapon supply.

HyperShock uses two separate spinning cutters, four larger deep-dish wheels, a compact shared axle and 15 mm nominal blade clearance upright and inverted. Its wheel positions and inverted acceleration limit prevent ordinary reverse acceleration from tipping the robot. Inverted driving retains the folded recovery arm and automatically reverses blade rotation. Manual vertical self-righting remains available. The inverted POV stays above the robot. Both result cards retain HP, flight distance and height, and show underlined biggest-hit-dealt values in green and biggest-hit-received values in red. See `quantum-hypershock-update.md` for verification and limits.

## Latest user-directed changes — hit height and recovery gating

Both result cards include maximum vertical rise after an opponent hit, in metres to two decimal places. The maximum persists for the whole match and excludes recovery movement. Automatic self-righting requires 0.6 seconds of steady floor or shelf support while tipped; airborne motion, transient tilts and stale AI observations must not trigger an arm. Idle arms must not enter recovery settling. See `height-recovery-update.md` for checks and suggested next additions.

## Latest user-directed changes — result units, HyperShock drive and landing sounds

Result distance and energy units use 20 px bold text, up from 14 px. HyperShock uses stronger D48 Sport motors and 240 N of floor attraction; motor mass, work, current and battery use remain accounted for. Floor attraction releases during self-righting. A wider recovery foot and corrected stow-angle wrapping keep recovery functional with the heavier drive. Landing sounds use short, damped recordings with a low-frequency body and no long metal ringing. Floor contacts within one landing share a sound. See `landing-drive-update.md` for measured changes and validation limits.

## Latest user-directed changes — damage threshold, scoops, results and RPM audio

Weapon output remains 100% through 50% damage to the blade or actuator. Above 50%, output decreases linearly to a 45% reserve at full damage. Battery damage still affects drive, but does not derate the protected weapon supply. Quantum and Hydra have physical low side edges on their front scoops for turning under an opponent. Result portrait cards show HP bars, the robot's farthest travel after being hit, and its hardest attack dealt. Powered ground escape and recoil do not inflate the travel statistic; maxima persist beyond the bounded replay history. Match starts, rematches and tournament starts use three generated amber tones and a distinct fight tone. ICEwave uses original noise-driven combustion synthesis; pitch, texture and load follow current blade RPM, including impact slowdowns. No fixed-time engine run-up or recorded ICEwave playback. These latest requests supersede earlier continuous wear derating and extracted start-audio requirements. See `speed-scoop-update.md` for verification.

## Prior user-directed changes — vertical recovery and stronger strikes

Quantum and HyperShock now use vertical folding recovery arms and retain compatibility with saved stock builds. Hydra uses ground bracing during supported flips, a 50% larger stroke allowance and a 50% higher pressure limit. Deep Six gets 2× blade damage; HUGE, Hydra and all horizontals get 1.5× blade damage. Powered spinners get a symmetric battery-funded impact assist; coasting impacts stay unassisted. These user-requested gameplay changes supersede the earlier unchanged-impulse requirement for powered hits. HP displays are larger, result cards include remaining HP, and Hydra assist must not overlap its gauge. ICEwave uses original mechanical combustion synthesis, superseding the earlier recorded-engine requirement. See `hud-recovery-update.md` and the focused reports for validation and limitations.

## Current user overrides — 20 September 2026

The user's later requests supersede the original specification below. All eleven named robot templates, reference portraits and supplied audio remain supported. Weapons and weapon actuators retain function at zero health. A protected weapon supply prevents battery depletion or damage from disabling a weapon. Drive, armour and chassis damage remain active. All flippers have unlimited cycles; stroke work and cooldown limits still apply. Use a native animated start with extracted sound, not video playback. Results include both robot portraits and reduced-motion-aware confetti. Vertical rotor gyroscopic precession remains physical.


Latest damage/audio request: show robot-attached weapon and battery damage percentages, plus fixed HUD damage and output. Weapon wear (worst of blade and actuator) and battery wear reduce weapon torque continuously, with a 25% output reserve. The RPM cap falls with the square root of output. Drive torque decreases with battery wear; fully failed battery or empty drive charge still stops drive. Charges remain distinct from damage. Active blade strikes against non-weapon surfaces apply 1.2× contact energy to the target (50% above the previous 0.8 share); blade clashes retain 0.5 each. Passive sides/rear do not damage opponents except during a horizontal translating ram. Physical impulses remain unchanged. Use the supplied ICEwave idle, acceleration and full-power recordings without electric weapon layers. Rebuild impact tails to remove cookware-like ringing. This later request overrides full-strength protected weapon operation while preserving operation at reduced output.

## B. Complete game specification

### B1. Product and Sites delivery

- Working title: **Combat Robot Arena**. Use original robot names and original arena branding.
- Build a playable desktop 3D browser game, with AI and local two-player combat.
- Keep three weapon families: horizontal bar, vertical drum, and flipper.
- Include Quick Fight, Practice, Builder, Tournament, Settings, and Results as views within one application.
- Use TypeScript, Vite, plain DOM UI, Three.js `WebGLRenderer`, and `@dimforge/rapier3d-compat`.
- Use exact dependency versions and a lockfile. Check the installed APIs before writing integration code.
- Use procedural game meshes. Do not import robot models, photos, programme audio, or third-party textures.
- Use generated mesh details rather than runtime Boolean geometry operations.
- Keep the simulation independent of the DOM, rendering, audio, and Sites runtime.
- Use static Sites hosting with the built public directory, normally `dist`.
- Bundle Three.js, Rapier, and required WASM through the build. Do not depend on runtime CDN imports.
- Use the current Sites setup and hosting skills. Preserve the Site identity between stages.
- Do not add a server, D1, R2, authentication, an AI API, or an external database.
- Keep intermediate work in the same local preview. Publish the completed game after functional checks pass.
- Keep match and tournament state in memory. Refresh starts a new run.
- Use the URL fragment for build sharing only. Local storage may hold controls, volume, and graphics preferences only.
- State the refresh behaviour beside tournament start. A build link does not save a tournament.

### B2. First screen and visual direction

Open on a compact game menu beside a live arena view. Make Quick Fight and Practice immediately available.
Use charcoal steel surfaces, white text, amber warnings, cyan P1 accents, and orange P2 accents.
Use distinct P1/P2 labels and shapes. Colour alone must not identify players or damage.
Avoid a marketing hero, stock dashboard cards, and large unused margins.

Builder: controls on the left, live robot preview in the centre, live totals on the right.
Match: large arena, clock at top centre, player status at top corners, compact controls at the bottom.
Result: winner and reason first, then damage, judging, and impact records.
Repair: module condition, exact cost, and a before/after preview beside the budget.

Support normal desktop widths from 1280×720 upward. Keep menus usable at 200% text zoom.
On narrow or touch-only screens, show a clear desktop-control message. Do not add mobile combat controls.
Use readable DOM text. Keep the canvas and its overlays within the viewport.

### B3. Shared simulation rules

| Setting | Value |
|---|---:|
| Rules ID | `arena-v1` |
| Weight limit | 113.398 kg |
| Tip-speed limit | 111.76 m/s |
| Match length | 180 simulation seconds |
| Arena floor | 14.63 m × 14.63 m |
| Gravity | 9.81 m/s² |
| Normal physics rate | 120 Hz |
| Maximum steps per render frame | 16 |
| Late-frame pause threshold | 0.25 seconds |
| AI decisions | 60 Hz |
| Immobilisation count | 10 seconds |
| Pin release request | 10 seconds |
| Pin release warning | 9 seconds |
| Runtime module slots | 12 |
| Repair allowance | 900 points between rounds |
| Dynamic debris limit | 30 |
| Replay capture | 3 seconds at 60 Hz |
| Replay clip | 1 simulation second at 0.25 speed |
| Minimum builder ground clearance | 0.003 m |

Start at 120 Hz and run the collision gates. If they fail, improve CCD and geometry first.
Use 240 Hz only if required by measured collision results. Record that choice before a match starts.
Do not change physics rate during a match or when changing graphics quality.
A full match contains 21,600 ticks at 120 Hz, or 43,200 at 240 Hz.

Use one fixed-step loop and integer simulation ticks. Keep the accumulator remainder after normal frames.
Do not silently discard backlog when the per-frame step limit is reached.
Pause on a long frame or sustained backlog. Clear scheduling backlog when entering pause, without advancing simulation time.
Pause the complete simulation on focus loss, hidden tab, controller loss, settings, replay, or explicit pause.
Clear held inputs. Resume only after an explicit user action. Do not fast-forward missed wall-clock time.

Use separate seeded random streams for simulation and visual effects.
Keep body creation, event processing, tie resolution, and removal order stable.
Use input commands stamped with simulation ticks for reproducibility tests.
Do not promise cross-platform application determinism until it passes a cross-browser test.
Recorded visual playback does not require re-simulating a match.

### B4. Data, dimensions, and legality

Implement a versioned `BotConfig` with `schemaVersion: 2`.
Use a discriminated weapon union: `horizontal_bar`, `drum`, `flipper`, or `none`.
Allow `none` in Practice only. Tournament and Quick Fight require a working active weapon at entry.
Damage can disable a weapon during a tournament without making the existing entry illegal.
Do not include unimplemented vertical discs or hammer-saws in the editor.

Define these authored groups:

- Identity: original name, maximum 24 Unicode code points, and two validated hex colours.
- Chassis: form, dimensions, material, thickness, wedge angle, clearance, and mount positions.
- Spinner: actual shape dimensions, tooth dimensions/count, material, mount, motor ID, gear ratio, and requested speed.
- Flipper: arm dimensions, hinge transform, travel limits, actuator ID, stroke time, and 1–12 starting charges.
- Drive: 2WD/4WD/6WD, wheel geometry/material, motor ID, ratio, and optional magnetic downforce.
- Armour: one entry for each front, left, right, rear, and top mount. Zero thickness means absent.
- Battery: pack ID and capacity.
- Self-right system: absent or a defined physical mechanism with a mount and actuator.

Compile all physical simulation values to metres, kilograms, seconds, radians, joules, amperes, volts, and newtons.
Display millimetres, degrees, Wh, RPM, pounds, and mph only through explicit conversions.
Motor catalogue ratings may use labelled Kv in RPM/V. Convert them once when compiling a robot.

Use these dimension ranges where they produce valid geometry:
chassis length 0.60–1.20 m, width 0.50–1.00 m, height 0.15–0.45 m;
chassis thickness 0.004–0.020 m; armour thickness 0–0.025 m;
clearance 0.003–0.040 m; wheel radius 0.05–0.15 m; magnet force 0–400 N.
Spinner outer radius can be 0.15–0.60 m only when the complete assembly fits and clears itself.
Reject negative inner radii, inner radii at least as large as outer radii, invalid angles, and overlapping mounts.
Use 1–12 teeth with physically valid spacing.

The starting envelope is 1.2 m × 1.2 m × 0.6 m.
Include wheels, armour, mounts, and the complete spinner rotation envelope.
Check a flipper in its stowed position. Check its deployed sweep separately for self-interference.
Use the same generated dimensions for visuals, mass calculation, colliders, and legality checks.
Reject impossible builds. Do not silently change the player's entered dimensions or requested speed.
Allow a legal speed controller setting below a motor's free speed. Show the requested and available speeds separately.

Validate when editing, importing, entering a match, and committing tournament repairs.
Use finite numbers, allowlisted enums, bounds, unique mounts, and strict object construction.
Reject unsupported schema versions. Add a version-1 migration only if it can map every required value explicitly.

### B5. Mass, inertia, drive, and energy

Use a parts manifest as the only mass source. Include every physical part exactly once.
List plate volumes, armour, rotor/arm, teeth, wheels, motors, battery, electronics, mounts, magnets, and self-right equipment.
Plate mass equals density × geometric volume. A hollow shell must not use solid-box mass.
Use this complete material catalogue as the starting approximation:

| Material ID | Density, kg/m³ | Base roughness | Base metalness |
|---|---:|---:|---:|
| `aluminium7075` | 2810 | 0.25 | 0.90 |
| `hardox` | 7850 | 0.45 | 0.90 |
| `titanium` | 4430 | 0.35 | 0.85 |
| `uhmw` | 940 | 0.60 | 0.00 |
| `polycarbonate` | 1200 | 0.10 | 0.00 |

`hardox` is the steel entry used by the game damage table.
These values are approximations. They do not certify a real material grade.
Label all unverified balance values as game data.
Use exact generic motor specifications in the catalogue; do not claim they describe commercial hardware.

Starting pack model: 48 V nominal, 100–1000 Wh, mass `0.8 + capacityWh / 180` kg.
This is a game approximation. Keep it in one catalogue entry.
Use an explicit magnet mass cost. Start with `downforceN / 80` kg for permanent magnets.
Use actual part entries for motors and electronics. Remove the undefined all-purpose 18 kg mass addition.

Store motor Kv, winding resistance, no-load current, current limit, motor mass, and gear efficiency.
Define gear ratio as motor angular speed divided by output angular speed.
Convert `Kt = 60 / (2π × Kv)` when Kv uses RPM/V. Use SI back-EMF constants after conversion.
Calculate motor current from applied voltage, back EMF, and resistance. Clamp it to the current limit.
Calculate output torque through the stated ratio and efficiency.
Include stall current loss, positive mechanical work, controller idle loss, and bearing loss.
Braking must not recharge the battery unless regeneration is implemented and tested. V1 has no regeneration.
Cap actuator work by available energy. Energy cannot become negative or increase through reverse driving.

Model wheels as dynamic bodies with appropriate joints and limited drive torque.
Include their real contact geometry, friction, and mass. Do not move robots by setting their positions each frame.
Use contact-dependent traction. Airborne wheels cannot accelerate the chassis along the arena floor.
Apply magnetic force only near the steel floor, using valid wheel proximity and orientation.
Apply it once per robot, not once per wheel. Remove it when airborne.

Compute mass, centre of mass, and inertia from the actual assembly.
For reference, a uniform bar uses `I = m(L² + W²) / 12` about its centre spin axis.
A hollow drum uses `I = 0.5m(Router² + Rinner²)` about its long axis, before teeth and mounts.
Include added parts using the parallel-axis theorem.
Use one mass assignment method in Rapier. Do not add explicit mass on top of duplicate collider density mass.

### B6. Collision ownership and weapon behaviour

**Rapier owns physical collision impulses, recoil, and rotor spin-down.**

Create each spinner as a dynamic rotor on a revolute joint.
Use current-limited motor torque with the corresponding chassis reaction.
Read RPM and energy from actual relative rotor angular velocity.
Use `E = 0.5 × I × omega²` for the stored rotational-energy display.
Enforce powered speed through the actuator controller. Do not reset angular velocity after each contact.
An external impact may briefly change actual speed; report that state rather than injecting a corrective hit.

Enable nonlinear CCD on fast moving bodies. Check the installed Rapier API.
Keep solver iterations and CCD substeps in named simulation settings.
Do not add `sqrt(2 × energy × targetMass)` launch impulses.
Do not manually subtract the estimated damage energy from rotor energy after the solver resolves the hit.
Do not add manual gyro torque to a rotor whose dynamics already provide it.

Use segmented arc probes as collision diagnostics and time-of-impact candidates.
They do not apply a second impulse, trigger damage by themselves, or suppress valid solver contacts.
Bound segment chord error relative to the smallest tested collision feature.
Cover translation, rotation, the full tooth volume, and moving opponents.
If a probe reveals a missed physical contact, fix CCD, time resolution, or collider design before passing the stage.

Separate `ContactSample`, `ImpactEvent`, and visual feedback.
Create contact samples from solver manifolds and solved impulses.
Use stable robot, module, tooth, and contact-episode IDs.
Aggregate repeated solver samples from one contact episode. Preserve separate teeth and later re-entry episodes.
HUD and sound may aggregate several small strikes. Physics and damage records must retain their identity.
Do not use the old 0.15-second bot-pair cooldown.

For game damage, compute a contact-energy estimate from pre-contact closing speed and solved normal impulse:
`impactEnergyEstimateJ = 0.5 × max(normalImpulseNs, 0) × max(closingSpeedMS, 0)`.
Aggregate unique contact contributions once. Validate this approximation in the reference cases.
This is a game damage estimate. It is not a claim of exact energy transfer or measured heat.
Record rotor energy before and after separately. Do not label those values as identical quantities.
Use a 200 J damage-event threshold and suppress resting-contact chatter.
Low-energy contacts still receive normal physical collision resolution.

Physical tooth spacing provides different engagement patterns.
Use feed-per-tooth `2π × approachSpeed / (toothCount × abs(omega))` as a diagnostic, with a safe zero-speed case.
Do not add the old tooth-count bite multiplier to both impulse and damage.

### B7. Damage and part failure

Use these 12 stable module slots:

`chassis`, `weapon`, `weapon_actuator`, `drive_left`, `drive_right`, `battery`, `self_right`,
`armour_front`, `armour_left`, `armour_right`, `armour_rear`, `armour_top`.

Each slot has presence, maximum health, current health, material, geometry reference, and functional state.
An absent module has no collider, mass, repair cost, or score denominator.
Generate separate physical contact geometry and internal damage-routing proxies where needed.
Map contact handles to module IDs. Do not raycast from an undefined direction at the contact point.

Start with these game HP settings:
chassis 1800; weapon 500; weapon actuator 350; each drive side 400; battery 350; optional self-right system 200.
For an armour panel, use `400 × (areaM2 / 0.25) × (thicknessM / 0.008)`.
Clamp only invalid geometry, not legitimate health values. Zero thickness means no panel.

Starting damage resistance in joules per HP:
steel 125; aluminium 70; titanium 110; UHMW 80; polycarbonate 50.
These are game values. Use `damageHP = allocatedDamageEnergyJ / resistanceJPerHP`.
Do not also multiply HP by that resistance or apply another toughness/bite factor.
The reference 0.25 m², 8 mm steel panel has 400 HP.
Allocating 10 kJ to it removes 80 HP, or 20% of its health.

For a weapon-to-armour event, start with 80% of the estimate allocated to the target and 20% to the attacking weapon.
For weapon-to-weapon contact, divide the estimate 50/50 once.
Treat these allocations as balance parameters. An event must never allocate more than its damage-energy estimate.
Route target damage through the struck armour first. Only excess damage may continue through that path.
Destroyed armour exposes that path to chassis or reachable internal damage proxies.
Specify the module routing map and remaining energy after each layer. Do not apply a full event to every layer.
Include collision damage from hard landings and hazards, using the same thresholds and event identity rules.

For UHMW, remaining thickness and health fraction must agree.
Use the health fraction for visuals, repair costs, and normalized judge damage.
Use one state transition for functional failure. Clamp health to valid bounds.

- A failed weapon actuator supplies no torque. The rotor coasts under normal losses and contacts.
- A failed weapon detaches or becomes inactive according to its physical part definition.
- A failed drive side supplies no motor torque. The remaining side can still move the robot.
- Two failed drive sides start the normal movement count. They do not cause a separate immediate KO.
- A failed battery disables powered systems and starts the normal movement count.
- Chassis failure ends the match as a structural KO.
- An absent or failed self-right mechanism cannot self-right the robot.

When a part detaches, transfer its mass and inertia instead of creating duplicate mass.
Give it the parent's local point velocity and angular velocity before any existing collision impulse effects.
Debris collides with arena geometry only. It cannot damage, trap, or push combatants.
Recycle the oldest debris at the 30-body limit. Recycling must not change robot gameplay.
Preallocate bounded particle and damage-variant pools. Dispose resources on match teardown.

### B8. Flipper and self-right systems

Use a physical arm with a revolute joint, defined contact surface, and limited angular travel.
Give each flipper actuator an explicit torque/work curve and stroke duration.
Start with a 0.20-second extension, 0.50-second return, and 1.5-second minimum firing interval.
Set the simulated mechanical work budget to 3000 J per charge and control energy to 100 J per firing cycle.
Calibrate the reference preset so it can lift and overturn an equal-mass target in a controlled test.
This is a game actuator model, not a real pneumatic design calculation.

Store charges separately from battery joules. Each accepted firing request consumes one charge immediately, including a missed shot.
Reject a request while firing, returning, depleted, unpowered, or mechanically failed.
The joint and contact solver deliver the launch. Do not apply a second launch impulse.
A flipper can cause landing damage and earn active-weapon Aggression.

Self-righting requires the physical flipper arm or a visible optional roll mechanism.
Only allow it when the relevant mechanism works and has sufficient resources.
Use a three-second self-right request cooldown. Do not teleport the robot upright.
Invertible builds work only when their wheel geometry can contact the floor in both orientations.
Use the actual chassis orientation to map controls. Do not blindly reverse a turn axis for every inverted shape.

### B9. Post-impact movement telemetry

Record both the target and attacker when a qualifying weapon event changes their motion.
Use a persistent chassis reference point for geometric distance. Record whole-robot centre of mass separately.
This prevents a centre-of-mass jump after part loss from appearing as travel.

Record origin, final position, maximum horizontal displacement, 3D displacement, path length, height gain, and airtime.
Path length sums sampled position changes. The main HUD number is horizontal displacement on the arena floor.
Show final displacement and maximum excursion separately in details. A wall bounce can make them differ.
Include impact ID, source, hit module, energy estimate, and the ending reason.

Track for up to two simulation seconds.
End on a new qualifying impact, match end, or speed below 0.1 m/s for 0.25 seconds.
At the next impact, close the previous record before opening the next one.
Keep the held input state. A held movement key must not create an instant zero-distance record.
Mark any actual motor work during the record as **Powered movement**.
Mark later wall/hazard interactions as **Compound movement**.
Pause sampling when simulation pauses.

Use the main label **Post-impact travel**. Show **Recoil travel** for the attacker.
Do not claim exact impact-only causation in live play.
A controlled stationary, unpowered, isolated target can support a clean knockback comparison.
Draw the horizontal line on the floor and mark the measured robot clearly.

### B10. Rules, scoring, and simultaneous events

Use explicit states: menu, builder, practice, introduction, countdown, fighting, paused, replay, result, repair, bracket.
Fighting and Practice can advance physical simulation, AI, hazards, motors, battery, and damage.
Only fighting advances competitive match rules and scoring.
Practice uses the same simulation with separate controls and no tournament consequences.
Reset is available in Practice only. Do not provide a free competitive unstuck button.

Use a tracked-movement state machine.
At 10 Hz, measure horizontal chassis travel in a one-second window.
Require at least 0.05 m of movement with valid powered ground contact to classify controlled travel.
Small orbiting motion from a failed side must pass the same travel test; failure alone is not disqualification.
External impacts and falling do not reset the controlled-travel count.
Use a one-second pending period to reject jitter. Start the visible ten-second count only after that period.
Show the count immediately. Reset it only after 0.5 seconds of continuous valid travel.
Thus a robot disabled from rest is counted out after 11 seconds under these custom rules.
Suspend the count during an opponent pin and when the complete simulation is paused.
Resume the stored count after release. Do not run two separate ten-second timers.

Detect pins using sustained opponent contact, blocking arena contact, speed, and actual pushing direction.
Do not penalize mutual stationary contact as a pin without a clear attacker.
Warn at nine seconds. Request release at ten seconds.
The attacker must separate by at least 0.5 m within two seconds.
Give one foul per failed release episode. Three fouls lose the match.
Require separation before a new pin episode can score again.

Evaluate all terminal events for both robots before selecting a result.
One structural KO defeats a non-disabled opponent.
One completed movement count defeats an otherwise live opponent.
One third foul loses against an otherwise live opponent.
Simultaneous terminal failures use a decision from accumulated match evidence; label it **Double stoppage**.
Timeout also uses a decision. Terminal events on the last tick are evaluated before timeout scoring.

Use custom automated scoring with Damage 5, Aggression 3, and Control 3.
Do not describe this algorithm as official judging.

Damage: normalize module loss from each robot's condition at match start.
Do not charge an opponent for damage carried into the match.
Use category weights: chassis 0.20, weapon 0.20, actuator 0.15, drives 0.20, battery 0.10, armour 0.10, self-right 0.05.
Distribute drive and armour weights across present modules. Renormalize when an optional category is absent.
Count new impairment from attacks, forced hazards, or self-inflicted mistakes; show the cause in the report.

Aggression: use 0.60 × active-weapon attack engagement time share plus 0.40 × controlled closing time share.
Control: use 0.40 × effective pin/control time share, 0.40 × forced hazard/inversion time share, and 0.20 × stable positioning time share.
Define qualifying intervals explicitly. Do not add joules directly to seconds or reward stationary facing without engagement.
Record raw intervals and their normalized shares. No evidence gives equal shares.
Limit hazard and inversion attribution to a preceding opponent action within 1.5 seconds.
End attribution when the affected robot regains controlled motion or another source takes over.

For each category, compare the two normalized values:

- Damage: leader share below 0.65 gives 3–2; below 0.85 gives 4–1; otherwise 5–0.
- Aggression and Control: leader share below 0.75 gives 2–1; otherwise 3–0.
- Exact metric ties use the pre-match seeded tie preference, rotated by category and independent of player slot.
- State that tiebreak in the result when used. A tied metric does not imply a tied 11-point score.

This tie policy is a transparent game simplification. Every completed decision distributes exactly 11 integer points.

### B11. AI and local control

Run utility decisions at 60 Hz. Convert Easy/Medium/Hard perception delays of 250/120/60 ms to fixed ticks.
Use ceiling quantization and report the resulting delay. At 120 Hz they become 250/125/66.67 ms.
Retain aim error of 15/7/2 degrees and spinner engage thresholds of 0.40/0.60/0.75.
Difficulty changes decisions and perception only. It does not alter physics, health, battery, speed, or damage.

State priority: recover from immediate danger, release an illegal pin, evade, spin up, approach, attack, disengage.
Use scores with hysteresis and a 0.3-second minimum dwell, except emergency recovery and pin release.
Use only delayed observable state. Do not inspect future inputs or another controller's queued commands.
Give all levels access to the same behaviour set. Difficulty adjusts delay, aim, and risk tolerance.
A rush at an unready opponent must still satisfy the attacker's weapon-specific readiness policy.

Spinner AI checks actual RPM. Flipper AI checks charges, cooldown, arm position, reach, and target alignment.
Flippers may engage without RPM. Damaged robots may push or escape without attempting a nonexistent weapon action.
Define recovery from inversion, lost drive, walls, shelf traps, and repeated path failure.
After two seconds without route progress, choose a new safe waypoint. Do not teleport.
Release pins by nine seconds. Provide an optional developer overlay showing state and reason.

Keep arcade steering as default. Document forward/reverse and steering relative to the camera and robot heading.
Implement tank mode separately. Use one input-command type for AI, keyboard, and gamepads.
Retain P1 WASD/Space/Q/E and P2 IJKL/Enter/U/O defaults.
Weapon input toggles spin. Flipper input fires a cycle. Self-right reports why it is unavailable.
Support two gamepads, split keyboard, or a mixed pair. Show controller assignment.
Use 0.15 default deadzone, remapping, conflict detection, and pause on disconnect.
Ignore gameplay shortcuts while editing form fields. Edge-trigger toggles; do not repeat them on key repeat.
Use one tactical camera for both local players. The camera control toggles POV inset, never primary POV driving.

### B12. Builder and sharing

Ship three original presets: **Crosscut** (horizontal bar), **Upturn** (drum), and **Springboard** (flipper).
These are working game names, not claims of worldwide name clearance.
Create complete legal configurations and verify each with the same validator used for player builds.
Do not assume a fixed rock-paper-scissors winner. Use matchup results to adjust balance.

Show mass, requested/available tip speed, actual energy capacity, time to 95% speed, clearance, and battery estimates.
Use time to 95% because an ideal free-speed curve approaches its final speed asymptotically.
Show actuator charges and cycle time for flippers instead of RPM.
Use a named endurance scenario: weapon enabled plus 50% drive duty on the reference floor.
Calculate the estimate with the same actuator model. Label it an estimate and show its assumptions.
Show a before/after comparison against the selected preset. Explain each invalid field beside the field.
Builder edits may be debounced for geometry work. Target readout updates within 100 ms on tested hardware.

Sharing: canonical JSON, UTF-8, base64url, `#build=` fragment.
Limit encoded input to 16 KiB before decoding. Limit object depth and list sizes.
Parse into fresh allowlisted objects. Never merge imported data into application prototypes.
Render names with text nodes. Do not insert imported strings as HTML.
Use a clear invalid-code message and a safe default preset. Do not fail silently.
Canonical serialization must be byte-stable after a round trip; arbitrary input whitespace need not be preserved.
Update the build fragment only through an explicit share action. Do not put match state in the URL.
If clipboard access fails, show a selectable link.

### B13. Arena, tournament, and repairs

Keep the 14.63 m floor and a raised shelf. Treat the shelf dimensions and all hazard schedules as game design.
Use 2.4 m visible containment panels and an unobtrusive 6 m physical containment boundary with a roof.
Test collisions at the upper boundary. Do not let an out-of-bounds body hang a match.
An invalid world position is a simulation fault. Pause and provide a safe restart, with no invented winner.

Use original hazard labels: **Corner Hammers**, **Floor Blades**, and **Wall Augers**.
Keep two hammers, four blade positions at x/z ±2.5 m, and wall augers with clear non-overlapping placements.
Give each hazard a finite state machine and a named damage/contact budget.
Use a 0.5-second visual warning before hammer or blade activation.
Use actual contacts for damage. Being in a hazard's trigger zone alone must not deal damage.
One hammer stroke or blade contact episode produces one damage event, not one event per simulation tick.
Use the common event pipeline for source attribution. Freeze all hazards when paused.
Hazards default on. Lock that choice for a tournament run.

Use an eight-entry single-elimination bracket. The player must win three fights.
Create seven legal AI entries from the three archetypes with seeded variation.
Run non-player matches through the same simulation without rendering, in bounded batches that keep the UI responsive.
Do not select winners through an unrelated random or rating formula.
Use the same rules, actuators, damage, and AI in displayed and offscreen matches.
Reset AI opponents fully before their next fight, as an explicit tournament difficulty rule.

Carry the player's module condition and missing parts between fights.
Refill battery charge and flipper charges between rounds at no repair cost.
Refilling does not repair a failed battery, actuator, or pressure system.
Grant 900 repair points after each won fight before the next round. Unspent points do not carry over.

Repair cost is one point per HP restored, rounded upward.
Convert armour thickness restoration to restored HP. Do not provide a cheaper parallel thickness repair route.
Replacing an unchanged destroyed module costs its maximum HP plus 100 points.
Replacing a damaged module costs its missing HP plus 100 points.
Swapping a physical module costs `max(old missing HP, new maximum HP) + 100` points.
No refunds arise from deleting damaged modules. Preserve chassis identity and its damage through edits.
Names and colours cost zero and must not rebuild the physical robot.
Stage all purchases. Show the remaining budget and preview. Commit atomically after legality checks pass.
Recompute functional flags from repaired health. Do not recreate a fully healthy robot from BotConfig after every round.

### B14. Replay, rendering, audio, accessibility, and performance

Keep the tactical camera as the only main gameplay camera.
POV is optional inset or replay view. Disable its shake independently.
Record 180 visual frames in a bounded three-second ring.
Store transforms, rotor phase, visible damage state, effects IDs, and relevant event metadata.
Do not record a full Rapier world snapshot 60 times per second for cinematic playback.

After an impact estimate above 3000 J, mark a replay candidate.
Wait for 0.75 simulation seconds of aftermath. Use a clip from 0.25 seconds before impact through that aftermath.
Select the strongest pending event. Start playback only when fighting remains active.
Pause the whole simulation, use replay-only visual proxies, play at 0.25 speed, then restore the live view.
Do not overwrite the live Rapier state with playback transforms.
Add skip, replay off, and a ten-simulation-second replay cooldown.
Do not auto-start during the last five match seconds or after a terminal event.
Disable automatic full-screen replays in local two-player by default. Keep post-match viewing available.

Use procedural damage variants, roughness changes, bounded sparks, and motor smoke.
Use procedural environment lighting for readable metal. Do not depend on downloaded HDR images.
Use Web Audio only after a user gesture. If audio cannot start, the game must remain playable.
Include weapon, impact, motor, hazard, and countdown sounds with bounded voice counts.
Use original short text for calls. If speech synthesis is unavailable, show captions and a beep.
Expose master and SFX volume. Add a music slider only when a music layer actually exists.

| Quality | Pixel-ratio cap | Shadows | AO | Bloom | Transmission | POV inset |
|---|---:|---:|---|---|---|---|
| Low | 1.0 | 512 or off | Off | Off | Off | Off |
| Medium, default | 1.0 | 1024 | Off | Off | Off | Optional, 30 Hz |
| High | 1.5 | 2048 | Optional | Optional | Optional | Optional, 30 Hz |

Quality settings must not change simulation steps, collision geometry, hazard outcomes, or damage.
Keep a 150,000-triangle ceiling and record draw calls, body count, physics time, render time, and memory growth.
Treat 60 FPS at 1080p as a measured target, not a promise for every integrated GPU.
Record OS, browser, GPU, viewport, internal resolution, quality, and p50/p95/p99 frame times.
For a supported 60 FPS profile, target median frame time at most 16.7 ms and p95 at most 20 ms.
If the environment lacks representative hardware, report the target as unverified.

Provide captions, full remapping, visible focus, clear errors, pause, and colour-independent status.
Respect reduced-motion preferences. Disable camera shake and POV vibration when reduced motion is requested.
Avoid full-screen flashes and strobing effects. Do not certify flash safety from particle frequency alone.
Handle WebGL context loss, Rapier initialization errors, asset errors, and duplicate Start clicks.
Allow a clean retry without stacking canvases, animation loops, event listeners, or AudioContexts.

## C. Acceptance checks

Execute these checks during the build. Record actual evidence. Treat the gate labels as internal checkpoints.

| Gate | Required evidence |
|---|---|
| G01 — Startup | A fresh load reaches the game menu. Start waits for initialization. Retry does not create a second loop. |
| G02 — Robot compilation | Three presets compile legally. Manifest mass matches physics mass. Armour, battery, and magnets affect totals. |
| G03 — Time and control | Tick-stamped inputs reach matching states at 30/60/144 render FPS. Pause changes no simulation state. |
| G04 — Contact physics | 200 labelled isolated hit cases and 200 near-miss cases pass. No missed known hits or duplicate episodes. |
| G05 — Physical response | Free-space motor-off impacts preserve linear momentum within 1%. They do not create more than 2% kinetic energy. |
| G06 — Damage | The reference panel loses 80 of 400 HP for 10 kJ assigned energy. Each functional failure has a visible effect. |
| G07 — Weapons and telemetry | Both spinners slow after contact. Flipper charges/work are bounded. Clean travel measurements match recorded positions within 5%. |
| G08 — Rules and scoring | Count-outs, pins, double failures, last-tick results, and timeout resolve once. Decisions distribute exactly 11 points. |
| G09 — AI and local play | 20 seeded AI matches finish. Flippers fire legally. Keyboard and available controller combinations work. |
| G10 — Builder and import | All numeric boundary cases and 50 malformed configurations pass expected checks. Canonical share codes round-trip. |
| G11 — Tournament | A full bracket completes. Damage carries. Repairs cannot exceed 900 points or refresh unrelated modules. |
| G12 — Replay and lifecycle | 50 replay transitions preserve live state. Ten consecutive matches do not grow retained game resources without bound. |
| G13 — Performance | One full 180-second worst-case match has recorded frame-time data and hardware details, or an explicit unverified status. |
| G14 — Hosted game | Final deployed URL loads on refresh. JS/WASM assets load. Menu → match → result → rematch works. |

G04 cases must state expected geometry, contact count, target motion, seed, radius, speed, and feature size.
Do not expect one event for an entire multi-tooth engagement. Test one event for each labelled isolated contact episode.
Cover horizontal and vertical rotation, both spin directions, glancing contacts, walls, corners, and moving targets.
Keep every known failing case as a regression. Do not pass by weakening expected results.

G05 uses no floor, gravity, magnets, active motors, or damping. Those are external impulse or energy sources/sinks.
Include translational and rotational kinetic energy in the measurement.
Use appropriate low-speed restitution settings. Numerical tolerance is not permission for repeated energy growth.

Report each gate as passed, failed, or unverified. Include the observation or test output that supports that status.
Do not claim controller, browser, hardware, or deployment checks that were not performed.


## Latest user-directed changes — Quantum and combat readouts

Quantum receives a cosmetic cast head and a physical folding recovery arm. Keep all added physical recovery mass in the manifest and keep the preset below the weight limit. Show numeric chassis HP, km/h, and actual module damage on hits. An attacking blade does not receive damage from its own strike; incoming attacks remain damaging. Raise ICEwave camera clearance and synthesize its combustion sound without recorded ICEwave playback. Double Hydra return damping and halve its peak retraction torque. User-requested exits must not open another confirmation dialog. See `quantum-combat-update.md` and its test results for measured limits.
