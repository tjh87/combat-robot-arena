# Combat Robot Arena — project-local skills

## Scope and installation status

These four skills are vendored **only inside the Combat Robot Arena repository**, under `.agents/skills/`. They are available to Manus when working on this repository through its `AGENTS.md` loading instructions. They have not been installed into the account-wide Manus skill library or the global `/home/ubuntu/skills/` directory.

This task currently has no native Manus Project binding. Accordingly, this is a **repository-local installation**, not a claim of native Manus Project skill registration or automatic account-wide activation. A separate native Project binding would be needed to manage them through native project skill settings.

## Installed skills

| Skill | Load when working on | Local entry point |
|---|---|---|
| Physics tuning | Fixed steps, interpolation, collision groups, CCD, joint stability, jitter or tunneling | `.agents/skills/physics-tuning/SKILL.md` |
| Game feel | Impact lights, sparks, feedback intensity, hit audio, transient visual effects and reduced-motion behavior | `.agents/skills/game-feel/SKILL.md` |
| Game AI | Robot decisions, steering, target selection, navigation and stuck behavior | `.agents/skills/game-ai/SKILL.md` |
| Behavior trees / utility AI | Utility scoring, response curves, hysteresis, decision cadence, interruptibility and reusable behavior logic | `.agents/skills/ai-behavior-trees-utility-ai/SKILL.md` |

Each complete skill folder includes its upstream `references/` files. Load a skill's entry point first, then only the referenced files needed for the current change. Related skills mentioned by upstream are not installed unless listed above; do not assume they exist.

## Project-specific application

- Apply these instructions only to this game repository, not unrelated projects or account-wide Agent profiles.
- Treat the current user's request, approved design decisions and existing mechanics as authoritative. Skill examples are guidance, not authorization to change gameplay.
- Adapt engine-neutral advice to **TypeScript, Three.js and Rapier**. Godot/Unity/C# examples are not this project's runtime APIs.
- Preserve the existing **240 Hz fixed-step simulation**, SI units, contact forces, finite energy/work budgets, shared collision masks and rendering interpolation. Example upstream 50–60 Hz values do not replace the game's established timestep.
- Keep feedback independent of authoritative simulation and network timing. Installing Game Feel does **not** authorize hit-stop, artificial knockback, screen shake, new flashing or input-blocking effects. Preserve the approved stable Brawl camera and reduced-motion behavior unless the user requests a change.
- Preserve usual damage, knockout and recovery rules. Skills do not authorize restoring genuinely eliminated robots or adding power/HP to disabled ones.
- Preserve current game modes, robot roster, player input responsiveness, mobile layout and offline operation. Keep player input priority over Brawl automatic recovery.
- Reuse the existing AI and its decision cadence where practical. Profile a demonstrated problem before introducing a new behavior-tree framework. Avoid per-tick allocations and oscillating target/state choices.
- Installing guidance does not authorize gameplay changes, pushing commits, publishing or deployment. Keep commits local under the user's current instruction.

## Source and validation

- Upstream: https://github.com/gamedev-skills/awesome-gamedev-agent-skills
- Pinned upstream commit: `0a70cfc64672d512c5b5b6006b5dcb5cf90dbdbd`
- License: Apache-2.0; retained at `.agents/skills/LICENSE` with upstream `.agents/skills/NOTICE`.
- Upstream skill and reference contents are unchanged.
- `.agents/skills.lock.json` records source URLs, the pinned commit and SHA-256 hashes for every installed skill/reference file.
- All four skill entry points passed the skill validator; installed files were byte-compared against the pinned upstream checkout.

## Maintenance

Do not silently refresh these skills from upstream. Review an explicitly requested update, preserve licensing and provenance, and rerun validation and checksums. Do not move or symlink these folders into a global skill directory, or add account-wide skill bindings, without a separate request.
