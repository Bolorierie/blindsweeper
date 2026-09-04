# BlindSweeper

A roguelike Minesweeper. Single-file browser game, vibecoded for fun.

## Rules for working here

- **Everything lives in `index.html`** until it passes ~1,500 lines. No build step, no bundler, no framework. Do not introduce one without being asked.
- **No external assets.** Audio is synthesized with Web Audio (`tone`, `noise`, `SFX`). Fonts come from Google Fonts. Everything else is inline.
- **One feature per change.** Add it, open `index.html`, play a round, then move on.
- **Balance lives in `startRound()` only.** Board size, mine density and the target formula are all there. Do not scatter difficulty numbers elsewhere.
- **Relics are data plus `has('id')` checks.** New relic: add a row to `RELICS`, then guard the behaviour with `has()` at the point it applies. Relics never stack (the shop excludes owned ones).
- **First dig is always safe** (mines are placed after the first click, excluding its 3×3). Keep that invariant.
- **Round ends the moment score ≥ target.** Do not add "keep digging for bonus" without redesigning coins.
- Keep the visual language: dark olive ground, fuse-orange accent, classic Minesweeper number colours, Big Shoulders Display for headings, JetBrains Mono for numbers.
