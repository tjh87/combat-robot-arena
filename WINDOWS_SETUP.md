# Windows: install, play, build and continue in Codex

## 1. What you need to install first

The **full Windows release ZIP** already includes the game, Node.js 24.21.0, npm, the locked build dependencies and Windows x64 native build tools. You can play, edit source, rebuild and run the included checks without downloading packages.

| Purpose | Required on your PC | Already included / optional |
| --- | --- | --- |
| Play the full ZIP | Windows 10/11 **x64**, a browser supporting WebGL 2, working graphics drivers | Edge can be used if already installed. Windows Extract All is enough to unpack the ZIP. |
| Build or run tests from the full ZIP | The same PC; a terminal for optional commands | Portable Node, npm, TypeScript, Vite, esbuild, Rollup and installed dependencies are included. No system Node install required. |
| Edit source yourself | A text editor | VS Code is optional; use any editor you prefer. |
| Continue with Codex CLI | Install Codex separately while online; sign in through its normal flow | Instructions below. Codex and its AI model are not inside this ZIP. |
| Clone and build source from GitHub | Git for Windows, Node.js 22.12+ with npm; internet for the first dependency install | The repository's automatic “Source code (zip)” download omits portable tools and dependencies. |
| Push commits or publish releases | Git for Windows; GitHub CLI for the supplied publication script; GitHub authentication | Not required for local play or local builds. Keep this repository private. |
| Make a refreshed offline ZIP | Python 3.10+ | Only the archive-preparation scripts need Python. No Python packages required. |

The bundled target is Windows x64, not Windows 32-bit or native ARM64. Use a local folder with about 1 GB free for the ZIP, extraction and build output; allow more for screenshots and backups. This is a storage allowance, not a measured performance requirement.

No Docker, WSL, Visual Studio C++ build tools, database, API key or web-hosting account is required for the packaged game. The native build binaries are already present. Graphics performance depends on the machine; no minimum frame rate has been certified.

Official download pages, needed only when installing optional or missing tools:

