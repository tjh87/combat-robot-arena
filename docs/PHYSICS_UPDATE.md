# Physics update — 2026-09-23

## Changes

- Complete the unfinished rotor-energy and wall-containment changes.
- Remove additional launch impulses, formerly capped at 700 N·s.
- Remove damage-based recoil cancellation, formerly up to 45% or 70% for vertical spinners.
- Spend one shared rotor-energy budget across contacts in each step. Count normal contact work and friction. Do not deduct an existing solver loss twice.
- Scale damage by feed per tooth, actual insertion, tooth depth, and strike angle. Show bite depth and engagement in result details.
- Preserve Deep Six's 4× and HUGE's 3× game damage ratings. These scale HP damage, not physical impulses.
- Increase wall thickness from 0.30 m to 0.60 m. Overlap corners. Sweep collider bounds before allowing an exit. Keep the 2.70 m rim and genuine ring-outs.
- Keep 240 Hz physics and one CCD substep. Four internal CCD substeps erased short-lived contact records, including a reproducible Tombstone hit.
- Change corner hammers from driven kinematic bodies to finite 100 kg heads during the strike. Each starts with 3,500 J. The head can stop or rebound. Direct and hammer-related floor damage share one 3,500 J allowance per cycle.
- Require tire slip before smoke can appear. Retain pressure, command, speed, turn and braking effects.
- Smooth HUGE drive changes at 2.4 command units per second. Preserve its top speed, steering direction, wheel protection, and grounded stability settings.
- Refresh rotor-energy details when an existing hit continues across later steps.
- Update obsolete test fixtures for current recovery, contact, camera and damage rules.

## Verification

- Nine spinner templates record real damaging contacts and rotor-energy loss.
- Coasting Tombstone energy falls from 51,002 J to 1,162 J against a wall, and 50,982 J to 36,336 J against the floor.
- Forty-eight high-speed wall scenarios reach 150 m/s: 41 remain inside, while seven clear the full rim. No low wall crossing passes.
- Two hundred isolated tooth hits and 200 near misses pass at 240 Hz.
- An unpowered impact adds no total kinetic energy. Its momentum error is 0.675%, including damping and solver error.
- The hammer reaches 3,500 J maximum kinetic energy. Quantum retains 1,200 chassis HP in the corner-strike fixture.
- HUGE peak tilt falls from 28.69° to 6.43° during forward, reverse and turning checks. Minimum blade clearance stays 19.98 mm.
- All five vertical spinner mechanisms retain physical gyroscopic response. Minotaur recovers from both sides. The isolated gyro check adds no rotational energy.
- Interface integration checks cover start, settings, builder, tournament, pause, replay, result, exit, denied audio, and graphics failure recovery.

`physics-validation.json` contains the final test summary, source settings, and match results. `engagement-update-results.json` contains the focused physics evidence.

## Limits

This remains a rigid-body game with authored material and HP rules. Tooth engagement approximates cutting; it does not simulate metal deformation.

The managed test browser reports disabled WebGL graphics. Live GPU rendering and audible playback could not be checked. Interface tests use an offline DOM with graphics and device test doubles.

## Technical source

[Rapier collision documentation](https://rapier.rs/docs/user_guides/templates/advanced_collision_detection/) describes transient contact records with multiple CCD substeps. [Rapier CCD documentation](https://rapier.rs/docs/user_guides/javascript/rigid_body_ccd/) describes nonlinear motion clamping. The implementation keeps contact accounting observable and adds independent wall containment.
