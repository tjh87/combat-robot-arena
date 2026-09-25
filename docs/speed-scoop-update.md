# Damage, scoop, match highlights and audio update

Implemented the latest requests, including the follow-up that ICEwave sound must track weapon speed.

## Behaviour

- Weapon and actuator output stay at 100% through 50% damage, then decline to 72.5% at 75% damage and 45% at 100%. The weapon keeps running. Drive remains subject to battery damage and stored charge.
- Quantum and Hydra have thin triangular side ramps on their existing front scoops. Turning presents a low leading edge, and the solver supplies the upward contact. No pose overrides or scripted opponent lifting were added.
- Both result portrait cards show a large HP bar and numeric remaining HP, farthest hit travel in metres, and hardest hit dealt in kJ. Farthest travel belongs to the robot being hit. Airborne travel and unpowered sliding count; powered ground escape, recoil, manual recovery and later driving do not. Hardest hit is the existing game contact-energy estimate, including a crusher bite. Whole-match maxima are separate from capped replay logs.
- Every competitive match resets the generated three-tone amber sequence plus distinct fight tone. Pause/resume retains cue position. The tones use the already unlocked Web Audio context and are independent of the impact sound limit. Practice has no competitive countdown. User mute settings remain respected.
- ICEwave now has original short combustion cracks, irregular filtered exhaust/induction bursts and cylinder resonances. No bass oscillator, hard clipping or fixed ten-second run-up remains. Three timbre bands share one current firing cadence. Measured weapon speed sets playback pitch with a 65 ms smoothing constant; engine brightness and level follow speed/load. Supplied MP3s were used for spectral reference only, not as playback assets.

## Verification

| Check | Result |
|---|---|
| `tests/speed-scoop-update.ts` | 7 groups passed: threshold boundaries, four physical side sweeps, forward/reverse floor clearance, highlight accounting, RPM audio, repeated countdown cues, bounded waveforms |
| `tests/review-ui.ts` | 53 groups passed, including pause/resume, rematch/tournament start cues and both winner orders with HP/statistics |
| `tests/damage-update.ts` | 6 groups passed; real rotor speed unchanged at 50% damage, reduced at 75%/100%; three real AI pairings |
| `tests/hud-recovery-update.ts` | 6 groups passed; Quantum/HyperShock recover from six orientations and retain folded arms during driving |
| `tests/hydra-support.ts` | Off-centre flip group passed in four positions; opponent peaks 2.01–3.36 m, Hydra maximum tilt 5.37 degrees |
| `tests/quantum-update.ts` | 6 groups passed; recovery, geometry, damage readouts, camera clearance, and measured combustion cadences |
| Browser result layout | Actual result component rendered with portraits, HP bars and both statistics; readable and aligned at 1363 × 936 |
| Native browser Web Audio | AudioContext running, three amber cues plus FIGHT, no API errors; measured engine cadence 48 → 112 → 160 → 66 Hz during speed rise and slowdown |

Production TypeScript/Vite build and the 28-file bundle audit passed. The existing large-bundle warning remains; physics WASM is embedded. Temporary browser fixtures are excluded from the output.

Total: 79 automated test groups passed. Side sweeps lifted the test opponent 5.65–7.57 mm through real side-ramp contacts. Preset masses remain legal: Hydra 94.570 kg, Quantum 112.717 kg.

The browser result/audio checks use a temporary fixture with the actual modules. Full WebGL gameplay cannot run in the managed browser environment, as established previously; physics runs against real Rapier in the tests. Audio API/pitch checks do not establish subjective sound realism or loudspeaker output. Travel is a post-impact trajectory measurement, not a counterfactual separation of every force during flight. Later arena contacts may affect the measured trajectory.
