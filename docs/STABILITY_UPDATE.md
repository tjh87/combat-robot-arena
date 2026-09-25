# Hydra stability, manual recovery and steel impacts

Hydra now reduces pressure as its arm accelerates, switches to a damped catch earlier, and stops 0.10 radians before the joint limit. This prevents late contacts from repeatedly driving the hard stop. Opponent lift still comes from physical contact; the 12.6 kJ allowance and unlimited flips remain.

Three equal-mass fixtures use central and ±0.15 m offset contacts. Hydra stays upright in all three. Maximum tilt is 16.8°, 51.5° and 15.3°, versus 168.6°, 180° and 159.1° before this update. The central opponent reaches 1.56 m versus 1.39 m before. Hydra's own central peak chassis height falls from 1.33 m to 0.25 m. These are controlled fixtures, not guarantees for every collision.

The fight HUD has an Unstick button. It identifies eligible P1/P2 robots and places them upright on nearby clear floor. All ten templates recover and drive afterward, including robots without self-righting. Damage, energy, charges, judging evidence and match time are preserved. Recovery ends the current flight measurement, clears old replay frames and prevents the relocation being counted as hit distance. A five-second cooldown and stopped-robot checks prevent repeated use during normal driving. Dead batteries and fully disabled drive systems cannot be repaired through recovery.

Persistent impact gouges, scratch overlays and damage markers are removed from robots and weapons, including replays. Existing physical damage, detached armour, smoke, temporary sparks and flight measurements remain.

Eight real metal recordings replace the previous short impact pack. [Nox_Sound's metal-impact recording](https://freesound.org/people/Nox_Sound/sounds/569555/) is CC0 and was made with a contact microphone. The local excerpts keep 0.95–2.95 seconds of decay, emphasise low frequencies, and use limited pitch variation. Hit energy selects tap, strike or crash and controls volume. Steel axles now use metal audio; rubber tyres retain a duller response. The game serves the clips locally, with a bounded fallback if loading fails. Attribution and exact source ranges are in `public/audio/License.txt`.

## Verification

- 65 passing automated groups: stability/recovery 5, blades/audio 7, offline UI 43, wedge/audio 8, targeted earlier recovery 2.
- All ten robots recovered upright and drove 1.73–4.15 m afterward. Simultaneous recovery, cooldown, disabled-state gates, pause/countdown blocking and damage/time preservation pass.
- Twenty empty Hydra flips pass with unlimited charges, cooldown and work limits. Separate physical checks confirm Hydra still self-rights from both inverted orientations.
- Two seeded AI fights finish with 162 weapon hits in total: Hydra–Minotaur and Hydra–Gigabyte.
- Eight MP3s decode without clipping. Attacks start within 30 ms of each clip. Recorded playback routing, severity, voice limits and node cleanup pass using offline audio fixtures.
- Production TypeScript/Vite build and static bundle/embedded-WASM audit pass. No dependencies were added.

The managed preview browser cannot create a WebGL context. GPU appearance, live browser gameplay, frame rate and audible playback remain unverified. Offline DOM and audio fixtures do not establish those properties. Earlier full-suite reports are historical and are not counted above.

Evidence: `stability-update-results.json`, `stability-update-summary.json`, `stability-matches.json`, `steel-audio-assets.json`, `steel-audio-validation.json`, and the current suite result files.
