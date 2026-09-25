# Compact robots, ground contact and audio

This is the historical version-6 behavior record. RECOVERY_UPDATE.md supersedes its recovery and balance figures. It previously superseded conflicting dimensions, recovery mechanisms and balance figures in SLEEK_UPDATE.md and earlier notes.

## Robot shapes and mechanisms

- Minotaur's drum axle moves 90 mm back into a recessed chassis. The drum's projection ahead of the chassis falls from 323 to 233 mm, a 27.9% reduction. Its radius, operating speed and energy are retained.
- HyperShock's chassis is 19.3% shorter, and its disc moves 70 mm closer. The fixed rollover struts are removed. Flat yellow paddles fold across the deck, deploy through a physical hinge to self-right, and fold back after recovery. Small solid bearing cheeks protect the disc while inverted. The folding mechanism is a game adaptation requested by the user, not a claim about the real team's 2022 configuration.
- SawBlaze's chassis is 16.1% shorter, its fork tips move back 220 mm, and its saw arm is shorter. Its total fore-aft envelope is now 834 mm. Its saw arm can still self-right the robot and return to the driving position.
- Deep Six has only its two lower drive wheels. Its upper wheels and support struts, their motors, axles and associated physical mass are removed. The rotor tower and low stabilizers remain. Inverted driving is no longer promised for this template. Its 134.09 kJ requested-speed rotor energy remains the largest in the roster.
- Broad armour edges are more rounded without rounding off the actual wedge noses or cutter tips. Wheels, drums, discs and shell shoulders have smoother surfaces. Cutting edges have a brighter finish and a more defined bevel. HyperShock gains pink lightning graphics, SawBlaze green flame graphics, and ICEwave an engine-cowl nameplate.

All changed mechanisms are represented in the physical part manifest, mass and joints. No pose reset, invisible lifting force or extra launch impulse is used.

## Ground contact and driving

Ordinary wedge noses have 2 mm underside clearance and 3 mm thickness. Ground forks follow the configured chassis height and clearance. Hydra has eight independent hinged fingers with 0.6 mm underside clearance and a 1.2 mm nose. They follow floor contact through physical hinges.

Wedges lift through real contact and their relative height matters. The ordinary wedge is blocked by a 3 mm clearance fixture, gets beneath 8 mm and 30 mm clearances and lifts them, and passes below a 100 mm clearance fixture. Hydra establishes supporting contact and raises every roster type in the controlled fixture. Equal-height Hydra noses can meet edge-to-edge; the mirror fixture approaches from the side.

Sliding skids and low wedge surfaces now use low-friction contact independently of the tyre/floor friction. This also covers the drum bearing supports and HUGE/Deep Six stabilizers. All ten robots drive forward and backward at 30% throttle with weapons stopped and running, without stalled samples in the 40-case fixture and without automatic unstuck assistance.

A drive-motor integration error made small wheels alternate between excessive positive and negative speed. Implicit back-EMF integration now respects wheel/chassis inertia, current limits, motor reaction and battery use. Gigabyte's reverse mean speed in the same fixture improves from approximately 0.054 to 1.375 m/s. HUGE's AI uses delayed yaw-rate feedback to avoid alternating steering commands in corners. The five tested robot families escape the corner within four seconds.

## Flips, recovery and flight labels

Hydra has unlimited flip count, including when its stored charge count is zero. It still requires a functioning actuator and battery and obeys the 1.5-second cooldown and 4.2 kJ stroke work limit. Custom finite-charge flippers retain their charge count. Hydra displays infinity in the menu, builder and match gauge.

HyperShock's folding mechanism recovers from the inverted fixture in 1.238 seconds, expends 883 J, and folds flat again. SawBlaze recovers in 0.654 seconds, expends 113 J and remains upright while its arm returns. These are game fixtures, not real-machine specifications. Minotaur and HyperShock also drive inverted with their vertical weapons powered in the reverse direction. All five vertical-spinning types reverse their motor direction on inversion.

Post-impact flight lines now show a nearby readable label with the robot, horizontal distance and peak height. Labels follow the measured line endpoint, stay inside desktop/mobile viewports, and hide when the endpoint is offscreen. Existing travel samples determine the figures; the label does not invent an extra trajectory.

## Sound and references

ICEwave has a separate pulsed combustion-engine exhaust layer with idle, rev and load changes. Electric spinners retain RPM-dependent motor, rotor and air layers, tuned by weapon family. Moving arms and flippers have actuator whine/hiss. Metal, plastic and rubber contacts have distinct impact profiles; low-energy taps become louder strikes and crashes as collision energy increases. A short 42 ms accumulation window prevents the initial contact sample understating a heavy hit. Impact voices are bounded, cleaned up, and mixed through a limiter when supported. Pause mutes continuous layers.

Sound is synthesized locally. No video audio was downloaded or sampled. Official pages and existing local robot photographs were used as references. The official video catalog was consulted; YouTube audio could not be played in the available tools, and the Fandom pages rejected access. The Settings references panel links the source material.

- [ICEwave official profile](https://battlebots.com/robot/icewave/) identifies its gas-powered weapon.
- [HyperShock: Iteration](https://hypershock.tv/blogs/inside-the-bot/iteration) provides configuration and self-righting history.
- [BattleBots video catalog](https://battlebots.com/videos/) provides official footage references.
- Existing local Minotaur, HyperShock, SawBlaze, ICEwave and other roster photographs remain in public/robots.

## Verification and limits

Current machine-readable results are wedge-update-results.json, mobility-results.json, mobility-cases.json, sleek-results.json, roster-results.json, gameplay-results.json, review-core-results.json, review-ui-results.json, test-results.json and sleek-matches.json. WEDGE_UPDATE.md and wedge-update-summary.json supersede earlier release summaries.

The production TypeScript/Vite build and embedded physics-WASM bundle audit pass. No dependency was added. All ten presets meet the game's weight and tip-speed limits. The largest robot preview has 36,075 triangles. Five complete seeded roster fights finish, each with weapon hits (35 total).

The managed preview browser cannot create a WebGL context. GPU appearance, live browser gameplay, frame rate and audible playback remain unverified. Offline geometry, DOM, physics and audio-parameter checks do not establish those browser results.
