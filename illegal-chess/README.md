# Rogueboard — Chess, Unchained

Rogueboard is a standalone browser game in the illegal-chess/ directory. It takes the high-chaos chess idea in a new direction: pick a rolled crossover power, then use it to break the opponent's position.

## Play

After GitHub Pages publishes the repository, open:

https://lrv2017.github.io/RinconCasino/illegal-chess/

For local play, serve the repository root over HTTP and visit /illegal-chess/:

    npx serve .

## Current features

- **Chaos Chess:** each player rolls three random powers and locks in exactly one at the start of the match.
- **1,000 power cards:** 50 pop-culture universes × 20 named techniques. The current release uses seven core board effects (blast, teleport, freeze, shield, sniper, swap, and extra move) with card-specific costs/ranges. This is a 1,000-card roll pool, not 1,000 separately programmed physics systems.
- **Crossover references:** card names reference well-known shows, films and games as a fan-made tribute. Rogueboard is unofficial and is not affiliated with any rights holder. It does not use franchise logos, character art, music or ripped assets.
- **Private peer-to-peer rooms:** create a six-character room code or join a friend's code.
- **WebRTC live play:** the room uses PeerJS for signalling, then sends match actions and board snapshots over a WebRTC data channel. The room host validates moves and powers and sends authoritative state to the guest.
- **Classic Chess:** standard legal chess with check, checkmate, castling, en passant, promotion and draw rules.
- **Local Duel:** two players share one device.
- **Bots:** three difficulty settings for local play.
- **Training Lab:** mate-in-one puzzle and chaos sandbox.
- **Progression:** local rating, XP, levels, shards, daily contracts, achievements, and match counters.
- **Armory:** five cosmetic board skins.
- Responsive desktop and mobile layouts.

## Peer-to-peer notes

The host creates a room ID in the PeerJS signalling service. The guest connects to that ID, and the browsers establish a WebRTC data connection. This is not a dedicated game server, but it does rely on a signalling service for rendezvous; some network configurations may require a TURN relay. The host must keep the browser tab open for the match to continue.

The host is authoritative for board moves and power actions. This first release is intended for friendly private matches, not anti-cheat-secure ranked competition. There is no global matchmaking, public leaderboard, friends list, or chat yet.

## Saving and privacy

Progression is saved in the current browser's local storage. Online room codes are temporary. There is no account system or cloud save yet. Clearing browser data removes the local profile.

The first load requires an internet connection because chess.js and PeerJS are loaded as browser modules from CDNs.

## Project structure

- index.html — standalone site shell
- styles.css — responsive visual system
- app.js — chess gameplay, roll/draft UI, powers, bot, peer messages, and progression
- power-bank.js — 1,000 unique rollable power cards
- peer-room.js — PeerJS / WebRTC room transport

The existing Rincon Casino root app is not replaced by Rogueboard.
