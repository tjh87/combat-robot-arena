# Gauge readability update

- Added each robot name inside its weapon panel at 20 px.
- Increased weapon types, status, units, details and key prompts from 14 to 16 px (+14.3%).
- Increased the normal reading from 30 to 32 px (+6.7%). Long numbers use a smaller size to preserve clearance.
- Expanded the dial from 116 to 148 px (+27.6%) and panel width from 328 to 380 px (+15.9%). Short screens keep the same type and dial sizes.
- Moved all words and units outside the circle. Kept a 20 px gap between the dial box and the details column.
- Removed negative letter spacing from readings. Names can wrap without touching the status badge.

Validation: six focused DOM integration checks passed. These cover all 11 robot names, weapon types, remapped keys, Quantum, Hydra, measured readings and damage states. Chromium layout checks covered 12 example states across all 11 robots. No card or numeric readout overflowed. The measured number box had at least 9.1 px of clearance inside the ring. At 1280 × 720, Hydra’s panel, caption, assist and control bar stayed separate. Browser checks used actual UI markup and styles in fixtures without WebGL.
