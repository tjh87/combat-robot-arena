# Offline setup and troubleshooting

## Windows x64

The full ZIP includes Node.js v24.21.0, npm, locked build dependencies and Windows native build modules.
Extract everything before running a launcher. Keep `src`, `dist`, `public`, `scripts`, `node_modules` and `runtime` together.
Use `START-WINDOWS.cmd` to play. Use `DEVELOP-WINDOWS.cmd` to edit with live reload.
Use `BUILD-WINDOWS.cmd` after edits. Then restart the play launcher.
Use `TEST-WINDOWS.cmd` for package checks. Add `--physics` for the selected physics suites.
No system-wide installation or administrator account is required by these launchers.
This package contains x64 binaries. It does not contain native Windows ARM64 or 32-bit runtimes.

## Linux x64

Use `sh start.sh`. The launcher restores the Node executable flag if the ZIP tool removed it.
For development:

```sh
chmod +x runtime/linux-x64/bin/node
export PATH="$PWD/runtime/linux-x64/bin:$PATH"
node scripts/dev.mjs --open
```

Run `node scripts/build.mjs` and `node scripts/verify.mjs` with the same PATH.
Use a ZIP tool that preserves executable flags. If a build reports permission denied for esbuild,
run `chmod +x node_modules/@esbuild/linux-x64/bin/esbuild` and build again.
A compatible Linux system is required. The included Node build is not a universal binary for old distributions.

## Other systems

macOS and ARM are not bundled targets. Install a supported Node release and run `npm ci` while online.
After building, the game still runs locally. Do not copy Windows native modules into a different architecture and claim support.

## Git clone instead of full ZIP

A clone excludes generated runtimes, `node_modules` and `dist`.
While online, install Node 22.12 or newer, then run:

```sh
npm ci
npm run build
npm start
```

Use the full release ZIP when you need a ready offline copy.
The `scripts/prepare-offline.py` helper can regenerate included x64 runtimes and extra Windows modules while online.
It checks Node SHA-256 sums and npm lockfile integrity before unpacking.

## Repackage after development

Build and verify the app first. With Python 3 installed, run `python3 scripts/package-offline.py`.
On Windows, use `py scripts/package-offline.py` if that is the installed Python launcher.
The script creates a full ZIP in the parent folder, checks its CRCs, and writes a separate SHA-256 file.
It refreshes the included file manifest. Do not replace source Git commits with repeated binary ZIP commits.
For a clean extraction, run `node scripts/verify-manifest.mjs` before editing or rebuilding.
That checks the original packaged files, including local dependencies and runtimes.

## Common faults

| Symptom | Action |
| --- | --- |
| A window closes immediately | Run the command in a terminal and read the error. Confirm the ZIP was fully extracted. |
| Port 4173 is in use | Stop the other play or development server. Use `node scripts/serve.mjs --port=4174` only if needed. |
| Settings appear missing | Use the same browser and `http://127.0.0.1:4173/`. A different host or port has different storage. |
| Source edits do not appear | Rebuild, then refresh the browser. The play server serves `dist`, not `src`. |
| Missing Vite, TypeScript or tsx | Restore `node_modules` from the full ZIP. Do not run an online installer when disconnected. |
| Wrong native module | Confirm x64 Windows/Linux. Restore the packaged native modules. Other targets need an online install. |
| Black arena or WebGL error | Enable browser hardware acceleration, update the graphics driver and test a current browser. |
| No sound | Click the game, check master/SFX levels and browser sound permission. |
| Reference pages do not open | Those links need internet. Gameplay does not need them. |
| Saved Sites builds are absent | Export build codes from the original origin and import them locally. Storage does not transfer automatically. |

## Do not do these

Do not open `dist/index.html` directly with `file://`.
Do not bind the local game to every network interface by default.
Do not disable browser security to load modules.
Do not add service-worker caching without a clear update and invalidation design.
Do not delete the installed dependencies and then expect an offline `npm ci` to restore them.
Do not promise offline Codex model access. This package supplies the game and prompts, not the AI service.
