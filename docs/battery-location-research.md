# Battery location review — 25 September 2026

This review covers all 11 stock robots. Team build logs, team answers on Reddit, photographs, and reported fight damage were checked. Searches also returned toy manuals and unrelated products; these were excluded.

No source supplied measured battery coordinates for the game's exact models. The zones below remain fitted game volumes. A power-system specification does not prove a pack's location. One zone can represent several packs. All zones still share the existing battery health module.

| Robot | Evidence and limit | Game decision |
| --- | --- | --- |
| Tombstone | [Ray Billings AMA](https://www.reddit.com/r/battlebots/comments/lyptp2/tombstone_ama_ask_me_anything/) discusses wiring, not measured pack locations. A [fight recap](https://battlebotsupdate.com/battlebots-s9-e7/) describes rear batteries, but is secondary evidence. | Retain rear bay. Label it an estimate. |
| Minotaur | [RioBotz AMA](https://www.reddit.com/r/battlebots/comments/13u7k9r/ama_with_minotaurs_team_riobotz_at_7pm_et/) confirms separate drive and weapon supplies and two parallel weapon packs. [SawBlaze's report reproduced on Reddit](https://www.reddit.com/r/battlebots/comments/141gblg/sawblaze_v_minotaur_aftermath/) identifies the damaged pack at a rear underside corner. Its linked Facebook original could not be read. | Move both side targets to the rear corners and lower all three targets. Mirroring that corner and retaining a centre drive target are game inferences, not confirmed pack coordinates. |
| Hydra | [Team Whyachi](https://whyachi.com/) describes the robot and hydraulic system, but does not identify battery positions. The older Facebook hydraulic post could not be read. | Retain rear side bays as unconfirmed estimates. |
| ICEwave | [BattleBots profile](https://battlebots.com/robot/icewave-2021/) and team-related material distinguish the engine and electric drive. The profile fetch timed out during this review. No usable pack layout was found. | Retain the lower rear drive bay as an estimate. Do not treat the engine as a battery. |
| HyperShock | [Team power-system build log](https://hypershock.tv/blogs/inside-the-bot/putting-the-shock-in-hypershock), especially its S6 interior photograph and battery-box description, supports the shared central box and suspension above the base plate. | Retain its central plan position. Raise the fitted target 16 mm to model the suspended box. That clearance is a game estimate. |
| Gigabyte | [Team post-fight report](https://www.reddit.com/r/battlebots/comments/17c0od2/gigabyte_sin_city_slugfest_post_fight/) confirms a battery puncture through the bottom plate. It does not specify left/right coordinates. | Lower both fitted targets 3 mm. Keep side-bay coordinates marked as estimates. |
| Son of Whyachi | [Team Whyachi](https://whyachi.com/) does not provide pack coordinates for the modern wheeled version. Old shuffler, engine-powered and toy layouts are not interchangeable. | Retain rear bay as an unconfirmed estimate. |
| HUGE | [Team build log and CAD](https://hugebattlebots.com/team-huge-battlebots-blog/huge-build-log-2018) show mirrored chassis halves. [Fusion fight report](https://hugebattlebots.com/team-huge-battlebots-blog/huge-vs-fusion) identifies access through the wheel area. | Retain targets in both elevated chassis pods. Exact positions inside them remain estimates. |
| SawBlaze | [Builder Jamison Go](https://jamisongo.com/projects/sawblaze/) specifies the 12s4p supply, but not its coordinates. A photograph of another robot's battery fire is not evidence for SawBlaze's own layout. | Retain rear bay as an unconfirmed estimate. |
| Deep Six | [Team AMA](https://www.reddit.com/r/battlebots/comments/coottd/ama_with_deep_six/) and public searches did not establish pack positions. Triton is a different robot. | Retain both lower chassis targets as unconfirmed estimates. |
| Quantum | [Team AMA](https://www.reddit.com/r/battlebots/comments/13hmmck/quantum_ama_with_james_grant_cooper/) discusses Ribbot's batteries. That passage does not locate Quantum's batteries. | Retain rear side bays as unconfirmed estimates. |

## Applied coordinate changes

Coordinates use the existing chassis model: positive Z is rearward. Values describe the game, not measured hardware.

| Robot | Change | Stock model result |
| --- | --- | --- |
| Minotaur | Side-target Z: 0.058333 → 0.28 of chassis length. Battery lower clearance: fitted 18 mm → 6 mm. | Both side targets move 133 mm rearward. All three move 12 mm down. |
| HyperShock | Lower clearance: 9 mm → 25 mm. | Central target moves 16 mm up. |
| Gigabyte | Lower clearance: 9 mm → 6 mm. | Both targets move 3 mm down. |

All 11 entries received evidence notes. Seven still lack sufficient team evidence for a battery region: Tombstone, Hydra, ICEwave, Son of Whyachi, SawBlaze, Deep Six and Quantum. Their positions were not changed merely to imply new certainty.

The shared `batteryZones` function feeds damage rays, component mass placement, rendered packs, battery hints and fire origins. Target size, pack mass and total robot mass are unchanged. Total stock target count remains 18.

## Recovery regression

Moving Minotaur's battery mass exposed a stalled gyro recovery when the drum was already at full speed. Recovery now uses the existing motor to slow an over-speed drum below 15% of its rated speed, waits for the chassis to settle, and then rebuilds the usual rocking speed. It retains the spin direction to avoid a long reversal. Steering, motor limits and physical precession still supply the motion.
