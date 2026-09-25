# Start here

## Windows setup first

Read [WINDOWS_SETUP.md](../WINDOWS_SETUP.md) for required versus optional installs and exact launch/build commands. All four Codex prompts start with that setup information.

## What this package contains

This is the working game source, not only a design plan.
The export starts from source commit `15056c8e80233054f240a13f98047b40e219e38f`, published on 25 September 2026.
It includes the latest Hydra Flip Assist and battery-layout changes.
The export adds local servers, portable runtimes, build commands, validation and development instructions.
It removes the Sites hosting configuration from this copy. The original hosted project remains separate.

## First five actions

1. Extract the complete ZIP into a short local path, such as `C:\Games\CombatRobotArena`.
2. Run the play launcher. Start one practice match.
3. Check movement, weapon, camera, damage numbers and sound.
4. Run the verification launcher.
5. Open this folder in Codex and paste the continuation prompt.

Use the complete build prompt only when you need a detailed specification or a fresh reconstruction.
Do not rebuild from scratch merely because a new Codex session starts.

## Current priority

First, verify live graphics and sound on the target computer. The previous browser environment had no working WebGL context.
Do not label that limitation as proof that the game graphics are broken.
The automated physics and DOM checks passed for the last focused update.
Read `WINDOWS_PACKAGE_VALIDATION.json` for this Windows update. `EXPORT_VALIDATION.json` records the earlier combined export. The README screenshots are UI previews with the unavailable 3D renderer omitted.

## Offline meaning

The Windows release includes a Windows x64 runtime and all installed build dependencies. Its game and build tools run locally without internet. The earlier combined release also included Linux x64.
External source links need internet when opened. They are optional references, not runtime dependencies.
This ZIP does not include the Codex application or an AI model.
A hosted Codex model can still need internet. A fully disconnected AI setup needs a separately configured local model and client.
Do not claim that including prompts makes a hosted AI service work offline.

## Instruction priority

1. The current user instruction.
2. `AGENTS.md` and `CURRENT_REQUIREMENTS.md`.
3. Current source and exported specification data.
4. Current verification results.
5. Old documents and JSON reports under `docs/`.

The old reports are retained for investigation. Their dates and version scope matter.
