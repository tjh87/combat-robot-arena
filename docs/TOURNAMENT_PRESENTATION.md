# Tournament presentation and repair studio

## Tournament bracket

The bracket uses local robot portraits and current cup records. Each robot shows wins and losses from completed bracket results.

Green animated paths show advancement. Red animated paths end at elimination markers.

The bracket retains its connector elements when its results and layout stay unchanged. A resize recalculates their positions.

Round winners receive a victory banner. The overall champion receives a trophy panel, gold accents, a portrait, and bounded confetti.

Reduced motion disables flowing paths and confetti. The result colors and records remain visible.

Online play uses the same current-cup records and champion presentation. The full online bracket opens from the room sidebar.

The online bracket clears local held controls. The authoritative fight continues while the bracket stays open.

## Repair plan

1. Select **Repair robot** after a win.
2. Select **Recommended repairs** or choose individual components.
3. Read the preview and remaining budget.
4. Select **Commit plan & continue**.

The offline studio uses component cards and a live budget dial. Green previews show the HP after the selected purchases.

Selected repair labels distinguish partial and full repairs. Each selected repair shows its selected HP cost.

Online repair purchases retain their automatic allocation.

The recommended plan prioritizes chassis and drive repairs. The plan retains the existing replacement surcharge and 900-point limit.

Healthy components stay in a collapsed section. Optional material changes and livery controls stay under **Advanced workshop**.

## Acceptance

[Cloud acceptance](https://github.com/tjh87/combat-robot-arena/actions/runs/37503176917) tested `dcf01a510909d7e8b6c8fcb2b34803d6c1aec24d` and completed successfully.

The checks covered:

- Exact win/loss records with duplicate robot names
- Fractional HP costs and the 900-point budget
- Destroyed components and recommended allocations
- Green and red connector paths
- Stable animation elements during progress updates
- All three tournament stages and the champion panel
- Optional repairs and immediate next-fight entry
- Online bracket controls and champion records
- A native online room, bracket records, and a physical frame
- Desktop and medium-width layouts
- Reduced motion.

Controlled player results covered the complete UI progression. A separate browser check started an actual physical tournament fight.

The controlled UI fixture paused arena frames. The native online check resumed the renderer and received an actual physical frame.

The screenshots used Chromium WebGL with SwiftShader. Windows GPU behavior and audible playback remain manual checks.
