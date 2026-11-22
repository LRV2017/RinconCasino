# Rogueboard — Chess, Unchained

Rogueboard is a standalone browser chess game in the illegal-chess/ directory. Its Chaos mode uses a draft: each player rolls three crossover-inspired power cards and locks one for that match.

## Play

After GitHub Pages publishes the repository, open:

https://lrv2017.github.io/RinconCasino/illegal-chess/

For local play, serve the repository root over HTTP and visit /illegal-chess/:

    npx serve .

## Game features

- **Chaos Chess:** each player rolls three random power cards and locks one at the start of the match.
- **1,000-card power pool:** 50 pop-culture universes × 20 named signature techniques. The cards are unique themed variations backed by 20 implemented chess-effect archetypes (blast, clone, teleport, conversion, freeze, time stop, shield, fortify, sniper, drain, swap, exchange, haste, energy surge, summon, push, silence, promotion, rank prison, and pull). This is a 1,000-card collection, not 1,000 separately programmed physics systems.
- **Crossover references:** card names reference shows, films, and games as a fan-made tribute. Rogueboard is unofficial and is not affiliated with any rights holder. It does not use franchise logos, character art, music, or ripped assets.
- **Private peer-to-peer rooms:** create a six-character room code or join a friend's code.
- **WebRTC live play:** PeerJS brokers the initial room connection; game actions and board snapshots then travel over a WebRTC data channel. The host validates the moves/powers and relays the match state.
- **Classic Chess:** standard legal chess with check, checkmate, castling, en passant, promotion, and draw rules.
- **Local Duel:** two players can share one device.
- **Bots:** three local difficulty settings.
- **Training Lab:** mate-in-one puzzle and Chaos sandbox.
- **Progression:** rating, XP, levels, shards, daily contracts, achievements, and match counters.
- **Cosmetics:** unlockable board themes, piece sets, and quick emote reactions.
- **Accounts and cloud saves:** email/password accounts through Supabase Auth and a private per-user save row in Supabase Postgres. The browser keeps a local cache and asks which save to keep if the local and cloud copies differ.

## Account/cloud setup

Cloud accounts require a Supabase project owned by the site operator. The repository contains a public configuration template, SQL schema with Row Level Security policies, and step-by-step instructions:

- illegal-chess/ACCOUNTS.md
- illegal-chess/cloud-config.js
- supabase/rogueboard.sql

Until a Supabase Project URL and publishable key are entered in cloud-config.js and the SQL is run in Supabase, the Account screen shows setup instructions and the existing local profile continues to work.

The browser uses only the Supabase publishable key. Never expose a service-role or secret key in frontend code. The SQL restricts each save row to its authenticated owner.

## Peer-to-peer notes

The host creates a room ID in the PeerJS signalling service. The guest connects to that ID, and the browsers establish a WebRTC data connection. This is not a dedicated game server, but it does rely on a signalling service for rendezvous; some network configurations may require a TURN relay. The host must keep the browser tab open for the match to continue.

The host is authoritative for board moves and power actions within the current room. This is intended for friendly private matches, not anti-cheat-secure ranked competition. There is no global matchmaking or server-verified public leaderboard yet.

## Saving and privacy

Local progress is cached in this browser. Once Supabase is configured and an account is signed in, the player profile and progression are uploaded to that account's private save row. Passwords are handled by Supabase Auth and are not included in the save JSON.

Cloud saves are backups, not cheat-proof game state. Because the app is static and match hosting is peer-to-peer, a modified client can still tamper with its own stats.

## Project structure

- index.html — standalone page shell
- styles.css — responsive visual system
- app.js — chess gameplay, power draft, abilities, account UI, P2P messages, cosmetics, and progression
- power-bank.js — 1,000 unique crossover-themed power cards and 20 mechanics
- peer-room.js — PeerJS / WebRTC room transport
- cloud.js — Supabase Auth and cloud-save API
- cloud-config.js — public Supabase project URL and publishable-key template
- ../supabase/rogueboard.sql — private cloud-save table and RLS policies

The existing Rincon Casino root app is not replaced by Rogueboard.
