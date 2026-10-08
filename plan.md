# Combat Robot Arena — Graphics, Network, and Stability Upgrade

## Objective

Improve the existing Three.js/Rapier combat game without changing its fixed 240 Hz authoritative physics, 11-stock-robot roster, offline modes, stored builds, or existing controls. The online work minimizes **client-added** latency and bandwidth while preserving server authority, robust reconnect behavior, and an actionable fallback for older deployed services.

## Implementation approach

### Network transport and responsiveness

- Add a compact, validated binary input transport for live controls. It carries the match UUID, sequence number, normalized drive axes, and idempotent action IDs in a fixed, bounded layout.
- Negotiate the new input transport through the existing welcome message. New clients use it only when the service advertises support; older services continue to receive the existing JSON input messages.
- Keep the current 60 Hz control cadence and immediate send-on-key-change behavior. This avoids a client-side input queue while reducing the per-packet payload and JSON work.
- Make action intake transactional: reject overflow packets before they mutate sequence or queue state, cap every seat at 64 pending actions, and clear unexecuted actions when the control stream becomes stale.
- Keep snapshots, damage, results, room transitions, and physics authoritative on the server. No client-side collision, hit, score, or result is trusted.
- Add a small adaptive snapshot timing buffer driven by observed arrival jitter. On stable links it renders near the 30 Hz snapshot edge with a lower delay; it expands within a strict cap when jitter rises to prevent visible snap-back. Local prediction remains limited to the owned robot and is never treated as authoritative.
- Surface a compact connection-health state (smoothed round-trip time, jitter, and display buffer) in the online HUD for diagnosis without affecting game flow.

### Graphics and combat presentation

- Add a short, pooled, non-shadow-casting impact light to the existing spark path. It creates a steel-reflection pulse at the authoritative contact point, scales only from recorded impact energy, and fades in the normal render update.
- Keep the existing color management, adaptive resolution, 60 FPS gameplay presentation cap, reduced-motion behavior, and 240 Hz physics untouched. The new light does not add a post-processing pass or create physics behavior.
- Preserve the industrial broadcast-arena look rather than adding unrelated art or external assets.

### Wall impact readability and shared presentation efficiency

- Extend cosmetic, replay-safe wall damage with deterministic **shear** patterns for glancing impacts and denser **shatter** patterns for the heaviest impacts, while retaining hairline, starburst, branching, and fracture patterns for the existing energy bands. Pattern choice may use only recorded contact energy, impulse, direction, and deterministic seed; it never changes wall collision geometry, damage, or physics.
- Keep the existing wall limits: 200 J / 20 N·s visual thresholds, 0.25-second local repeat suppression, 48 stored cracks, 72 segments per crack, and one bounded line buffer / draw call. Older replay crack records continue to resolve through their original energy-based fallback.
- Remove avoidable presentation-only allocations from body interpolation and front-marker orientation, and skip idle smoke buffer uploads while preserving active smoke movement, reduced-motion behavior, shadows, camera modes, menus, builder, practice, local two-player, AI, online replica display, tournaments, and replays.
- Preserve the existing adaptive resolution, frame gates, fixed 240 Hz simulation, input rate, gameplay timing, collision response, robot behavior, and game modes. Smoothness changes must only affect visual scheduling and resource use.

### Weapon presentation, tournament start, and menu identity

- Model weapon audio from the already-simulated rotor RPM, configured tooth count, motor ratio, power draw, and an audio-only acceleration estimate. The local procedural voice will rise in pitch, brightness, blade-pass pulse, and airflow as stored speed rises; it will settle into a high-RPM warning tone and naturally fall after the simulated rotor loses RPM. No new audio assets, motors, energy budgets, or damage calculations are introduced.
- Make impact playback respond to both the existing physical contact energy and recorded module HP loss. Greater received damage adds a stronger, longer, lower-bodied hit treatment while material selection, voice limits, replay timing, and the existing local steel/landing recordings remain intact.
- Drive all existing weapon-exposure families from one speed profile. Low RPM keeps teeth readable, mid RPM uses a short angular exposure, and high RPM reaches a capped tooth-pitch exposure; reduced-motion remains blur-free. The physical rotor transform, hit timing, and replay frame data stay unchanged.
- Start every player tournament bout through the exact existing three-amber / green **FIGHT!** countdown, including its HUD and synthesized countdown tones. Computer-only tournament simulation remains background-only and unchanged.
- Use the user-provided industrial arena artwork only as local top-bar branding and a favicon. Refresh non-match navigation, selection cards, opponent choice, saved-build entry, and tournament entry surfaces around a dark foundry/amber presentation without replacing menu semantics, keyboard access, local persistence, or offline availability.

### Combat debris and menu label correction

- Suppress every airborne component visual: no HP-loss shard spray, no rendered detached-armour body, and no replay rendering of detached component bodies. Preserve module failure, collider removal, mass accounting, recorded simulation state, hit effects, sparks, smoke, replays, local saves, and all physical combat behavior; this is a presentation-only removal rather than a hidden physics change.
- Correct the Quick Fight / Local Ready eyebrow using an explicit two-column baseline-aligned layout with stable line height. Preserve the existing words, local-ready status, narrow-screen hiding behavior, navigation actions, and keyboard accessibility.

