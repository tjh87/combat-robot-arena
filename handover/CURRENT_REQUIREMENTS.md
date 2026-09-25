# Current requirements

This file consolidates the latest user requests as of 25 September 2026.
It replaces conflicting old statements in `docs/BUILD_CONTRACT.md` and older update notes.
Exact executable settings are in the source and `ROBOT_SPECIFICATIONS.json`.
Do not silently change those settings while documenting or moving the project.

## 1. Product and offline operation

Build a complete 3D browser combat game. Open on the arena and robot selection, not a marketing page.
Keep Quick Fight, AI difficulty levels, practice, local two-player control, builder, settings, replays, results and tournaments.
Keep the game usable without ChatGPT Sites, a backend, sign-in, an API key or internet access.
Use a localhost HTTP server. Do not require opening ES modules through `file://`.
Include local robot pictures, audio, styles, engine code and physics WASM.
Reference links can remain external. Gameplay must not depend on them.
Use desktop controls first. Keep smaller-screen layouts readable without making the arena unusable.

## 2. Technology and units

Preserve TypeScript, Three.js 0.180.0, Rapier compat 0.19.0 and the pinned Vite build.
The source uses direct DOM UI and Three.js. Do not migrate it to a new framework without a clear requirement.
Physics uses metres, kilograms, seconds, radians, newtons and joules.
The local frame uses X across the robot, Y up, and negative Z forward.
Positive local Z means the rear. Convert to world coordinates with the body rotation.
Run physics at 240 Hz with a fixed timestep of 1/240 second.
Preserve the solver limits, finite values, seeded simulation and recorded contact evidence.
Keep rendered robot geometry and physical contact surfaces consistent.
Keep each stock robot below the existing 60,000-triangle target.

## 3. Arena

The floor is 14.63 metres square. The containment rim is 2.70 metres high.
Walls use 0.60-metre overlapping collision geometry and the existing swept assembly guard.
Robots must not cross walls below the rim. They can leave the arena above the rim.
Do not add an invisible roof that blocks valid ring-outs.
Keep the raised upper deck, floor cut-outs, screws, corner hammers, warning states and visible hazard motion.

Floor hazards are paired rotating saw discs. They emerge from the slots and retract.
Current saw radius is 0.32 m. The game setting is 1,200 RPM and 750 W.
Do not render floor hazards as flat glowing discs or ordinary rotating blocks.
Corner hammer heads are 50 lb each: 22.6796185 kg. The separate arm mass is 3 kg.
The game hammer budget is 3,500 J per cycle. Do not restore the old 100 kg head.
The visible hammer must swing around its physical hinge and contact the robot once per strike budget.
Upper-deck screws use helical flights and lift at the exposed contact surface.
Detect a jam after about 1.25 seconds without useful movement. Reverse for 1.8 seconds, then resume.
Preserve occupied-deck clearance behavior and the brief contact-gap allowance.
Do not leave a robot trapped indefinitely because successive screw teeth briefly lose contact.

## 4. Stock robots and mass

Keep all 11 templates: Tombstone, Minotaur, Hydra, ICEwave, HyperShock, Gigabyte, Son of Whyachi, HUGE, SawBlaze, Deep Six and Quantum.
Each stock robot has 1,200 chassis HP and a nominal total mass of 113.2 kg.
The build limit is 113.398 kg. Preserve geometry-based mass, inertia, centre of mass and a counted hardware allowance.
Custom edits must not silently reset the total mass to the stock value.
Keep the 111.76 m/s tip-speed limit. Reference RPM and actual capped game RPM can differ.
Use the specification JSON for all exact preset dimensions, drive settings and battery zones.
Use the saved source links and evidence labels for real-world claims.
Keep the real robot photographs in selection and results.
Use smoother edges, coherent metal materials, clear weapon outlines and each robot's known silhouette.
Do not replace working models with generic blocks or hide geometry mistakes with visual effects.

## 5. Robot-specific mechanisms

### Tombstone

Keep a two-wheel horizontal bar spinner with a separate rotor body, low bar, exposed wheels and rear battery bay estimate.
The reference bar is 70 lb. The game uses 2,541 RPM for the modeled radius and speed cap.
Preserve controlled movement while the horizontal weapon spins.

