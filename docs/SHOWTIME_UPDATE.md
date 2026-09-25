# Results, start sequence, weapon protection and sound

- Align the result header, winner and runner-up cards, robot portraits, result reason, and judging explanation. Both cards use the same layout, spacing and name scale. Long names wrap.
- Add a gold winner treatment and 96 confetti pieces. Reduced-motion settings disable confetti. Menu, rematch and replay controls remain accessible.
- Replace the start video with six amber LED panels, three flashes, and a green start signal. Use only the sound extracted from the supplied clip. Pause/resume synchronizes the sound. If audio cannot play, timed tones take over without delaying the match.
- Protect weapon and weapon actuator function when health reaches zero. These modules still record damage for judging and wear. Their independent supply ignores drive-battery depletion or damage. All flippers have unlimited cycles. Physical motor limits, impact spin-down, stroke energy limits and cooldowns remain.
- Keep drive, armour, battery, chassis damage and knockout rules. Gigabyte restores its shell after an interrupted recovery cycle.
- Retain physical gyroscopic inertia on the rotor, transmitted through the joint. Check the precession response of Minotaur, HyperShock, HUGE, SawBlaze and Deep Six against the same unspun robot.
- Render round, soft spark tips with white-to-orange cooling and thin ballistic trails. Clip square sprite corners in the shader. Live effects and replays use the same look. Damage smoke is round too.
- Add eleven distinct weapon timbres with different harmonics, pulse rates, roughness, airflow and load response. Blend the supplied ICEwave idle/running loops. Preserve eleven steel impact and landing clips.

## Verification

62 automated groups pass: 49 UI cases, 7 blade/audio cases, 5 update cases, and 1 protected-weapon/core damage case. All eleven weapons work after weapon/actuator destruction and loss of battery power at simulated mid-match timestamps. Spinners restart after a forced stop near the end of a match. Hydra and Quantum repeat cycles; SawBlaze strikes with its arm. All five vertical profiles exhibit gyroscopic response. All fourteen recordings decode without clipping.

The production build and asset audit pass. No dependencies were added. A temporary browser fixture used the actual result and countdown markup and stylesheet; it showed aligned text and the correct robot portraits. That fixture was removed before the production build.

The managed browser cannot create WebGL. Live-browser gameplay, GPU spark appearance, frame rate and audible playback are not verified. Physics, waveform generation, audio routing, lifecycle cleanup and UI logic have automated coverage. Older test reports are historical and are not included in this release's count.
