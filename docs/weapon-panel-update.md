# Weapon panel update

All 11 robot presets use the new weapon panel. Status, weapon readings and control keys sit in separate rows. The panel supports spinner speed, crusher force and flipper readiness. Control hints follow the player’s key bindings. SawBlaze also shows its swing control.

Positive damage labels round to whole HP, with a minimum of 1. Live bubbles, replay bubbles, module loss and impact reports use the same formatter. Border tiers follow the displayed value. Internal damage and scoring retain full precision.

Validation:
- 14 focused DOM integration checks passed, including all 11 presets, remapped keys, 8 rounding cases, replay, reports and 7 damage tiers.
- TypeScript check passed.
- Actual interface markup and styles were inspected in Chromium, using static UI fixtures without WebGL.
- Essential panel labels measure 14 px. The old output label was 9 px, so that label is 56% larger. Main readings use 30 px, or 28 px on short screens.
- Six representative states fit within their 328 px cards without horizontal overflow.
- Hydra’s panel, assist prompt, caption and controls stay separate at 1363 × 936 and 1280 × 720.

Browser fixtures cover the interface. They do not claim GPU or live combat coverage.
