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
  constructor(){this.innerHTML="";this.handlers=new Map();}
  addEventListener(name,fn){this.handlers.set(name,fn);}
  removeEventListener(name){this.handlers.delete(name);}
  querySelector(){return null;}
}
const wallet = {
  balance: 100000,
  charge(amount){if(amount>this.balance)return false;this.balance-=amount;return true;},
  settle(stake,payout){this.balance+=payout;}
};
for (const game of gameCatalog) {
  const root = new FakeRoot();
  const session = mountGame(game,root,wallet);
  assert.ok(root.innerHTML.length>0, game.name + " should render an initial game screen");
  assert.equal(typeof session.close,"function",game.name + " should expose close()");
  assert.equal(typeof session.destroy,"function",game.name + " should expose destroy()");
  session.close();
  session.destroy();
}
console.log("Rincon Casino smoke test passed: 240 catalog entries mounted across 12 categories.");
