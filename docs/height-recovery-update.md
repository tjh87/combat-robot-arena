# Hit height and automatic recovery

## Changes

- Both result portrait cards show **Max hit height**, in metres with two decimal places. Each value is the largest vertical rise of that robot after an opponent hit, measured from its position at the hit. Result cards now show three hit statistics instead of two. Unit text remains 20 px and bold.
- Match-wide height maxima survive replay-history truncation and remain available when a match ends. Recoil, powered ground escape, post-landing driving, manual unstick and self-righting movement do not increase the hit-travel statistics. A robot with no recorded lift shows 0.00 m.
- Reproduced the recovery bug: HyperShock, Gigabyte and Quantum AI requested self-righting on the first physics tick while upside down at 3 m, before touching the floor.
- Automatic self-righting now requires 144 consecutive physics ticks (0.6 seconds) of stable floor or shelf support while sufficiently tipped. Translation speed must be at most 0.5 m/s and angular speed at most 2 rad/s. Losing support, moving, or returning upright resets the check. Floor support uses actual solver contacts; wall contact alone is insufficient.
- The AI and automatic unstick assistance use the same current-state check. Old AI observations cannot trigger recovery after the robot returns upright. Arm stowing also requires an active recovery before entering its settling phase.

## Verification

- Eight focused test groups pass. A real Rapier flight reached 1.817777 m above its starting position; the result stored 1.817777 m and retained it at match end.
- The three airborne AI cases make zero recovery requests during the first 0.4 seconds of flight. All three can request recovery after settling inverted on the floor. A stranded Gigabyte uses automatic recovery only when assistance is enabled.
- All three folding-arm robots remain stowed through six seconds of idle and curved driving. Maximum arm deviation is 1.01 degrees for HyperShock, 1.15 for Gigabyte and 2.32 for Quantum, with no active recovery cycle.
- Six recovery regression groups pass, including 12 manual recovery orientations and two HyperShock recoveries with the disc running. Seven damage, scoop, highlight and engine regression groups pass.
- All 53 DOM integration groups pass. Results retain the correct height for either winner, next to the matching portrait and HP bar.
- Browser layout review confirms both height rows fit without text overlap and retain 20 px units. Production compilation and the bundle audit pass. No temporary fixture ships.

## Limits

The managed browser cannot create a WebGL context. Physics tests use real Rapier; DOM integration substitutes the renderer. Full rendered gameplay remains unverified in this environment.

## Suggested next additions

1. Save separate replays of the hardest hit and highest launch.
2. Give automatic self-righting and automatic escape separate settings.
3. Add practice targets with adjustable weight and armour.

These are suggestions only and are not included in this update.
