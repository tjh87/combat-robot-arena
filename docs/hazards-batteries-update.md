# Arena hazards and battery targets — 24 September 2026

## Changes

- Four floor slots contain paired, thin circular saws with metal edges and 24 teeth per disc. Yellow rectangular marks frame each slot. The discs spin on physical hinges, rise above the floor, cut at contact, and retract. Damage includes solved sliding-friction work. All teeth share one damage budget per cycle.
- Two hammers have long pivoting arms and chamfered steel heads. Each head weighs 50 lb (22.6796 kg), as requested. A 3 kg arm contributes its own mass and inertia. The downstroke starts with a finite 3,500 J charge; impacts and floor reactions share that charge. The hinge limits travel to 90 degrees, followed by a controlled return.
- Two silver helical screws span the upper-deck entrance, with red bearing guards and red/blue deck markings. Their front surfaces move upward and their tops move toward the deck. A stationary robot in contact triggers 1.8 seconds of reversal after 1.25 seconds. Short gaps between successive teeth do not clear a jam. Occupancy of the deck also reverses its entrance screws. The two wall screws use the same physical helical geometry and jam logic.
- All 11 robots have internal battery targets: 18 zones in total. Their boxes become visible when the covering armour is removed. Fire originates at the damaged zone and retains that location in replay.
- Quantum tests its tooth penetration path against battery zones in the target robot's local coordinates. A correctly placed bite first spends work puncturing the cover, then damages the battery. Alternating teeth retain separate puncture progress. A miss does not damage a remote battery. Pressure stays engaged at the smaller per-tooth holding load after initial contact.
- Minotaur checks its steering direction again after landing on the other side during recovery. It brakes earlier when rolling toward upright. Recovery still uses wheel torque and drum precession; no pose reset or recovery impulse is added.
- The builder identifies each battery target, links its references, and marks estimated positions.

All stock robots remain 113.2 kg. Battery mass is divided among the target zones rather than added again. Zones share the existing 350 HP battery pool. Existing weapon-power behavior, battery-fire rules, and Quantum's two-length retreat remain in place.

## Reference basis and limits

The supplied images set the appearance of saw slots, hammer heads/arms, and deck-front screws. The [official 2021 tournament rules](https://battlebots.com/wp-content/uploads/2021/07/BattleBots-Tournament-Rules-Rev.2021.1.1.pdf) describe inward-turning deck screws and outward reversal when a robot occupies the deck. Jam detection is an automatic game behavior requested by the user.

Published layouts vary by season. No dimensioned battery coordinates were verified for these 11 configurations. **Every exact game coordinate below is an estimate.** Zone counts represent game targets, not verified physical pack counts. The sources support the stated system or chassis arrangement only where indicated.

| Robot | Game target | Research basis |
|---|---|---|
| Tombstone | Rear bay | [Hardcore Robotics](https://hardcorerobotics.com/team.html) documents battery maintenance; no coordinates. |
| Minotaur | Two side zones and a rear drive zone | [RioBotz team AMA](https://www.reddit.com/r/battlebots/comments/13u7k9r/ama_with_minotaurs_team_riobotz_at_7pm_et/) confirms separate drive and weapon supplies and two parallel weapon batteries; no coordinates. |
| Hydra | Rear bays beside the hydraulic unit | [Team Whyachi](https://whyachi.com/) and its [hydraulic description](https://www.facebook.com/Whyachi/posts/2588424261170373/) do not give battery coordinates. |
| ICEwave | Low rear drive bay | [Official robot profile](https://battlebots.com/robot/icewave-2021/); the combustion weapon engine is separate from the electric drive. Placement is estimated. |
| HyperShock | Central box between drive pods | [Team power-system build log](https://hypershock.tv/blogs/inside-the-bot/putting-the-shock-in-hypershock) describes the removable shared battery box and motor pods. Game dimensions are estimated. |
| Gigabyte | Low side bays under the shell | [Public damage report](https://www.reddit.com/r/battlebots/comments/17c0od2/) mentions battery damage through the bottom plate. No measured layout was available. |
| Son of Whyachi | Low rear bay under the rotor | [Team Whyachi](https://whyachi.com/) does not give battery coordinates. |
| HUGE | Left and right chassis pods | [Team build log](https://hugebattlebots.com/team-huge-battlebots-blog/huge-build-log-2018) documents mirrored chassis halves; battery placement within them is estimated. |
| SawBlaze | Rear bay | [Jamison Go's project page](https://jamisongo.com/projects/sawblaze/) specifies a 12s4p battery system; no battery coordinates. |
| Deep Six | Left and right lower pods | [Team AMA](https://www.reddit.com/r/battlebots/comments/coottd/); no dimensioned battery layout was found. |
| Quantum | Rear bays beside the hydraulic unit | [RoboChallenge team AMA](https://www.reddit.com/r/battlebots/comments/13hmmck/); no battery coordinates verified. |

Saw speed (1,200 RPM target), screw speed (5 rad/s), motor powers (750 W and 600 W), cycle timing, and damage budgets are game settings. Loaded rotors slow or stall. They are not claims of measured BattleBox specifications. The 50 lb hammer head is user specified. Local puncture work uses rated front bite force multiplied by cover thickness; battery crush resistance is a game value of 18 J/HP. These are simplified damage models, not an engineering prediction of real battery failure.

## Verification

- Seven hazard/battery groups pass, including 54 rotated hit/miss cases, all 18 battery zones, and a held bite using actual tooth contacts. The held bite deals 69.48 battery HP while leaving over 90% of the covering panel intact. Its allocated damage energy does not exceed the pressure work.
- A hammer strike peaks at 3,499.28 J. The head mass is 22.6796 kg, total moving mass is 25.6796 kg, and maximum measured pivot error is 0.14 mm.
- Saw discs emerge to 0.285 m above the floor, retract below it, and create damaging physical contact.
- A screw lifts at its front surface, detects a pinned robot after 1.258 seconds, reverses, and resumes its usual direction after clearance.
- Twelve Minotaur cases cover upside-down and both side starts, stopped and both spinning drum directions, and automatic recovery. All recover in 4.75–24.01 seconds without a match loss or physics fault. The test limit is below the 26-second controller timeout so timeout cannot count as a recovery.
- Eight handling/presentation checks and eight crusher/regression checks pass. These include the two-length Quantum retreat, release bubble, Gigabyte steering, treads, fall damage, ring-out travel, and the faster release timing.
- All 11 stock builds retain their legal mass, share-link round trips, and finite builder geometry. Each remains below the existing 60,000-triangle robot budget.
- Three battery-fire checks pass: the 70% ignition threshold, local penetration, and an eight-second burn that ends without disabling the weapon.
- Three builder DOM checks pass. Type checking and build/bundle validation run before publication.

WebGL appearance and GPU frame rate remain unverified because the available browser has no working WebGL renderer. Geometry and DOM checks do not substitute for a gameplay screenshot.

Reports: `hazards-batteries-results.json`, `hazards-geometry-results.json`, `hazards-gyro-results.json`, `hazards-repair-results.json`, `hazards-crusher-results.json`, `hazards-battery-fire-results.json`, and `hazards-ui-results.json`. Earlier reports are retained as historical records.
