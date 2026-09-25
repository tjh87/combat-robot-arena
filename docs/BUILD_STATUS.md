> Historical record. For the current standalone specification, read `../handover/CURRENT_REQUIREMENTS.md`.
> Old values below can be superseded. Do not treat old test counts as a new test run.

# Build status

Current build: physics update dated 2026-09-23. See `PHYSICS_UPDATE.md` and `physics-validation.json` for changes and evidence.

125 automated groups pass across eight suites. These include 400 isolated collision cases, 48 wall scenarios, all nine spinner templates, and six seeded matches covering all eleven templates. The final HUGE match replaces its earlier result after the drive-ramp fix. Five unaffected match results were reused.

The managed browser reports disabled graphics and cannot create a WebGL context. One retry failed. Live GPU rendering and audible playback remain unverified. All 57 offline interface integration groups pass. No dependencies were added.
