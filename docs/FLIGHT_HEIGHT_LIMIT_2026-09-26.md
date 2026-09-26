# Flight height limit

Changed from no fixed flight ceiling to **3.35 metres above the arena floor**, measured at the complete robot's centre of mass. Walls remain **2.70 metres** high, leaving **0.65 metres** of centre-height clearance.

`src/model.ts` defines `RULES.maxFlightHeight`. `src/sim.ts` limits upward translation using the remaining ballistic rise under gravity. It preserves horizontal velocity, angular velocity, rotor speed and relative body motion. Small jumps and downward motion below the ceiling are unchanged. Excess launch energy is removed rather than converted into extra damage or horizontal speed.

A solver-step overshoot moves every attached body down by the same amount and removes excess upward speed. This preserves the assembly's pose and joint offsets. The rule applies during fights and post-match motion; replays use those recorded poses. Detached debris is not part of a robot's flight limit.

Validation is recorded in `docs/flight-height-results.json`: strong launches for all 11 robots, ordinary jumps and falls, unchanged horizontal/spin/relative motion, complete-assembly overshoot correction, ring-outs for all 11 upright robots, and post-match recording. All six groups passed. The complete eight-group roster suite and offline build checks also passed.

Additional collision checks cover weapon slowing, 48 high-speed wall cases, legitimate ring-outs, impact energy/recoil, floor and wall contact, hammer damage, tire slip and 200 hits/200 near misses. Gigabyte recovery and HUGE side-support checks passed.

An older Minotaur gyro-recovery assertion fails identically with this change and the unchanged parent simulation. It is a pre-existing check failure, not reported as passing. No recovery tuning was changed.

The cloud browser cannot create WebGL. Physics measurements and deployed file verification do not claim a GPU visual check.
