# Original visual references

These eight images came from the user's instructions. They are development references, not new runtime art.
Read the current requirements before using them. Later instructions override words and layouts shown in these examples.

| File | What to use | What not to copy |
| --- | --- | --- |
| [Comic effects, sheet 1](../reference-images/3598d721-f851-4d9e-8f0b-37c98a90f615.png) | Sharp burst outlines, rays, dots, saturated colour and impact energy. | The example words, watermarks or a stock-image sheet as game art. |
| [Comic effects, sheet 2](../reference-images/6872de86-8c07-48ea-aa2f-7b52d1b98fbd.png) | Distinct burst shapes and stronger effects for higher damage tiers. | BAM, POW, other words, captions or stock marks. |
| [Damage bubble feedback](../reference-images/c9cbcc47-7373-4f86-8d40-047f83594559.png) | Colour contrast, short rays and clear central number. Make the outline sharper and spikier. | Its smooth cloud edge, HP suffix or tier caption. |
| [Floor saws](../reference-images/06c7e3ce-111d-4551-8f89-db6c77832051.png) | Paired upright discs emerging from rectangular floor slots with yellow edges. | Flat floor discs, decorative blades with no contact behavior. |
| [Corner hammer](../reference-images/dc9aaa00-82ea-452e-9df3-d4570ad16cac.png) | A metal hammer head on a long pivoted arm. Use a 50 lb head. | An arbitrary heavy block, the obsolete 100 kg setting. |
| [Upper-deck screws](../reference-images/6a798b7c-6d49-48ba-a885-8d8e70167c5b.png) | Horizontal helical screws at the deck edge, aligned with the shown barriers. | Static cylinders. The exposed face lifts; a jam triggers auto-reverse. |
| [Old compact gauge](../reference-images/4bbd449a-b11d-4a58-bc2a-c8eac8b71096.png) | The need for compact information near the HUD. | Tiny text, words touching the ring, or a panel obscuring the robot. |
| [Readable weapon panels](../reference-images/937aa90b-6534-41b2-8a37-20ba9bcaa7ef.png) | Clear information hierarchy and spacing; separate robot and weapon typography/colour. | Large panels blocking play, hard-coded example values, or Hydra's old unlimited-flips display. Hydra now shows Flip Assist. |

Match the visual intent using the game's own geometry, CSS and effects.
Damage labels contain only whole numbers, with a minimum positive value of 1.
Keep seven tiers and make 500+, 800+ and 1,000+ visibly stronger.
The game already has 11 robot photographs under `public/robots/`; preserve them as model and selection references.
