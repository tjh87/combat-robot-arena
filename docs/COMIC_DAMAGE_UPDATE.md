# Comic damage borders

Removed the four impact words above damage numbers. Each number now sits inside a comic border. Colour, shape, thickness, glow and the brief size pop depend on actual HP loss. Team class and world position still identify the struck robot. Existing damage aggregation and expiry remain unchanged.

| HP loss | Border | Colour | Thickness | Initial pop | Initial glow |
| --- | --- | --- | --- | --- | --- |
| Below 40 | Rounded | Muted blue | 3 px | 4% | 0 px |
| 40–99 | Angled | Yellow | 4 px | 10% | 4 px |
| 100–249 | Jagged burst | Orange | 5 px | 16% | 9 px |
| 250+ | Layered starburst | Pink and gold | 6 px | 22% | 16 px |

Borders use CSS shapes, dark ink shadows and a light dotted fill. The number stays unclipped above the border layers. The size pop settles once over 0.24 seconds. It does not use a repeating flash. Both live and replay presentation use recorded simulation time, so pausing holds the effect. The readout still lasts 1.3 seconds.

The saved reduced-motion preference disables the size pop, tilt, glow and upward movement. The operating-system media query also suppresses the border transform and glow.

Validation: four focused offline UI groups pass, including eight tier boundary cases, actual HP totals and expiry, replay timing, reduced motion, and unchanged winner-only confetti. TypeScript and production build pass. Live browser/GPU appearance was not verified.
