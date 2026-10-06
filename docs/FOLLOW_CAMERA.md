# Third-person camera and hard mode

## Select the view

1. Open **Settings**.
2. Select **Third person** under **Camera view**.
3. Start a fight or Practice.

During a fight:

1. Press **E** to change the camera.
2. Select **View: Third person** with the camera button.

The camera cycle contains three views:

- Tactical
- Third person
- Robot POV.

New preferences use third person. Existing saved preferences retain their selected view.

## Follow behavior

The camera follows the displayed position of your robot. Online play follows your assigned side, including player two.

The horizon stays level during pitch, roll, and inversion. The camera uses the correct axle heading for HUGE drive assemblies.

The camera adjusts its distance for the robot envelope. Near a wall, it remains inside the arena and raises its position.

## Opponent telemetry

A compact HP bar appears above the opponent. It uses current chassis HP and includes the robot name.

The indicator points to the visible opponent. For an off-screen opponent, the indicator stays at the screen edge.

The edge indicator shows distance and HP. A target behind the camera also shows **BEHIND**.

The telemetry accepts no pointer input. Replay telemetry uses recorded chassis HP.

## Doubled hard mode

| Setting | Previous hard | Updated hard |
| --- | --- | --- |
| Decision rate | 60 Hz | 120 Hz |
| Target perception delay | 62.5 ms | 31.25 ms |
| Maximum aim error | 2 degrees | 1 degree |

The simulation samples observations at 240 Hz. The target delay is subject to that sampling interval.

Easy and medium retain their previous decision rates and error settings. The update preserves robot HP, mass, and physical weapon limits.