### Minotaur

Keep the compact two-wheel drum robot and inverted drive behavior.
The reference drum is 50 lb and 8,000 RPM. The modeled radius caps the game target at 6,885 RPM.
Self-right through drum angular momentum, floor contact and alternating steering actions.
Retain the Euler inertial torque and four physics substeps during active gyro recovery.
Do not substitute a hidden self-righting arm, pose reset or artificial vertical impulse.
For an over-speed drum, brake below 15% of requested RPM and wait for low chassis angular speed.
Then rebuild the recovery speed. Retain spin direction during preparation.
Use the current 35–55% rocking band, 0.55-second steering pulse and 0.15-second pause.
Stop after stable upright wheel contact, power loss, broken required drives, or the 26-second controller limit.
Automatic recovery requires sustained arena support. Do not start it during a normal jump.
Keep the separate manual Unstick feature. Do not confuse it with physical gyro self-righting.

### Hydra

Keep the low, stable four-wheel hydraulic flipper and supported insertion-dependent flip strength.
Unlimited flips remain a game rule. The gauge must show **Flip Assist**, not an infinity dial or flip count.
Show useful contact advice, such as alignment, drive-under, and FLIP NOW.
Only Hydra uses this assist panel. Keep the robot name, weapon name and current mapped fire key.
Do not add a second floating assist panel beside the gauge.
Reject a second flip while the arm is already cycling. Preserve recovery through the flipper.
Do not damage or launch an opponent merely because the flipper is nearby; use support/contact and available work.

### ICEwave

Keep the long low horizontal blade, upper combustion-engine shape and separate electric drive supply.
The reference blade is 54 lb. The 200 mph tip reference yields 1,524 RPM for this model.
Use the existing original synthesized engine/exhaust sound, smoke and throttle response.
Do not require streamed engine recordings or treat the upper engine as a battery target.

### HyperShock

Keep four large wheels and two separate spinning cutters. The assembly reference is about 45 lb.
The 6,800 RPM value is a game estimate. Do not label it a confirmed team specification.
Preserve inverted driving, automatic inverted blade direction, clearance and stable acceleration.
Retain its current physical recovery mechanism and folded/stowed behavior.
The battery box sits centrally between the drive pods, above the floor plate.

### Gigabyte

Keep a full-body spinning shell with lower and upper damaging teeth, separate drive heading and a physical recovery arm.
The shell reference in this game is an estimate: 120 lb and 190 mph, giving 1,689 RPM.
Keep smooth steering, grounded stability, fixed drive direction and straight-drive control under shell torque.
Stop or brake the shell as required by the recovery mechanism. Restore requested weapon state afterward.
Do not rotate control directions with the spinning shell or give the chassis arbitrary weapon damage.

### Son of Whyachi

Keep a low horizontal cage/rotor with sharp contact features and clear chassis separation.
The cage mass is an estimated 120 lb. A 170 mph team tip reference yields 1,295 RPM.
Do not use the old shuffler layout as the current robot geometry.

### HUGE

Keep two large wheels, the central suspended chassis and a blade within the wheel diameter.
The current blade diameter is 0.92 m. The wheel diameter is 0.96 m, leaving 20 mm nominal radial clearance.
Keep the horizontal poles from the middle of each wheel's outer face and the support geometry.
The blade must reach opponents without crossing the wheels or cutting the floor in its normal pose.
Keep 2.10 wheel friction, a shared 4 m/s forward/reverse speed target and a 2.2 rad/s turn target.
Use actual support before stability assistance. Do not lock airborne orientation.
Use axle-based controls and camera heading. Keep equal forward and reverse treatment.
Wheel-only hits take half damage and must not disable or derate the protected weapon supply.
Exposed chassis, drive, weapon and battery targets still take their appropriate damage.
The blade reference is 30 lb; the game uses 2,180 RPM.

### SawBlaze

Keep an overhead hammer arm that carries an independently spinning vertical disc.
Space controls disc spin. The separate strike/self-right control moves the arm.
The spinning disc and swinging arm have separate inertia and energy.
A stopped disc can still make a physical hammer strike. Do not require RPM before arm contact can matter.
Keep the fast downward stroke, guarded floor clearance, front forks, full return and arm self-righting.
Do not replace the mechanism with a fixed vertical spinner or let the arm repeatedly drive the saw through the floor.
The 30 lb disc mass is an estimate. The game uses 5,252 RPM from its diameter and tip limit.

