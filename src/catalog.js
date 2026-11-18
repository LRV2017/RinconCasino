const groups = [
  ["Roulette","roulette","◉","table",[
    "European Roulette","American Roulette","French Roulette","La Partage Roulette","En Prison Roulette","Single Zero Roulette","Double Zero Roulette","Lightning Roulette","Mini Roulette","Speed Roulette","Grand Roulette","VIP Roulette","Classic Roulette","Golden Wheel","Midnight Roulette","Royal Roulette","Casino Royale Wheel","High Roller Roulette","Zero Edge Roulette","Rincon Roulette"]],
  ["Blackjack","blackjack","♠","table",[
    "Classic Blackjack","Atlantic City Blackjack","European Blackjack","Vegas Strip Blackjack","Spanish 21","Pontoon","Double Exposure Blackjack","Blackjack Switch","Super Fun 21","Perfect Pairs Blackjack","Double Attack Blackjack","Free Bet Blackjack","Surrender Blackjack","Single Deck Blackjack","Double Deck Blackjack","Eight Deck Blackjack","High Stakes Blackjack","Premium Blackjack","Speed Blackjack","Rincon Blackjack"]],
  ["Baccarat","baccarat","♦","table",[
    "Punto Banco","Chemin de Fer","Baccarat Banque","Mini Baccarat","Speed Baccarat","No Commission Baccarat","EZ Baccarat","Dragon Bonus Baccarat","Panda 8 Baccarat","Fortune 6 Baccarat","Golden Baccarat","VIP Baccarat","Classic Baccarat","High Roller Baccarat","Squeeze Baccarat","Super 6 Baccarat","Lightning Baccarat","Royal Baccarat","Salon Baccarat","Rincon Baccarat"]],
  ["Poker Tables","poker","♣","table",[
    "Texas Hold'em","No-Limit Hold'em","Limit Hold'em","Pot-Limit Omaha","Omaha Hi-Lo","Short Deck Hold'em","Pineapple Hold'em","Crazy Pineapple","Five-Card Draw","Seven-Card Stud","Razz Poker","Seven-Card Stud Hi-Lo","Triple Draw Lowball","2-7 Single Draw","Heads-Up Hold'em","Deep Stack Hold'em","Turbo Hold'em","Sit & Go Hold'em","Six-Max Hold'em","Rincon Hold'em"]],
  ["Video Poker","videopoker","▣","arcade",[
    "Jacks or Better","Bonus Poker","Double Bonus Poker","Double Double Bonus","Deuces Wild","Joker Poker","Tens or Better","Aces and Faces","Bonus Deuces Wild","Loose Deuces","White Hot Aces","All American Poker","Pick'em Poker","Multi-Strike Poker","Super Bonus Poker","Royal Aces","Double Jackpot Poker","Triple Play Poker","Five Play Poker","Rincon Video Poker"]],
  ["Slots","slots","✦","arcade",[
    "Golden Sevens","Midnight Riches","Emerald Fortune","Lucky Lanterns","Royal Reels","Desert Gold","Neon Nights","Pearl Palace","Wild Safari","Moonlight Millions","Temple of Fortune","Cash Cascade","Dragon's Hoard","Clover Club","Pharaoh's Fortune","Crystal Cavern","Velvet Vault","Starburst Lane","Rincon Reels","Jackpot Garden"]],
  ["Keno","keno","✳","arcade",[
    "Classic Keno","Quick Keno","10-Spot Keno","8-Spot Keno","Corner Keno","High Five Keno","Super Keno","Double Keno","Power Keno","Lucky Keno","Gold Keno","Rush Keno","80-Ball Keno","Caveman Keno","Diamond Keno","Fortune Keno","Pick 3 Keno","Pick 5 Keno","Pick 7 Keno","Rincon Keno"]],
  ["Dice Games","dice","⚄","table",[
    "Craps","Sic Bo","Yahtzee","Farkle","Liar's Dice","Cee-lo","Bunco","Ship, Captain, Crew","Pig Dice","Shut the Box","Hazard","Grand Hazard","Under-Over 7","High Dice","Dice Poker","Chicago Dice","Ten Thousand","Greedy","Balut","Rincon Dice"]],
  ["Strategy & Bots","board","♟","strategy",[
    "Tic-Tac-Toe","Ultimate Tic-Tac-Toe","Connect Four","PopOut Connect Four","Reversi","Othello","Gomoku","Five in a Row","Battleship","Salvo Battleship","Checkers","International Draughts","Nim","Marienbad","Dots and Boxes","Sprouts","Nine Men's Morris","Four-in-a-Row Blitz","Reversi Classic","Rincon Arena"]],
  ["Arcade & Wheels","wheel","◎","arcade",[
    "Coin Flip","Double or Nothing","Plinko","Lucky Plinko","Limbo","Crash Run","Mines","Treasure Grid","Hi-Lo Cards","Wheel of Fortune","Big Six Wheel","Prize Wheel","Multiplier Wheel","Color Wheel","Lucky 7 Wheel","High Roller Wheel","Rocket Cashout","Safecracker","Golden Ladder","Rincon Spin"]],
  ["Scratch Cards","scratch","▤","arcade",[
    "Lucky Clover Scratch","Golden Ticket","Triple Sevens Scratch","Diamond Mine","Treasure Chest","Cash Stack","Royal Flush Scratch","Lucky Horseshoe","Fortune Cookie","Emerald Scratch","Neon Jackpot","Wild West Gold","Dragon Scratch","Star Prize","Moon Money","Crown Jewels","Mystery Vault","Lucky Number 9","Double Diamond","Rincon Scratch"]],
  ["Number Draws","draw","▦","arcade",[
    "Pick 3","Pick 4","Pick 5","Daily 6","Lucky 7 Draw","Mega 49","Power 60","Euro 50","Quick Pick","Cash Five","Lucky Stars","Daily Keno Draw","Triple Match","Double Draw","Millionaire's Row","Golden Numbers","Fortune 20","Rincon 6/49","Rincon 5/50","Grand Number Draw"]]
];
const descriptions = {
  roulette:"Choose a pocket, color or outside bet. The wheel decides the result.",
  blackjack:"Play your hand against the dealer. Get closer to 21 without going over.",
  baccarat:"Choose Player, Banker or Tie, then follow the classic third-card rules.",
  poker:"Play a real card-table variant against local house bots. No online seats yet.",
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
    if (engine === "dice") mode = ["craps","sicbo","yahtzee","farkle","liars","ceelo","bunco","ship","pig","shutbox","craps","craps","sicbo","sicbo","yahtzee","dice-poker","farkle","farkle","yahtzee","sicbo"][index];
    if (engine === "board") mode = ["ttt","ttt","connect4","connect4","reversi","reversi","gomoku","gomoku","battleship","battleship","checkers","checkers","nim","nim","dots","dots","morris","connect4","reversi","connect4"][index];
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
