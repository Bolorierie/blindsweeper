# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# BlindSweeper

A roguelike Minesweeper. Single-file browser game, vibecoded for fun.

## Running it

There is no build, lint, or test step. Open `index.html` in a browser, or for live reload while developing:

```bash
npx serve .
```

Verifying a change means playing a round. See `README.md` for controls.

## Rules for working here

- **Everything lives in `index.html`** until it passes ~1,500 lines. No build step, no bundler, no framework. Do not introduce one without being asked.
- **No external assets.** Audio is synthesized with Web Audio (`tone`, `noise`, `SFX`). Fonts come from Google Fonts. Everything else is inline.
- **One feature per change.** Add it, open `index.html`, play a round, then move on.
- **Balance lives in `startRound()` only.** Board size, mine density and the target formula are all there. Do not scatter difficulty numbers elsewhere.
- **Relics are data plus `has('id')` checks.** New relic: add a row to `RELICS`, then guard the behaviour with `has()` at the point it applies. Relics never stack (the shop excludes owned ones). `MAX_RELICS` caps slots; `MEDKIT` is the one consumable and is handled by id in the shop click handler.
- **Bosses work the same way**: a row in `BOSSES`, then `R.boss && R.boss.id === '...'` checks inline where the rule bites (`reveal` for cascade/fog, `dig` for heart cost, `startRound` for the target).
- **First dig is always safe** (mines are placed after the first click, excluding its 3×3). Keep that invariant.
- **Round ends the moment score ≥ target.** Do not add "keep digging for bonus" without redesigning coins.
- Keep the visual language: dark olive ground, fuse-orange accent, classic Minesweeper number colours, Big Shoulders Display for headings, JetBrains Mono for numbers.

## How the script is organised

`index.html` is `<style>`, then markup (sidebar, board, shop overlay, game-over overlay), then one `<script>` in this order: audio → content tables (`RELICS`, `MEDKIT`, `BOSSES`) → state → board/dig logic → shop → rendering → input.

**Two state objects, and which one a value belongs to matters:**

- `run` lives for the whole run: round number, hearts, coins, owned relic ids, next boss, shop items. Created in `newRun()`.
- `R` is the current round only and is rebuilt from scratch in `startRound()`: grid, target, score, mult, per-round relic flags (`kevlarUsed`, `sonarUsed`, `shovelUsed`), interaction mode (`dig`/`flag`/`sonar`), and `over`. Anything that must reset every round goes here.

**Round flow:** `startRound()` → player clicks → `dig()` (places mines on the first dig, handles mine hits and relic effects) → `reveal()` (flood-fill cascade, scoring via `cellChips()`) → when score ≥ target, `roundClear()` computes the coin breakdown and calls `openShop()`; the shop's Next button bumps `run.round` and calls `startRound()` again. `endRun()` handles both loss paths (out of hearts, or board exhausted below target).

**Rendering is stateless:** `renderAll()` repaints the sidebar and every cell from `R`/`run`; `renderCell()` maps a cell's fields to CSS classes (`rev`, `flag`, `hit`, `defused`, `mineshow`, `bonus`, number colour `n1`–`n8`). Change state, then call `renderAll()`. Never touch cell DOM directly from game logic.

**Input:** one pointer handler pair on the board distinguishes click, right-click, and long-press (touch flagging); on release it dispatches on `R.mode`. `F` toggles flag mode. Sonar and Shovel are sidebar buttons that only appear when the relic is owned.

**Audio:** the `AudioContext` is created lazily in `audioInit()` on the first pointer gesture (browser autoplay rules). Every `SFX.*` call must tolerate `AU.ctx` being null.

**Persistence:** `localStorage` keys `bs-best` (best round) and `bs-sfx`/`bs-music` (audio toggles), all wrapped in try/catch.
