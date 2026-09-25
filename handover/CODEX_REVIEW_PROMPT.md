Review and repair this existing Combat Robot Arena checkout. Keep it fully local and offline-capable.
Read AGENTS.md, CURRENT_REQUIREMENTS.md, ARCHITECTURE.md, DO_AND_DO_NOT.md and TEST_PLAN.md first.
Do not replace the working app or restore conflicting historical settings.

1. Inspect the current diff and identify the source baseline. Preserve unrelated work.
2. Verify build and local assets. Check every runtime fetch. External reference links are allowed; required external requests are not.
3. Inspect state transitions for stale simulations, held keys, audio sources, timers, replay events and result values.
4. Review contacts, bite, rotor slowdown, force budgets, collider mass, fall energy and wall containment.
5. Review each robot's drive heading, inverted controls and real recovery mechanism.
6. Reproduce Minotaur recovery from both sides and upside down, with stopped and both rotating drum directions.
7. Check SawBlaze spin/swing independence, fast strike, floor protection and recovery.
8. Check Hydra supported-contact advice and one compact assist panel.
9. Check Quantum tooth contact, pressure, battery penetration, prompt release, two-length retreat and crush total.
10. Check every battery zone with strong, weak, missed and rotated impacts. Verify both players' hints and POV exclusions.
11. Check floor saw shape/motion, hammer mass/budget and screw jam reversal.
12. Check fractional HP aggregation, integer labels, missing numbers, seven bubble tiers, animation and reduced motion.
13. Check tactical/POV text fit, speed placement, component warnings, KO circles and result shortcuts.
14. Check local saves, import validation, tournaments, remapped controls and gamepad loss.
15. Check audio, effects, geometry budgets, disposal and sustained match performance.

For each defect, capture a reproducible case and explain the cause. Fix the cause with a focused change.
Use a meaningful regression test where necessary. Do not change expected values merely to make a report green.
Separate proven defects from uncertain visual judgments and unverified real-world specifications.
Do not invent CAD data or make gameplay changes merely to claim the game is more realistic.

Run relevant checks and the production build. Verify the extracted offline package when packaging changes.
Use a real graphics-capable browser for WebGL and sound when available. Report unavailable checks honestly.
Report numerical changes, files changed, test counts and remaining risks. Do not publish unless currently authorized.
