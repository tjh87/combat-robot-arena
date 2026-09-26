# Suppress tiny trailing readouts at their source

The previous screen filter already hid rounded 1 HP labels. However, HitReadouts still created new tiny entries every 0.12 seconds. These could merge into visible trailing bubbles and were stored in replay readouts.

The tracker now permits a new bubble only when new damage rounds above 1 HP (at least 1.5 actual HP). Tiny increments may update an existing bubble during its original merge window, without extending its 1.3-second lifetime. The contact ledger and actual HP loss retain all damage. Real later hits and released crushing summaries remain visible. Live play and replay capture share this tracker; the existing screen filter also handles older replay frames.

Regression reproduced before the fix: 48 tiny-entry observations in the first scenario. After the fix: zero tiny entries and zero trailing bubbles across both robots at 240, 60 and 20 updates per second. Exact damage totals and subsequent substantial hits passed. Fourteen focused UI checks, build/typecheck and offline verifier passed. GPU appearance remains unverified in the available browser.

Runtime change: src/hit-readouts.ts. Requirements and focused regression tests updated. No physics or dependency changes.
