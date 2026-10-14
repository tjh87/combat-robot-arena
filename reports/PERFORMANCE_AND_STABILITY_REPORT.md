# Combat Robot Arena — Performance & Stability Test Report

- **Test date:** 14 October 2026
- **Revision under test:** local-only Brawl validation build; changes remain unpushed
- **Preview target:** [online WebGL preview](https://4173-iy2g4qa5twboexd3hqdx3-c388a922.sg2.manus.computer/)
**Overall result:** **MIXED** — network/authority and Brawl browser checks pass; the Brawl CPU stress test exceeds the 240 Hz step budget with 2–4 AI opponents on this sandbox. See §5.1.

> This report distinguishes deterministic simulation from an internet measurement. The jitter figures below exercise the production `SnapshotTiming` implementation with controlled arrival patterns. They establish expected client behavior, but do **not** measure a browser GPU, the user’s ISP route, Wi-Fi contention, or production Redis/Vercel latency.

## 1. Scope and environment

The preview serves the current built game plus the local authoritative online gateway. It uses an isolated local Redis instance only for the test session. It is reachable publicly over HTTPS and has been checked as follows:

| Check | Result | Evidence |
| --- | --- | --- |
| Public static route | PASS | `HTTP/2 200` from the preview URL |
| Local static route | PASS | `HTTP/1.1 200`, no-store cache policy |
| Local `/api/online?session=1` | PASS | `HTTP/1.1 200` and a scoped `cra_online` session cookie |
| Public WebSocket handshake | PASS | WSS welcome completed with protocol 1 and advertised `binary-v1` controls |
| Browser GPU / visual perception | Manual | Requires the tester’s browser and GPU |
| Real WAN/WSS latency | Manual | Requires two browser sessions on a real network |

The report covers the following upgrade mechanisms: compact capability-negotiated binary controls, JSON compatibility, adaptive snapshot timing, client prediction boundaries, authoritative input limits, stale-action clearing, render pacing/adaptive resolution, and impact-light effects.

## 2. Network design under test

| Layer | Behavior verified |
| --- | --- |
| Authoritative simulation | The server remains the sole source of physics, damage, match outcome, and snapshots at the existing 240 Hz simulation cadence. |
| Live control transport | A client uses binary controls only after the gateway advertises `binary-v1`; an older service continues to receive JSON controls. |
| Input safety | Match UUID, sequence, axes, action count, IDs, kinds, fixed binary length, and ordering are validated. Overflow packets are rejected transactionally. |
| Stability limit | A seat can hold at most 64 pending actions; stale streams clear unexecuted actions rather than letting them fire after input expiry. |
| Snapshot display | Stable links use a 42 ms display buffer rather than the prior fixed 60 ms; observed arrival variation expands the buffer up to 140 ms. |
| Prediction boundary | Only the owned robot is predicted visually; collision, hit, score, and result remain server authoritative. |

## 3. Transport payload benchmark

The payload comparison uses one real UUID, a sequence number, axes, and either no actions or two ordered actions. Values are **application payload bytes** only; WebSocket framing, client masking, TCP/IP, TLS, and retransmission overhead are excluded.

| Control shape | JSON bytes | Binary bytes | Reduction |
| --- | ---: | ---: | ---: |
| Idle drive update | 105 | 27 | 74.3% |
| Drive update with weapon + recover actions | 164 | 37 | 77.4% |

The client retains the existing immediate-send-on-change behavior and 60 Hz active control cadence. The size reduction removes JSON construction/parsing from the high-frequency path where the service advertises support; it does not claim to overcome physical network propagation time.

## 4. Simulated snapshot-jitter results

### Method

The reproducible benchmark runs **240 snapshots at 30 Hz** per scenario against the production `SnapshotTiming` class. It models a 55 ms one-way baseline solely to create a realistic arrival timeline; clock mapping means the timing estimator measures arrival *variation*, not the absolute 55 ms baseline. Two scenarios introduce an ordered stall at frame 90; queued snapshots are released as an ordered batch, matching the ordering characteristic of WebSocket/TCP.

| Scenario | Buffer min / mean / p95 / max (ms) | Final buffer (ms) | Jitter max (ms) | Recovery after stall |
| --- | --- | ---: | ---: | ---: |
| Stable 30 Hz delivery | 42 / 42.00 / 42 / 42 | 42 | 0.00 | — |
| Low consumer jitter (±4 ms pattern) | 42 / 54.70 / 56 / 56 | 55 | 4.65 | — |
| Moderate ordered 80 ms stall | 42 / 53.99 / 72 / 117 | 42 | 25.05 | 666.7 ms to ≤44 ms |
| Severe ordered 180 ms stall | 42 / 61.49 / 88 / 140 | 42 | 42.67 | 833.3 ms to ≤44 ms |

### Interpretation

- **Stable link:** client-added display delay is **42 ms**, a reduction of **18 ms (30%)** from the previous fixed 60 ms target.
- **Low jitter:** the buffer settles near **55 ms**, adding only the margin needed to smooth the deterministic ±4 ms variation.
- **Moderate stall:** the estimator expands to **117 ms**, then returns to the 42 ms floor after the stream stabilizes.
- **Severe stall:** the protection ceiling is exercised at **140 ms**. It avoids unbounded latency growth and decays back to 42 ms after recovery.
- **Important:** the test validates buffer response and bounds—not a total end-to-end input-to-photon number. Total perceived latency also includes local input scan, browser scheduling, simulation tick, physical route latency, display refresh, and monitor scan-out.

The full per-snapshot samples are retained in [network-jitter-results.json](network-jitter-results.json); a compact aggregate table is available in [network-jitter-results.csv](network-jitter-results.csv). The reproducible harness is [network-jitter-benchmark.ts](network-jitter-benchmark.ts).

## 5. Rendering and performance regressions

`npm run test:performance` completed successfully. These are deterministic correctness/cost guards, not a substitute for GPU frame-time telemetry.

| Area | Result |
| --- | --- |
| Presentation pacing | Exactly 300 draws at 30 FPS and 600 draws at 60 FPS over 10 seconds, at simulated 60, 120, and 144 Hz displays. Static screens redraw only on change. |
| Adaptive resolution | Drops to a 0.65 scale under sustained simulated load; recovers gradually to 0.70 in the recovery test. |
| Pixel budget | Medium quality remains within 1,440,000 pixels at the tested 4K/2× condition; high quality caps the pixel ratio at 1.5 in that case. |
| Geometry compaction | All 11 robots and 1,175 collision parts preserve geometry attributes while graphics buffer storage falls from 17,566,800 to 9,787,552 bytes: **44.3% lower** (7.42 MiB saved). |
| Idle fire effects | 120 inactive updates produce zero position-buffer uploads; active flames still move and light the robot. |
| Resource lifetime | Replacing a scene releases the tested instanced buffer. |
| Shadow scheduling | 60 static-menu frames trigger 1 shadow refresh; match and replay each refresh at 30 updates in the 60-frame test. |
| Impact illumination | Profile remains bounded: medium impact intensity 2.596 / distance 2.897; heavy impact intensity 4.396 / distance 4.447. It is non-shadow-casting and respects reduced-motion mode. |
| Simulation continuity | A 960-tick off-screen tournament comparison preserves exact seeded state; the unseen run stores zero replay frames. |

### 5.1 Brawl multi-robot simulation stress

The Brawl UI and physics regressions pass for 1–4 AI rivals. Before this run, the fixed-step loop was changed only to reuse per-body pre-step snapshot records and replace per-body array/callback finite checks with explicit equivalent component checks. The 240 Hz timestep, forces, AI cadence, solver, contacts, and game rules were not changed. A separate Node 22 sandbox microbenchmark used seeded stock robots, Medium AI, hazards enabled, the default 240 Hz timestep and visual-frame recording, with 120 warm-up steps followed by 840 timed `Simulation.step()` samples for each field size. The per-step budget at 240 Hz is **4.17 ms**.

| AI rivals | Robots total | P50 (ms) | P95 (ms) | P99 (ms) | Maximum (ms) | Samples over 4.17 ms | Physics faults |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 2 | 3.37 | 5.54 | 7.08 | 9.91 | 121 / 840 (14.4%) | 0 |
| 2 | 3 | 7.61 | 11.62 | 14.09 | 17.19 | 840 / 840 (100%) | 0 |
| 3 | 4 | 9.54 | 17.65 | 21.16 | 36.36 | 840 / 840 (100%) | 0 |
| 4 | 5 | 12.15 | 16.04 | 19.27 | 23.92 | 840 / 840 (100%) | 0 |

These CPU-only timings **do not establish browser frame time or end-user performance**; the sandbox CPU is not a representative phone/desktop. This run misses the interval in 14.4% of one-rival samples and every measured sample with 2–4 AI rivals. There were no simulation faults. Snapshot-state reuse and allocation-light validation reduce avoidable per-tick work, but this report does **not** claim the multi-AI lag is fixed. To preserve the approved combat physics and rules, this pass does not lower the physics rate, solver settings, or AI behavior to conceal the remaining budget gap.

The Brawl browser suite passed Desktop, Android landscape, and Small Android layouts for each 1–4 AI field, including randomized distinct opponents, zero-HP status, non-overlapping in-arena callouts, preserved Unstick controls, results, and rematches. Its Small Android 640×360 CSS-viewport assertion caught and now guards against the callout expanding after its arrow-side style is applied. The renderer regression also passed the Brawl opening full-arena fit, bounded combat framing, wall-visibility hysteresis, and spark-output checks.

## 6. Online stability and authority regressions

`ONLINE_NAMESPACE=report-online REDIS_URL=redis://127.0.0.1:6380 npm run online:test` completed successfully.

| Verification | Result |
| --- | --- |
| Four-digit rooms | 12 generated room codes remained unique in the test. |
| Match admission | Duel capacity, host start, and ready gating passed. |
| Connection recovery | Exclusive ownership and resumed-seat fencing passed. |
| Tournament coverage | 1-, 2-, 5-, and 8-human brackets each completed all 7 matches with deterministic AI fill. |
| Persistence/recovery | Three checkpoint restoration pairs stayed within 5 mm in the recorded recovery-pose check. |
| Control validation | Invalid axes and duplicate action IDs were rejected. |
| Binary protocol | 37-byte action payload round trip passed; malformed magic and truncated payloads were rejected. |
| Queue stability | 64 pending actions remain bounded; overflow packets do not mutate accepted state; stale actions are cleared. |

## 7. Manual browser test procedure

1. Open the [online WebGL preview](https://4173-iy2g4qa5twboexd3hqdx3-c388a922.sg2.manus.computer/) in a desktop browser with WebGL enabled.
2. In **Settings**, test Medium and High graphics. Enter a match and observe steel-contact sparks plus the short blue/warm impact-light pulse. Turn on reduced motion and confirm that the pulse/spark effects are suppressed while combat state remains readable.
3. To test online play, create a room in one browser profile and join its code from a second profile/incognito window. Ready both players and start the match.
4. During combat, inspect the lower connection line: it reports connection state, smoothed RTT, jitter estimate, and the current snapshot buffer.
5. Confirm that stable local play trends toward a **42 ms** buffer. Intentionally adding browser/system load or a constrained network should raise the buffer temporarily, then let it decay after the stream stabilizes.
6. Verify control feel by driving continuously, releasing/re-pressing controls, triggering a weapon, and reconnecting a tab. Match results should remain server-provided rather than instantly changing from a local prediction.

## 8. Limits and follow-up measurements

The preview is an ephemeral sandbox service and its local Redis state is not production infrastructure. The deterministic benchmark does not emulate congestion control, packet loss recovery, a mobile radio, cross-region routes, a real Vercel edge path, or GPU/monitor timing.

For a production acceptance pass, record a two-player session from representative regions and capture: browser RTT/jitter/buffer telemetry, input-to-authoritative-ack time, snapshot inter-arrival percentiles, WebGL frame time, long-frame count, reconnect rate, room recovery time, and browser/device/GPU metadata. Compare that measured data against the deterministic bounds in this report.
