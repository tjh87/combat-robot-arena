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

Continue development of the existing Combat Robot Arena project in this folder.
Read AGENTS.md and the handover documents before editing. This is a working source export, not an empty starter.

Read, in order:
1. handover/START_HERE.md
2. handover/CURRENT_REQUIREMENTS.md
3. handover/ARCHITECTURE.md
4. handover/DO_AND_DO_NOT.md
5. handover/TEST_PLAN.md
6. handover/ROBOT_SPECIFICATIONS.json
7. handover/VISUAL_REFERENCES.md and the supplied reference images.
8. The source and focused test files relevant to my next request.

First inspect the working tree. Preserve unrelated edits. Confirm the bundled Node runtime and dependencies are present.
Use the supplied local server and build scripts. Do not depend on ChatGPT Sites or other cloud hosting.
Do not run npm ci if this offline package already contains node_modules. Do not update dependency versions without a specific need.

Perform my requested change. If I have not supplied a new feature, verify this handover and fix proven package/runtime defects only.
Do not invent a feature backlog or rebuild all robot models as a default first action.
Investigate old failures against current requirements; historical docs are not the latest specification.

Preserve all 11 robots, the 1,200 chassis HP rule, physical motor limits, contact energy accounting, local assets and saved build compatibility.
Preserve Hydra Flip Assist, Minotaur physical gyro recovery, SawBlaze's two mechanisms, Quantum's fast release and two-length retreat.
Preserve battery targets for every robot and damage from valid attacks by any robot.
Keep battery positions marked as estimates where evidence is incomplete.
Keep integer-only impact numbers, seven bubble tiers, compact POV gauges and both players' controls.
Do not add hidden launch impulses, duplicated fall energy, online dependencies or fake validation results.

Before implementing, state a short plan and identify the current settings that will change.
Make focused edits. Run relevant tests, build the app and verify local assets.
If a graphics-capable browser is available, run the manual cases affected by the change.
If it is unavailable, state that limit and complete all useful checks that remain possible.

Finish with a concise report: what changed, exact numerical changes, tests run, known limits and next concrete steps.
Do not publish or change repository visibility unless my current request asks for it.
