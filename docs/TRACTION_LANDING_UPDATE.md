# HUGE handling and fall damage — 23 September 2026

The user requested more wheel traction, control and stability for HUGE, and fall damage calculated using robot weight, velocity and height. The game keeps the previous weapon references, horizontal poles, contact physics, damage rules and recovery controls.

## HUGE changes

| Setting | Previous | Current |
| --- | ---: | ---: |
| Wheel friction coefficient | 1.65 | 2.10, +27.3% |
| Straight speed target at full command | 4 m/s | 4 m/s, retained |
| Steering | Direct differential motor duty; straight-only yaw correction | Shared speed and yaw controller; 2.2 rad/s full steering target |
| Supported pitch spring | 1,800 | 2,400, +33.3% |
| Supported pitch torque ceiling | 650 N·m | 900 N·m, +38.5% |
| Supported roll spring / torque ceiling | None | 1,600 / 700 N·m |

Both drive directions use the same controller. Steering and braking remain within the existing motor current, torque and battery limits. When the wheel axle tips toward vertical, forward drive falls toward 20% and the requested turn rate falls toward zero. This limits wheel spin while the supported robot regains balance.

The pitch and roll assist requires solved contact with the floor or shelf. A pole can provide support during side recovery. The assist does not teleport the robot, set its rotation, cancel airborne gyroscopic motion, or lock it upright. The poles remain horizontal and the blade retains its researched mass and target speed. These support torques are game handling assistance, not a claim about real HUGE control hardware.

With the blade initially at full target RPM, the same two side-pose fixtures give:

| Measurement | Previous | Current |
| --- | ---: | ---: |
| Recovery from left side | 2.896 s | 0.717 s |
| Recovery from right side | 3.071 s | 0.717 s |
| Peak yaw speed, left / right | 19.83 / 19.55 rad/s | 6.54 / 6.74 rad/s |
| Time turning faster than 2 rad/s while deeply tipped, left / right | 1.650 / 1.654 s | 0.213 / 0.242 s |

The side-recovery time falls about 75–77%. Time spent spinning on the side falls about 85–87%. A separate forward/reverse/full-steering fixture stays below 2.58 degrees of tilt. Forward and reverse speeds at 65% command reach 2.60 and 2.61 m/s. Real impacts can still tip or spin the robot.

## Landing calculation

The previous code estimated energy separately for each collider pair and applied a 200 J threshold to each pair. A hard fall could therefore spread its energy across several parts without producing the expected damage. Its height tag was also an inferred equivalent height rather than a measured descent.

The new model tracks the whole robot's center of mass and flight peak. For each landing:

- `m` is the current attached rigid-body mass in kilograms. Detached armour does not remain in this mass.
- `v` is downward center-of-mass speed immediately before contact, in metres per second.
- `h` is the center-of-mass descent from the tracked flight peak to the landing, in metres.
- Available translational energy is `E = 0.5 * m * v²`.
- The gravity share is `min(E, m * 9.81 * h)`. Extra downward motion accounts for the remainder.

Height and impact speed describe the same falling energy. The game does not add `m*g*h` to kinetic energy a second time. Extra horizontal speed is not vertical fall energy; horizontal collisions retain their separate contact calculation.

Measured vertical contact impulse determines how much of the available energy reaches the landing. All floor or shelf contact points share a single budget over a 0.20 s landing interval. Repeated resting contacts cannot recharge it. Rotor contact still reduces rotor energy; the landing does not apply any additional motion impulse.

A 0.12 m equivalent drop is absorbed before damage, and the impact must exceed 1.5 m/s downward speed. These are game cushioning values. The remaining damage energy goes 70% to the contacted parts and 30% to the chassis. Existing material resistance, armour routing and HUGE's 50% wheel damage reduction remain active. Nearby active corner hammers still share their finite energy ceiling with floor loading. Manual recovery clears the flight state.

The impact table now shows mass, measured descent, downward speed, kinetic energy, gravity share and cushioning. Existing damage numbers, HP bars and landing sounds use the new landing event.

## Measured examples

These are total module HP losses for the 113.2 kg Tombstone game preset. They are not real-world damage predictions.

| Drop fixture | Impact speed | Landing energy | Total HP lost |
| --- | ---: | ---: | ---: |
| 0.06 m | Below damaging threshold | No fall event | 0 |
| 0.5 m | 3.18 m/s | 574 J | 5.98 |
| 1 m | 4.44 m/s | 1,115 J | 14.03 |
| 2 m | 6.26 m/s | 2,216 J | 28.24 |
| 1 m, initial downward speed 5 m/s | Higher impact speed | 2,541 J | 32.19 |

Reducing the same robot to 106.76 kg lowers its one-metre landing energy to 1,052 J and HP loss to 13.24. A shelf drop uses the shelf's actual 0.32 m surface. All eleven stock robots take zero fall damage while resting.

## Checks and limits

`traction-landing-results.json` records the new physics fixtures. `traction-landing-validation.json` records the regression suites, before/after side-pose evidence and selected full match. The build and bundle audit run before publication.

Interface checks use an offline DOM with a mocked graphics renderer. The available browser has WebGL disabled; live graphics and audible playback remain unverified. Passing these tests does not guarantee every collision pose or custom build will recover.
