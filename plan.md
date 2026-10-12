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

- Model weapon audio from the already-simulated rotor RPM, configured tooth count, motor ratio, power draw, and an audio-only acceleration estimate. Retain procedural voices for all profiles; for Hypershock's vertical-disc profile, use the user-approved Magnetar recordings: clip 01 as a spin-up cue, clip 02 as the high-speed loop, and clip 03 as the load/RPM-variation loop. For Deep Six and Minotaur only, use the approved Deep Six start, full-speed loop, and coast-down clips; Minotaur retains its own synthesized motor layers and gets a gain match for the shared recorded loop. Select the recorded loop from actual simulated speed/load, adjust its playback rate with actual rotor RPM, create seamless loop buffers in memory, and fall back to the existing procedure if a sample is unavailable. Audio remains presentation-only and does not alter physics, energy, damage, or replay state.
- Make impact playback respond to both the existing physical contact energy and recorded module HP loss. Greater received damage adds a stronger, longer, lower-bodied hit treatment while material selection, voice limits, replay timing, and the existing local steel/landing recordings remain intact.
- Drive all existing weapon-exposure families from one speed profile. Low RPM keeps teeth readable, mid RPM uses a short angular exposure, and high RPM reaches a capped tooth-pitch exposure; reduced-motion remains blur-free. For Deep Six, use the user-selected concept 1: a soft translucent copper/amber partial sweep around a clear hub, with its arc, opacity, and visible rotation driven by actual simulated RPM and capped at 300 degrees for a stronger trail. Anchor the overlay to the chassis frame while rotating the sweep about the weapon axis in the correct spin direction. The physical rotor transform, hit timing, and replay frame data stay unchanged.
- Start every player tournament bout through the exact existing three-amber / green **FIGHT!** countdown, including its HUD and synthesized countdown tones. Computer-only tournament simulation remains background-only and unchanged.
- Use the user-provided industrial arena artwork only as local top-bar branding and a favicon. Refresh non-match navigation, selection cards, opponent choice, saved-build entry, and tournament entry surfaces around a dark foundry/amber presentation without replacing menu semantics, keyboard access, local persistence, or offline availability.

### Combat debris and menu label correction

- Suppress every airborne component visual: no HP-loss shard spray, no rendered detached-armour body, and no replay rendering of detached component bodies. Preserve module failure, collider removal, mass accounting, recorded simulation state, hit effects, sparks, smoke, replays, local saves, and all physical combat behavior; this is a presentation-only removal rather than a hidden physics change.
- Correct the Quick Fight / Local Ready eyebrow using an explicit two-column baseline-aligned layout with stable line height. Preserve the existing words, local-ready status, narrow-screen hiding behavior, navigation actions, and keyboard accessibility.

### Online robot picker density

- Present the existing 11 online robot buttons in a scoped, compact three-column grid with local portraits, an active-selection treatment, one-line robot names, lazy images, a bounded scroll area, native button focus, and the same `data-online-robot` controls. Apply the presentation both before room creation and while a lobby is open; do not alter room messages, robot configuration, ready state, saved robots, offline selection, networking, or persistence.

### Tournament contender selection

- Replace the Foundry Cup's single, inherited contender preview with a dedicated horizontal tile rail containing every stock robot and its locally bundled portrait. A player selects exactly one contender before bracket generation; the choice receives an explicit active state, native button focus, `aria-pressed` state, and a live selected-contender summary.
- When the player enters from a custom build, retain that build as an additional custom contender tile. Starting the cup commits only the chosen contender, while the existing seven distinct AI opponents, bracket seeding, countdown, repairs, damage carry-over, offline tournament simulation, physics, and controls remain unchanged.

### Tournament difficulty and broadcast HUD scale

- Add an explicit Easy / Medium / Hard selector to the Foundry Cup entry panel. Lock the selected setting into the tournament, show it in the bracket header, and propagate it to both the player's computer opponent and background computer-only bouts, including the worker and synchronous fallback. Difficulty changes AI decision parameters only; it does not change robot configurations, seeds, bracket structure, damage, timing, controls, or physics.
- Enlarge only the visual display of the knockout readout to twice its current numerical scale, the live match clock to three times its current numerical scale, and the bottom-left weapon instrument to twice its current panel width with proportionally larger type, dial, meter, and control labels. Preserve the three-minute match duration, ten-second knockout rule, all HUD values and semantics, and fit-safe smaller overrides for narrow/mobile layouts.

### Online copy hierarchy and Quick Fight centering

- Separate the selected-machine label, robot name, weapon family, mass/build-limit detail, and controls note into visible line-level elements in the online panel. Keep the selected local portrait, exact robot identity, weapon title, 113.398 kg limit, accessibility label, and picker behavior unchanged.
- Center the paired Quick Fight and Local Ready status words as one non-wrapping cluster in the hero row; retain the status, original words, desktop/narrow behavior, actions, and keyboard semantics.

### Reference notes

