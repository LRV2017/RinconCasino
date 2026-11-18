# Rincon Casino — The Play Lounge

Rincon Casino is a static, browser-only, free-to-play casino and game lounge. It uses fictional credits saved in the current browser. There are no deposits, payments, prizes, cash-outs or real-money gambling.

## Current rebuild

The `mega-casino-rebuild` branch replaces the original single-file prototype with a modular app:

- `index.html` — application shell and game overlay
- `styles.css` — responsive emerald, charcoal and gold visual system
- `src/catalog.js` — 240 selectable catalog entries in 12 categories
- `src/app.js` — lobby, search, categories, favorites, demo wallet, bonus, history, stats and achievements
- `src/engines.js` — casino, draw, dice, slot, wheel and scratch-card game engines
- `src/poker.js` — Texas Hold'em and Pot-Limit Omaha local tables
- `src/board.js` — board-game rules and computer opponents
- `src/room-adapter.js` — local room adapter and an explicitly unconfigured network adapter
- `docs/ONLINE_MULTIPLAYER.md` — future server-authoritative multiplayer design

## Game families

The catalog contains 240 selectable titles across roulette, blackjack, baccarat, poker, video poker, slots, keno, dice, strategy/board games, arcade/wheels, scratch cards and number draws.

The 240 entries are themed tables and variants backed by a smaller set of shared game-family engines; they are not 240 separately written game implementations. Texas Hold'em and Pot-Limit Omaha use card ranking and local opponent decisions. Board bots use tactical search or game-specific heuristics for tic-tac-toe, Connect Four, Reversi, Gomoku, Battleship, checkers, Nim and Dots & Boxes. Dice tables include Craps, Sic Bo, Yahtzee-style dice, Farkle, Liar's Dice, Cee-lo, Bunco, Ship-Captain-Crew, Pig, Shut the Box and dice poker.

## Run locally

Because the app uses JavaScript modules, serve the repository over HTTP rather than opening `index.html` as a `file://` URL.

With Node installed:

```bash
npx serve .
```

Then open the local URL printed by the server.

GitHub Pages can host the static app directly from the repository.

## Verify

```bash
npm install
npm run check
```

The smoke test checks module syntax, catalog size/uniqueness and that every catalog entry can mount its engine with a lightweight test root. It is not a substitute for visual browser QA, gameplay balancing, exhaustive rules certification or accessibility testing.

## Online multiplayer — future update

Online PvP is not implemented in this branch. Current multiplayer-style tables use local bots only. The room adapter defines the seam for a later network transport but does not connect to a server.

See [docs/ONLINE_MULTIPLAYER.md](docs/ONLINE_MULTIPLAYER.md) for the planned account, room, authoritative game-state, WebSocket, persistence, reconnect and anti-cheat architecture. Future online games must have the server own the deck/randomness, valid actions, pot/balance state and settlement; clients should only send player intent.

## Credits and browser storage

The starting balance is 2,500 fictional credits. Balances, favorites, game history, stats and the once-daily demo bonus are stored locally in the browser. Reset local data from the Player Room to clear them.
