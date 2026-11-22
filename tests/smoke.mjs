import assert from "node:assert/strict";
import { gameCatalog } from "../src/catalog.js";
import { mountGame } from "../src/engines.js";
import { createRoomBoard, applyRoomMove, ONLINE_ROOM_MODES, getPublicRoomState } from "../src/multiplayer.js";

assert.equal(gameCatalog.length,56,"catalog should contain 56 distinct game types");
assert.equal(new Set(gameCatalog.map(game=>game.id)).size,56,"game IDs must be unique");
assert.equal(new Set(gameCatalog.map(game=>game.name)).size,56,"game names must be unique");
assert.equal(new Set(gameCatalog.map(game=>game.category)).size,16,"catalog should contain 16 categories");
const supported=["roulette","blackjack","baccarat","poker","videopoker","slots","keno","dice","board","wheel","scratch","draw","extra"];

const tic=createRoomBoard("ttt");
let ticState=applyRoomMove(tic,0,{i:0});
assert.ok(ticState,"first Tic-Tac-Toe move should be accepted");
assert.equal(applyRoomMove(ticState,1,{i:0}),null,"occupied Tic-Tac-Toe squares must be rejected");
ticState=applyRoomMove(ticState,1,{i:3});
ticState=applyRoomMove(ticState,0,{i:1});
ticState=applyRoomMove(ticState,1,{i:4});
ticState=applyRoomMove(ticState,0,{i:2});
assert.equal(ticState.winner,0,"Tic-Tac-Toe must detect a winning line");

let connect=createRoomBoard("connect4");
for(const col of [0,1,0,1,0,1,0]){
  const player=connect.turn;
  connect=applyRoomMove(connect,player,{c:col});
}
assert.equal(connect.winner,0,"Connect Four must detect a vertical four");

let reversi=createRoomBoard("reversi");
reversi=applyRoomMove(reversi,0,{r:2,c:3});
assert.ok(reversi,"standard Reversi opening move should be legal");
assert.equal(reversi.board[3][3],1,"Reversi must flip the enclosed opposing disc");

let gomoku=createRoomBoard("gomoku");
for(const c of [3,4,5,6,7]){
  gomoku=applyRoomMove(gomoku,0,{r:7,c});
  if(c<7)gomoku=applyRoomMove(gomoku,1,{r:0,c:c-3});
}
assert.equal(gomoku.winner,0,"Gomoku must detect five in a row");


assert.deepEqual(ONLINE_ROOM_MODES,["ttt","connect4","reversi","gomoku","chess","checkers","battleship","mancala","nim","dots"],"the online lobby should expose every enabled head-to-head game");

let chess=createRoomBoard("chess");
chess=applyRoomMove(chess,0,{from:{r:6,c:4},to:{r:4,c:4}});
assert.ok(chess,"e2-e4 should be accepted by the online chess rules");
assert.equal(chess.position.board[4][4],"P");
assert.equal(chess.turn,1);
assert.equal(applyRoomMove(chess,0,{from:{r:1,c:4},to:{r:3,c:4}}),null,"out-of-turn chess moves must be rejected");
chess=applyRoomMove(chess,1,{from:{r:1,c:4},to:{r:3,c:4}});
assert.ok(chess,"e7-e5 should be accepted by the online chess rules");

let checkers=createRoomBoard("checkers");
checkers=applyRoomMove(checkers,0,{from:{r:5,c:0},to:{r:4,c:1}});
assert.ok(checkers,"a legal opening checkers move should be accepted");
assert.equal(checkers.turn,1);
assert.equal(applyRoomMove(checkers,1,{from:{r:2,c:1},to:{r:4,c:3}}),null,"a checkers jump over an empty square must be rejected");

let battle=createRoomBoard("battleship");
battle=applyRoomMove(battle,0,{r:0,c:0});
assert.ok(battle,"a first Battleship shot should be accepted");
assert.equal(battle.turn,1);
assert.equal(applyRoomMove(battle,0,{r:0,c:1}),null,"a Battleship player cannot move out of turn");
battle=applyRoomMove(battle,1,{r:0,c:0});
battle=applyRoomMove(battle,0,{r:0,c:1});
assert.equal(applyRoomMove(battle,1,{r:0,c:0}),null,"a player cannot shoot the same coordinate twice");
const guestView=getPublicRoomState(battle,1);
assert.equal(guestView.fleets,undefined,"a guest must never receive the hidden full fleet arrays");
assert.ok(Array.isArray(guestView.ownFleet)&&Array.isArray(guestView.outgoingShots)&&Array.isArray(guestView.incomingShots),"Battleship should expose only the guest's own fleet and public shot history");

