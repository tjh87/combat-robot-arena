# Before the task: Windows installs and setup

Read this setup section first. Use the existing game files if present.

## What must be installed

- **Full Windows release ZIP:** use Windows 10/11 x64 and a desktop browser with WebGL 2/hardware acceleration. Extract All is sufficient. The ZIP already includes Node.js 24.21.0, npm, TypeScript, Vite, esbuild/Rollup, dependencies, built game and local assets. No separate Node, npm, Python, Git, Docker, WSL, database or hosting install is required to play, rebuild or run the included tests.
- **Source-only Git clone/archive:** install Node.js 22.12+ with npm from https://nodejs.org/en/download. Install Git from https://git-scm.com/downloads/win if cloning or syncing. Run `npm.cmd ci` once while online, then `npm.cmd run build`. A source archive is not the full offline release.
- **Coding with Codex:** install Codex separately while online. For the CLI route, install Node/npm on PATH, reopen PowerShell, then run `npm.cmd install -g @openai/codex`, `codex.cmd --version`, and `codex.cmd` from the project root. Follow its normal sign-in flow. See https://developers.openai.com/codex/cli/ for current installation/authentication details. An editor such as VS Code is optional. Codex and an AI model are not bundled.
- **Publishing only:** Git and GitHub CLI (https://cli.github.com/) plus authentication are needed for `PUBLISH-GITHUB.ps1`. Keep `tjh87/combat-robot-arena` private. Do not publish unless the current request authorizes publication.
- **Creating another release ZIP only:** install Python 3.10+ from https://www.python.org/downloads/windows/ and run `py -3 scripts\package-offline.py --target windows` after building and verifying. No third-party Python modules are required.

## Start, build and check on Windows

Extract the complete ZIP before running anything. Keep all project folders together, for example at `C:\Games\combat-robot-arena`. Allow about 1 GB for the ZIP, extracted tools and build output. This is not a measured hardware-performance requirement.

From PowerShell in the project root:

```powershell
.\runtime\windows-x64\node.exe --version
.\runtime\windows-x64\node.exe scripts\verify-manifest.mjs
.\START-WINDOWS.cmd
```

The bundled runtime should report v24.21.0. Run the manifest check before editing or rebuilding; legitimate edits change its checksums. Keep the server terminal open and visit `http://127.0.0.1:4173/`. Click the game to enable sound. Do not open `dist/index.html` directly or run from inside the ZIP viewer.

Stop the play server with Ctrl+C before starting `.\DEVELOP-WINDOWS.cmd` for live editing. After edits, stop development, then run these commands one at a time:

```powershell
.\BUILD-WINDOWS.cmd
.\TEST-WINDOWS.cmd
.\TEST-WINDOWS.cmd --physics
.\START-WINDOWS.cmd
```

Both servers use port 4173. TEST pauses to keep results visible; `--physics` adds core, battery and gyro checks. Source changes reach the packaged game after BUILD. Use the bundled Node path for direct script/test commands when system Node is absent.

**Do not run `npm ci`, update dependencies or delete `node_modules` in the full offline ZIP.** It already contains the necessary modules. The Windows package includes the Windows x64 runtime; Linux/macOS/ARM need their own compatible setup.

The game and included build tools work offline. A hosted Codex model needs internet and configured authentication. A fully disconnected AI workflow needs a separate local model/client; do not claim these prompts provide one. Do not put credentials into project files. Read `WINDOWS_SETUP.md` for detailed installation, troubleshooting, source-only setup and private GitHub continuation.

---

# Development task

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
