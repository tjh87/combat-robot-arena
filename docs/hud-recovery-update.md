# HUD, self-righting and strike update

## Changes

- Quantum and HyperShock use physical vertical folding recovery arms. HyperShock hinges at the front and folds rearward; Quantum hinges at the rear and folds forward. A wide foot provides side contact. HyperShock brakes the disc for recovery, then restores its prior weapon state. Both arms retract slowly and hold stowed while driving. The normal recovery key remains Q. Auto-unstick and driving do not compete with an active recovery stroke.
- Known saved stock arm settings migrate while preserving other build settings. Preset masses: HyperShock 99.509 kg; Quantum 113.056 kg. Both remain below 113.398 kg.
- Hydra routes its supported actuator recoil through a ground-bracing assistance model, with pitch/roll damping and downward preload. This gameplay assistance requires an active stroke, wheel support, near-floor chassis position and an upright attitude. It turns off while airborne or overturned. No pose reset is used. Flipper contact provides the opponent lift.
- Hydra launch-pressure limit rises from 10,800 to 16,200 N m. Its stroke allowance rises from 12,600 to 18,900 J (+50%). Insertion depth still scales effective launch pressure from 40% to 100%.
- Blade-hit damage multiplier: Deep Six 2.0; HUGE, Hydra, Tombstone, ICEwave, Son of Whyachi and Gigabyte 1.5; other templates 1.0. Ramming, floor and hazard damage are not multiplied. The attacking weapon stays protected from its own hit.
- Powered spinners also receive a symmetric, bounded impact impulse. Its added translation energy is paid from the battery. This does not run for coasting weapons or rams. Rotor mass and tip-speed limits are unchanged. The HP multiplier is exact; actual throw distance depends on contact geometry, mass and energy.
- HP bars rise from 4 to 18 px (4.5 times taller). HP text rises from 0.75 to 1.15 rem on full desktop layouts. Low HP is highlighted. Both result cards show chassis HP remaining and a proportionate bar.
- Hydra assist, circular gauge and captions share a flex layout. At 1280 x 720, the gauge ends at y=537 and the control strip begins at y=568.44, giving more than 31 px clearance. The assist is 18 px to the right of the gauge. A separate stacked layout serves narrow menu previews; combat still targets desktop screens.
- ICEwave uses original synthesis, without ICEwave MP3 playback: short exhaust cracks, four metal resonances, induction noise and gear harmonics. Engine firing cadence rises from 54 to about 143 Hz. The 10-second run-up, pause/resume lifecycle and full-throttle pitch are retained.

## Measured checks

- 12 free-arena recovery orientations: six each for Quantum and HyperShock. Both finished upright with stowed arms. Longest active recovery was 1.80 seconds in these cases. Two additional HyperShock cases started with its disc at 4,800 RPM; both recovered and resumed spinning in under 2.14 seconds.
- Seven loaded Hydra offsets stayed within 8.27 degrees of level, without self-flipping. Opponent peak chassis heights ranged from 1.25 to 4.03 m. The original three-offset regression keeps its 1.2 m minimum launch requirement and strengthens the permitted Hydra tilt from 60 to 15 degrees, and its own peak height from 0.45 to 0.16 m.
- Symmetric powered-hit assistance conserves linear momentum to within 0.001 kg m/s in isolated fixtures and accounts for added translation energy. Repeated same-tick boosts and coasting boosts are excluded.
- Real CPU AI fights covered Tombstone/Minotaur, ICEwave/Gigabyte and Deep Six/Quantum. Blade hits and damage registered; no simulation faults occurred.
- Offline DOM integration checks cover updated HP results, low-HP state, assist/gauge nesting, builder and saved-build flows, pause, replay, remapping and exit.
- Managed browser layout review used serialized real HUD/result DOM with the production stylesheet. Checked result portraits and HP totals, and HUD spacing at 1363 x 936 and 1280 x 720.
- At 12 kHz analysis sampling, synthesized idle spectral energy below 200 Hz fell from 34.4% to 1.6%; full-power energy from 450 to 4500 Hz rose from 6.8% to 51.8%. Peak waveform amplitude stays below 0.76. This is waveform evidence, not a claim of loudspeaker listening validation.

## Limits

The managed browser cannot create a WebGL context. Full rendered gameplay, GPU performance, physical controllers and loudspeaker sound quality were not verified in this environment. Physics tests use the real Rapier engine. DOM tests use an explicitly substituted renderer. No fixture pages or test hooks are shipped.
