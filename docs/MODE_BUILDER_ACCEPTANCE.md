# Builder and mode acceptance

## Source and cloud evidence

The full acceptance run tested `90829d6c003db121bbff78a8dee1609c562f6e40`.
[Full acceptance](https://github.com/tjh87/combat-robot-arena/actions/runs/37397910496) completed successfully.

The focused builder run tested `64ec67ffacab0474d1a81d746d1a3337163d4a40`.
[Builder recovery acceptance](https://github.com/tjh87/combat-robot-arena/actions/runs/37399525649) completed successfully.

The focused change corrected invalid scratch-draft recovery and part labels. The simulation and online controller remained identical to the full acceptance source.

## Completed checks

- All 11 stock configurations retained their mass, part count, legality, and rotor inertia.
- All 11 templates passed the settled physical fit test.
- The suite compiled 605 assembly/source combinations and preserved their component-source fields through build links.
- Floor errors and attachment collisions produced errors.
- The fit worker completed through the visible builder control.
- Draft changes invalidated earlier fit results.
- Invalid scratch drafts returned to a valid scratch frame.
- The library retained two named robots after refresh.
- A saved robot entered an actual Practice session.
- Seven physical worker fights completed through three rounds and produced a champion.
- The browser heartbeat continued during the worker tournament.
- Retry created a fresh worker.
- Eight native online connections completed seven physical tournament fights.
- A saved custom robot entered its physical quarterfinal.
- Winners purchased repairs before the next round.
- Spectator cameras reset between matches and showed the correct weapon instruments.
- Both online players retained their controls and POV after refresh.
- An armed online impact produced integer damage bubbles in both browsers.
- Physics ticks, control acknowledgments, graphics, and refresh recovery continued after the impact.
- The offline asset audit and server type checks passed.

Core transition tests used injected results for additional state coverage. Physical fight checks used the normal simulation and normal result rules.

## Environment

Browser checks used Chromium with SwiftShader. The worker tournament used the same physical simulation as offline play.

Online graphics use a 60 FPS cap. Hardware, network latency, and server load determine the actual frame rate.

Windows GPU behavior and audible playback remain manual checks.
