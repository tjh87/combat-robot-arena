# Sleeker robots, clearer judging and stronger weapons

Historical version 5 behavior record. WEDGE_UPDATE.md supersedes its dimensions, Deep Six upper-wheel design, HyperShock rollover supports, recovery and validation figures. Retained below as release history.

## Appearance and controls

All ten templates use rounded machined edges, higher-resolution cylindrical surfaces, smooth drum/disc/wheel rings, and smoother shell panels. Metal and painted surfaces have a cleaner finish; impact wear increases roughness. Horizontal bars have swept shoulders and cutters use tapered physical prisms. Physical mass and inertia include the changed blade and cutter geometry. Tiny rendering bevels and circular smoothing are cosmetic and do not alter the collision model.

A front arrow stays visible through robot geometry in the arena, POV, replays and builder. Arena markers sit on the floor and follow heading rather than disappearing as a robot rolls. HUGE uses its wheel-axis heading for steady steering while its centre body rocks.

The builder has separate Save settings and Reset to default buttons near the top. Save validates and stores one build on the device. It loads on the next visit unless an explicit build link is opened. Reset restores the selected starting preset and clears that saved build. Storage failures appear beside the controls, and invalid drafts cannot replace a good saved build.

## Match displays

KO countdowns are large circular clocks in the middle of the screen, with robot names, remaining seconds, progress rings, and final-three-second emphasis. Two simultaneous counts display side by side. Pinned counts remain held; paused time does not advance. Practice shows immobilization status without declaring a winner.

Results show large totals and a side-by-side Damage / Aggression / Control comparison. Each row explains the criterion and shares its 5, 3, or 3 available points between P1 and P2. A KO or disqualification clearly says the stoppage decides the winner; the displayed scorecard does not override it. Detailed evidence remains collapsed below. The categories are sourced to the official [BattleBots 2022 Judges’ Guide](https://battlebots.com/wp-content/uploads/2022/09/Judges-Guide.2022.0.pdf), verified this turn. Point allocation remains the game's automated approximation.

## Physics changes

- Son of Whyachi's rotor sits 36 mm lower, with 21 mm clearance above its own armour.
- HUGE has symmetric front/rear supports and a symmetric speed controller. The measured forward/reverse speed difference is 0.163% in the straight-line fixture.
- Minotaur has centred rotor/axles and supports on both sides of its body. HyperShock has slim rollover horns. Both drive inverted with the weapon running in reverse.
- All five vertical-spinning templates reverse motor direction when inverted. Hysteresis prevents direction chatter near a sideways pose. Drive sides also swap when inverted to keep steering consistent. Rotor exposure trails and recorded replays follow the actual rotation sign.
- Inversion reversal does not bypass contact forces: a blade pinned against an obstruction can still stall. Deep Six has thin titanium upper rails, skids and a dedicated rubber roller pair with 6:1 gearing, so it can drive inverted with the blade clear of the floor. The wheels, two extra motors, support mass, joints, contact and battery draw are all represented physically. Custom 2/4/6WD layouts retain distinct upper-wheel IDs. SawBlaze can recover with its articulated arm.
- SawBlaze's arm has a separate physical recovery stroke, triggered by the self-right control when tipped or inverted. It returns after recovery. A working arm can self-right even if the spinning disc has failed. Recovery uses motor work, contact and torque, with no pose resets or free repair.
- All weapon templates gain available energy. Stronger spinner motor current limits shorten spin-up. Deep Six has the highest requested-speed rotor energy, 134.09 kJ versus 44.59 kJ before (3.007 times). The result of an individual hit still depends on contact, speed and angle. Hydra has a 4.2 kJ charge allowance; SawBlaze has a 1.3 kJ strike allowance.
- Deep Six has lightweight rear supports. A seeded no-hit overturning case found during this update now remains upright until combat.

## Verification

85 focused automated groups pass: 33 offline UI, 14 core regression, 11 combat feedback, 8 roster, 7 systems, 7 new update checks, and 5 scene checks. Five complete seeded AI fights finish, each with real weapon hits. All ten templates meet the game's 113.398 kg mass and 111.76 m/s tip-speed limits. 1,902 independently checked part moments agree with Rapier. The largest robot preview contains 28,027 triangles.

The inverted drive fixture records Minotaur at 2,062 RPM after 4.92 m of driving and HyperShock at 1,749 RPM after 2.34 m, and Deep Six at 268 RPM after 6.58 m. SawBlaze reaches an upright pose 0.642 seconds after its recovery command, using 102.5 J of arm work. Its maximum chassis displacement per physics step is 5.42 mm. These are reproducible game fixtures, not specifications or performance claims about real BattleBots.

The production TypeScript build passes. No dependencies were added. Images and physics assets remain local.

The approved browser still reports Error creating WebGL context. GPU appearance, live browser gameplay, GPU frame rate and audible playback could not be verified here. Offline scene geometry and DOM tests are not presented as rendered-browser tests. Earlier 20-match and tournament reports remain historical evidence from the previous release; they were not repeated for this update.
