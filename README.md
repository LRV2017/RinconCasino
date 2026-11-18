# Rincon Casino — The Play Lounge

Rincon Casino is a static, browser-only, free-to-play game lounge. It uses fictional credits saved in the current browser. There are no deposits, payments, prizes, withdrawals or real-money gambling.

## The distinct-game catalog

The current catalog contains **54 actual game types across 15 categories**. Repeated room names and cosmetic table re-skins have been removed. Each catalog entry points to a distinct mode with its own rules and gameplay loop.

### Existing core tables and arcade games

Roulette (European and American), Blackjack, Punto Banco Baccarat, Texas Hold'em, Pot-Limit Omaha, Jacks or Better, Deuces Wild, five-reel slots, 80-ball Keno, Craps, Sic Bo, Yahtzee, Farkle, Liar's Dice, Cee-lo, Bunco, Ship-Captain-Crew, Pig, Shut the Box, High-Low Dice, Dice Poker, Tic-Tac-Toe, Connect Four, Reversi, Gomoku, Battleship, Checkers, Nim, Dots and Boxes, Chess, Coin Flip, Plinko, Limbo, Crash Run, Mines, Hi-Lo Cards, Prize Wheel, Scratch Card and 6/49 Number Draw.

### Newly added independent games

- **Three Card Poker** — three-card rankings, ante/play choice and dealer qualification.
- **Casino War** — high-card comparison, tie, surrender and a three-unit war wager.
- **Red Dog** — two-card spread and third-card outcome.
- **Caribbean Stud Poker** — five-card player/dealer comparison and 2× raise.
- **Let It Ride** — three wager units, two community cards, pull-back choices and poker paytable.
- **Pai Gow Poker** — player sets a five-card high hand and two-card low hand against a house way.
- **Chuck-a-Luck** — three-dice number wager.
- **Crown and Anchor** — three symbol dice and match-count payouts.
- **75-Ball Bingo** — real B-I-N-G-O card layout with three house cards.
- **Mancala (Kalah)** — sowing, captures, extra turns and a look-ahead bot.
- **Mastermind** — ten-guess code-breaking puzzle with exact/colour-only feedback.
- **Memory Match** — 4×4 concentration board with eight matching pairs.
- **Minesweeper** — 9×9 board with number clues, flags and flood-reveal.
- **Klondike Solitaire** — seven tableau columns, stock, waste and suit foundations.

## Architecture

- `index.html` — app shell and game overlay
- `styles.css` — responsive visual system
- `src/catalog.js` — curated list of distinct game types
- `src/app.js` — lobby, search, favorites, demo wallet, rewards, history and stats
- `src/engines.js` — original casino, dice, poker and board-game engines
- `src/extra-games.js` — 14 new independent game loops
- `src/poker.js` — Hold'em and Omaha local tables
- `src/board.js` / `src/chess.js` — strategy games and bots
- `src/room-adapter.js` — local room abstraction and future network adapter seam
- `docs/ONLINE_MULTIPLAYER.md` — future server-authoritative multiplayer plan

## Run locally

Because the app uses JavaScript modules, serve the repository over HTTP rather than opening `index.html` directly.

```bash
npx serve .
```

GitHub Pages can host this static app.

## Verify

```bash
npm run check
```

The automated smoke suite syntax-checks the modules, verifies every catalog game has a unique ID and supported engine, mounts each game and triggers a first gameplay action. This is not exhaustive browser QA, rules certification or payout balancing.

## Online multiplayer — future update

Online PvP remains disabled. Competitive tables use local bots only. The room adapter is an architectural seam; it does not claim to connect online players. See [docs/ONLINE_MULTIPLAYER.md](docs/ONLINE_MULTIPLAYER.md) for the server-authoritative design.

All balances and outcomes are local fictional credits.
