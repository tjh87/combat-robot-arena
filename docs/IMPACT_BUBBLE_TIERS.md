# Impact bubble tiers

The user supplied two comic effects references. Only the bubble shapes, colours and effects guide this update; none of the example words or watermarks are used. CSS shapes create the artwork, with the real damage number above the decorative layers.

## Seven levels

| Damage | Shape and effect |
| --- | --- |
| Below 40 HP | Blue ink-outlined oval with dotted fill |
| 40–99 HP | Yellow impact bubble with an orange star |
| 100–249 HP | Cyan-and-white cloud with radial speed lines |
| 250–499 HP | Orange-and-yellow layered explosion with stars and dots |
| 500–799 HP | Red-and-yellow explosion with smoke puffs |
| 800–999 HP | Cyan, purple and yellow burst with lightning and stars |
| 1,000+ HP | Largest pink, yellow and cyan burst with smoke, lightning and stars |

The three new tiers begin at 500, 800 and 1,000 HP. There are seven tiers rather than four. Decorative inset thickness ranges from 5 to 9 px, including the dark ink outline. Initial size pop rises from 4% at the lowest tier to 34% at the highest. Initial glow ranges from 0 to 20 px. The pop settles once over 0.24 s. There is no repeated strobe. Effects follow simulation or recorded replay time. Both player slots use the damage-based palette.

The saved reduced-motion preference removes pop, upward drift, tilt and glow. The operating-system media query also removes border transform and glow. The extra decorations contain no text.

## Validation

Four focused UI groups pass. They cover 14 tier/boundary values from 12 through 1,200 HP, actual damage totals and expiry, replay timing, reduced motion, and winner-only confetti. TypeScript, production build and bundle audit pass.

Chrome rendered all seven styles on a temporary review page using the exact game markup and stylesheet. The screenshot is `impact-bubbles-preview-20260924.jpg`. All seven numbers fit their bubbles. Browser inspection confirmed that reduced motion removes transforms and filters. Review also found an abrupt rectangular edge on the dot layer; an elliptical mask and stronger fade fixed it.

The review page was removed and the game entry page restored before building. The browser check validates CSS appearance; it does not verify live WebGL gameplay.
