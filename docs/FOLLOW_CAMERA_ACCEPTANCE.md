# Follow camera acceptance

[Cloud acceptance](https://github.com/tjh87/combat-robot-arena/actions/runs/37469124076) tested `9433da27adddbd59a189612ec3cb37b0080e7fa1` and completed successfully.

The checks covered:

- All 11 robot envelopes
- Roll and inversion
- Exact translation tracking
- Camera clearance near arena walls
- Opponent directions behind the camera
- Current floating opponent HP
- Correct opponent selection for both online player sides
- Camera controls and saved preferences
- Online controls and refresh recovery.

Hard mode made 180 decisions in 360 physics ticks. The previous implementation made 90 decisions.

The hard target delay changed from 62.5 ms to 31.25 ms. The hard aim error changed from 2 degrees to 1 degree.

Easy and medium each retained 90 decisions in the same test. Stock mass and starting HP remained identical.

The screenshots used real Chromium WebGL with SwiftShader. Windows GPU behavior and audible playback remain manual checks.
