# Crusher, effects, and endurance update

The roster now contains eleven robots. Quantum uses the supplied photos as its reference: a compact blue four-wheel chassis, a polished curved jaw, two pointed teeth, and a low steel scoop. It is available as the player, computer opponent, and builder preset.

## Gameplay changes

- Quantum weighs 111.87 kg. Its chassis has 2,200 HP and each drive module has 550 HP. Relative to the standard chassis and drive modules, these are increases of 22.2% and 37.5%.
- The jaw uses physical hinge torque and tooth contacts. Sustained pressure consumes battery power and damages the contacted module. Each bite releases after 3.5 seconds or 12 kJ of crushing work. Space closes or releases the jaw. The HUD reports jaw force in kN.
- Hydra measures how far its flipper has entered beneath the opponent. Loaded launch pressure increases from 40% to 100% with insertion. The existing maximum launch setting and work limit remain in place. The flip cue reports insertion and available power.
- Gigabyte has a wider, longer wheel base and a lower chassis. Traction commands ramp over approximately 0.29 seconds, and its drive motors counter unwanted yaw during straight driving. The shell resumes after self-righting if it was previously enabled. Pressing the weapon key during recovery can cancel that restart.
- R performs manual Unstick. P is the second keyboard binding. Both can be remapped. Recovery preserves damage, battery energy, score evidence, and match time. It retains the five-second cooldown and does not act during pauses or countdowns.

## Effects and media

- Spark output follows measured hit energy. Example bursts range from 18 sparks at 200 J to 260 sparks at 40 kJ. Larger bursts travel faster, last longer, and include bright fading streaks. The fixed pool contains 720 particles, up from 180.
- The supplied countdown excerpt plays before the match clock starts. Video progress controls the approximately 3.47-second sequence. Pausing freezes it. Failed or stalled playback falls back to countdown lights and tones.
- The app uses eight recorded steel-impact clips and three separate landing clips. Landing selection considers drop height and impact energy. Simultaneous wheel contacts produce one landing voice per robot.
- Steel crash clips have stronger low-frequency weight and a sharper attack. Landing clips have encoding headroom to prevent clipping. A master limiter bounds playback peaks. These are processed real-metal recordings, not recordings claimed to be from a BattleBots match.
- Sources and licences are recorded in `public/audio/License.txt`. The countdown is the user-supplied excerpt; it is not labelled CC0.

## Weapon shutdown fixes

A no-hit, three-minute reproduction exhausted the old Minotaur and SawBlaze batteries. Their healthy weapons then coasted down. Minotaur's preset pack is now 500 Wh, SawBlaze's is 450 Wh, and HyperShock's is 400 Wh. Tournament robots retain their preset capacities instead of receiving undersized packs. Custom build capacities remain editable.

The three revised spinner presets completed full-length, no-hit tests with 23.7%, 36.9%, and 37.0% charge remaining respectively. Genuine module damage can still disable a weapon. The HUD now distinguishes an empty pack, lost electrical power, and weapon damage.

## Validation and limits

Current evidence is listed in `crusher-update-summary.json`. Eighty automated test groups and two seeded AI matches pass. Physics tests cover the jaw grip and release, mobility, floor clearance, insertion-dependent flips, shell stability, self-righting restart, keyboard recovery, particle bounds, landing classification, media fallback, and three-minute endurance.

Quantum's controlled grip test reached 10.64 kN, damaged the opponent by 90.0 HP, and stayed within 1.07 degrees of upright. In the full Quantum versus Minotaur AI match, Quantum performed eleven crushing bites. All eleven presets compile legally and round-trip through saved build links.

The Hydra depth fixture produced opponent peak heights of 1.06 m, 1.17 m, and 1.56 m at 8.7%, 57.3%, and 100% insertion. Launch height also depends on contact location, opponent geometry, motion, and mass; insertion does not promise a fixed height. Three loaded central/off-centre flip fixtures stayed upright.

Gigabyte's full-speed steering fixture remained within 0.47 degrees of upright across six changes of steering. This fixture stays clear of arena walls; hard impacts can still overturn it. Three inverted recovery cases pass and resume shell rotation.

The UI checks use an offline DOM harness with explicit graphics and device test doubles. The managed browser's WebGL limitation remains unresolved. GPU appearance, live-browser frame rate, and audible playback are not verified. Media decoding, non-clipping sample peaks, geometry bounds, production compilation, and static asset integrity are checked independently. No dependencies were added.
