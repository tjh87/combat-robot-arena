# Online play

## Create a room

1. Open the game at https://bbots-tjh87.vercel.app.
2. Select **ONLINE**.
3. Enter your name.
4. Select your robot.
5. Select **Create 1 vs 1 room** or **Create tournament room**.
6. Share the four-digit room number.
7. Select **Ready**.
8. If every participant is ready, select **Start fight** or **Start tournament**.

## Join a room

1. Select **ONLINE**.
2. Enter your name.
3. Select your robot.
4. Enter the four-digit room number.
5. Select **Join room**.
6. Select **Ready**.

## Controls and views

Each participant uses that browser's player-one control mapping for their own robot. The opponent uses a separate browser.

The default controls are:

- Arrow keys for drive
- Space for the weapon
- Q for strike or self-right
- E for the camera
- R for manual recovery.

The camera menu contains tactical, robot POV, and chase views. Spectators can follow either robot.

The online match continues while a participant opens view options. Focus loss clears held controls.

The **Your saved robots** selector includes legal custom robots from the local library. [Robot builder instructions](ROBOT_BUILDER.md) explain assemblies, fit tests, statistics, and saves.

## Tournament rules

A tournament has eight entrants. Empty entries become AI robots when the host starts the tournament.

The server runs the tournament fights in sequence. The bracket shows the active fight and completed results.

Winners retain damage between rounds. Each winner receives a 900-point repair budget before the next round.

Only an eligible winner can purchase repairs. The repair window lasts up to 45 seconds. The server applies automatic repairs for AI robots and incomplete purchases.

## Connections and recovery

Room numbers range from 1000 to 9999. Room records expire after one hour without a room update.

The server owns physics, damage, match results, and tournament progress. Client prediction changes display poses only.

Physics uses a fixed 240 Hz timestep. The server sends snapshots at a target rate of 30 Hz.

Each client sends controls at a target rate of 60 Hz. The server clears stale drive commands after 250 milliseconds.

A presence record lasts 15 seconds without refresh. The disconnect grace then lasts 60 seconds before a forfeit.

A browser refresh retains the guest identity and room number. Reconnection uses bounded retries and a new connection ticket.

The client renews connections before the five-minute function limit. Redis coordinates connections across function instances.

The server saves checkpoints approximately every two seconds. A replacement owner resumes the saved state, so recent progress can repeat.

A simulation fault pauses the room without a winner. The host can select **Resume saved fight**.

Each process owns at most two active fights. A full process rejects a new start before it changes the lobby state.

## Offline operation

Offline modes retain local assets, physics, preferences, and saved builds. Online play requires an internet connection and the hosted service.

## Acceptance evidence

The cloud tests cover:

- Four-digit reservation and room capacity
- Host-only start and ready rules
- Tournament progression with 1, 2, 5, and 8 humans
- AI fill and repair budgets
- Exclusive match leases and resumed-seat fencing
- Physical checkpoint restoration
- Duplicate and invalid controls
- Separate browser controls and POV cameras
- Refresh recovery and independent control transmission
- Concurrent rooms and capacity release
- Host-only recovery after an injected simulation fault.

The core progression tests inject results to exercise bracket transitions. A separate native browser check runs seven physical fights through all three rounds.

The native check includes a saved custom robot, repair purchases, spectator updates, final results, and the champion. Offline tournament checks run seven physical fights in a worker.

Browser tests use Chromium with software WebGL. Windows graphics and audible playback remain manual checks.

## Impact updates and damage bubbles

Online damage bubbles use the authoritative HP readouts from each server frame. Both players see the same integer damage values.

The display suppresses values that round to 1 HP. Exact fractional HP remains in the simulation.

The network callback updates the HUD independently of the graphics loop. Online graphics use a maximum rate of 60 frames per second.

The client permits one prediction job at a time. Each job uses the latest frame and current drive command.

The prediction horizon is 18 physics ticks, or 75 ms. Replies from an older epoch or an outdated frame cannot replace current server poses.

A worker error removes prediction and retains the authoritative view. A new match or lease epoch resets the replica and its prediction state.

The impact regression uses two native browser connections and an armed weapon. It requires visible bubbles, continued ticks, input acknowledgments, graphics updates, and refresh recovery.

## Presentation and workload

Tournament opponents run in a separate worker in offline mode. Progress messages update at most four times per second during a fight.

A failed worker stops the fight without a result. Retry creates a fresh worker and rejects replies from the previous job.

Online instruments use the selected weapon assembly. A spectator camera change rebuilds the instruments for the selected robot.

Graphics use the browser frame loop with a 60 FPS cap. Hardware, network latency, and server load determine the actual frame rate.