let mancala=createRoomBoard("mancala");
mancala=applyRoomMove(mancala,0,{pit:0});
assert.ok(mancala);
assert.equal(mancala.pits[0],0);
assert.equal(mancala.pits[1],5);
assert.equal(mancala.turn,1);
assert.equal(applyRoomMove(mancala,0,{pit:8}),null,"Mancala must reject picking from the opponent's side");

let nim=createRoomBoard("nim");
nim=applyRoomMove(nim,0,{pile:0,count:3});
nim=applyRoomMove(nim,1,{pile:1,count:4});
nim=applyRoomMove(nim,0,{pile:2,count:5});
nim=applyRoomMove(nim,1,{pile:3,count:7});
assert.equal(nim.over,true);
assert.equal(nim.winner,1,"the player taking the final Nim token should win");

let dots=createRoomBoard("dots");
dots=applyRoomMove(dots,0,{type:"h",r:0,c:0});
dots=applyRoomMove(dots,1,{type:"v",r:0,c:0});
dots=applyRoomMove(dots,0,{type:"h",r:1,c:0});
dots=applyRoomMove(dots,1,{type:"v",r:0,c:1});
assert.equal(dots.scores[1],1,"completing a Dots and Boxes square should score it");
assert.equal(dots.turn,1,"a player who completes a box should keep their turn");

for(const game of gameCatalog){
  assert.ok(game.name&&game.description&&game.rules,game.name+" needs full catalog metadata");
  assert.ok(supported.includes(game.engine),game.name+" needs a supported engine");
}

