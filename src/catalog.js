const gameCatalog=[];
const counters={};
function add(name,category,engine,mode,icon,description,rules,featured=false){
  counters[engine]=(counters[engine]||0)+1;
  const id=engine+"-"+String(counters[engine]).padStart(2,"0");
  gameCatalog.push({
    id,number:gameCatalog.length+1,name,category,engine,mode,kind:["board","poker","dice"].includes(engine)?"strategy":"table",
    icon,description,rules,featured,tags:[category.toLowerCase(),engine,mode]
  });
}
add("European Roulette","Roulette","roulette","classic","◉","Single-zero wheel with inside and outside bets.","37 pockets: 0–36. Straight-up pays 35:1; standard even-money outside bets pay 1:1.",true);
add("American Roulette","Roulette","roulette","classic","◎","Double-zero roulette with a different house edge.","38 pockets including 0 and 00. Straight-up pays 35:1; outside bets lose on either zero.");
add("Blackjack","Blackjack","blackjack","classic","♠","Play the dealer to 21 with hit, stand, double and split.","Six-deck shoe. Dealer stands on soft 17. Natural blackjack pays 3:2.",true);
add("Punto Banco Baccarat","Baccarat","baccarat","classic","♦","Bet on Player, Banker or Tie using standard baccarat drawing rules.","Hands aim for 9. Player and Banker third-card rules are applied; Banker wins pay 0.95:1, Tie 8:1.");
add("Texas Hold'em","Poker","poker","holdem","♣","Six-seat no-limit Hold’em against five local CPU opponents with distinct table personalities.","Two hole cards, five community cards, rotating blinds, multiway betting and side pots across six seats.",true);
add("Pot-Limit Omaha","Poker","poker","omaha","♠","Six-seat Pot-Limit Omaha against five local CPU opponents. Use exactly two of four hole cards with three community cards.","Pot-limit betting. Exactly two hole cards and three board cards form the final hand.");
add("Jacks or Better","Video Poker","videopoker","jacks","▣","Five-card draw video poker. Hold cards and draw replacements.","A pair of Jacks or better pays. Higher poker combinations pay according to the displayed paytable.");
add("Deuces Wild","Video Poker","videopoker","deuces","🃏","Video poker with every 2 acting as a wild card.","Twos are wild. The final five-card hand is evaluated with wild-card rules.");
add("Five-Reel Slots","Slots","slots","classic","✦","Five reels, three rows and ten active paylines.","Match three or more symbols from the left on one of ten paylines.");
add("80-Ball Keno","Keno","keno","classic","✳","Pick up to ten spots and compare them with twenty drawn balls.","Twenty unique numbers are drawn from 1–80. Payout depends on spots and hits.");
add("Craps — Pass Line","Dice Games","dice","craps","⚄","Classic pass-line craps with come-out and point phases.","7 or 11 wins on come-out; 2, 3 or 12 loses. Establish a point and roll it before a 7.");
add("Sic Bo","Dice Games","dice","sicbo","⚅","Bet on totals, parity, Big, Small or triples.","Three dice. Big/Small exclude triples; an Any Triple wager pays 30:1.");
add("Yahtzee","Dice Games","dice","yahtzee","⚂","Roll five dice up to three times and score combinations.","Keep chosen dice between rolls. Score five-of-a-kind, full house, straights and other combinations.");
add("Farkle","Dice Games","dice","farkle","🎲","Risk your turn points by rolling the remaining scoring dice.","Select scoring dice, keep them, reroll or bank. A Farkle ends the turn and loses unbanked points.");
add("Liar's Dice","Dice Games","dice","liars","🎭","Four-seat hidden-dice bluffing game against house bots.","Bid the total quantity of a face under all cups or challenge the previous bid.");
add("Cee-lo","Dice Games","dice","ceelo","🎲","Four-player Cee-lo table against three local bots, using 4-5-6, triples, points and 1-2-3.","4-5-6 is strongest, 1-2-3 is weakest; triples and pairs are ranked by Cee-lo rules.");
add("Bunco","Dice Games","dice","bunco","🎯","Six rounds of target-number dice scoring against three local competitors with separate scoreboards.","Roll three dice for the round's target. A triple target is a Bunco and scores 21.");
add("Ship, Captain, Crew","Dice Games","dice","ship","🚢","Race three local competitors to build a ship, captain and crew before comparing cargo.","Up to three rolls. Lock 6, then 5, then 4 in order; remaining dice are cargo.");
add("Pig","Dice Games","dice","pig","🐷","Four-player race to 100 against three bots with different risk thresholds.","A 1 busts the current turn. Choose when to hold to protect points.");
add("Shut the Box","Dice Games","dice","shutbox","▦","Close numbered tiles that add up to each dice total.","Roll one or two dice depending on remaining tiles. Close an exact combination to reduce your final score.");
add("High-Low Dice","Dice Games","dice","highlow","⚄","Predict whether three dice total 11–18 or 3–10.","Call High or Low before the roll. A correct call returns twice the wager.");
add("Dice Poker","Dice Games","dice","dice-poker","♣","Roll five dice and challenge the house to a poker-style hand.","Roll and hold five dice over three rolls, then compare your poker hand against four local opponents.");
add("Tic-Tac-Toe","Strategy & Board","board","ttt","✕","Play X against a perfect minimax opponent.","Three in a row wins. The bot searches the complete game tree.");
add("Connect Four","Strategy & Board","board","connect4","●","Drop tokens into a seven-column board against a search-based bot.","Connect four horizontally, vertically or diagonally. The bot uses tactical minimax search.");
add("Reversi","Strategy & Board","board","reversi","◉","Capture lines of opposing discs and control the board.","A legal move brackets one or more opposing discs. The bot evaluates corners, mobility and position.");
add("Gomoku","Strategy & Board","board","gomoku","⚫","Make five in a row on a 15×15 board against a tactical bot.","First to connect five stones horizontally, vertically or diagonally wins.");
add("Battleship","Strategy & Board","board","battleship","▤","Hunt the house fleet on a hidden 10×10 grid.","Sink all four hidden ships. The bot switches from hunt mode to target mode after a hit.");
add("Checkers","Strategy & Board","board","checkers","⚫","Move, jump and promote pieces against a search-based opponent.","Diagonal movement, mandatory captures, multi-jumps and king promotion.");
add("Nim","Strategy & Board","board","nim","▥","Take tokens from four piles against an optimal Nim bot.","Remove at least one and any number from one pile. The player taking the last token wins.");
add("Dots and Boxes","Strategy & Board","board","dots","▦","Draw edges, complete boxes and keep scoring extra turns.","Complete all nine boxes. A player who draws the fourth edge claims that box and plays again.");
add("Chess","Strategy & Board","board","chess","♚","Full chess rules against a search-based local opponent.","Legal moves, check, checkmate, stalemate, castling, en passant and queen promotion.");
add("Coin Flip","Arcade","wheel","coin","◉","Call heads or tails before the coin lands.","A correct call pays 1:1; an incorrect call loses the stake.");
add("Plinko","Arcade","wheel","plinko","◎","Drop a chip through a ten-row peg board with selectable risk.","The chip's route determines a slot multiplier. Low, medium and high risk use different payout profiles.");
add("Limbo","Arcade","wheel","limbo","↗","Set a multiplier target and see whether the random result clears it.","Higher target multipliers have lower hit probability. Cashout is automatic at the chosen target.");
add("Crash Run","Arcade","wheel","crash","🚀","Watch a multiplier climb and cash out before the crash point.","A random crash point ends the run. Cash out at the current multiplier to secure the return.");
add("Mines","Arcade","wheel","mines","✹","Reveal gems on a 5×5 grid and cash out before hitting a mine.","Three hidden mines. Each safe reveal increases the multiplier; a mine ends the round.");
add("Hi-Lo Cards","Arcade","wheel","hilo","♥","Predict whether the next card is higher or lower and build a multiplier.","A correct prediction increases the multiplier. Cash out at any time or lose on a wrong call.");
add("Prize Wheel","Arcade","wheel","wheel","🎡","Spin a weighted multiplier wheel.","The wheel contains zero, small and large multipliers. The landing segment decides the result.");
add("Scratch Card","Scratch Cards","scratch","classic","▤","Reveal a 3×3 scratch card and match symbols for prizes.","Three matching symbols pay the printed multiplier; otherwise the stake is lost.");
add("6/49 Number Draw","Number Draws","draw","classic","▦","Pick six numbers and compare them with a random 6/49 draw.","Six unique numbers are drawn from 1–49. The prize multiplier depends on the number of matches.");