### Online robot picker density

- Present the existing 11 online robot buttons in a scoped, compact three-column grid with local portraits, an active-selection treatment, one-line robot names, lazy images, a bounded scroll area, native button focus, and the same `data-online-robot` controls. Apply the presentation both before room creation and while a lobby is open; do not alter room messages, robot configuration, ready state, saved robots, offline selection, networking, or persistence.

### Online copy hierarchy and Quick Fight centering

- Separate the selected-machine label, robot name, weapon family, mass/build-limit detail, and controls note into visible line-level elements in the online panel. Keep the selected local portrait, exact robot identity, weapon title, 113.398 kg limit, accessibility label, and picker behavior unchanged.
- Center the paired Quick Fight and Local Ready status words as one non-wrapping cluster in the hero row; retain the status, original words, desktop/narrow behavior, actions, and keyboard semantics.

### Reference notes

- Reviewed [BattleBots video library](https://battlebots.com/videos/), [Run Amok’s spinner FAQ](https://runamok.tech/AskAaron/spinner_FAQ.html), [Division V3 slow-motion weapon reference](https://www.youtube.com/watch?v=boaXAm54SG0), and [combat-robot sound reference](https://www.youtube.com/watch?v=7Adel6_AM1g). These informed presentation only: rising RPM tone, blade-pass/airflow texture, high-speed blur, sharp material impacts, and post-hit RPM decay. They do not supply assets or change game simulation.

## Design direction

- **Design movement:** Broadcast-grade industrial robot sport — machined steel, warning-light accents, and readable competition telemetry.
- **Core principles:** physical credibility, fast combat legibility, scalable performance, and no cosmetic effect that masks game state.
- **Color philosophy:** cool steel and dark foundry neutrals frame team-blue/team-red identity; brief warm impact light makes force readable at the point of contact.
- **Layout paradigm:** retain the in-arena HUD and compact side-panel control surface; connection telemetry stays in the existing lower combat bar instead of becoming a dashboard.
- **Signature elements:** low-glare steel materials, directional sparks, and now short-lived impact illumination.
- **Interaction philosophy:** controls remain direct and immediate; online state reports connection quality without interrupting a match.
- **Animation:** impact illumination decays quickly, respects reduced motion, and never persists after the authoritative event.
- **Typography system:** retain the project’s existing heavy sans display and monospace instrument hierarchy for machine labels and network values.
- **Brand essence:** A physically grounded browser arena for competitive, readable heavyweight robot combat. **Personality:** mechanical, focused, high-energy.
- **Brand voice:** concise operational language — “LIVE · 34 ms” and “LINK STABLE · 42 ms buffer.”
- **Wordmark & logo:** retain the existing Combat Robot Arena mark and foundry identity.
- **Signature brand color:** the existing electric cyan telemetry accent.

## Project structure

| Path | Responsibility |
| --- | --- |
| `src/online/protocol.ts` | Shared frame protocol plus compact control encode/decode validation. |
| `src/online/client.ts` | Capability negotiation and resilient control transport selection. |
| `src/online/timing.ts` | Pure adaptive snapshot buffer estimator used by the online renderer. |
| `src/online/ui.ts` | Snapshot timing, prediction coordination, and health telemetry display. |
| `src/online/online.css` | Legible, non-obstructive connection-health styling. |
| `server/gateway.ts` | Binary-control acceptance, bounded validation, and legacy JSON compatibility. |
| `src/render.ts` | Pooled impact light visual integrated into the existing spark/render lifecycle. |
| `src/wall-damage.ts` / `src/wall-fracture.ts` | Deterministic cosmetic pattern selection and bounded line generation for wall impacts. |
| `src/wall-cracks.ts` | One fixed GPU buffer and one draw call for all visible wall damage. |
| `src/weapon-audio.ts` / `src/audio.ts` | RPM, tooth-pass, acceleration, airflow, and damage-aware procedural sound profiles. |
| `src/weapon-blur.ts` / weapon exposure modules | Shared speed profile for teeth-readable, partial, and capped full-exposure blur. |
| `src/main.ts` | Tournament countdown parity, local logo markup, and recorded-damage audio routing. |
| `public/branding/` | Derived local logo and favicon files from the user-supplied artwork. |
| `src/damage-debris.ts` / `src/render.ts` | Component-debris presentation policy; physical detached-component simulation remains unmodified. |
| `tests/online-core.ts` | Binary input round-trip and malformed-packet regression coverage. |
| `tests/gameplay.ts` / `tests/wedge-update.ts` | Sound/blur profile and start-sequence behavior checks. |
| `tests/performance.ts` / `tests/wall-cracks.ts` | Presentation-resource and deterministic wall-pattern checks that do not claim GPU measurement. |

## Constraints

- Do not add remote assets, telemetry, authentication, subscriptions, a new framework, or package upgrades. The supplied logo is copied into local build assets.
- Preserve the existing server-authoritative model, input bounds/rate limits, stale-input expiry, reconnect fencing, and room recovery.
- Preserve local/offline play and all existing robots, modes, saves, builder imports, replays, and physics rules.
- Validate with TypeScript, focused online/performance tests, build, and package verification. Real internet latency, production WSS behavior, WebGL quality, audible quality, and Windows execution remain target-machine checks.
