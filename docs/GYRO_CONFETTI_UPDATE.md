# Minotaur gyro dance and winner confetti

## Recovery

Minotaur retains the existing physical rotor-inertia integration and now uses a staged wheel controller: spin up to 35% of configured RPM, pulse opposing wheels for 0.55 s, pause for 0.15 s, and choose steering direction from chassis lean and actual drum direction. Steering requires solved floor/shelf support. The controller stops after 0.12 s of wheel contact with absolute vertical alignment above 0.88, or after 8 s. Both upright and inverted wheel-supported driving count as recovery.

No recovery impulse, position reset, or extra gyroscopic torque is introduced. Existing motor work, battery use, mass and inertia remain authoritative. Broken drives, unavailable weapon power and repeated activation cannot bypass recovery guards. Manual unstick clears dance state.

Review found the former constant-steering recovery failed its existing side-recovery regression with the current mass/inertia. The new pulse controller passes the updated physical recovery window. The original 3 s deadline was replaced by the bounded 8 s recovery allowance and 9 s observation; final wheel support and subsequent driving are still required.

## Confetti

The after-match effect moves from the viewport to the winning portrait. Particle count falls from 96 to 24 (75% fewer); width changes from 3–6 px to 2–3 px and height from 8–15 px to 4–7 px. Motion stays clipped to that portrait. The runner-up, scores and match screen receive no confetti. Both reduced-motion mechanisms remain active.

## Verification

- Six physics cases: left/right side, stopped drum, and both full-speed drum directions. All regain wheel support and subsequently travel more than 3.25 m over 1.5 s of drive input. Spinning recoveries reach initial wheel alignment in 3.25–6.20 s. Cold fixtures settle onto their wheels in about 0.5 s before the steering stage is needed; these are not claimed as precession-only recoveries.
- Five safeguard checks: level pose, broken drive, empty battery, unsupported spin-up, and loss of drive during recovery.
- Existing two-sided gyro regression passes; isolated inertial integration never exceeds its initial rotational energy.
- Full offline UI suite passes; focused winner mapping checks cover both player slots and reduced-motion suppression.
- TypeScript and production build pass. Existing large-bundle advisory remains.

Tests use deterministic Rapier simulation and offline DOM integration. Live browser/GPU animation appearance was not verified in this environment. Physical recovery can still fail under opponent pressure, damage or obstructed geometry.
