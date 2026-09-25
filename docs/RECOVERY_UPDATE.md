# Recovery, impact feedback and fight controls

This is the current behavior record. It supersedes conflicting recovery and balance figures in WEDGE_UPDATE.md and earlier release notes. These are game adaptations, not real-machine specifications.

## Robot hardware and recovery

- ICEwave emits pale exhaust above its engine cowl, at idle and faster with its weapon running. Exhaust follows the robot, freezes during pause, stops when power or the actuator fails, and respects reduced motion. Its pool is bounded at 96 particles.
- HUGE has two physical titanium supports attached near the outer wheel hubs. Each extends 360 mm out and 360 mm down while retaining upright floor clearance. Their mass and collisions are included. Ordinary driving moves it 5.03 m and 3.12 m after falls onto either side, without automatic unsticking. This demonstrates escape movement, not guaranteed upright recovery from every trap.
- Gigabyte has a folding recovery arm, rubber foot and internal shell brake. It brakes both relative shell speed and remaining whole-rotor angular speed before extending the arm against the floor. Inverted tests recover in 0.97, 3.23 and 6.06 seconds from 0, 1,000 and 1,950 RPM, using less than 1.2 kJ of arm work.
- Minotaur uses drum angular momentum and differential steering to recover from a side fall onto its wheels. Upright or inverted driving is successful recovery; inverted weapon reversal remains active. Small physical hub caps reduce flat-side support. Both spinning-drum side-fall tests recover and then drive more than 2.5 m. A stopped-drum probe also recovers from both sides.
- A free-rotation probe found that the installed Rapier 0.19 build leaves world angular velocity unchanged for an asymmetric freely spinning body. An implicit Euler inertial term supplies the missing precession for rotors. Its regression confirms changed precession without increasing rotational energy. This supersedes earlier assumptions that this backend already supplied that term.
- Recovery controls appear only for configured, functioning mechanisms. Reinstalling HyperShock's or Gigabyte's arm in the builder restores the correct template mount. Recovery does not teleport a robot or apply an extra launch impulse.

## Stronger weapons and stable flips

At the same requested RPM and tip radius, wider horizontal rotors increase their energy:

| Robot | Before | Now | Increase |
|---|---:|---:|---:|
| Tombstone | 40.81 kJ | 50.90 kJ | 24.7% |
| ICEwave | 43.56 kJ | 55.65 kJ | 27.8% |
| Son of Whyachi | 82.81 kJ | 101.90 kJ | 23.0% |

All ten presets remain within the game's weight and tip-speed limits. Deep Six retains the highest requested-speed rotor energy, 134.09 kJ. Low-friction frame skids prevent a reverse-driving snag after increasing Tombstone's rotor mass.

Hydra's flip allowance rises from 4.2 to 12.6 kJ and extension torque limit from 3,600 to 10,800 Nm. Unlimited flips, actuator damage, battery use and the 1.5-second cooldown remain. The stronger empty stroke initially overshot and damaged its own arm. An implicit damped controller now estimates load from actual arm contacts and wraps hinge angles correctly. Twenty consecutive empty flips complete, including at zero stored charges. The equal-mass comparison records 637.8 versus 1,875.3 J of estimated actuator work (2.94 times), and higher opponent peaks of 0.473 versus 0.571 m. The existing core fixture also verifies target inversion. Three times the energy allowance does not imply three times the flight height.

## Damage, replay and menus

Heavy hits leave larger gouges, exposed metal and raised torn edges. Marks remain bounded at twelve per robot and preserve replay history. Metal panels and chassis parts deform more as health falls. Larger damaged-module smoke starts at 65% health. A 42 ms accumulation window makes marks reflect accumulated hit energy.

Automatic slow motion requires a robot weapon hit of at least 12 kJ, four times the old threshold. Light taps and arena/landing contacts do not trigger it. Manual replay remains available.

The opponent picker appears above the player's roster with all ten computer opponents and photographs. A Main menu button exits the fight in one click. Gold winner and blue runner-up panels have larger names beside the existing readable 5/3/3 judging table.

## Verification and limits

This update passes 99 automated groups: eight recovery/impact, eight wedge/audio, three mobility, eight roster, eleven gameplay, fourteen core review, thirty-nine offline UI, seven model/recovery and one focused core flipper regression. All forty forward/reverse cases have zero stalled samples. Five complete seeded roster fights finish with weapon hits in every fight, 68 total. The broader twenty-match core run belongs to the previous release and was not rerun.

The TypeScript/Vite production build and embedded physics-WASM audit pass. No dependency was added. Evidence is in recovery-update-results.json, recovery-update-summary.json, the named regression reports and sleek-matches.json.

The managed preview browser cannot create WebGL. GPU appearance, live browser gameplay, frame rate and audible playback remain unverified. Existing audio is synthesized locally; this update adds no sampled video audio.
