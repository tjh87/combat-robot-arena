# Quantum, combat readouts, and original ICEwave audio

## Changes

- Quantum uses a curved silver crushing skull with nine open cutouts, two curved piercing fangs, and four inner teeth. Beveled surfaces use smooth normals. The existing jaw collision ribs remain the physical structure.
- Quantum has a titanium folding recovery arm. Recovery closes the jaw, deploys the arm through floor contact, then folds it onto the rear deck. Chassis plating is 6 mm so the complete robot remains legal at 112.79 kg. Chassis health remains 2,200 HP.
- Both player panels show current/max chassis HP and speed in km/h. Floating numbers show actual new module HP losses. Contacts within 0.12 seconds combine, repeat frames do not duplicate damage, and numbers expire after 1.3 simulation seconds.
- Blade strikes assign damage to the receiver only. For two cutting blades, the greater incoming blade velocity chooses the attacker. That attribution stays fixed within the contact episode. Incoming enemy strikes and arena impacts remain valid sources of damage.
- ICEwave's mounted camera moves from 0.37 m to 0.70 m above the chassis origin. The tactical camera gains 25% elevation when ICEwave is present.
- Hydra's return stroke has twice the hydraulic damping and a 750 Nm retraction torque cap, reduced from 1,500 Nm. Launch pressure and the 12.6 kJ allowance are preserved. These are controller changes, not a promise that every possible impact produces half the tilt.
- The fight button, paused Leave button, and navigation exit immediately. They dispose the match and tournament state and stop replay/audio without a confirmation dialog.
- ICEwave uses original procedural combustion: idle, a ten-second acceleration, and full throttle. Reference firing rates are approximately 54 Hz and 145 Hz. No ICEwave MP3 is shipped, fetched, or played; three recorded assets were removed. Other robots keep distinct weapon voices.

## Verification

84 groups passed: 51 UI, 7 blade/audio, 7 damage, 6 Quantum/readout/audio, 5 stability/recovery, and 8 crusher/combat groups.

- Quantum recovered from four settled side/inverted starting orientations in 1.67–2.89 seconds, using 1.16–2.53 kJ of its 4 kJ arm budget.
- Hydra remained upright in central and two offset loaded-flip cases. Opponent peak height was 1.54–1.72 m. Maximum tilt was 16.85, 51.45, and 15.35 degrees respectively; stability is not uniformly doubled across contacts.
- Damage tests cover both collider orders, exposed panels, blade clashes, passive body contacts, and genuine rams. Three short AI fights registered real hits without a simulation fault.
- Audio tests check generated waveforms, firing-rate rise, pause/resume offsets, voice disposal, and absence of engine-recording requests.
- Build and TypeScript validation passed. The bundle audit verifies local assets, embedded physics, 11 robot photos, 12 remaining audio files, and exclusion of temporary review fixtures.
- Managed-browser layout review used the actual serialized HUD and a CPU render of Quantum geometry. GPU-backed WebGL gameplay and subjective speaker playback could not be verified in this browser. The CPU image is not a claim of a live game screenshot.
