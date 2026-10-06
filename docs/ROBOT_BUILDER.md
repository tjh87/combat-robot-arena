# Robot builder

## Start a robot

1. Open **BUILDER**.
2. Select a robot under **Starting preset**.
3. For an empty frame, select **Start from scratch**.
4. Enter a robot name.
5. Adjust the frame dimensions.

The builder contains all 11 stock templates. A scratch robot includes a frame and the basic drive hardware.
It starts without an active weapon.

## Install an assembly

1. Select an **Assembly**.
2. Select its **Part source**.
3. Select **Install this functional assembly**.
4. Adjust the dimensions and mounts for your frame.

Each assembly retains its source independently of the frame. A chassis change preserves the sources of existing assemblies.

The assembly menu contains:

- Chassis
- Weapon and mounts
- Wheels and drive motors
- Self-right mechanism
- Battery packs
- Armor set.

## Install a catalogue part

1. Open **All template parts catalogue**.
2. Select a **Robot template**.
3. Select a **Part**.
4. Select **Install selected part**.
5. For a structural attachment, adjust its mount coordinates.

The catalogue contains the compiled parts from every template. Motors, wheels, weapons, batteries, and articulated arms install with their functional assembly.

Each structural attachment retains its source geometry and material. It retains its mass and contact behavior.
The builder permits up to 32 attachments.

## Examine fit problems

1. Read the messages under **LIVE BUILD TOTALS**.
2. Correct fields that show errors.
3. Select **Run physical fit test**.
4. If the test reports a collision, adjust the relevant mount or dimensions.
5. After a draft change, run the physical fit test again.
6. Select **Test in Practice**.

The static inspection finds these problems:

- Floor penetration
- Wheel spacing errors
- Invalid coordinates
- Existing mechanism limits.

A weapon without sufficient ground clearance produces a floor warning.

The physical test settles the robot for 480 physics ticks. It examines wheel support and the spinner sweep at 48 angles.

The physical test also finds attachments that intersect wheels or the spinner sweep. A draft change invalidates an earlier fit result.

The fit test examines the normal settled pose. Practice exposes behavior during movement and combat.
It also exposes articulated motion and recovery.

## Part statistics

1. Select **Show statistics for every part**.
2. Open **Parts & mass**.

The table contains these columns:

- Part
- Mass
- Dimensions
- Material
- Speed or function.

Wheel speeds and drive motor RPM use no-load estimates.

The weapon row shows requested RPM and modeled tip speed. Motor ratings, fitted dimensions, and additional hardware masses are game estimates.

Each part contributes to total mass once. Custom changes do not automatically restore the stock mass.

## Save a robot

1. Select **Save settings** to update the current robot.
2. Select **Save as new robot** to create a separate library entry.
3. To load a robot, select it under **Saved robot library**.
4. To delete a robot, select its entry.
5. Select **Delete selected save**.

The library retains up to 40 robots on the current browser origin. Existing version-2 build links remain compatible.

The library includes the earlier single saved build. A reset changes the draft and preserves the saved library.

## Fight with a saved robot

1. Return to the arena menu.
2. Select your robot under **Use a saved robot**.
3. Select a fight mode.

The selected robot enters Quick Fight, local two-player mode, Practice, or the offline tournament.

For online play:

1. Open **ONLINE**.
2. Select your robot under **Your saved robots**.
3. Create or join a room.
4. Select **Ready to fight**.

A robot without an active weapon can enter Practice. Competitive modes require a legal armed build.

Browser storage belongs to its origin. Build links transfer robots between different origins or devices.
