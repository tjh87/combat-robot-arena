# Combat visibility and tournament corrections

## Controls and opponent location

V enters or exits the third-person view. The shortcut returns to the previous tactical or POV view.

The existing camera-cycle control remains available. V also controls the online spectator view.

An earlier custom V assignment moves to an unused key. The other custom assignments retain their values.

The opponent indicator uses an outlined red SVG arrowhead. Its size is 38 pixels on screen and 44 pixels at the edge.

## Camera behavior

The combat cameras use a level horizon. The follow and POV views filter position changes and rapid turns from physical impacts.

A near-vertical robot retains its last reliable heading. The camera follows its real front direction after the robot settles.

HUGE retains its axle-based heading. The inset camera uses its own filter and elapsed time.

## Tournament behavior

A final result declares the champion automatically. The champion panel appears without a **Finish tournament** action.

Offline tournaments use fresh browser entropy for each new cup. Each cup selects seven distinct computer templates from the available stock roster.

Online cups also select distinct computer templates. Explicit seeds remain reproducible in simulation tests.

The bracket uses larger current-cup records. Gold borders and **YOU** labels identify the user robot in every stage.

Connectors use entrant identities across shuffled rounds. They use the current CSS viewport dimensions rather than SVG user coordinates.

Resize callbacks, row changes, and font completion recalculate the paths. Obsolete observers cannot update a newer bracket.

## Quantum balance

| Component | Previous maximum HP | Current maximum HP |
| --- | ---: | ---: |
| Left drive | 550 | 400 |
| Right drive | 550 | 400 |
| Weapon | 650 | 500 |

These values match the standard drive and weapon budgets. The chassis uses the existing 1,200 HP budget.

## Damage fragments

Component HP loss produces matching fragments. The visual types include:

- Tire sections for drive damage
- Weapon chips for weapon damage
- Casing pieces for battery damage
- Housing pieces for actuator damage
- Plate pieces for chassis and armor damage.

The pieces use the affected part location and material color. Larger HP losses produce more pieces, with eight per burst and 48 total.

The new fragments are cosmetic. Their 2.6-second animation adds no forces to the simulation.

Destroyed armor panels retain their physical debris. Live play, online replicas, and replays use component health to show the new fragments.

Reduced motion disables the cosmetic fragments. The actual physical parts still follow the simulation.

## Acceptance

[Cloud acceptance](https://github.com/tjh87/combat-robot-arena/actions/runs/37638294709) completed successfully for `20907db8828cf4e6ca53c320d4aa7b923e7fa948`.

The checks covered:

- Build output, local assets, and server types
- Distinct seeded rosters and fresh browser seeds
- Quantum HP budgets and damage behavior
- Quantum recovery and actual skull openings
- Stable camera trajectories, inversion, and wall clearance
- Physical armor debris and bounded component fragments
- Keyboard V in offline and native online play
- The red arrowhead, readable records, and user highlight
- Immediate championship presentation
- Connector identities, resize alignment, and transformed layouts
- The repair budget and damage carryover
- Reduced motion.

Controlled result fixtures covered the complete cup UI. Separate checks entered a physical offline fight and received a rendered native online frame.

Chromium used software WebGL for the screenshots. Windows GPU behavior and audible playback remain manual checks.