### Deep Six

Keep the large vertical blade, pointed tips, lower body and current physical recovery behavior.
Do not restore unwanted wheels or struts on top of the robot.
The reference blade is 80 lb. Its 1,860 RPM game setting remains an estimate.
Deep Six has the highest stock strike damage setting. Preserve the game damage multiplier of 4.
HUGE's multiplier is 3. These factors affect HP damage, not extra launch energy.

### Quantum

Keep four-wheel drive, the sculpted skull, two fangs, broad scoop and hydraulic crushing jaw.
Model 35,000 lbf front force and up to 50,000 lbf at the rear using the existing lever curve.
Keep the rapid-close stage, real tooth contact, pressure ramp and finite hydraulic work.
Current settings: 0.30 s close, 0.12 s pressure rise, 3.5 kW pump and 12 kJ cycle budget.
Auto-release after 2.1 s total, 1.2 s held contact, or the work limit, whichever applies first.
Retreat at most two complete robot lengths after release. Measure traveled distance from release.
Do not steer to the arena centre as a release destination. Stop the retreat and resume normal engagement.
Preserve the fast jaw opening, clear stale AI waypoints, and do not replace pressure with a launch impulse.
After release, show one accumulated crushing-damage bubble using actual HP removed.
Keep local penetration to battery targets and the physical fold-out recovery mechanism.

## 6. Damage and physical energy

Keep the current contact ledger. Record position, participant, part, cause, energy and actual HP loss.
Use rotor energy E = 0.5 I omega squared. RPM to radians/second is RPM times pi / 30.
Share available rotor energy across simultaneous contacts. Debit contact losses once.
Contacts with the floor and walls also slow the weapon. Motor work can restore speed on later steps.
Use feed per tooth, exposed tooth depth, insertion and incidence to determine bite.
Feed per tooth is 2 pi times closing speed divided by tooth count times absolute angular speed.
Do not grant full cutting damage to a shallow skim or a non-tooth surface.
Use solved contact forces for motion. Do not add damage-based recoil cancellation or extra launch impulses.
Weapon-to-weapon contact has reduced damage. Non-weapon targets take the current higher contact share.
Robot sides and rear can deal only valid ramming damage from closing translation.
Do not turn a spinning chassis, gentle push or resting wedge into a damaging weapon.
Retain protected weapon operation: derating starts above 50% damage and retains a 45% output reserve at full damage.
Show weapon and battery damage separately. Do not silently stop a protected weapon after wheel-only damage.

Fall damage uses actual attached mass, downward impact speed and centre-of-mass descent.
E = 0.5 m v squared already includes energy gained from gravity.
Use m g h to identify the gravity part; never add it again to the same impact energy.
Preserve the 0.12 m cushioning allowance, 1.5 m/s threshold and one shared landing budget.
Keep the current 70% contacted-part and 30% chassis allocation.
Display ring-out height above launch and horizontal travel distance.
Exclude normal recovery motion from opponent-hit flight records.

## 7. Batteries and evidence

All robots have fitted battery targets. The stock set contains 18 zones.
Use one shared layout for damage rays, mass, rendered packs, hints and fire locations.
Any robot can damage a battery if a valid hit reaches its location through the covering structure.
Quantum can penetrate with its tooth and pressure work before the entire cover is destroyed.
Misses and wrong-side hits must not damage a battery because of proximity alone.
Keep transformed local hit tests for rotated robots.
Keep subtle battery-location hints on both robots in local two-player mode.
Hide the player's own obstructive markers in first-person view.

The latest research moves Minotaur's two side targets 133 mm rearward and all three 12 mm down.
HyperShock's central target moves 16 mm up. Gigabyte's targets move 3 mm down.
These are fitted game coordinates, not measured hardware coordinates.
Do not claim exact positions when public evidence is incomplete.
Seven battery regions still lack reliable team confirmation: Tombstone, Hydra, ICEwave, Son of Whyachi, SawBlaze, Deep Six and Quantum.
Retain clear estimates. Do not use a passage about an opponent's batteries as evidence for the named robot.
Keep the 70% ignition threshold, eight-second fire and local fire origin.
Current fire damage is 30 chassis HP/s and 10 battery HP/s, with charge loss.
Do not repeatedly reset a fire forever with each contact or silently remove the protected weapon reserve.

