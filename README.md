# Rincon Casino — The Play Lounge

Rincon Casino is a static, browser-only, free-to-play game lounge. It uses fictional credits saved in the current browser. There are no deposits, payments, prizes, withdrawals or real-money gambling.

## The distinct-game catalog

The current catalog contains **56 actual game types across 16 categories**. Repeated room names and cosmetic table re-skins have been removed. Each catalog entry points to a distinct mode with its own rules and gameplay loop.

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
- **Russian Roulette** — six-chamber survival game against three local bots.
- **Demon’s Deal** — an original gadget-based survival showdown with hidden chambers and three local bots.

## Architecture

- `index.html` — app shell and game overlay
- `styles.css` — responsive visual system
- `src/catalog.js` — curated list of distinct game types
- `src/app.js` — lobby, search, favorites, demo wallet, rewards, history and stats
- `src/engines.js` — original casino, dice, poker and board-game engines
- `src/extra-games.js` — 14 new independent game loops
- `src/poker.js` — Hold'em and Omaha local tables
- `src/board.js` / `src/chess.js` — strategy games and bots
- `src/multiplayer.js` — PeerJS WebRTC invite rooms with Tic-Tac-Toe, Connect Four, Reversi and Gomoku
- `src/github-cloud.js` — GitHub account connection and save sync through a secret (unlisted) Gist
- `docs/ONLINE_MULTIPLAYER.md` — P2P room model, setup and trust boundaries

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

## Peer-to-peer rooms

Choose **Online rooms** in the lobby to create or join an eight-character invite room. Current online games are Tic-Tac-Toe, Connect Four, Reversi and Gomoku (two players). The host browser validates moves and sends board snapshots over a WebRTC data channel. PeerJS Cloud brokers the initial handshake; normal game data is peer-to-peer, though some restrictive networks may need a TURN relay. The host must keep its browser tab open. This mode is for friendly board matches, not a tamper-proof competitive economy. See [docs/ONLINE_MULTIPLAYER.md](docs/ONLINE_MULTIPLAYER.md).

## GitHub saves

Open the player profile and connect GitHub with a classic personal access token that has only `gist` and `read:user` scopes. The save syncs after balance, favorites, history or stats change. The token stays in the current browser tab's `sessionStorage` and is not written to the save file or repository. You may need to reconnect after closing the tab.

Saves are stored in a GitHub **secret (unlisted) Gist**. Secret Gists are not private: anyone who obtains the Gist URL can read them. The file contains fictional-credit balance, favorites, recent results and aggregate stats only—never credentials or personal secrets. See [GitHub's Gist visibility explanation](https://docs.github.com/en/get-started/writing-on-github/editing-and-sharing-content-with-gists/creating-gists).

All balances and outcomes are local fictional credits.
