# Handling, recovery and impact display repair

Updated 2026-09-24. This update supersedes earlier gyro timing and crusher-release settings.

## Changes

- Seven damage tiers remain. The 100–249 HP shape has 12 sharp spikes. Bubbles bounce, sway and rise with recorded simulation time. Reduced motion freezes these movements.
- Every positive damage delta is collected, including values below 0.01 HP. Long contact episodes get unique bubble IDs. Offscreen or invalid projected contacts use a visible fallback. Crushing totals appear once on release and cannot merge with the next hit.
- Ring-out results show height gained and horizontal distance from the launch point. The final flight updates these values. Fast speed is highlighted at 12 km/h in the existing player panel.
- M returns to the arena menu after a match. R activates the existing rematch action for quick fights; tournament results retain their bracket/continue flow. Shortcuts ignore repeats, modified keys and text input.
- Quantum's maximum automatic hold falls from 3.5 to 2.1 seconds (40% shorter). Sustained pressure may release sooner. Opening torque rises from 45% to 80% of the actuator rating. The AI measures actual retreat travel, limits it to two robot lengths and clears stale waypoints/recovery commands.
- Gigabyte uses stronger limited drive motors, 1.70 tire friction instead of 1.35 (+26%), and measured speed/yaw feedback for steering and braking. Controls no longer change sign as the shell tilts.
- Spinner bite includes feed per tooth at first rigid contact. Exposed tooth depth, incidence and the shared rotor-energy budget still cap the hit; the solver no longer makes all first contacts look like near-zero insertion.
- Minotaur uses a regulated 50% drum-speed target and real wheel steering pulses to redirect angular momentum. Recovery preserves the existing spin direction above 50 rad/s, latches the steering direction, brakes when approaching upright and requires positive upright alignment. It never accepts an inverted pose as recovered. Four integration substeps stabilize active gyro recovery; contact samples from all four are retained. Automatic recovery can start even if an inverted robot is still moving.
- Builder tracks use four or six physical driven rollers, 6.4 kg of belt mass, friction 2.6 and animated continuous belts. This gives about 24% more friction than stock HUGE. Nine stock templates fit directly; HUGE needs clearance changes and Son of Whyachi needs mass reduction. Tracks approximate contact with rollers, rather than flexible individual links.
- All 11 models have smoother principal curves and revised bevels/material finish, preserving the existing photo-derived shapes and liveries. Main round sections increase from 64 to 80 segments. All remain below 60,000 triangles.

## Research

Marco Antonio Meggiolaro, *RioBotz Combot Tutorial*, section 6.15 explains how steering redirects a vertical rotor's angular momentum and creates chassis precession. The implementation retains Euler inertial torque and powered wheel contact instead of applying a synthetic flip impulse.

- Team tutorial page: https://www.riobotz.com/tutorial
- Readable author-text mirror: https://studylib.net/doc/26042423/riobotz-combot-tutorial--1-
- Team combat robots: https://www.riobotz.com/combat

Motor choices, gear ratios and recovery control are game tuning, not newly verified hardware specifications. Existing sourced weapon ratings and estimate labels remain.

## Verification

- 12/12 competitive Minotaur recovery cases passed: inverted and both sides, cold and both drum directions; three automatic cold-start cases included. Recovery took 4.74–22.14 seconds. A 24-second timeout still applies; damaged or unpowered machines may not recover.
- Five recovery safeguards passed: level pose, damaged drive, empty battery, airborne spin-up and interrupted recovery.
- Eight focused repair groups passed: small damage, crusher totals, release/retreat, manual release, Gigabyte handling, track drive, ring-out telemetry and deterministic track animation.
- Quantum test: release 2.108 seconds, unloaded opening 0.083 seconds, retreat 1.967 m against a 1.992 m limit. Loaded opening depends on contact.
- Gigabyte passed forward/reverse/turn/brake checks with both shell directions.
- Nine UI groups passed, including all seven damage tiers, reduced motion, replay, shortcuts, speed, saved builds and ring-outs.
- All 11 stock builds pass limits and share-link round trips. All 11 model geometry checks pass finite-coordinate and triangle-budget checks.
- The engagement suite passed nine groups, including all nine spinner strikes, wall containment, energy/recoil limits, 200 hits/200 near misses and six seeded matches across all 11 templates. One old floor-event assertion failed because landings now aggregate contact modules. The corrected focused test passes while retaining the rotor-energy-loss requirement. Both original and follow-up reports are preserved.
- The browser overlay review is saved in repair-bubbles.png. The managed browser could not create a WebGL context, so full 3D visual playback remains unverified. Geometry and simulation checks do not replace GPU inspection.

Reports: gyro-repair-results.json, repair-update-results.json, repair-ui-results.json, roster-focused-results.json, repair-engagement-results.json and repair-floor-energy-results.json.
