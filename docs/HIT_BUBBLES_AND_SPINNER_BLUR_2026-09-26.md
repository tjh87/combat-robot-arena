# Damage bubbles and horizontal spinner blur — 26 September 2026

Baseline: `01ad5a60519dd61df1c9511ec4c8741cfbcf833e` from the shared private repository.

## Changes

- Hide floating damage bubbles whose rounded label would be **1 HP**, in live play and replays, for either robot. The smallest visible floating label is now **2 HP**.
- Keep every fractional HP allocation, aggregate and result value. Small contacts can still add to a larger visible impact; damage calculation is unchanged.
- Replace the horizontal weapons' six short edge streaks per cutting level with a soft angular exposure. It follows the actual rotor pose, RPM and spin direction, including inverted robots.
- Apply the effect to **Tombstone, ICEwave, Gigabyte and Son of Whyachi**. Gigabyte's lower and upper cutting levels have separate blur surfaces with their respective radii and heights.
- Use a **1/90-second exposure**, capped at the spacing between blades. At stock target RPM, the sweeps cover about **169.4°**, **101.6°**, **112.6°** and **86.3°** per blade respectively.
- Fade in above approximately **100 RPM** and reach full opacity strength at **1,090 RPM**. The material opacity is capped at **0.58**, with softer edges and a transparent trailing end. Stop the effect when the rotor stops or reduced motion is enabled.
- Retain the real weapon geometry and physical pose. Use normal transparency with depth testing, so the effect respects the floor, robot body and other objects.
- Use **one mesh per cutting level**, a single transparency pass and reusable vertex buffers. No extra render target, texture download or full-screen blur is needed. Steady RPM does not upload new vertices.
- Interpolate recorded RPM during replay. Restore live blur buffers correctly after returning from replay.

## Validation

- **70 UI test groups passed**, including the new 600-update trailing-damage test on both robots, live/replay filtering, all weapon panels, settings, builder persistence, controls and match flows.
- **5 focused presentation groups passed**: all four horizontal weapons, direction/inversion, replay restoration, all nine spinners' stop/reduced-motion behavior, exact fractional damage and crusher summaries.
- **2 existing rotor compatibility groups passed**, updated for the new horizontal exposure behavior.
- Production TypeScript build, asset integrity, embedded physics WASM and offline server checks passed.
- The cloud browser still reports `Error creating WebGL context`. Geometry, state and DOM tests do not verify the final GPU appearance or frame rate.

Commands: `node --import tsx tests/spinner-presentation.ts`, `node --import tsx tests/review-ui.ts`, `CASE='Rotor blur' node --import tsx tests/blades-update.ts`, `CASE='Rotor exposure' node --import tsx tests/gameplay.ts`, `node scripts/build.mjs`, `node scripts/verify.mjs`.

See `spinner-presentation-results.json` and `spinner-presentation-validation.json` for the current checks. The update changes 14 files; no gameplay physics, robot specifications, controls, assets or save formats were changed.
