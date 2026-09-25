> The newer GAMEPLAY_UPDATE.md supersedes the game-name mapping, POV mounts, HUGE stabilizers, count-out behavior, replay behavior, and feedback described below.

# Reference roster update

The user's latest request expands the original three-family brief. The game now offers ten reference templates, eight active weapon mechanisms, and the existing unarmed Practice configuration. The original build contract remains available as history.

| Game preset | Requested reference | Working geometry |
|---|---|---|
| Crosscut | Tombstone | Exposed frame, two wheels, short spindle and low red horizontal bar |
| Upturn | Minotaur | Black compact body, wheel guards, gold hollow drum and close bearing cheeks |
| Springboard | Hydra | Purple wedgelets and a narrow powered flipper |
| Whiteout | ICEwave | Low chassis and plow, overhead bar, stationary engine cowl and exhaust |
| Aftershock | HyperShock | Four treaded wheels, open rims, yellow/pink paint, front scoops and vertical disc |
| Prism | Gigabyte | A rotating multicolour sloped shell, crown spokes, teeth and fixed direction mast |
| Triad | Son of Whyachi | Three rotor arms, triangular tie rods, impact teeth and low skirts |
| Colossus | HUGE | Large open wheels, split elevated chassis, centre vertical bar and tail supports |
| Firebreak | SawBlaze | Three forks, powered articulated arm and independently driven vertical disc |
| Undertow | Deep Six | Tall braced rotor support, shaped large vertical bar and outriggers |

## Operation and implementation

- All templates are available in Quick Fight, local play, Practice, the Builder, opponent selection, and agent menu actions. Tournament opponents use the full roster.
- Arrow keys drive P1 and navigate menus. The selected card keeps keyboard focus after activation. P2 uses IJKL. Existing key remaps remain supported.
- Space toggles the spinner or fires the flipper. Q swings Firebreak's arm; other robots use Q for their fitted self-right system. An inverted hammer-saw with a fitted roll arm can use that arm. P2 equivalents are Enter and U.
- E switches between Tactical and P1 POV. The camera follows the interpolated chassis position, heading, pitch, and roll. Each frame has a suitable physical camera location; replay uses the recorded pose.
- Three starting lights count 3, 2, 1, FIGHT. The match timer counts down from 3:00, with a progress strip and a final-30-second state. Pausing freezes both the start and match clocks.
- New rotors, wheel openings, shell sectors, supports, forks and arm plates use shared collision and render geometry. The hammer-saw has separate arm and rotor bodies and joints. Rotor reaction torque acts on the arm. Arm strokes use a 900 J work cap and consume battery energy.
- Flipper damping scales with effective inertia, so its narrower arm holds still and still flips through physical contact. Both its 3,000 J charge limit and self-right behaviour remain tested.
- Each hollow wheel's exact surfaces are batched by material. Aftershock's builder uses 76 mesh batches instead of 220; Colossus uses 62 instead of 132. Collision geometry is retained.
- The custom starting envelope is now 2.2 × 2.2 × 1.6 m to support tall and large-wheel templates. Mass remains capped at 113.398 kg and tip speed at 111.76 m/s. The fixed 240 Hz solver is unchanged.
- Version-2 build links still load. Missing frame profiles default to Standard. New enum values, sizes, arm controls and interference checks are validated on import and in the Builder.

The models use reference proportions and silhouettes. Motor ratings, material values, weapon RPM, masses and actuator limits are game parameters, not specifications of the real robots. The ICEwave-inspired model uses the game's motor simulation. All artwork and meshes are procedural; no external image or model is downloaded during play.

## Reference evidence

All ten supplied reference photographs were inspected, including the earlier Tombstone image. The requested BattleBots Wiki rejected automated access through robots.txt. No proxy or alternate browser was used to bypass it. Official BattleBots profiles and their linked photographs supplied additional reference material:

| Reference | Profile | Additional official photograph |
|---|---|---|
| Tombstone | [2021 profile](https://battlebots.com/robot/tombstone-2021/) | [2018 photograph](https://uk.battlebots.com/wp-content/uploads/2018/04/Tombstone-Bot-S2018-1140x733.jpg) |
| Minotaur | [WCVII profile](https://battlebots.com/robot/minotaur-wcvii/) | [2022 photograph](https://battlebots.com/wp-content/uploads/2022/11/BB2022-minotaur-bot.jpg) |
| Hydra | [WCVII profile](https://battlebots.com/robot/hydra-wcvii/) | [2022 photograph](https://battlebots.com/wp-content/uploads/2022/11/BB2022-hydra-bot.jpg) |
| ICEwave | [2021 profile](https://battlebots.com/robot/icewave-2021/) | [2021 photograph](https://battlebots.com/wp-content/uploads/2021/10/Icewave-bot-2021.jpg) |
| HyperShock | [2021 profile](https://battlebots.com/robot/hypershock-2021/) | [2021 photograph](https://battlebots.com/wp-content/uploads/2021/10/HyperShock-bot-2021.jpg) |
| Gigabyte | [2021 profile](https://battlebots.com/robot/gigabyte-2021/) | [2021 photograph](https://battlebots.com/wp-content/uploads/2021/10/Gigabyte-bot-2021.jpg) |
| Son of Whyachi | [2018 profile](https://battlebots.com/robot/son-of-whyachi-2018/) | [2018 photograph](https://battlebots.com/wp-content/uploads/2018/05/Son-of-Whyachi-Bot-S2018-1140x760.jpg) |
| HUGE | [2020 profile](https://battlebots.com/robot/huge-2020/) | [2020 photograph](https://battlebots.com/wp-content/uploads/2020/11/HUGE-bot-2020.jpg) |
| SawBlaze | [WCVII profile](https://battlebots.com/robot/sawblaze-wcvii/) | [2022 photograph](https://battlebots.com/wp-content/uploads/2022/11/BB2022-sawblaze-bot.jpg) |
| Deep Six | [2021 profile](https://battlebots.com/robot/deep-six-2021/) | [2021 photograph](https://battlebots.com/wp-content/uploads/2021/10/Deep-Six-bot-2021.jpg) |

## Verification limits

The managed browser reaches the preview but reports `GL_RENDERER = Disabled` and cannot create WebGL. The real error/retry screen was observed. Meshes and procedural textures were inspected in an offline geometry study; that study does not reproduce WebGL shading or textures. No browser rendering success or GPU frame rate is claimed. Physical gamepads also remain unverified.

See `roster-results.json`, `visual-results.json`, `review-ui-results.json`, and `VALIDATION.md` for the automated evidence. The focused regression fixtures now use unsupported `laser_cannon` to test unknown weapon rejection, the expanded numeric/envelope limits, and a Standard unarmed box target without Hydra wedgelets for direct rotor contact.
