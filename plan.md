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
| `tests/online-core.ts` | Binary input round-trip and malformed-packet regression coverage. |
| `tests/performance.ts` | Timing-buffer and impact-light behavior checks that do not claim GPU measurement. |

## Constraints

- Do not add remote assets, telemetry, authentication, subscriptions, a new framework, or package upgrades.
- Preserve the existing server-authoritative model, input bounds/rate limits, stale-input expiry, reconnect fencing, and room recovery.
- Preserve local/offline play and all existing robots, modes, saves, builder imports, replays, and physics rules.
- Validate with TypeScript, focused online/performance tests, build, and package verification. Real internet latency, production WSS behavior, WebGL quality, audible quality, and Windows execution remain target-machine checks.
