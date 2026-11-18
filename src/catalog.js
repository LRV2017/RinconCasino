const groups = [
  ["Roulette","roulette","◉","table",[
    "European Roulette","American Roulette","French Roulette","French Roulette — La Partage","French Roulette — La Partage Table","Single Zero Roulette","Double Zero Roulette","Classic Roulette — Gold Room","Mini Table Roulette","Speed Table Roulette","Grand Roulette","VIP Roulette","Classic Roulette","Golden Wheel Roulette","Midnight Roulette","Royal Roulette","Casino Royale Wheel","High Roller Roulette","Zero Edge Roulette","Rincon Roulette"
  ]],
  ["Blackjack","blackjack","♠","table",[
    "Blackjack — Classic","Atlantic City Blackjack","Blackjack — European Room","Vegas Strip Blackjack","Blackjack — Gold Room","Blackjack — Velvet Room","Blackjack — The Garden","Blackjack — Night Lounge","Blackjack — High Stakes","Blackjack — Classic II","Blackjack — VIP Room","Blackjack — The Terrace","Blackjack — Silver Room","Blackjack — Midnight","Blackjack — Royal Table","Blackjack — Rincon Room","Blackjack — Speed Table","Blackjack — House Select","Blackjack — Private Room","Blackjack — Grand Table"
  ]],
  ["Baccarat","baccarat","♦","table",[
    "Punto Banco — Classic","Punto Banco — Mini Table","Punto Banco — Speed Table","Punto Banco — Gold Room","Punto Banco — Silver Room","Punto Banco — VIP Table","Punto Banco — Night Lounge","Punto Banco — Royal Room","Punto Banco — Grand Table","Punto Banco — Private Room","Punto Banco — The Terrace","Punto Banco — Garden Table","Punto Banco — High Stakes","Punto Banco — Classic II","Punto Banco — Rincon Room","Punto Banco — Velvet Room","Punto Banco — Midnight","Punto Banco — House Select","Punto Banco — Premier","Punto Banco — Grand Salon"
  ]],
  ["Poker Tables","poker","♣","table",[
    "Texas Hold'em","Texas Hold'em — Heads-Up","Texas Hold'em — Deep Stack","Pot-Limit Omaha","Texas Hold'em — Turbo Table","Texas Hold'em — Classic Table","Texas Hold'em — Night Table","Texas Hold'em — Gold Room","Texas Hold'em — Silver Room","Texas Hold'em — VIP Table","Texas Hold'em — Short Session","Texas Hold'em — High Stakes","Texas Hold'em — Rincon Room","Texas Hold'em — Grand Table","Texas Hold'em — Private Table","Texas Hold'em — 6-Max Seat","Texas Hold'em — The Terrace","Texas Hold'em — Velvet Room","Texas Hold'em — Midnight","Texas Hold'em — House Select"
  ]],
  ["Video Poker","videopoker","▣","arcade",[
    "Jacks or Better","Jacks or Better — Gold Room","Jacks or Better — Silver Room","Jacks or Better — Classic II","Deuces Wild","Jacks or Better — VIP Table","Jacks or Better — The Terrace","Jacks or Better — Night Lounge","Jacks or Better — Garden Table","Jacks or Better — Classic Table","Jacks or Better — High Stakes","Jacks or Better — Rincon Room","Jacks or Better — Grand Table","Jacks or Better — Velvet Room","Jacks or Better — Midnight","Jacks or Better — Private Table","Jacks or Better — Premier","Jacks or Better — House Select","Jacks or Better — Royal Room","Jacks or Better — Speed Table"
  ]],
  ["Slots","slots","✦","arcade",[
    "Golden Sevens","Midnight Riches","Emerald Fortune","Lucky Lanterns","Royal Reels","Desert Gold","Neon Nights","Pearl Palace","Wild Safari","Moonlight Millions","Temple of Fortune","Cash Cascade","Dragon's Hoard","Clover Club","Pharaoh's Fortune","Crystal Cavern","Velvet Vault","Starburst Lane","Rincon Reels","Jackpot Garden"]],
  ["Keno","keno","✳","arcade",[
    "Classic Keno","Quick Keno","Keno — 10 Spot Table","Keno — 8 Spot Table","Corner Keno","High Five Keno","Super Keno","Double Keno","Power Keno","Lucky Keno","Gold Keno","Rush Keno","80-Ball Keno","Caveman Keno","Diamond Keno","Fortune Keno","Keno — Short Table","Keno — Five Spot","Keno — Seven Spot","Rincon Keno"
  ]],
  ["Dice Games","dice","⚄","table",[
    "Craps","Sic Bo","Yahtzee","Farkle","Liar's Dice","Cee-lo","Bunco","Ship, Captain, Crew","Pig","Shut the Box","Craps — Hazard Table","Craps — Grand Table","High-Low Dice","High-Low Dice — Classic","Dice Poker","Cee-lo — House Table","Farkle — Hot Dice","Farkle — Ten Thousand","Yahtzee — House Table","Sic Bo — Grand Table"
  ]],
  ["Strategy & Bots","board","♟","strategy",[
    "Tic-Tac-Toe","Tic-Tac-Toe — Expert Bot","Connect Four","Connect Four — Expert Bot","Reversi","Othello","Gomoku","Five in a Row","Battleship","Battleship — Classic Fleet","Checkers","Checkers — House Match","Nim","Nim — Classic Piles","Dots and Boxes","Dots and Boxes — Expert Bot","Dots and Boxes — Classic","Four-in-a-Row Blitz","Reversi — Classic Table","Chess — Rincon Bot Arena"
  ]],
  ["Arcade & Wheels","wheel","◎","arcade",[
    "Coin Flip","Double or Nothing","Plinko","Lucky Plinko","Limbo","Crash Run","Mines","Treasure Grid","Hi-Lo Cards","Wheel of Fortune","Big Six Wheel","Prize Wheel","Multiplier Wheel","Color Wheel","Lucky 7 Wheel","High Roller Wheel","Rocket Cashout","Safecracker","Golden Ladder","Rincon Spin"]],
  ["Scratch Cards","scratch","▤","arcade",[
    "Lucky Clover Scratch","Golden Ticket","Triple Sevens Scratch","Diamond Mine","Treasure Chest","Cash Stack","Royal Flush Scratch","Lucky Horseshoe","Fortune Cookie","Emerald Scratch","Neon Jackpot","Wild West Gold","Dragon Scratch","Star Prize","Moon Money","Crown Jewels","Mystery Vault","Lucky Number 9","Double Diamond","Rincon Scratch"]],
  ["Number Draws","draw","▦","arcade",[
    "Rincon 6/49","Daily 6/49","Lucky 6/49","Quick Pick 6/49","Golden 6/49","Royal 6/49","Midnight 6/49","Grand 6/49","House 6/49","The Terrace 6/49","VIP 6/49","Silver 6/49","Gold 6/49","Velvet 6/49","Premier 6/49","Private 6/49","Fortune 6/49","Rincon 6/49 — Night Draw","Rincon 6/49 — Grand Draw","Rincon 6/49 — Classic Draw"
  ]]
];
const descriptions = {
  roulette:"Choose a pocket, color or outside bet. French La Partage returns half an even-money stake on zero.",
  blackjack:"Play your hand against the dealer. Get closer to 21 without going over.",
  baccarat:"Choose Player, Banker or Tie, then follow the classic third-card rules.",
  poker:"Play Texas Hold’em or Pot-Limit Omaha against a local house bot. No online seats yet.",
  videopoker:"Choose which cards to hold, draw replacements and beat the pay table.",
  slots:"Spin the reels, match symbols on active lines and collect the posted payout.",
  keno:"Pick your lucky numbers, draw the balls and compare your hits to the pay table.",
  dice:"Roll against the table or local opponents. Rules depend on the selected dice game.",
  board:"Challenge a local bot. The opponent uses game-specific search and tactical scoring.",
  wheel:"Choose a risk, make your call and let the wheel or multiplier resolve.",
  scratch:"Reveal the card, find matching symbols and check the printed prize rules.",
  draw:"Select numbers, enter the draw and see how many match."
};
const icons = {
  roulette:["◉","◎","◌"],blackjack:["♠","♥","♦","♣"],baccarat:["♦","♜","♛"],poker:["♣","♠","♥"],videopoker:["▣","♠","★"],slots:["✦","♛","7","♦","☼"],keno:["✳","▦","✧"],dice:["⚄","⚅","⚂"],board:["♟","✕","●","▦"],wheel:["◎","◉","↗","◇"],scratch:["▤","✦","♦"],draw:["▦","✳","◈"]
};
const gameCatalog = [];
let serial = 1;
for (const group of groups) {
  const category = group[0], engine = group[1], icon = group[2], kind = group[3], names = group[4];
  names.forEach((name, index) => {
    const id = engine + "-" + String(index + 1).padStart(2,"0");
    let mode = "classic";
    if (engine === "dice") mode = ["craps","sicbo","yahtzee","farkle","liars","ceelo","bunco","ship","pig","shutbox","craps","craps","highlow","highlow","dice-poker","ceelo","farkle","farkle","yahtzee","sicbo"][index];
    if (engine === "board") mode = ["ttt","ttt","connect4","connect4","reversi","reversi","gomoku","gomoku","battleship","battleship","checkers","checkers","nim","nim","dots","dots","dots","connect4","reversi","chess"][index];
    if (engine === "wheel") mode = ["coin","coin","plinko","plinko","limbo","crash","mines","mines","hilo","wheel","wheel","wheel","wheel","wheel","coin","wheel","crash","mines","limbo","wheel"][index];
    const item = {
      id, number:serial++, name, category, engine, mode, kind, icon:icons[engine][index%icons[engine].length],
      description:descriptions[engine],
      featured: serial <= 7 || [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20].includes(index+1) && index < 3,
      tags:[category.toLowerCase(),engine,mode],
      rules:engine === "roulette" ? (index===1 || index===6 ? "American double-zero wheel: 0 and 00 are green. Straight-up bets pay 35 to 1; red/black and even-money outside bets pay 1 to 1." : "European single-zero wheel: 0 is green. Straight-up bets pay 35 to 1; red/black and even-money outside bets pay 1 to 1.") :
        engine === "blackjack" ? "Dealer follows the table's posted soft-17 rule. Beat the dealer without busting. Natural blackjack pays 3:2 unless this table says otherwise." :
        engine === "baccarat" ? "The hand closest to 9 wins. Player and Banker draw according to standard baccarat third-card rules. Banker wins pay 0.95:1 after commission; Tie pays 8:1." :
        engine === "poker" ? "Local bot table only. Betting rounds, folds, calls, raises, blinds and showdown are simulated on this device. Multiplayer networking is reserved for a future update." :
        engine === "videopoker" ? "Hold any cards you want to keep, draw replacements, then compare the final five-card hand to the pay table." :
        engine === "slots" ? "The reels spin independently. Matching symbols on a payline award the displayed multiplier. All results use fictional credits." :
        engine === "keno" ? "Choose between 1 and 10 spots. Twenty unique balls are drawn from 80; payout depends on your number of hits and spots selected." :
        engine === "dice" ? "Read the table rules before rolling. The game uses the named dice rules and local CPU opponents where applicable." :
        engine === "board" ? "Take turns against a local strategy bot. The bot evaluates legal moves and game-specific tactical positions; no online multiplayer is connected." :
        engine === "wheel" ? "Choose a risk profile and wager, then use the game's unique wheel, grid or multiplier rules to resolve the round." :
        engine === "scratch" ? "Pay for a card, reveal the covered spaces and compare matching symbols with the card's prize rules." :
        "Choose your numbers and match them against a random draw. Every result is local and uses fictional credits only."
    };
    gameCatalog.push(item);
  });
}
export { gameCatalog };
