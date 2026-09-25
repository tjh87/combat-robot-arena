# Combat feedback and recovery update

## User-requested behavior

- The roster is taller (at least 520 px), uses all ten real robot names, shows weapon families, and includes the user's supplied photographs. The selected opponent also has a photograph.
- Automatic replays default off for new preferences. Existing replay preferences are preserved. Playing or skipping a replay resumes automatically; deliberate pauses, hidden tabs, lost focus, and disconnected controllers still pause.
- Rendering hitches no longer open the pause dialog. Fixed 240 Hz physics steps remain bounded; excess wall time is discarded instead of fast-forwarding combat.
- All nine spinning templates show RPM-dependent exposure trails. The actual rotor geometry and collision pose remain driven by physics. Reduced-motion preferences hide exposure trails.
- POV cameras are higher and farther back, use a modest downward viewing angle, and follow interpolated chassis heading, pitch, and roll. Offset mounts on tall machines leave the weapon visible without putting the camera directly behind the blade.
- The lower-centre circular gauge shows measured RPM, percentage of requested speed, and actual modelled electrical input in kW. Its inner ring shows motor power; flippers show remaining charges.
- Weapon sounds now combine blade-pass frequency, geared motor harmonics, low mechanical rumble, and filtered air noise. Drum, bar, shell, and ICEwave-inspired engine sounds differ. These are procedural approximations, not recordings of the real machines.
- Mirror matches give P2 a distinct primary and secondary livery without changing the saved build or physical mass.
- An opponent pointer follows P2 in view and moves to the edge when P2 is beside or behind the camera. It includes distance and a behind-camera label.
- Impacts immediately leave bounded scorch/scratch marks. Progressive armour wear, dents, changing finish, smoke, and detached parts reflect damage. Historical replay frames hide marks that had not happened yet.
- Launch lines sample the actual flight path from the pre-contact position through landing. Distance is horizontal displacement; the readout also shows height and airtime. Completed lines stop following subsequent driving and expire after eight simulated seconds.
- HUGE's rotor is centred on the wheel axle and uses front stabilizers. It remains clear of the floor during normal spin-up.
- Healthy robots waiting on clear floor do not count out simply for standing still. A blocked drive, loss of drive power, or physically trapped pose starts the immobilization assessment. Loss occurs after ten immobilized seconds; both player panels show the remaining time.
- Recovery requires real ground travel to clear the count. Pinned robots have their count held. Practice never records a winner.
- Automatic unstuck assistance reverses, turns toward clear floor, and uses a working self-right mechanism. It does not teleport or repair robots, does not override an active manual self-right stroke, and does not reset the count unless movement resumes. It is enabled by default and can be disabled in Settings.
- AI recovery uses progress checks, corner escape, and shelf routing. Tournament opponents also use real robot names.

## Reference assets

The ten PNG files in public/robots are unchanged copies of the user's supplied Tombstone, Minotaur, Hydra, ICEwave, HyperShock, Gigabyte, Son of Whyachi, HUGE, SawBlaze, and Deep Six photographs. No external image request is needed during play. Earlier source research remains in ROSTER_UPDATE.md; the original game-name mapping there is superseded by this request.

## Focused evidence

- A healthy stationary Deep Six versus Minotaur remains active after 16 seconds, with no impacts and no count-out.
- A disabled robot loses at exactly 2,400 simulation ticks (10 seconds).
- HUGE reached approximately 2,387 RPM, with at least 56 mm blade clearance and an upright body throughout the stationary test.
- Five tested robot families escaped a corner in 1.95–8.78 seconds using actual drive forces.
- Player recovery uses continuous movement; the largest position change per physics tick in the blocked-drive fixture was 21.2 mm.
- The launch fixture recorded 2.37 m horizontal travel, 1.81 m height gain, and a stable endpoint after landing.
- Dedicated tests check duplicate configuration references, side-on/behind-camera pointers, rotor blur visibility, RPM-dependent sound parameters, immediate damage marks, replay resumption, hitches, thumbnails, and the gauge.

## Verification limits

The approved managed browser loads the preview but reports GL_VENDOR / GL_RENDERER Disabled and cannot create WebGL. GPU rendering, frame rate, audible playback, and physical gamepad operation remain unverified. Scene construction, camera projection, damage geometry, audio node parameters, real Rapier physics, and offline DOM flows are tested without claiming browser gameplay coverage.
