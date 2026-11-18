import assert from "node:assert/strict";
import { gameCatalog } from "../src/catalog.js";
import { mountGame } from "../src/engines.js";

assert.equal(gameCatalog.length, 240, "catalog should expose 240 entries");
assert.equal(new Set(gameCatalog.map(game => game.id)).size, 240, "game IDs must be unique");
assert.equal(new Set(gameCatalog.map(game => game.category)).size, 12, "catalog should have 12 categories");
const categoryCounts = new Map();
for (const game of gameCatalog) {
  categoryCounts.set(game.category, (categoryCounts.get(game.category) || 0) + 1);
  assert.ok(game.name && game.name.trim(), "each entry needs a name");
  assert.ok(game.description && game.description.trim(), "each entry needs a description");
  assert.ok(game.rules && game.rules.trim(), "each entry needs table rules");
  assert.ok(["roulette","blackjack","baccarat","poker","videopoker","slots","keno","dice","board","wheel","scratch","draw"].includes(game.engine), "each entry must use a supported engine");
}
for (const [category,count] of categoryCounts) assert.equal(count, 20, category + " should contain 20 entries");

class FakeRoot {
  constructor(){this.innerHTML="";this.handlers=new Map();this.elements=new Map();}
  addEventListener(name,fn){this.handlers.set(name,fn);}
  removeEventListener(name){this.handlers.delete(name);}
  querySelector(selector){
    if(selector==="#stake")return {value:"100"};
    if(selector==="#bidCount")return {value:"1"};
    if(selector==="#bidFace")return {value:"2"};
    if(selector==="#target")return {value:"2"};
    if(!this.elements.has(selector))this.elements.set(selector,{textContent:"",className:""});
    return this.elements.get(selector);
  }
  click(dataset){
    const handler=this.handlers.get("click");
    assert.ok(handler,"mounted game must register a click handler");
    handler({target:{closest:()=>({dataset})}});
  }
}
const wallet = {
  balance: 1000000,
  charge(amount){if(amount>this.balance)return false;this.balance-=amount;return true;},
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
    const action={
      craps:"craps",sicbo:"sicbo",yahtzee:"roll",farkle:"roll",liars:"bid",ceelo:"ceelo",
      bunco:"bunco",ship:"ship",pig:"pigroll",shutbox:"boxroll",highlow:"highlow","dice-poker":"roll"
    }[game.mode];
    assert.ok(action,game.name+" must map to a supported dice mode");
    root.click({act:action});
    if(game.mode==="ship")root.click({act:"ship"});
    if(game.mode==="yahtzee"||game.mode==="dice-poker")root.click({act:"score"});
  } else if(game.engine==="board"){
    root.click({act:"start"});
    if(game.mode==="ttt")root.click({pos:"0"});
    else if(game.mode==="connect4")root.click({col:"3"});
    else if(game.mode==="reversi")root.click({cell:"2,3"});
    else if(game.mode==="gomoku")root.click({cell:"7,7"});
    else if(game.mode==="battleship")root.click({cell:"0,0"});
    else if(game.mode==="checkers"){root.click({cell:"5,1"});root.click({cell:"4,0"});}
    else if(game.mode==="nim")root.click({pile:"0",remove:"1"});
    else if(game.mode==="dots")root.click({dot:"h",r:"0",c:"0"});
    else assert.fail(game.name+" has an unsupported board mode "+game.mode);
  } else if(game.engine==="wheel"){
    const actions={coin:"flip",plinko:"drop",limbo:"limbo",crash:"crash",mines:"startmines",hilo:"starthilo",wheel:"wheel"};
    const action=actions[game.mode];assert.ok(action,game.name+" must map to a supported wheel mode");
    root.click({act:action});
    if(game.mode==="mines")root.click({tile:"0"});
    if(game.mode==="hilo")root.click({act:"higher"});
  } else if(game.engine==="scratch"){root.click({act:"buy"});root.click({act:"reveal"});}
  else if(game.engine==="draw")root.click({act:"draw"});
}
for (const game of gameCatalog) {
  const root = new FakeRoot();
  let session;
  try {
    session = mountGame(game,root,wallet);
    assert.ok(root.innerHTML.length>0, game.name + " should render an initial game screen");
    assert.equal(typeof session.close,"function",game.name + " should expose close()");
    assert.equal(typeof session.destroy,"function",game.name + " should expose destroy()");
    exercise(game,root);
    session.close();
    session.destroy();
  } catch (error) {
    throw new Error("Game smoke test failed for "+game.name+" ("+game.engine+"/"+game.mode+"): "+error.message,{cause:error});
  }
}
console.log("Rincon Casino gameplay smoke test passed: 240 entries mounted and one action path exercised.");
