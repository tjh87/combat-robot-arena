# Combat Robot Arena — offline Codex development package

A complete local browser game with 11 combat robots, a builder, practice, local two-player matches, AI opponents and tournaments.

## Play without internet

1. Extract the entire offline ZIP. Do not run files inside the ZIP viewer.
2. On Windows x64, double-click **START-WINDOWS.cmd**.
3. On Linux x64, run `sh start.sh`.
4. Keep the server window open. Open `http://127.0.0.1:4173/` if the browser does not open.

No account, ChatGPT Sites connection, API key, CDN or internet connection is needed for gameplay.
Use a current desktop browser with WebGL and hardware acceleration. Click the game to enable sound.
The Windows runtime is included. No administrator install is needed. Windows execution still needs a check on a Windows computer.

## Continue development

Open this folder in Codex. Paste [CODEX_CONTINUE_PROMPT.md](handover/CODEX_CONTINUE_PROMPT.md).
For a complete build instruction, use [CODEX_BUILD_ALL_PROMPT.md](handover/CODEX_BUILD_ALL_PROMPT.md).
For a focused bug review, use [CODEX_REVIEW_PROMPT.md](handover/CODEX_REVIEW_PROMPT.md).
For the eight original visual examples and their intended use, read [VISUAL_REFERENCES.md](handover/VISUAL_REFERENCES.md).

- **DEVELOP-WINDOWS.cmd** starts the local development server.
- **BUILD-WINDOWS.cmd** checks TypeScript and builds `dist/`.
- **TEST-WINDOWS.cmd** checks the build and local server.
- `TEST-WINDOWS.cmd --physics` also runs the core, battery and gyro checks.

Stop the play server before starting the development server. Both use port 4173.
Source edits do not change the packaged app until you build again.

## Read in this order

1. [START_HERE.md](handover/START_HERE.md)
2. [CURRENT_REQUIREMENTS.md](handover/CURRENT_REQUIREMENTS.md)
3. [ARCHITECTURE.md](handover/ARCHITECTURE.md)
4. [OFFLINE_SETUP.md](handover/OFFLINE_SETUP.md)
5. [TEST_PLAN.md](handover/TEST_PLAN.md)
6. [DO_AND_DO_NOT.md](handover/DO_AND_DO_NOT.md)

`handover/ROBOT_SPECIFICATIONS.json` contains values exported from the actual game code.
The old `docs/` files are development history. Some contain old settings or old test results.
The current requirements and source code take priority over those old files.

## GitHub source versus offline ZIP

The repository contains source, game assets, tests, prompts and launch scripts.
The full offline ZIP also contains `dist/`, `node_modules/` and portable runtimes.
These generated folders are excluded from normal Git commits. Attach the full ZIP to a GitHub Release.
A normal Git clone needs one online `npm ci`, then `npm run build`. The full ZIP does not.

See [GITHUB_PUBLISH.md](handover/GITHUB_PUBLISH.md) for publication and release instructions.
See [THIRD_PARTY_NOTICES.md](handover/THIRD_PARTY_NOTICES.md) for asset and dependency notes.

The ZIP includes `handover/FILE_MANIFEST.json`, with a SHA-256 checksum for each included file except the manifest itself.
Run `node scripts/verify-manifest.mjs` before editing to check the extracted copy.
Changes made during development will correctly change those checksums.
