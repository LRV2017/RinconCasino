# Online multiplayer — future update contract

Rincon Casino currently runs entirely in the browser. Head-to-head games use local CPU opponents; there are no accounts, public rooms, sockets, server wagers or online player actions in this release.

## Boundary already established

Game screens are mounted independently from the lobby. The src/room-adapter.js module defines a small room adapter contract and a local implementation for development. NetworkRoomAdapter deliberately refuses to run without a supplied transport. It does not simulate successful networking.

## Recommended server-authoritative design

1. Identity and sessions: authenticated user IDs, short-lived session tokens, rate limits and device/session revocation.
2. Room service: create/join/leave, public/private rooms, seat limits, ready checks, invitations, reconnect grace periods and room discovery.
3. Authoritative game service: server owns the deck, shuffle seed, dice/RNG, current state, pot, balances, legal-action validation and settlement. Never trust a browser to report a winner or payout.
4. Transport: authenticated WebSocket events with monotonically increasing room versions, action IDs for idempotency, acknowledgements and snapshot resync.
5. Persistence: durable credit ledger, hand histories, account profile, game stats and audit events. Keep the demo-credit model separate from any future production economy.
6. Bots: the same game reducer and legal-action API should serve both human and bot seats. Bot decisions must be validated server-side like human actions.
7. Abuse controls: per-action throttles, stale-turn rejection, reconnect tokens, tamper-evident hand logs, deterministic replay tests and server-only secrets.

## Event contract

- room:create / room:created
- room:join / room:joined
- room:leave / room:left
- room:state — versioned authoritative snapshot
- game:action — { roomId, actionId, expectedVersion, action }
- game:ack — accepted/rejected action and resulting version
- game:result — server-calculated result and ledger reference

The client should display server snapshots and submit intent only. It must not calculate authoritative card draws, random outcomes, table balances or payouts once online rooms exist.
