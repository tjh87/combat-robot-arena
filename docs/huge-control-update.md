# HUGE controls, hits and result portraits

## Changes

- Replaced HUGE's 76 segmented wheel collision pieces with two continuous rounded contact surfaces. The original visible wheel parts and their mass remain. This removes spoke holes and tread seams that could catch edges. Existing 50% wheel damage protection remains.
- HUGE now derives drive heading from its wheel axle. Central body pitch no longer reverses the controls or commands the blade to reverse. The POV and front arrow follow that same heading. Other robots switch inverted controls only with ground support, after 0.15 seconds, beyond a 0.70 upright-axis threshold.
- Wheel and drive damage remain separate from the weapon supply. With both wheel drives disabled, HUGE retained full weapon output and approximately 2,387 RPM in the focused check.
- Shortened HUGE's front supports from 48 cm to 26 cm (46% shorter). The old supports pushed a low opponent away before the blade could reach it. The updated setup produces a damaging blade contact in the live physics check.
- Increased HUGE's strike multiplier from 1.5× to 10×. Its stock full-speed strike rating is 302.63 kJ, versus Deep Six's 268.18 kJ: 12.8% higher. This is a game balance rating, not a promise that every glancing hit exceeds every other robot's clean hit. Blade speed and mass remain unchanged.
- Added recoil support on each damaging robot contact. The robot dealing more actual HP damage gets a reduction proportional to its damage advantage. The maximum is 45% for ordinary attacks and 70% for vertical spinners. Ties and non-damaging contacts get none. Support restores only motion lost during the hit and leaves the opponent's launch impulse unchanged. This is an explicit gameplay assist, not a claim of strict momentum conservation.
- Embedded all eleven result photographs as 240-pixel WebP thumbnails, totalling 44,712 image bytes. This removes separate post-match image requests. Fixed image bounds and normal blending avoid blank transformed image panels. Winner and runner-up retain the correct robot mapping.

## Checks

The targeted suites cover 84 checks: 10 HUGE/control/recoil/photo checks, 53 interface checks, 11 Quantum/HyperShock checks, six recovery checks, and four wheel-damage checks.

The HUGE suite checks eight forward/reverse starts across four pitch orientations, four left/right steering cases, escape from both end walls, continued weapon output after wheel failure, live blade contact, bounded recoil support, four POV orientations, all 11 compiled templates, and 22 podium mappings. Wall starts use clear floor outside the shelf; spawning a wheel inside a raised shelf is not a valid wall test.

The real Rapier simulation validates movement and collisions. The result card layout was inspected in the managed browser using the same Minotaur/ICEwave pairing as the supplied screenshot. Both photos rendered. Full GPU combat rendering remains unverified because the managed browser previously lacked WebGL. Interface integration tests use a renderer stub.
