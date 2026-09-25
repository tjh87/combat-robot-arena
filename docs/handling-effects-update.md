# Handling, hit presentation and directional sparks

## Delivered behavior

- HUGE's wheel friction coefficient increases from 1.10 to 1.65. Its blade diameter increases from 0.83 m to 0.92 m inside 0.96 m wheels, leaving 20 mm nominal clearance. Grounded pitch damping steadies the middle body without locking airborne motion or steering.
- Deep Six has the highest stock full-speed strike rating. Its strike multiplier is 4; HUGE's is 3. This supersedes the previous request that HUGE hit hardest. Deep Six's two blade tips are pointed hulls within the existing 0.57 m radius.
- Both player and computer opponent selectors have separate random buttons alongside manual selection. A random selection chooses another valid roster entry.
- A stoppage shows 1.2 seconds of visible follow-through before an automatic final-hit replay at 0.35 speed. Damage numbers and comic impact words remain visible in replay. The most recent damaging hit to each robot is retained independently of the rolling replay buffer, covering a ten-second count-out delay. Results can be opened immediately with Show results.
- Wall collision height matches the visible 2.70 m cage. A robot thrown over the wall and beyond the arena loses by ring-out. The invisible roof is removed. Ground-level collisions remain contained.
- Gigabyte has a wider wheelbase, 180 N of grounded floor attraction, gentler drive response and a folded-arm latch. The arm unlocks for self-righting and stows again afterwards.
- SawBlaze has three hinged low forks, a stationary rear saw guard and a full 180-degree arm sweep. Short rear skids and a controlled return prevent the returning arm from tipping the chassis after recovery.
- Quantum uses stronger drive motors and a 14:1 ratio: modeled stall torque increases from 40.82 Nm to 66.97 Nm, or 64.1%. Tyre friction increases from 1.35 to 1.80. Automatic post-release reverse throttle drops from 0.85 to 0.34, with a 0.20 m retreat bound. Manual reverse control stays available.
- Sparks originate at the physical contact point and follow the contact normal, blade velocity and struck robot's outgoing motion. A directional cone replaces the radial burst. Particles have varied lengths, speeds and sizes, short curved trails, occasional forks, round hot cores, gravity and fading. Three short generated hiss/crackle sounds scale with impact strength and obey volume controls.
- Replay transforms interpolate between recorded frames; camera tracking uses frame-independent easing. Unchanged damage materials are cached. Sparks use a fixed pool of 720 particles.

Grounded stabilization, floor attraction and strike multipliers are user-directed gameplay assists; they are not claims of exact real-world robot physics.

## Verification

98 automated checks passed: 20 focused handling/effect checks, 57 UI checks, 10 HUGE/control checks and 11 Quantum/HyperShock regression checks. TypeScript and whitespace checks passed. Build and deployable-bundle validation are run by the publishing workflow.

Measured checks include:

- HUGE: maximum tested body tilt 4.67 degrees; minimum tested blade clearance 19.85 mm; real blade contacts against all eleven templates.
- Gigabyte: maximum tested tilt 0.69 degrees and stowed arm movement 0.46 degrees. Deliberate recovery still opens and stows the arm.
- SawBlaze: 38.83 mm opponent lift from the forks; self-righting in 0.80 seconds followed by stable stow; rearward drop produces guard contacts and zero tooth/floor contacts.
- Spark distribution: 260 sampled particles remain in the outgoing cone, with 248 different trail lengths, 258 head sizes and 24 forked trails. Audio envelopes last 100, 180 and 260 ms, remain below clipping and decay to silence.
- Material cache: 120 unchanged frames produce one material update. This is a work reduction, not a measured FPS improvement.
- Ring-out, frozen final HP/clock/winner, delayed KO replay, damage labels, selection controls, result portraits and inverted recovery all have automated checks.

The browser layout preview was visually inspected. Full WebGL gameplay, GPU frame rate and subjective audio realism could not be validated in the available cloud browser. No GPU performance claim is made.

Reports: `handling-effects-update-results.json`, `review-ui-results.json`, `huge-control-update-results.json`, `quantum-hypershock-update-results.json` and `bundle-audit.json`.
