# Direct tournament acceptance

[Cloud acceptance](https://github.com/tjh87/combat-robot-arena/actions/runs/37473424144) tested `36d53e4f671835e97c26d6dd52b3ba6f9e774fa4` and completed successfully.

The model checks covered seeded AI-only quick results and preservation of completed results. Player damage remained unchanged across the direct action.

The UI checks held computer workers indefinitely. Controlled player results exercised all three rounds and champion progression.

The same checks covered:

- Immediate entry without a countdown
- Optional repairs and the 900-point budget
- Damage carryover without automatic HP repair
- Rejection of canceled worker results
- Immediate return after a loss.

A separate browser check started an actual physical tournament fight through the normal game UI. No player result was injected in that check.

Browser checks used Chromium with SwiftShader. Windows GPU behavior and audible playback remain manual checks.