## 8. Damage bubbles and HUD

Show numbers only in damage bubbles. Do not add POW, BAM, damage names, HP text or labels above them.
Minimum displayed positive damage is 1. Display no decimal places.
Keep fractional HP in physics and accumulated contacts. Quantize only the visible label.
Use seven tiers: below 40, 40+, 100+, 250+, 500+, 800+, and 1,000+.
Use sharper borders, distinct shapes and stronger colours as damage rises.
The 100–249 tier must have sharp spikes, not a smooth cloud edge.
Animate a short impact pop, drift, rise, sway and supporting rays without hiding the robot.
Use simulation/replay time. Respect reduced motion. Preserve the 1.3-second lifetime.
Capture every positive new HP delta, including small hits and continued contact episodes.
Use unique display IDs, avoid double-counting, and provide a visible fallback for offscreen contact positions.
A crush summary is separate from ordinary hit aggregation.

Keep larger clear health bars, component warnings and robot speed in km/h.
Place speed away from other indicators and avoid covering the robot.
Use compact weapon panels in tactical and first-person views.
Robot name and weapon name use distinct font treatments and colours.
Fit text inside the panel with clear space around the ring, borders, values and controls.
Do not place words on top of gauge circles or compress letters until they overlap.
Keep the opponent direction indicator and a clear front-direction marker.
Use the current raised first-person camera so the weapon does not block the main view.

## 9. Controls, results and audio

Default P1: arrows drive, Space weapon, Q strike/self-right, E camera, R Unstick.
Default P2: I/J/K/L drive, Enter weapon, U strike/self-right, O camera, P Unstick.
Escape pauses. Preserve remapping, gamepad assignment, conflict validation and focus-loss pause.
After a match, R starts a rematch and M returns to the arena menu.
Do not fire those shortcuts while the user edits a text field.
Leave-match controls do not add an unwanted confirmation prompt.

Animate the match countdown with sound; do not play a countdown video.
Show the final physical hit before results. Keep decisive-hit playback and slowdown for strong hits only.
Use 5/3/3 damage, aggression and control judging for decisions.
Do not make a knockout winner appear to lose because unused judging totals differ.
Show winner and runner-up robot pictures, HP left, flight height/distance and biggest dealt/received hits.
Show dealt hits in green and received hits in red, with the requested underline.
Limit small confetti to the winning robot portrait. Use the current 24 pieces and respect reduced motion.

Use local impact and landing recordings with appropriate level, variation and event timing.
Generate the existing original engine and weapon layers locally.
Keep directional sparks, varied streak lengths, contact-origin smoke and slip-dependent tyre marks.
Do not produce full smoke from a stationary gentle push or fill the arena with unrelated particles.
Keep captions and audio settings usable when browser audio is unavailable.

## 10. Builder and saved data

Keep preset selection, opponent selection, separate random-player and random-opponent controls, save/reset and practice testing.
Keep caterpillar treads as the strongest available traction choice, subject to normal mass and geometry limits.
Preserve version-2 build import/share compatibility and malformed-input handling.
Keep local preferences and builds. Do not silently erase data during updates or a failed import.
Use stable localhost origin and port because browser storage belongs to an origin.
Do not promise that Sites browser storage automatically transfers to localhost. Export/import builds when needed.
Preserve tournament progression, repair budget and damage carryover.

## 11. Acceptance and change discipline

Use current tests and focused new regression checks. Do not weaken assertions just to pass.
Check actual outcomes, not only that functions were called.
Every physics change needs relevant seeded simulation checks and finite-state validation.
Every layout change needs tactical and first-person inspection, text fitting and a smaller viewport check.
Check both players when changing shared damage, hints, controls or results.
Build the app and verify every local asset after packaging.
Report exact tests run. Identify old reused reports as historical evidence.
Keep manual WebGL, audible playback and Windows execution gaps explicit until someone performs those checks.
Do not change the project license, publish public assets, install telemetry or add remote dependencies without authorization.
