# Peer-to-peer rooms

Rincon's private online rooms use PeerJS to establish WebRTC data channels. RinconCasino does not run a dedicated game server or persistent room database for these matches.

## How rooms work

1. The host chooses a supported game and creates a private room. Rincon generates an eight-character invite code and registers a PeerJS peer ID.
2. The guest enters the invite code. PeerJS Cloud brokers the initial WebRTC signalling handshake.
3. After the connection is established, gameplay messages travel over a reliable WebRTC data channel. The host validates each move and sends the resulting game state.
4. The host browser remains authoritative for the game reducer. A guest sends a move request, not a replacement board or a claimed winner.

PeerJS Cloud handles signalling, not the game itself. Game traffic normally travels directly between browsers. Some NAT/firewall combinations require a TURN relay, in which case traffic may be relayed. The host must keep the page open. Current rooms support one host and one guest.

## Supported online games

These ten game modes have online, two-player room reducers:

- Tic-Tac-Toe
- Connect Four
- Reversi
- Gomoku
- Chess (legal moves, check/checkmate and stalemate through the shared chess rules module)
- Checkers (mandatory captures, crowning and chained jumps)
- Battleship (random fleets, alternating shots and player-specific state snapshots that do not expose the opposing fleet)
- Mancala / Kalah (sowing, captures, store landing extra turns and end-game sweep)
- Nim (four piles, one-pile removal and last-token winner)
- Dots and Boxes (edge claims, box scoring and extra turns after completing a box)

Press **ONLINE** on one of these game cards to open the room lobby with that game preselected, or use **Online rooms** in the header to choose a game from the full list.

## Games not yet network-enabled

These catalog games still use their existing local bot tables and need their own multiplayer state reducers before they can safely run over P2P:

- Texas Hold'em and Pot-Limit Omaha
- Liar's Dice, Cee-lo, Bunco, Ship-Captain-Crew, Pig and Dice Poker
- 75-Ball Bingo
- Russian Roulette and Demon's Deal

Single-player casino games and puzzle modes remain local by design. The room layer is shared, but each game's rules and hidden information still require a dedicated validated reducer; simply broadcasting UI clicks would not make a safe or fair multiplayer game.

## Security and trust boundary

The host validates turn ownership, board coordinates, piece movement, capture rules and each supported game's win conditions before broadcasting state. For Battleship, each peer receives only their own fleet, their outgoing shots and incoming shots against their own fleet; the other player's unhit fleet positions are not included in the snapshot.

This is appropriate for casual friendly matches only. The host controls the authoritative game process and could modify its own browser. Do not use this architecture for real-money play, valuable balances or competitive prize games.

Room codes are invite secrets, not accounts. Share them only with the intended guest. Closing the host tab closes the room. Public matchmaking, room discovery, moderation, reconnect grace periods and host migration are not implemented. A TURN relay may be required on restrictive networks.

## Player data

The current room transport does not send GitHub save tokens or player save data to the peer. Multiplayer rooms are temporary sessions; game outcomes are not currently written to account profiles or cloud saves.
