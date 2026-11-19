# Peer-to-peer rooms

Rincon's online mode uses WebRTC data channels through PeerJS. It does not require a dedicated RinconCasino game server or a persistent central room database.

## How rooms work

1. The host creates a room. Rincon generates an eight-character random code and registers a PeerJS peer ID.
2. The guest enters the code. PeerJS Cloud brokers the initial WebRTC signaling handshake.
3. Once connected, game moves and room chat flow over the WebRTC data channel. WebRTC data channels are encrypted in transit by the platform's DTLS layer.
4. The host is authoritative for the board state and validates every incoming move before broadcasting an updated snapshot.

PeerJS Cloud handles signaling only. Data normally flows directly between browsers; some NAT/firewall combinations may require a TURN relay. No central matchmaking list is provided. The host must keep the browser tab open. A room supports one host and one guest.

## Supported online games

- Tic-Tac-Toe
- Connect Four
- Reversi
- Gomoku

Chess, poker, dice contests and casino tables still use their existing local game modes. They are not yet network-enabled.

## Security and trust boundary

The host checks turn ownership, coordinates, occupied squares and each game's legal-move rules. The guest sends a move request, not a claimed winner or a replacement board state. This is suitable for casual board matches, but the host still controls the room and could modify its own browser. Do not use this architecture for real-money play, valuable balances or competitive prize games.

Room codes are invite secrets, not user accounts. Share them only with the intended guest. Closing the host tab closes the room. Reconnect and host migration are not implemented yet.

## GitHub save account

The static browser app does not embed an OAuth client secret. The player profile currently uses a user-created classic personal access token with only `gist` and `read:user` scopes. The token is kept in the current tab's `sessionStorage`; it is never sent to the multiplayer peer and never written into the save file.

Player data is stored in a GitHub **secret (unlisted) Gist**. GitHub explicitly warns that secret Gists are not private: anyone who obtains the Gist URL can read them. The save contains fictional-credit balance, favorites, recent results and aggregate stats only—never credentials or personal secrets.

## Known limitations

- Only two players per room.
- Four board-game modes are playable online.
- No public room browser, player search, moderation, reconnect grace period or host migration.
- PeerJS Cloud signaling and network access are required. Direct P2P may fail on some networks without TURN.
- Game outcomes are suitable for casual play only; the host controls the authoritative state.
