# 🪟 Windows offline build and Codex development package

- 🤖 Complete editable Combat Robot Arena: 11 stock robots, custom builder, AI, local two-player, practice and tournaments.
- 📦 Windows x64 Node.js 24.21.0, npm, installed dependencies, native build tools, built game and local assets included.
- 🧠 Four detailed Codex prompts, each starting with installations, build/run commands and offline rules.
- 🛠️ Full WINDOWS_SETUP.md, one-click play/develop/build/test launchers, current requirements and do/don't rules.
- 📸 README with game description, emojis, roster, controls and three explicitly labeled interface screenshots.
- 🔒 Source and release remain in the private tjh87/combat-robot-arena repository.
- ✅ ZIP CRC validation, per-file SHA-256 manifest and a separate checksum for the download.
- Windows launchers preserve the actual exit code after displaying errors.
- Fresh extraction passed all 6,165 per-file checksums, a production rebuild and local server/asset verification using Linux Node; native Windows execution remains untested.
- Development server now honors explicit host/port options while keeping localhost as the default.

Extract the entire ZIP and double-click START-WINDOWS.cmd. No separate Node installation is needed for the complete package. Use BUILD-WINDOWS.cmd after source edits. Do not run npm ci in the full offline ZIP.

The game and included build tools run locally offline. Codex and AI models are not bundled; hosted AI requires internet. The Windows ZIP omits the Linux runtime; the earlier combined release is retained.

Game source and numerical physics settings were preserved. Read handover/WINDOWS_PACKAGE_VALIDATION.json for checks actually run. Native Windows execution, real WebGL graphics, audible quality and a disconnected target-PC check remain manual. Screenshot captures use the real UI with a renderer fixture because the capture browser lacked WebGL; they are not live gameplay captures.