- [Node.js](https://nodejs.org/en/download) — Windows x64 installer, including npm, for a source-only clone or the optional Codex npm installation below.
- [Git for Windows](https://git-scm.com/downloads/win) — source control and GitHub sync.
- [VS Code](https://code.visualstudio.com/download) — optional editor.
- [Codex CLI setup](https://developers.openai.com/codex/cli/) — install and authenticate the local coding client.
- [GitHub CLI](https://cli.github.com/) — optional release publication.
- [Python for Windows](https://www.python.org/downloads/windows/) — optional ZIP regeneration.

## 2. Extract and play

1. Download **Combat_Robot_Arena_Windows_Offline_Codex.zip** from the private repository's release assets. Avoid the automatic source-code archive when you want the complete offline copy.
2. Right-click the ZIP → **Extract All**. A short location such as `C:\Games` is convenient. The extracted project root is `C:\Games\combat-robot-arena`, containing `package.json` and the four Windows launchers.
3. Double-click **START-WINDOWS.cmd**. Leave its terminal open.
4. Open `http://127.0.0.1:4173/` if the browser does not open automatically. Click inside the game to enable sound.
5. Stop the server with Ctrl+C when finished. Use the same browser, address and port to retain local saves.

Do not open `dist/index.html` directly, run the launcher inside the ZIP viewer, or move `runtime`, `node_modules` or `public` away from the project. You may disconnect the internet once the complete ZIP is on the PC.

## 3. Build and run from PowerShell

Open PowerShell in the extracted project folder. These commands use included tools:

```powershell
Set-Location "C:\Games\combat-robot-arena"
.\runtime\windows-x64\node.exe --version
.\runtime\windows-x64\node.exe scripts\verify-manifest.mjs
.\START-WINDOWS.cmd
```

The first command should report **v24.21.0**. Verify the manifest before editing or rebuilding; later legitimate edits change checksums.

To edit with automatic browser reload, stop the play server and run:

```powershell
.\DEVELOP-WINDOWS.cmd
```

After editing, stop development with Ctrl+C, then run these commands one at a time:

```powershell
.\BUILD-WINDOWS.cmd
.\TEST-WINDOWS.cmd
.\TEST-WINDOWS.cmd --physics
.\START-WINDOWS.cmd
```

The physics check is an additional focused check for core simulation, batteries and gyroscopic recovery. The TEST launcher pauses so you can read its result. Both play and development use port 4173; run one at a time. PLAY serves the last `dist` build, so rebuild to include source changes.

**Do not run `npm ci` or delete `node_modules` in the full offline ZIP.** The dependencies are already installed. `npm ci` replaces them and needs package access.

## 4. Install Codex and continue locally

This route uses Codex CLI in a Windows terminal and does not need a ChatGPT Sites project. Install the tools while online:

1. If you do not already have Node/npm on your PATH, install the current supported Node.js x64 LTS from the official page above. This extra system install is for the npm-based Codex setup; the game launchers continue using their bundled Node.
2. Reopen PowerShell. Run `node --version` and `npm.cmd --version`.
3. Install and check the Codex CLI:

```powershell
npm.cmd install -g @openai/codex
codex.cmd --version
Set-Location "C:\Games\combat-robot-arena"
codex.cmd
```

4. Follow Codex's sign-in flow. Keep credentials out of this project and out of prompts.
5. Paste the entire [continuation prompt](handover/CODEX_CONTINUE_PROMPT.md), followed by your next requested change. All four prompt files begin with installation and Windows setup instructions.
6. Ask Codex to use the included Windows Node executable for project commands and to preserve the pinned dependencies. Review the resulting diff and verification report.

If you use an installed Codex-capable editor extension instead, open the same project folder and paste the same prompt. An editor is optional for CLI use. Using `.cmd` names avoids the common PowerShell restriction on npm-generated `.ps1` shims; no machine-wide execution-policy change is needed for these commands.

The **game and build tools** work disconnected. A hosted Codex model still needs internet and a supported account or other configured authentication. A completely disconnected AI workflow needs a separately installed local model/client. Neither is bundled, and these prompts do not provide offline model access.

## 5. If you used a Git clone or GitHub source archive

This is a different route from the complete release ZIP. Install Git (for cloning) and Node.js 22.12+ with npm, then while online:

```powershell
git clone https://github.com/tjh87/combat-robot-arena.git
Set-Location combat-robot-arena
npm.cmd ci
npm.cmd run build
npm.cmd start
```

Authenticate to access the private repository. The launchers can fall back to system Node when a portable runtime is absent. The source archive itself does not contain everything for a first offline build.

## 6. Save progress and make another Windows ZIP

Use Git checkpoints or another backup before changing the game. Do not overwrite an existing Git remote or initialize inside an unrelated repository. `handover/GITHUB_PUBLISH.md` covers connecting the extracted package to the existing private repository.

With Python installed, after BUILD and TEST pass:

```powershell
py -3 scripts\package-offline.py --target windows
```

The script writes `Combat_Robot_Arena_Windows_Offline_Codex.zip` and its `.sha256` file beside the project folder. It includes source, screenshots, references, prompts, local game assets, `dist`, installed dependencies and the Windows runtime. It excludes Git metadata, environment files and caches. It regenerates the per-file manifest and verifies ZIP CRCs. `--target all` additionally requires a prepared Linux x64 runtime.

## 7. Troubleshooting and current validation limits

| Problem | Check |
| --- | --- |
| Blank arena / WebGL context error | Enable browser hardware acceleration, update the GPU driver and restart the browser. The game requires WebGL 2. |
| Window closes or command fails | Open PowerShell in the project and run the launcher there to keep the error visible. Check full extraction. |
| Port occupied | Close the other game/development server. For a separate temporary port use `.\runtime\windows-x64\node.exe scripts\serve.mjs --port=4174`. This creates a different browser storage origin. |
| Vite, tsx, esbuild or Rollup missing | Restore `node_modules` from the full Windows release ZIP. Do not try an online installer while disconnected. |
| Windows native module cannot load | Check x64 architecture and the error text. The bundled PE binaries were inspected, but native Windows execution remains a target-PC check. |
| No sound | Click the game; check master/SFX volume and browser sound permissions. |
| Old build still appears | Run BUILD again and refresh the browser. |
| Codex command missing | Reopen the terminal after its install; check the official Codex setup page and npm global executable PATH. |

Package integrity, production build and local server checks are separate from graphics and audible playback. Read `handover/WINDOWS_PACKAGE_VALIDATION.json` for this release's actual checks, and [TEST_PLAN.md](handover/TEST_PLAN.md) for the target-PC checklist. The README screenshots are clearly labeled UI previews; their capture environment lacked WebGL.
