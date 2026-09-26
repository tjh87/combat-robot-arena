# Taller arena walls and Minotaur recovery

Supersedes the 3.35 m ceiling in FLIGHT_HEIGHT_LIMIT_2026-09-26.md.

- Physical and visible walls: 2.70 m to 7.30 m, as requested.
- Centre-of-mass ceiling: 3.35 m to 7.95 m (0.65 m above the rim).
- Actual launch motion remains solver-driven: J = integral(F dt), delta-v = J/m; vertical rise = v²/(2g). No upward boost or damage-based launch force is added. The existing ballistic ceiling only removes excess upward translation and preserves horizontal motion, spin and relative joint velocities. Full collider clearance remains mandatory for ring-outs.
- Example measured on a 113.2 kg robot: 679.2 Ns vertical impulse (2037.6 J) reached 2.597 m; 1358.4 Ns (8150.4 J) reached 7.842 m. Gravity, damping and the ceiling account for departures from the ideal apex.
- Minotaur previously reached its inverted wheels, then restarted rocking because completion recognized only upright poses. Both faces support driving. Recovery now accepts either face, requires angular speed below 0.75 rad/s for 0.30 s, and rejects another request while on its wheels. No pose reset or added recovery torque.

## Verification in this update

- tests/recovery-update.ts, Minotaur filter: both side falls passed, first wheel contact at 3.296 / 3.308 s, remained supported at nine seconds, then drove 2.763 m.
- tests/gyro-dance.ts: 12 manual/automatic pose and rotor-direction cases plus power, drive and support safeguards passed. The repair suite now recognizes the valid inverted driving pose; the separate nine-second stability and drive assertions were retained.
- tests/flight-height.ts: seven groups passed, including all eleven robots, impulse-dependent height, low jumps/falls, velocity preservation and post-match frames.
- Targeted wall tests: complete over-rim clearance, floor/wall energy loss, and 48 high-speed containment cases.
- Build/typecheck and offline verifier passed.
- WebGL rendering and audible playback remain unverified because the available cloud browser cannot create a WebGL context.

Changed runtime files: src/model.ts, src/sim.ts, src/visuals.ts. Requirements and regression tests updated alongside them. No dependencies added.
