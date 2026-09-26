# Single battery marker

Changed battery guides to exactly one red dotted box per robot across all 11 templates.

The box encloses all battery bays. Removed the separate screen-space boxes and their per-frame projection work. Builder, match and replay use the same 3D marker. Physical battery zones, hit detection, damage and fire are unchanged.

Runtime files: `src/battery-outline.ts`, `src/battery-layout.ts`, `src/main.ts`, `src/render.ts`, `src/style.css`.

Validation: 594 battery hit cases; one enclosing dotted box on each of 11 models and their replay copies; UI regression suite; TypeScript build and offline verification. The cloud browser does not support WebGL, so direct GPU appearance remains unverified.

Deployment target: https://bbots-tjh87.vercel.app and the existing combat-robot-arena-live alias.
