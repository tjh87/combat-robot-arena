# Instructions for Codex

Work in this standalone project. The user moved it away from ChatGPT Sites.

## Read first

Read `handover/START_HERE.md`, `handover/CURRENT_REQUIREMENTS.md`, `handover/ARCHITECTURE.md`, `handover/DO_AND_DO_NOT.md` and `handover/TEST_PLAN.md`.
The current user request takes priority. Then follow these files and the current source.
Treat older `docs/` updates and reports as history. Do not restore old settings from them.

## Work rules

- Preserve the existing game. Do not replace it with a new starter or a mock-up.
- Keep the app playable offline. Use local images, audio, fonts, modules and physics WASM.
- Do not add Sites, remote APIs, login, analytics, subscriptions or cloud storage without a new user request.
- Do not fetch packages or reference pages when the user requires offline work.
- Preserve lockfile versions. The Windows ZIP already contains build dependencies and Windows x64 tools. The optional combined package also includes a Linux runtime.
- Do not run `npm ci` in the full offline ZIP unless online dependency replacement is intended.
- Use the supplied Node scripts. They do not require operating-system-specific npm command shims.
- Use SI units in physics. Preserve real contact forces, shared energy budgets and finite motor work.
- Do not convert physical gyroscopic recovery into teleporting, a pose reset or added launch torque.
- Keep all 11 stock robots, game modes, settings, builder persistence, import compatibility and replay features.
- Keep robot names and weapon names readable, distinct, and clear of panel borders.
- Do not add words to damage bubbles. Display integer damage with a minimum positive label of 1.
- Do not invent measured battery coordinates or weapon specifications. Label game estimates.
- Fix a proven defect before broad refactoring. Add a regression check when it protects meaningful behavior.
- Run relevant checks. Do not report old JSON reports as tests run in the current session.
- Report changed files, numerical setting changes, checks passed, and remaining limitations.
- For every change, push the finished source to the private GitHub repository, wait for the linked Vercel production deployment to be Ready, verify the deployed commit, and give the user its unique Vercel deployment URL. Fix deployment failures and retry before reporting completion.
- Keep `main` connected to the existing `combat-robot-arena-live` Vercel project. Do not claim a deployment URL is access restricted unless Vercel protection is enabled.
- Do not publish, create releases, change visibility or send messages unless the current request authorizes it.
- Never commit secrets, local credentials, runtime caches or browser profiles.

## Commands

`node scripts/build.mjs` builds the game.
`node scripts/serve.mjs` serves the built app on localhost.
`node scripts/dev.mjs` runs the development server.
`node scripts/verify.mjs` verifies the offline app and server.
`node scripts/verify.mjs --physics` also checks core, battery and gyro behavior.
Use `runtime/windows-x64/node.exe` if Node is not installed. A Linux runtime is included only in the optional combined package.
Read `WINDOWS_SETUP.md` before installing anything. Keep `tjh87/combat-robot-arena` private.
