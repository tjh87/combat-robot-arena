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

## Tournament rules

A tournament has eight entrants. Empty entries become AI robots when the host starts the tournament.

The server runs the tournament fights in sequence. The bracket shows the active fight and completed results.

Winners retain damage between rounds. Each winner receives a 900-point repair budget before the next round.

The repair window lasts up to 45 seconds. The server applies automatic repairs for AI robots and incomplete purchases.

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

Tournament progression tests inject results to exercise all bracket stages. They do not claim seven complete, uninterrupted live fights.

Browser tests use Chromium with software WebGL. Windows graphics and audible playback remain manual checks.
