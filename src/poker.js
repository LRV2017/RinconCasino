const SUITS = ["♠","♥","♦","♣"];
const RANKS = "23456789TJQKA";
function shuffledDeck() {
  const deck = [];
  for (const suit of SUITS) for (const rank of RANKS) deck.push({suit,rank});
  for (let i=deck.length-1;i>0;i--) { const j=Math.floor(Math.random()*(i+1)); [deck[i],deck[j]]=[deck[j],deck[i]]; }
  return deck;
}
function rank5(cards) {
  const values = cards.map(c=>RANKS.indexOf(c.rank)+2).sort((a,b)=>b-a);
  const counts = {};
  values.forEach(v=>counts[v]=(counts[v]||0)+1);
  const groups = Object.keys(counts).map(Number).sort((a,b)=>counts[b]-counts[a]||b-a);
  const flush = cards.every(c=>c.suit===cards[0].suit);
  const unique = Array.from(new Set(values)).sort((a,b)=>b-a);
  let straight = 0;
  if (unique.length===5) {
    if (unique[0]-unique[4]===4) straight=unique[0];
    if (unique.join(",")==="14,5,4,3,2") straight=5;
  }
  if (flush&&straight) return [8,straight];
  if (counts[groups[0]]===4) return [7,groups[0],groups[1]];
  if (counts[groups[0]]===3&&counts[groups[1]]===2) return [6,groups[0],groups[1]];
  if (flush) return [5,...values];
  if (straight) return [4,straight];
  if (counts[groups[0]]===3) return [3,groups[0],...values.filter(v=>v!==groups[0])];
  if (counts[groups[0]]===2&&counts[groups[1]]===2) return [2,groups[0],groups[1],groups[2]];
  if (counts[groups[0]]===2) return [1,groups[0],...values.filter(v=>v!==groups[0])];
  return [0,...values];
}
function compareRank(a,b) {
  for (let i=0;i<Math.max(a.length,b.length);i++) { const x=a[i]||0,y=b[i]||0; if(x!==y)return x-y; }
  return 0;
}
function bestHoldem(cards) {
  let best = null;
  for(let a=0;a<cards.length-4;a++) for(let b=a+1;b<cards.length-3;b++) for(let c=b+1;c<cards.length-2;c++) for(let d=c+1;d<cards.length-1;d++) for(let e=d+1;e<cards.length;e++) {
    const rank=rank5([cards[a],cards[b],cards[c],cards[d],cards[e]]);
    if(!best||compareRank(rank,best)>0)best=rank;
  }
  return best||[0];
}
function bestOmaha(hole,board) {
  let best=null;
  for(let a=0;a<hole.length-1;a++)for(let b=a+1;b<hole.length;b++)
    for(let c=0;c<board.length-2;c++)for(let d=c+1;d<board.length-1;d++)for(let e=d+1;e<board.length;e++){
      const rank=rank5([hole[a],hole[b],board[c],board[d],board[e]]);
      if(!best||compareRank(rank,best)>0)best=rank;
    }
  return best||[0];
}
function rankName(rank) {
  return ["High card","One pair","Two pair","Three of a kind","Straight","Flush","Full house","Four of a kind","Straight flush"][rank[0]]||"High card";
}
function cardText(card) { return (card.rank==="T"?"10":card.rank)+card.suit; }
function cardMarkup(card,back) {
  if(back)return '<div class="playing-card back">◆</div>';
  return '<div class="playing-card '+("♥♦".includes(card.suit)?"red":"")+'"><span>'+ (card.rank==="T"?"10":card.rank) +'</span><span class="suit">'+card.suit+'</span><span style="align-self:flex-end;transform:rotate(180deg)">'+(card.rank==="T"?"10":card.rank)+'</span></div>';
}
function preflopStrength(hole) {
  const a=RANKS.indexOf(hole[0].rank)+2,b=RANKS.indexOf(hole[1].rank)+2;
  const hi=Math.max(a,b),lo=Math.min(a,b),suited=hole[0].suit===hole[1].suit,gap=hi-lo;
  let s=(hi+lo)/30;
  if(a===b)s+=.34+(hi/14)*.12;
  if(suited)s+=.055;
  if(gap===1)s+=.07; else if(gap===2)s+=.035;
  if(hi>=11)s+=.07;
  return Math.min(.94,s);
}
function estimateStrength(hole,board,isOmaha) {
  if(board.length<3)return preflopStrength(hole);
  const rank=isOmaha?bestOmaha(hole,board):bestHoldem(hole.concat(board));
  const category=rank[0];
  const base=[.16,.34,.53,.67,.78,.84,.91,.96,.99][category]||.2;
  const high=(rank[1]||7)/140;
  return Math.min(.99,base+high);
}
export function mountPoker(game,root,wallet) {
  const isOmaha=game.name.toLowerCase().includes("omaha");
  const state={buyIn:0,stack:0,botStack:0,pot:0,deck:[],you:[],bot:[],board:[],street:0,stage:"idle",currentBet:0,youCommitted:0,botCommitted:0,last:"Buy in to join the table.",net:0,cashed:false};
  let status="";
  const result=(message,type)=>{
    status=message;
    const el=root.querySelector("#pokerResult");
    if(el){el.textContent=message;el.className="result-banner"+(type?" "+type:"");}
  };
  const handRank=(hole,board)=>isOmaha?bestOmaha(hole,board):bestHoldem(hole.concat(board));
  const render=()=>{
    const streetNames=["Pre-flop","Flop","Turn","River","Hand complete"];
    const playerCards=state.you.map(c=>cardMarkup(c,false)).join("");
    const botCards=state.stage==="showdown"?state.bot.map(c=>cardMarkup(c,false)).join(""):state.bot.map(c=>cardMarkup(c,true)).join("");
    const boardCards=state.board.map(c=>cardMarkup(c,false)).join("");
    const active=state.stage==="action";
    root.innerHTML=
      '<div class="game-intro"><div class="game-icon-large">♠</div><h3>'+game.name+'</h3><p>'+(isOmaha?"Pot-Limit Omaha rules: each player receives four hole cards and must use exactly two of them with three community cards.":"Texas Hold’em: two private cards, five community cards, four betting streets and a local CPU opponent.")+' Your opponent considers hand strength, board texture and pot odds. This table is local-only; online rooms are a future update.</p></div>'+
      '<div class="bet-controls"><label for="stake">BUY-IN</label><input class="bet-input" id="stake" type="number" min="10" step="10" value="100"><span class="tiny-note">Current credits: '+Math.floor(wallet.balance).toLocaleString()+'</span>'+
      (state.stage==="idle"?'<button class="game-action primary" data-act="buy">Join table</button>':'')+
      (state.stage==="over"||state.stage==="showdown"?'<button class="game-action primary" data-act="next">Next hand</button>':'')+
      (state.buyIn&&!state.cashed?'<button class="game-action secondary" data-act="cashout">Cash out</button>':'')+
      '</div>'+
      '<div class="table-felt"><div class="table-seats"><div class="seat"><small>HOUSE BOT · '+(state.botStack||0)+' CHIPS</small><strong>'+(state.stage==="showdown"?"SHOWDOWN":"THINKING")+'</strong></div><div class="seat"><small>POT</small><strong>'+state.pot+' CHIPS</strong></div><div class="seat"><small>YOU · '+state.stack+' CHIPS</small><strong>'+(state.stage==="action"?"YOUR TURN":streetNames[state.street]||"WAITING")+'</strong></div></div>'+
      '<div class="playing-cards">'+botCards+'</div><div class="tiny-note">COMMUNITY CARDS</div><div class="playing-cards">'+(boardCards||'<span class="muted">The flop has not been dealt.</span>')+'</div>'+
      '<div class="tiny-note">YOUR HOLE CARDS</div><div class="playing-cards">'+playerCards+'</div>'+
      '<div class="tiny-note">'+(state.buyIn?"TABLE STACK IS HELD IN YOUR SESSION · CHIPS CONVERT BACK TO CREDITS WHEN YOU CASH OUT":"A buy-in creates a local table stack. Leave with Cash out to convert the stack back to credits.")+'</div></div>'+
      '<div class="action-row">'+
      '<button class="game-action secondary" data-act="fold" '+(!active?"disabled":"")+'>Fold</button>'+
      '<button class="game-action primary" data-act="call" '+(!active?"disabled":"")+'>'+(state.currentBet>state.youCommitted?"Call "+(state.currentBet-state.youCommitted):"Check")+'</button>'+
      '<button class="game-action secondary" data-act="raise" '+(!active?"disabled":"")+'>Raise</button>'+
      '<button class="game-action secondary" data-act="allin" '+(!active?"disabled":"")+'>All-in</button>'+
      '</div><div id="pokerResult" class="result-banner">'+(status||state.last)+'</div>';
  };
  function startHand() {
    if(state.stack<=0){state.stage="over";result("Your stack is empty. Cash out your remaining table chips.", "loss");render();return;}
    if(state.botStack<=0)state.botStack=1000;
    state.deck=shuffledDeck();state.you=[];state.bot=[];state.board=[];state.pot=0;state.street=0;state.stage="action";state.currentBet=10;state.youCommitted=10;state.botCommitted=5;
    const holeCount=isOmaha?4:2;
    for(let i=0;i<holeCount;i++){state.you.push(state.deck.pop());state.bot.push(state.deck.pop());}
    state.stack-=10;state.botStack-=5;state.pot=15;
    state.last="Blinds posted (5/10). Choose an action.";status=state.last;render();
  }
  function award(winner,message,tie) {
    state.stage="showdown";
    if(tie){const half=Math.floor(state.pot/2);state.stack+=half;state.botStack+=state.pot-half;}
    else if(winner==="you")state.stack+=state.pot;
    else state.botStack+=state.pot;
    state.last=message;result(message,winner==="you"?"win":winner==="bot"?"loss":"");
    if(state.stack<=0)state.stage="over";
    render();
  }
  function showdown() {
    const mine=handRank(state.you,state.board),theirs=handRank(state.bot,state.board);
    const cmp=compareRank(mine,theirs);
    if(cmp>0)award("you","You win with "+rankName(mine)+". The bot showed "+rankName(theirs)+".");
    else if(cmp<0)award("bot","Bot wins with "+rankName(theirs)+". You showed "+rankName(mine)+".");
    else award("tie","Split pot: both players made "+rankName(mine)+".",true);
  }
  function advanceStreet() {
    state.street++;state.currentBet=0;state.youCommitted=0;state.botCommitted=0;
    if(state.street===1)state.board.push(state.deck.pop(),state.deck.pop(),state.deck.pop());
    else if(state.street===2||state.street===3)state.board.push(state.deck.pop());
    else {showdown();return;}
    state.stage="action";status=["","Flop dealt. You act first.","Turn dealt. You act first.","River dealt. Final betting round.",""][state.street];render();
  }
  function botResponse(userAggression) {
    const strength=estimateStrength(state.bot,state.board,isOmaha);
    const cost=state.currentBet-state.botCommitted;
    const potOdds=cost<=0?0:cost/(state.pot+cost);
    const adjusted=strength-(state.board.length===5?.035:0);
    if(cost>0&&adjusted<Math.max(.22,potOdds+.12)) {
      state.botStack+=0;
      award("you","The bot folds. You collect the pot.");
      return;
    }
    if(cost>0) {
      const paid=Math.min(cost,state.botStack);
      state.botStack-=paid;state.botCommitted+=paid;state.pot+=paid;
      if(paid<cost){showdown();return;}
      status="Bot calls. The hand continues.";
      advanceStreet();
      return;
    }
    if(!userAggression&&strength>.75&&Math.random()<.25&&state.botStack>0) {
      const bet=Math.min(state.botStack,20);
      state.botStack-=bet;state.botCommitted+=bet;state.currentBet=state.botCommitted;state.pot+=bet;
      status="Bot makes a value bet of "+bet+". Call, raise or fold.";
      render();return;
    }
    status="Bot checks. The next street is dealt.";
    advanceStreet();
  }
  function playerAction(type) {
    if(state.stage!=="action")return;
    if(type==="fold"){award("bot","You folded. The bot takes the pot.");return;}
    if(type==="allin"||type==="raise") {
      const desired=type==="allin"?state.stack:Math.min(state.stack,Math.max(20,state.currentBet*2||20));
      const pay=Math.min(state.stack,Math.max(0,desired-state.youCommitted));
      if(pay<=0){result("There are no chips available to raise.","loss");return;}
      state.stack-=pay;state.youCommitted+=pay;state.pot+=pay;
      if(state.youCommitted>state.currentBet)state.currentBet=state.youCommitted;
      if(type==="allin"&&state.stack===0){const botCost=state.currentBet-state.botCommitted;const strength=estimateStrength(state.bot,state.board,isOmaha);if(strength<.43&&botCost>0){award("you","Bot folds to your all-in.");return;}const call=Math.min(botCost,state.botStack);state.botStack-=call;state.botCommitted+=call;state.pot+=call;while(state.board.length<5)state.board.push(state.deck.pop());showdown();return;}
      result("You raise to "+state.currentBet+". The bot considers the pot odds.","");
      botResponse(true);return;
    }
    if(state.currentBet>state.youCommitted) {
      const due=state.currentBet-state.youCommitted;
      const paid=Math.min(due,state.stack);
      state.stack-=paid;state.youCommitted+=paid;state.pot+=paid;
      if(paid<due){while(state.board.length<5)state.board.push(state.deck.pop());showdown();return;}
      botResponse(true);
    } else {
      botResponse(false);
    }
  }
  function cashout() {
    if(!state.buyIn||state.cashed)return;
    if(state.stage==="action"){state.botStack+=state.pot;state.pot=0;state.stage="over";}
    const payout=Math.max(0,Math.floor(state.buyIn*state.stack/1000));
    state.cashed=true;wallet.settle(state.buyIn,payout,game.name);
    state.last="Cashed out "+payout+" credits from "+state.stack+" table chips.";
    result(state.last,payout>state.buyIn?"win":payout<state.buyIn?"loss":"");
    render();
  }
  function click(e) {
    const button=e.target.closest("[data-act]");if(!button)return;
    const act=button.dataset.act;
    if(act==="buy") {
      const amount=Number(root.querySelector("#stake").value);
      if(!Number.isInteger(amount)||amount<10){result("Minimum buy-in is 10 credits.","loss");return;}
      if(!wallet.charge(amount)){result("Not enough credits for that buy-in.","loss");return;}
      state.buyIn=amount;state.stack=1000;state.botStack=1000;state.cashed=false;startHand();
    } else if(act==="next") {if(!state.cashed&&state.stack>0&&state.botStack>0){startHand();}else{state.stage="over";result("The table is finished. Cash out your remaining stack.","");render();}}
    else if(act==="cashout")cashout();
    else playerAction(act);
  }
  root.addEventListener("click",click);
  render();
  return {close:cashout,destroy:()=>root.removeEventListener("click",click)};
}
