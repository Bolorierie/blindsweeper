# BlindSweeper

Minesweeper as a roguelike run. Every safe cell you dig scores **chips × mult**.
Each round has a target; hit it and you cash out to a shop where relics bend the rules.
Three hearts for the whole run, a boss every third round, targets that outgrow honest play
around round seven.

## Play

Open `index.html` in a browser. That's it: one file, no build step, no dependencies.

For live reload while developing:

```bash
npx serve .
```

## Controls

| Action | Desktop | Phone |
|---|---|---|
| Dig | Click | Tap |
| Flag | Right-click, or `F` to toggle flag mode | Long-press |
| Sonar / Shovel | Sidebar buttons (when owned) | Same |

## Where things live in `index.html`

| Section | What to edit |
|---|---|
| `RELICS`, `BOSSES` | Content. Add a relic here, then a `has('id')` check where it applies |
| `startRound()` | All balance: board size, mine density, target formula |
| `cellChips()` | How a cell scores |
| `reveal()` / `dig()` | Core Minesweeper rules and cascade |
| `roundClear()` / `openShop()` | Coins earned, shop rolling |
| `SFX`, `musicStart()` | All audio, synthesized with Web Audio, no files |
| `<style>` | Everything visual; cell states are CSS classes |

## Roadmap ideas

- Score that counts up with a tick, mult flashing on bonus cells
- Particle burst on mine explosions
- Consumable cards used mid-round
- Run seeds for racing friends on the same boards
- A "Liar" boss where one number on the board is wrong
