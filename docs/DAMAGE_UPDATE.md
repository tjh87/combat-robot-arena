# Damage and engine audio update

## Changes

- Both robots have attached component warnings with numeric weapon and battery damage. Critical damage uses red. Nearby warnings move apart. Fixed HUD readouts remain available in POV.
- Charge percentage is labelled separately from battery damage. The player gauge shows available weapon output as well as measured RPM and kW.
- Blade or actuator wear and battery wear reduce weapon torque and the speed cap. The reserve keeps every weapon functional at a minimum 25% output. Spinners restart after an impact stall; actuator strokes retain finite work and cooldowns. AI readiness uses the reduced speed cap.
- Battery damage also reduces drive torque. Complete battery failure still stops drive and can lead to a count-out.
- Blade strikes against sides, rear, top and bottom apply 50% more damage than the old non-weapon contact share. Equal-energy blade clashes remain less damaging. Passive body contacts cannot damage an opposing blade. Body damage requires a horizontal closing ram of at least 1 m/s. Arena hazards and landings retain damage.
- Contact attribution uses each collider's moving rotor and the pre-contact motion along the contact normal. Physics impulses are unchanged. Removed armour colliders are checked safely.
- Eight metal impact clips now have short, irregular transients and a lower mechanical body. Persistent pitched ringing is suppressed. One strike across multiple panels plays one sound. Landings retain separate recordings.
- ICEwave plays the supplied engine idle, recorded acceleration, and steady full-power audio. Full power retains the recording's pitch. Electric weapon layers are muted. The acceleration clip resumes from the same point after pause and is reset for a new match.

## Audio sources and limits

The impact set uses CC0 recordings by [Nox_Sound](https://freesound.org/people/Nox_Sound/sounds/569555/) and [SamsterBirdies](https://freesound.org/people/SamsterBirdies/sounds/587443/). The ICEwave clips come from the user's supplied files. The startup asset is recorded weapon acceleration from idle; it is not a cold-start/cord-pull recording. Source intervals and processing are in public/audio/License.txt and steel-audio-assets.json.

## Validation

69 automated groups pass: 50 UI, 7 damage/audio, 7 blade/gameplay/audio, and 5 weapon/gyroscope/visual checks. All eleven weapons operate after full weapon, actuator and battery wear. Three real AI matchups register blade damage with no simulation fault. All fifteen recorded clips decode, with peaks below full scale. The production build and 31-file bundle audit pass. No dependencies were added.

The managed browser displays the warning layout correctly in a temporary fixture using the actual markup and CSS. It cannot create WebGL for live gameplay. GPU appearance, frame rate and audible playback remain unverified. The fixture is excluded from source and production output.
