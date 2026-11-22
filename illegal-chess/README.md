# Rogueboard — Chess, Unchained

Rogueboard is a standalone browser game inside the illegal-chess/ directory. It is inspired by the high-chaos chess concept: play ordinary chess, then break the rhythm with powers that change the board.

## Play

After GitHub Pages publishes the repository, open:

https://<your-pages-host>/<repository>/illegal-chess/

Run locally by serving the repository root over HTTP, then visit /illegal-chess/. For example:

    npx serve .

## Included in this first release

- Chaos Chess and Classic modes.
- Local two-player hotseat matches.
- Three bot difficulty settings (Rookie, Tactical, Ruthless).
- Full chess rules through chess.js: legal movement, check, checkmate, stalemate, castling, en passant, and promotion.
- Seven chaos powers: Rocket, Blink, Freeze, Shield, Sniper, Swap, and Double Time.
- Energy economy, board targeting, temporary freezes, and capture protection.
- A mate-in-one training puzzle and a chaos sandbox.
- Five cosmetic board skins.
- Local rating, XP, levels, shards, daily contracts, achievements, and match history counters.
- Responsive desktop and mobile layouts.

## Important scope notes

This is a client-side first release. Your progress is stored in this browser using local storage. There is no account system, cloud sync, matchmaking, server-authoritative multiplayer, public leaderboard, or anti-cheat service yet. Local Duel is hotseat play on the same device. The bot plays legal chess; it does not currently use powers.

The chess.js ES module is loaded from jsDelivr, so the first load requires an internet connection. No Roblox code, Roblox assets, or Roblox branding are included.

## Controls

- Click a piece, then click a highlighted destination to move.
- In Chaos mode, click a power card and then select the requested target square(s).
- Press Escape to cancel power targeting.
- Use Flip Board to change orientation.
- Use New Match to restart or Resign to end the current match.

## Project structure

- index.html — standalone page shell
- styles.css — responsive visual system
- app.js — chess gameplay, bot, powers, UI, local progression

Rogueboard is a separate sub-site. The existing Rincon Casino root application is not modified by these files.