- Reviewed [BattleBots video library](https://battlebots.com/videos/), [Run Amok’s spinner FAQ](https://runamok.tech/AskAaron/spinner_FAQ.html), [Division V3 slow-motion weapon reference](https://www.youtube.com/watch?v=boaXAm54SG0), and [combat-robot sound reference](https://www.youtube.com/watch?v=7Adel6_AM1g). These informed presentation only: rising RPM tone, blade-pass/airflow texture, high-speed blur, sharp material impacts, and post-hit RPM decay.
- The approved in-game recording excerpts are from [Ranglebox – Team Pulsar’s Magnetar XR weapon-tuning video](https://www.facebook.com/ranglebox/videos/magnetar-xr-weapon-tuning/2432923390095264/), source ranges 0:05–0:08, 0:08–0:13, and 0:13–0:19; the user-selected v4 versions are used only for Hypershock's vertical-disc audio profile.
- Prepare new **preview-only** high-power vertical-bar excerpts from [Triton and Deep Six – First Spinner Test Full Speed](https://www.facebook.com/Tritonbattlebot/videos/deep-six-first-spinner-test-full-speed/466047744138592/), a Team Overboard source. Keep spin-up, full-speed, and coast-down clips separate, avoid the spoken outro, reduce background noise conservatively, and do not add them to the game until separately approved.

### Mobile browser gating and pre-fight RPM cards

- Enable the mobile landscape shell, rotate prompt, touch controls, mobile-only Local 2P restriction, home-screen full-screen request, and touch settings only for a browser that reports Android, iPhone, iPod, iPad/iPadOS, or a positive mobile-UA-data flag. A desktop browser remains on the normal browser path even if it has a touch-capable display: no mobile DOM class, overlay, orientation interception, fullscreen request, graphics cap, or mode restriction.
- Expand only the two cards shown during the existing pre-fight countdown. Each card retains the locally bundled portrait, player/name, chassis HP bar and existing telemetry, and adds the same reusable robot silhouette treatment already used by the weapon RPM instrument. The fill and colour are driven from that robot's actual simulated RPM ratio; non-spinners remain legible with a dormant silhouette. The regular active-fight cards remain compact.
- Keep silhouette paths local, deterministic, presentation-only, and free of unique duplicate DOM IDs. No robot model, weapon target RPM, physics, replay frame, input mapping, or visual asset dependency changes.

### Large player-card readability pass

- Scale the desktop player-card text, portrait, HP track, telemetry, and local silhouette/RPM instrument to approximately three times the current compact card typography. Let each side use up to 42% of the viewport width so two cards and the centre match clock remain visible at a standard 1280×720 desktop viewport.
- Keep the transparent outlined HUD treatment and all live player data. Avoid changing physical state, robot geometry, RPM values, input controls, playback, or arena camera; the change is confined to the presentation card layout.
- At narrow/mobile widths, use a smaller fit-safe override that is still materially larger and clearer than the prior six-to-ten-pixel labels, keeping both player cards and touch controls visible.

### RPM silhouette fill and colour bands

- Drive the existing local silhouette fill from the current simulated RPM ratio for each spinner, with a visible label and distinct continuous colour progression: **IDLE** blue/cyan, **SPOOL** cyan, **ENGAGE** green, **COMBAT** yellow, **HIGH** orange, then **REDLINE** red/magenta. The silhouette remains empty at zero RPM and fills from the base as the rotor gains speed.
- Apply the same ratio and color presentation to the compact weapon gauge without changing target RPMs, motor work, weapon damage, contacts, replay data, or input behavior.

### Final player health-bar and telemetry readability

- Set the live and countdown player-card chassis HP track to **42 px** on desktop and **21 px** on narrow/mobile: a 40% reduction from the prior 70 px / 35 px treatment. Keep the same simulated chassis-health percentage, P1 cyan / P2 pink identity, low-health warning, fill width, accessible progressbar semantics, and transparent HUD treatment.
- Present chassis HP and charge as a clear, high-contrast two-line telemetry block directly below the bar. Keep text inside its player card without covering the centre clock, touch controls, or arena, and do not alter health, damage, simulation, input, or replay data.

### Heavy armor impact for high-strength metal hits

- Bundle only preview **02 · Heavy armor impact** from the generated preview set as `public/audio/heavy-armor-impact.mp3`. Use it exclusively for high-strength (`crash`-class) metal impacts. Other impact classes, non-metal contacts, and landings retain their existing audio paths.
- Keep the other generated previews outside the game. Preserve the hit energy/damage mix, 12-voice cap, random variation for legacy samples, offline loading, and existing steel/landing assets; audio selection changes no physics, damage, timing, or replay data.

### Complete player-card text clarity

- Apply the same high-contrast readable hierarchy to every player-card string: player identity, HP percentage, chassis HP, charge, contact/AI/fouls status, damage warnings, RPM label, RPM value, and RPM band. On desktop, keep main values at 18–24 px and supporting labels at least 13 px; use a smaller fit-safe scale on mobile without hiding existing telemetry.
- Keep the transparent outlined HUD, existing wording, live colours, accessibility metadata, two-player and countdown geometry, touch controls, simulation, input, damage, and replay behavior unchanged.

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
| `src/touch-controls.ts` / `src/mobile.css` | Mobile-UA browser gate plus mobile-only landscape controls and scaling. |
| `src/rpm-presentation.ts` / `src/main.ts` / `src/hud-revamp.css` | Reusable silhouette fill and enlarged countdown-only player cards. |
| `src/main.ts` | Tournament countdown parity, contender selection entry flow, local logo markup, and recorded-damage audio routing. |
| `src/robot-selection.ts` / `src/tournament.css` | Reusable accessible tournament tile rail and the responsive foundry-style selection layout. |
| `src/hud-revamp.css` | Broadcast-safe match-clock, knockout, and bottom-left weapon-instrument scaling. |
| `src/sim.ts` / `src/tournament-runner.ts` / `src/tournament-worker.ts` | Tournament difficulty storage and consistent background-bout AI propagation. |
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


### Approved polycarbonate arena-wall impacts

- Use only approved preview **04 · Polycarbonate heavy thump** and **06 · Polycarbonate flex rebound** for an actual north/south/east/west arena-boundary contact when the robot was struck by its opponent within the existing 1.5-second forced-attribution window. Alternate the two recorded clips so the wall hit and panel rebound both have distinct voices.
- Tag the authoritative physics contact with its wall and recent opponent attribution; carry that optional effect metadata through recorded/replayed frames and compact online snapshots. Use the same wall-sound routing in local, tournament, replay, and online playback.
- Keep floor and shelf landings, un-attributed/self-motion wall scrapes, regular robot/weapon contacts, hazards, and all physics/damage unchanged. Only the two explicitly approved generated wall clips enter the game package; the other preview clips remain outside the game.

### Full-roster grid, tournament field size, and countout correction

- Replace the horizontal contender rail with a six-column/two-row desktop grid and four-column/three-row narrow-landscape grid. Render every stock robot (and optional custom contender) without an internal horizontal or vertical scrollbar, retain local portraits and keyboard/pressed state, and compact imagery on short landscape viewports.
- Let the player select 1, 3, or 7 AI opponents (2, 4, or 8 total entrants); these are complete single-elimination brackets without placeholder entrants or byes. Default to seven opponents. Derive round labels, bracket geometry, champion placement, final detection, repair availability, entry facts and copy from the locked field size. Preserve worker AI difficulty, countdown, distinct robots, seeded results, 900-point repairs and damage carryover. Online room capacity remains unchanged.
- Fix false immobilization countouts by measuring maximum recent controlled travel rather than endpoint displacement alone, accepting grounded powered chassis turning as movement, immediately clearing an active count on proven recovery, and clearing a stale count for a healthy upright driver who releases the controls. Rotation of a weapon alone and unpowered pushes do not qualify. Genuine 10-second immobilization, zero-chassis-health structural KO, ring-out, fouls and judging remain separate valid result conditions. Label immobilization explicitly in the finish presentation instead of implying chassis destruction.

### Mobile landscape match results

Keep desktop results unchanged. For browsers already detected as mobile, fit the landscape result modal to the dynamic viewport and safe-area insets rather than the desktop arena offsets. Reduce podium portraits, names, telemetry spacing and scoreboard typography to a legible mobile scale. Give the result content its own vertical scroll region while keeping replay/menu/rematch/continue buttons outside that scroll region with at least 40 px tap targets. Preserve every score, HP/highlight value, expandable evidence table, result action and tournament transition. Apply fit-safe sizing to online result cards and tournament victory/champion banners as well; do not alter gameplay or detection.

### Restored countdown and weapon-hit audio

Keep the previous local synthesized countdown cues: paired 480/960 Hz tones for 3-2-1 and paired 950/1900 Hz tones for FIGHT at the existing timing. Route large crash-class metal weapon hits back to the existing steel crash recordings instead of the generated heavy-armor clip. Preserve the independently approved alternating polycarbonate wall-impact clips, impact timing, material/landing handling, gain and voice limits, and all combat physics. Do not load or ship the generated countdown or heavy-armor samples.
### Mobile results confirmation

The results dialog is now structurally split into a compact action footer and a separate scroll area so standings and judging evidence cannot displace menu, replay, rematch or next-round actions. Mobile-only landscape CSS handles safe-area padding, podium and score density; online result cards and tournament champion/round banners get a compact viewport-bound treatment while desktop stays unchanged.


### Deep Six recorded weapon sounds

User requested removal of the first three seconds from Deep Six clip 05 and implementation of the full set. The trimmed 00:07–00:11 source excerpt is the Deep Six weapon-start cue, clip 06 is a seamless playback-rate-scaled loop above the existing RPM threshold, and clip 07 is a coast-down one-shot on weapon-off; starting again cancels the coast-down cue. Deep Six source attribution is in `public/audio/License.txt`; the clips ship in the offline package and fall back to the existing procedural Deep Six voice if unavailable. The Magnetar sounds remain exclusive to Hypershock.