class FakeRoot{
  constructor(){this.innerHTML="";this.handlers=new Map();this.elements=new Map();}
  addEventListener(name,fn){this.handlers.set(name,fn);}
  removeEventListener(name){this.handlers.delete(name);}
  querySelector(selector){
    if(selector==="#stake"||selector==="#extraStake")return {value:"100"};
    if(selector==="#bidCount")return {value:"1"};
    if(selector==="#bidFace")return {value:"2"};
    if(selector==="#target")return {value:"2"};
    if(!this.elements.has(selector))this.elements.set(selector,{textContent:"",className:"",innerHTML:"",classList:{add(){},remove(){},toggle(){}},appendChild(){},removeChild(){},getBoundingClientRect(){return {width:640,height:360};}});
    return this.elements.get(selector);
  }
  click(dataset){
    const handler=this.handlers.get("click");
    assert.ok(handler,"game must register its click handler");
    handler({target:{closest:()=>({dataset})}});
  }
}
const wallet={
  balance:1000000,
  charge(amount){if(amount>this.balance)return false;this.balance-=amount;return true;},
  refund(amount){this.balance+=amount;},
  settle(stake,payout){this.balance+=payout;}
};
function exercise(game,root){
  if(game.engine==="roulette")root.click({act:"spin"});
  else if(game.engine==="blackjack"){root.click({act:"deal"});root.click({act:"hit"});}
  else if(game.engine==="baccarat")root.click({act:"deal"});
  else if(game.engine==="poker"){root.click({act:"buy"});root.click({act:"call"});}
  else if(game.engine==="videopoker"){root.click({act:"deal"});root.click({act:"draw"});}
  else if(game.engine==="slots")root.click({act:"spin"});
  else if(game.engine==="keno")root.click({act:"draw"});
  else if(game.engine==="dice"){
    const action={craps:"craps",sicbo:"sicbo",yahtzee:"roll",farkle:"roll",liars:"bid",ceelo:"ceelo",bunco:"bunco",ship:"ship",pig:"pigroll",shutbox:"boxroll",highlow:"highlow","dice-poker":"roll"}[game.mode];
    assert.ok(action,game.name+" must have a unique supported dice mode");
    root.click({act:action});
  }else if(game.engine==="board"){
    root.click({act:"start"});
    if(game.mode==="ttt")root.click({pos:"0"});
    else if(game.mode==="connect4")root.click({col:"3"});
    else if(game.mode==="reversi")root.click({cell:"2,3"});
    else if(game.mode==="gomoku")root.click({cell:"7,7"});
    else if(game.mode==="battleship")root.click({cell:"0,0"});
    else if(game.mode==="checkers"){root.click({cell:"5,1"});root.click({cell:"4,0"});}
    else if(game.mode==="nim")root.click({pile:"0",remove:"1"});
    else if(game.mode==="dots")root.click({dot:"h",r:"0",c:"0"});
    else if(game.mode==="chess"){root.click({cell:"6,4"});root.click({cell:"4,4"});}
    else assert.fail(game.name+" has unsupported mode "+game.mode);
  }else if(game.engine==="wheel"){
    const action={coin:"flip",plinko:"drop",limbo:"limbo",crash:"crash",mines:"startmines",hilo:"starthilo",wheel:"wheel"}[game.mode];
    assert.ok(action,game.name+" must have a supported wheel mode");
    root.click({act:action});
    if(game.mode==="mines")root.click({tile:"0"});
    if(game.mode==="hilo")root.click({act:"higher"});
  }else if(game.engine==="scratch"){root.click({act:"buy"});root.click({act:"reveal"});}
  else if(game.engine==="draw")root.click({act:"draw"});
  else if(game.engine==="extra"){
    const actions={
      "three-card-poker":[{act:"deal"},{act:"play"}],
      "casino-war":[{act:"deal"}],
      "red-dog":[{act:"deal"},{act:"draw"}],
      "caribbean-stud":[{act:"deal"},{act:"fold"}],
      "let-it-ride":[{act:"deal"},{act:"ride"},{act:"ride"}],
      "pai-gow":[{act:"deal"},{card:"0"},{card:"1"},{card:"2"},{card:"3"},{card:"4"},{act:"set"}],
      "chuck-a-luck":[{act:"roll"}],
      "crown-anchor":[{act:"roll"}],
      "bingo-75":[{act:"start"},{act:"auto"}],
      "russian-roulette":[{act:"start"},{act:"pull"}],
      "demons-deal":[{act:"start"},{act:"oracle"},{act:"pull"}],
      "mancala":[{act:"start"},{pit:"0"}],
      "mastermind":[{act:"start"},{slot:"0"},{act:"guess"}],
      "memory-match":[{act:"start"},{card:"0"},{card:"1"}],
      "minesweeper":[{act:"start"},{cell:"0"}],
      "klondike":[{act:"start"},{act:"stock"},{card:"waste"},{act:"to-foundation"}]
    };
    const steps=actions[game.mode];assert.ok(steps,game.name+" must have a dedicated extra-game controller");
    for(const step of steps)root.click(step);
  }
}
for(const game of gameCatalog){
  const root=new FakeRoot();let session;
  try{
    session=mountGame(game,root,wallet);
    assert.ok(root.innerHTML.length>0,game.name+" should render");
    assert.equal(typeof session.close,"function",game.name+" should expose close()");
    assert.equal(typeof session.destroy,"function",game.name+" should expose destroy()");
    exercise(game,root);
    const botChecks={
      "Texas Hold'em":["Rico","Maya","Ace","Nova","Jax"],
      "Pot-Limit Omaha":["Rico","Maya","Ace","Nova","Jax"],
      "Cee-lo":["Rico","Maya","Ace"],
      "Bunco":["Rico","Maya","Ace"],
      "Pig":["Rico","Maya","Ace"],
      "Ship, Captain, Crew":["FOUR-PLAYER SHOWDOWN"],
      "Dice Poker":["FOUR LOCAL OPPONENTS"],
      "Russian Roulette":["Rico","Maya","Ace"],
      "Demon's Deal":["Rico","Maya","Ace"]
    };
    for(const marker of botChecks[game.name]||[])assert.ok(root.innerHTML.includes(marker),game.name+" should show its expanded local opponents");
    session.close();session.destroy();
  }catch(error){
    throw new Error("Gameplay smoke test failed for "+game.name+" ("+game.engine+"/"+game.mode+"): "+error.message,{cause:error});
  }
}
console.log("Rincon Casino smoke test passed: "+gameCatalog.length+" distinct game modes mounted and action-tested.");
