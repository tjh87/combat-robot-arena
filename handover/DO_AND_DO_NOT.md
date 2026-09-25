# What to do and what not to do

| Area | Do | Do not |
| --- | --- | --- |
| Starting work | Inspect the current source and reproduce the issue. | Replace the repository with a generic starter. |
| Scope | Complete the current request and necessary fixes. | Add unrelated game modes or services. |
| Offline | Use the supplied runtime, dependencies and local assets. | Add CDNs, remote WASM, streamed audio or mandatory login. |
| Dependencies | Preserve pinned versions; explain required upgrades. | Run an uncontrolled package upgrade or delete dependencies offline. |
| Physics | Use SI units, real colliders and finite work. | Add hidden launches, recoil cancellation or infinite damage energy. |
| Falling | Use one kinetic-energy budget and measured descent. | Add mgh to impact energy already gained during falling. |
| Gyro | Use drum momentum and wheel contact. | Teleport Minotaur upright or call Unstick its gyro mechanism. |
| Crusher | Use contact, pressure work and two-length retreat. | Damage nearby batteries through an arbitrary radius or retreat to arena centre. |
| Data | Distinguish team evidence, derived values and estimates. | Invent exact pack coordinates or transfer opponent data to the wrong robot. |
| Visuals | Preserve silhouettes, sharp weapons and readable text. | Restore generic blocks, smooth weak damage borders or obstructive gauges. |
| Damage | Display integer labels, minimum 1; retain precise HP internally. | Round each physics step or add words to the damage bubbles. |
| State | Keep build imports, settings, save compatibility and mode transitions. | Reset user data to hide a failure. |
| Testing | Run checks that cover changed behavior and report results. | Count old JSON files as newly passed tests. |
| Publication | Publish only when asked; use the correct repository and audience. | Upload to an unrelated repository or expose credentials. |
| History | Read current requirements before historical notes. | Restore the obsolete 100 kg hammer, four damage tiers or 0.20 m crusher retreat. |

## Change report format

State the outcome first. List the numerical settings that changed, with old and new values.
Name the checks that ran and any remaining limitations.
Report subagents only if they were used. Keep the final reply short.