add("Three Card Poker","New Poker Tables","extra","three-card-poker","♠","Play a three-card poker hand against the dealer with Ante and Play decisions.","Three-card rankings: straight flush, three of a kind, straight, flush, pair and high card. Dealer qualifies with Queen-high or better.");
add("Casino War","New Poker Tables","extra","casino-war","⚔","A head-to-head high-card draw with a real War or Surrender decision on ties.","Higher card wins. On a tie, surrender half or add a three-unit war wager; burn three cards before the war draw.");
add("Red Dog","New Poker Tables","extra","red-dog","♦","A two-card spread game where the third card must land between the first two.","Pairs push, consecutive cards pay 11:1, and a successful third card pays according to the spread.");
add("Caribbean Stud Poker","New Poker Tables","extra","caribbean-stud","♣","Five-card poker against the dealer with an Ante, Fold or 2× Raise decision.","Dealer qualifies with Ace-King or better. If qualified, compare five-card poker ranks; ante and raise pay even money.");
add("Let It Ride","New Poker Tables","extra","let-it-ride","♥","Three equal bets, three private cards and two community cards.","Pull back one bet before each community card or let it ride. Final five-card poker hand uses a fixed paytable.");
add("Pai Gow Poker","New Poker Tables","extra","pai-gow","🀄","Split seven cards into a five-card high hand and two-card low hand against the house way.","Both player hands must beat the dealer's corresponding hands to win. One win and one loss is a push.");
add("Chuck-a-Luck","New Dice Tables","extra","chuck-a-luck","⚄","Pick a face from one to six and roll three dice.","One matching die pays 1:1, two matches 2:1 and three matches 3:1.");
add("Crown and Anchor","New Dice Tables","extra","crown-anchor","⚓","Choose a traditional symbol and roll three symbol dice.","Each matching symbol pays 1:1; multiple matches multiply the wager.");
add("75-Ball Bingo","Puzzle & Classics","extra","bingo-75","B","Compete against three house cards on a real 5×5 Bingo card.","75 unique balls, B-I-N-G-O number ranges, free centre and horizontal, vertical or diagonal line wins.");
add("Mancala (Kalah)","Puzzle & Classics","extra","mancala","●","Sow stones, capture opposite pits and race for the most seeds.","Kalah rules include extra turns for landing in your store, captures on empty pits and end-game sweeping. Bot searches ahead.");
add("Mastermind","Puzzle & Classics","extra","mastermind","◈","Crack a hidden four-colour code in ten guesses.","Exact feedback counts correct colour and position; colour-only feedback counts correct colours in other positions.");
add("Memory Match","Puzzle & Classics","extra","memory-match","▣","Find eight matching pairs on a 4×4 concentration board.","Flip two cards per move. Match every pair to complete the board; fewer moves earns a higher reward.");
add("Minesweeper","Puzzle & Classics","extra","minesweeper","✹","Clear a 9×9 logic grid without revealing any of its ten mines.","Number clues show adjacent mines. Flag suspected mines and reveal all 71 safe squares to win.");
add("Klondike Solitaire","Puzzle & Classics","extra","klondike","♠","Classic seven-column solitaire with stock, waste and four foundations.","Build descending alternating-colour tableau sequences and suit foundations from Ace through King.");

add("Russian Roulette","Party Games","extra","russian-roulette","🎲","A four-seat local-bot survival game with one hidden danger token in each six-token chamber.","Take turns revealing sealed tokens. A danger marker costs a life; last player remaining wins.");
add("Devil’s Chamber","Party Games","extra","devils-chamber","😈","A tense four-seat bluff-and-risk party game with hidden outcomes, limited gadgets and smart local rivals.","Choose yourself or another player as the target. Use the Demon Lens to peek and the Soul Ward to block one hit; a safe self-target earns another turn.");

add("Russian Roulette","Party Survival","extra","russian-roulette","🎯","A tense four-seat survival game against three local opponents. One virtual chamber is loaded per six-shot cycle.","Take turns drawing a hidden chamber. One loaded round eliminates its player; blanks keep the table moving until one player remains.");
add("Demon's Deal","Party Survival","extra","demons-deal","👹","A dark-fantasy four-player showdown with hidden rounds, tactical gadgets and rival-targeting.","Two charged rounds and four blanks per cycle. Use the Oracle Lens, Ward and Hex to bluff, protect or outplay three local bots.");

export {gameCatalog};
