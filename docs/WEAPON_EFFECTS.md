# Weapon instruments and contact effects

## Son of Whyachi

The three arms and their hammer heads slope downward by 8 degrees. Six white, beveled strike faces share three tooth groups.

The rotor support includes a 50 mm offset above its original axis. This game adjustment keeps the lowered braces clear of the wheels.

The original four wheels retain their 170 mm diameter and 55 mm width. The drive motor and its 14:1 ratio retain their original values.

The stock weapon retains its original RPM target and reference mass. The simulation calculates inertia from the new physical geometry.

## RPM instrument

The bar changes continuously through these colors:

| Speed fraction | Color |
| --- | --- |
| 0 percent | Blue |
| 25 percent | Cyan |
| 50 percent | Green |
| 80 percent | Gold |
| 90 percent | Orange |
| 100 percent | Pink-red |

The percentage uses the same color as the bar. A silhouette beside the weapon state fills from bottom to top.

The bar tip starts its vibration at 80 percent. Its amplitude increases from 0.25 px to 2.5 px at full speed.

The vibration period decreases from 160 ms to 55 ms. Reduced motion stops the vibration.

## Rotor exposure

Seven stock spinner profiles use smoother angular exposure geometry. The exposure follows actual RPM and spin direction.

The renderer uses fixed buffers and translucent edges. The chassis does not receive motion blur.

SawBlaze retains its existing exposure effect. Son of Whyachi retains its existing style, with the exposure height aligned to its sloped rotor.

## Sparks

Contact energy controls the existing burst size and velocity. Actual removed HP controls the color palette.

| Removed HP | Available colors |
| --- | --- |
| Less than 40 | 2 warm colors |
| 40 or more | 4 colors |
| 100 or more | 6 colors |
| 250 or more | 8 colors |

The colors include cyan, green, pink, violet, blue, and white at stronger damage tiers. Each particle retains a deterministic color.

Live play, replays, and online frames use the same damage value. Older replay frames retain the warm palette.
