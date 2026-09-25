# Result units, HyperShock drive and landing update

## Changes

- Result-card distance and energy units increase from 14 to 20 px (+42.9%), with weight 700 instead of 500. Browser review confirms all four units fit in their stat columns.
- HyperShock receives four D48 Sport motors: 210 KV, 120 A current limit and 0.060 ohm resistance. Its 12:1 gearing remains. Floor attraction adds 240 N while upright and near the floor. The attraction releases during recovery. Electrical work and added mass remain in the simulation and builder totals. Other stock robots keep their existing drive motors. Old saved builds still load with the original motor.
- HyperShock's recovery foot widens by 40 mm. This provides better support with the upgraded drive. Stowing uses the shortest angular error, so an overshoot past zero returns to stow instead of trying another rotation into the floor. Quantum retains its foot geometry and passes its recovery checks.
- Three landing clips are rebuilt from the existing CC0 scrap recordings. Processing preserves a short attack, suppresses narrow resonances, and adds a slowed low-frequency body. Durations fall from 1.60, 1.85 and 2.40 seconds to 0.30, 0.52 and 0.64 seconds. Heavy-clip energy after 400 ms falls from 65.317% and 54.044% to 0.011% and 0.040%.
- Landing playback uses lower filter cutoffs and heavier samples for higher falls. Chassis and tyre contacts within the same landing share one audio event. Separate attacks, robots and later bounces retain separate events. Physical impact records are not changed. The missing-asset fallback also uses a damped body instead of a ringing tail.

## Verification

Real Rapier comparisons use the same current geometry, with the old D48/no-magnet drive versus the new drive. The disc spins for 15 seconds before 1.5 seconds of movement. These are measured scenario results, not universal maximum speeds.

| Measurement | Old drive | New drive | Change |
|---|---:|---:|---:|
| Speed after 0.5 seconds | 3.667 m/s | 4.481 m/s | +22.2% |
| Peak speed during the run | 6.757 m/s | 7.899 m/s | +16.9% |
| Turn angle in 1.5 seconds | 99.97 degrees | 134.64 degrees | +34.7% |

- The new stock mass is 104.532 kg, below the 113.398 kg limit. Estimated reference-duty endurance is 298.55 seconds. This estimate uses the existing mixed-duty model, not uninterrupted full throttle.
- Forward/reverse runs stay upright and stop below 0.10 m/s after braking. Both exceed 1.7 m travel in the test interval.
- All 12 recovery orientations pass: six each for HyperShock and Quantum. The slowest active recovery is 4.81 seconds. Both HyperShock recovery cases starting with a running disc restore weapon rotation. Arms finish stowed.
- Real drops from 0.75 and 2.5 m produce separate landing events with measured height. The high drop's four contact records produce one sound.
- Seven focused drive/audio test groups, six recovery regression groups and 53 DOM integration groups pass. Native browser AudioContext decodes all three new clips, starts playback, and releases all impact voices. The production build and bundle audit pass.
- The asset recipe is `scripts/rebuild-landings.py`. Original input excerpts can be recovered from the preceding Git revision. Source credits and measurements are in `public/audio/License.txt` and `docs/landing-audio-assets.json`.

## Limits

The managed browser cannot create a WebGL context. Physics checks use real Rapier; DOM integration substitutes the renderer. Native audio checks verify decoding and playback lifecycle. Loudspeaker sound quality and full rendered gameplay were not verified here. No preview fixture ships with the game.
