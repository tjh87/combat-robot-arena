# Online match transitions

The gateway discards controls whose match ID differs from its current match. Late messages from a completed fight do not produce a false permission error.

The gateway retains current-match permission checks. A spectator cannot control a robot in the active match.

[Acceptance](https://github.com/tjh87/combat-robot-arena/actions/runs/37404114932) tested `e5ae6f6d851c45849f604a3eaeddffab91b4d3c5` and completed successfully.

The transport regression used two independent gateways and real WebSocket messages. A late message did not change the engine acknowledgment.

The same regression rejected an unauthorized message for the current match. The complete online check also completed seven physical tournament fights.

The checks retained repair purchases, spectator instruments, armed impacts, integer damage bubbles, and refresh recovery.
