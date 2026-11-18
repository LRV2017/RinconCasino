const SUITS = ["♠","♥","♦","♣"];
import { mountArena3D } from "./arena3d.js";
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
function cardMarkup(card,back) {
  if(back)return '<div class="playing-card back">◆</div>';
  const value=card.rank==="T"?"10":card.rank;
  return '<div class="playing-card '+("♥♦".includes(card.suit)?"red":"")+'"><span>'+value+'</span><span class="suit">'+card.suit+'</span><span style="align-self:flex-end;transform:rotate(180deg)">'+value+'</span></div>';
}
function cardText(card) {
  return (card.rank==="T"?"10":card.rank)+card.suit;
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
  if(board.length<3){
    if(!isOmaha)return preflopStrength(hole);
    let best=0;
    for(let a=0;a<hole.length-1;a++)for(let b=a+1;b<hole.length;b++)best=Math.max(best,preflopStrength([hole[a],hole[b]]));
    return Math.max(.12,best-.08);
  }
  const rank=isOmaha?bestOmaha(hole,board):bestHoldem(hole.concat(board));
  const category=rank[0];
  const base=[.16,.34,.53,.67,.78,.84,.91,.96,.99][category]||.2;
  const high=(rank[1]||7)/140;
  return Math.min(.99,base+high);
}
const BOT_PROFILES=[
  {name:"Rico",style:"TIGHT",loose:.02,aggression:.22,skill:.03},
  {name:"Maya",style:"BALANCED",loose:.09,aggression:.42,skill:.06},
  {name:"Ace",style:"AGGRESSIVE",loose:.16,aggression:.72,skill:.08},
  {name:"Nova",style:"TRICKY",loose:.11,aggression:.56,skill:.12},
  {name:"Jax",style:"CALLING STATION",loose:.2,aggression:.18,skill:.02}
];
export function mountPoker(game,root,wallet) {
  const isOmaha=game.name.toLowerCase().includes("omaha");
  const state={
    buyIn:0,button:-1,seats:[],board:[],deck:[],street:0,stage:"idle",
    currentBet:0,minRaise:10,currentSeat:-1,pot:0,showCards:false,
    last:"Buy in to join the table.",cashed:false,net:0
  };
  let status="",arena=null;
  const you=()=>state.seats[0];
  const live=()=>state.seats.filter(s=>!s.folded);
  const active=()=>state.seats.filter(s=>!s.folded&&!s.allIn);
  const potTotal=()=>state.seats.reduce((sum,s)=>sum+s.totalCommitted,0);
  const result=(message,type)=>{
    status=message;
    const el=root.querySelector("#pokerResult");
    if(el){el.textContent=message;el.className="result-banner"+(type?" "+type:"");}
  };
  const handRank=(seat)=>isOmaha?bestOmaha(seat.hole,state.board):bestHoldem(seat.hole.concat(state.board));
  function makeSeats(){
    return [{id:"you",name:"YOU",isYou:true,style:"PLAYER",stack:1000},
      ...BOT_PROFILES.map((p,i)=>({id:"bot"+i,name:p.name,isYou:false,style:p.style,loose:p.loose,aggression:p.aggression,skill:p.skill,stack:1000}))];
  }
  function pay(seat,amount){
    const paid=Math.min(Math.max(0,amount),seat.stack);
    seat.stack-=paid;seat.streetCommitted+=paid;seat.totalCommitted+=paid;
    if(seat.stack===0)seat.allIn=true;
    return paid;
  }
  function seatCards(seat){
    if(!seat.hole.length)return "";
    return '<div class="playing-cards">'+seat.hole.map(c=>cardMarkup(c,!state.showCards&&!seat.isYou)).join("")+'</div>';
  }
  function render(){
    const streetNames=["Pre-flop","Flop","Turn","River","Hand complete"];
    const isYourTurn=state.stage==="action"&&state.currentSeat===0;
    const player=you();
    const seats=state.seats.map((seat,i)=>{
      const current=state.stage==="action"&&state.currentSeat===i;
      const statusText=seat.folded?"FOLDED":seat.allIn?"ALL IN":current?"ACTING":seat.acted?"WAITING":"IN HAND";
      const details=state.stage==="idle"?"":'<div class="tiny-note">'+statusText+' · '+seat.totalCommitted+' IN POT'+(seat.streetCommitted?' · '+seat.streetCommitted+' THIS STREET':'')+'</div>';
      const cards=seat.isYou||state.showCards?seatCards(seat):seat.hole.length?'<div class="playing-cards">'+seat.hole.map(()=>cardMarkup(null,true)).join("")+'</div>':"";
      return '<div class="seat poker-seat '+(current?"active-seat ":"")+(seat.folded?"folded-seat":"")+'"><div class="aside-line"><small>'+(seat.isYou?"YOU":seat.name+" · "+seat.style)+'</small><small>'+(i===state.button?"DEALER BUTTON":"SEAT "+(i+1))+'</small></div><strong>'+seat.stack+' CHIPS</strong>'+details+cards+'</div>';
    }).join("");
    const boardCards=state.board.map(c=>cardMarkup(c,false)).join("");
    const actionAllowed=isYourTurn&&!!player&&!player.folded&&!player.allIn;
    const due=Math.max(0,state.currentBet-(player?player.streetCommitted:0));
    const defaultRaise=Math.max(state.currentBet+state.minRaise,state.currentBet+20);
    root.innerHTML=
      '<div class="game-intro"><div class="game-icon-large">♠</div><h3>'+game.name+'</h3><p>'+(isOmaha?"Six-seat Pot-Limit Omaha with five local opponents. Each player receives four private cards and must use exactly two with three community cards.":"Six-seat No-Limit Texas Hold’em with five distinct local opponents, rotating blinds, multiway betting and side pots.")+' Bots have different risk profiles and consider hand strength, opponents and pot odds. All opponents are local CPU players; online rooms are a future update.</p></div>'+
      '<div class="bet-controls"><label for="stake">BUY-IN</label><input class="bet-input" id="stake" type="number" min="10" step="10" value="100"><span class="tiny-note">Current credits: '+Math.floor(wallet.balance).toLocaleString()+'</span>'+
      (state.stage==="idle"?'<button class="game-action primary" data-act="buy">Join table</button>':'')+
      ((state.stage==="showdown"||state.stage==="over")&&!state.cashed?'<button class="game-action primary" data-act="next">Next hand</button>':'')+
      (state.buyIn&&!state.cashed?'<button class="game-action secondary" data-act="cashout">Cash out</button>':'')+
      '</div>'+
      '<section class="arena3d-stage" aria-label="Interactive 3D poker table"></section>'+
      '<div class="table-felt"><div class="table-seats poker-seats">'+seats+'</div><div class="tiny-note">POT · '+(state.stage==="action"?potTotal():0)+' CHIPS · '+(streetNames[state.street]||"WAITING")+'</div>'+
      '<div class="tiny-note">COMMUNITY CARDS</div><div class="playing-cards">'+(boardCards||'<span class="muted">The flop has not been dealt.</span>')+'</div>'+
      '<div class="tiny-note">YOUR HOLE CARDS</div><div class="playing-cards">'+(player&&player.hole.length?player.hole.map(c=>cardMarkup(c,false)).join(""):"")+'</div>'+
      '<div class="tiny-note">'+(state.buyIn?"Your stack converts back to fictional credits when you cash out":"Join with a buy-in to receive 1,000 table chips")+'</div></div>'+
      '<div class="action-row">'+
      '<button class="game-action secondary" data-act="fold" '+(!actionAllowed?"disabled":"")+'>Fold</button>'+
      '<button class="game-action primary" data-act="call" '+(!actionAllowed?"disabled":"")+'>'+(due>0?"Call "+Math.min(due,player?player.stack:0):"Check")+'</button>'+
      '<label class="tiny-note">RAISE TO <input class="bet-input" id="raiseTo" type="number" min="1" value="'+defaultRaise+'" style="width:96px" '+(!actionAllowed?"disabled":"")+'></label>'+
      '<button class="game-action secondary" data-act="raise" '+(!actionAllowed||active().length<2?"disabled":"")+'>Raise</button>'+
      '<button class="game-action secondary" data-act="allin" '+(!actionAllowed?"disabled":"")+'>All-in</button>'+
      '</div><div id="pokerResult" class="result-banner">'+(status||state.last)+'</div>';
    const scenePlayers=state.seats.length?state.seats.map(seat=>({name:seat.name,human:seat.isYou,stack:seat.stack,status:seat.folded?"FOLDED":seat.allIn?"ALL IN":seat.acted?"WAITING":"IN HAND",holeCards:seat.hole.map(card=>cardText(card)),hideCards:!seat.isYou&&!state.showCards})):[{name:"YOU",human:true},...BOT_PROFILES.map(p=>({name:p.name}))];
    const sceneConfig={
      kind:"poker",title:game.name,pot:state.stage==="action"?potTotal():0,
      players:scenePlayers,
      board:state.board.map(card=>cardText(card)),
      playerCards:you()?.hole.map(card=>cardText(card))||[],
      centerText:state.stage==="idle"?"JOIN TABLE":state.stage==="action"?"BETTING · "+(state.currentSeat===0?"YOUR TURN":"BOTS THINKING"):state.stage.toUpperCase()
    };
    if(!arena)arena=mountArena3D(root,sceneConfig);else arena.update(sceneConfig);
  }
  function findNextActor(){
    for(let step=1;step<=state.seats.length;step++){
      const i=(state.currentSeat+step+state.seats.length)%state.seats.length;
      const seat=state.seats[i];
      if(!seat.folded&&!seat.allIn&&(!seat.acted||seat.streetCommitted<state.currentBet))return i;
    }
    return -1;
  }
  function awardFold(){
    const winner=live()[0],amount=potTotal();
    if(winner)winner.stack+=amount;
    state.pot=0;state.stage="showdown";state.showCards=false;
    state.last=(winner?(winner.isYou?"You":winner.name):"A player")+(winner&&winner.isYou?" win ":" wins ")+amount+" chips. Everyone else folded.";
    result(state.last,winner&&winner.isYou?"win":"");
  }
  function finishShowdown(){
    while(state.board.length<5)state.board.push(state.deck.pop());
    state.showCards=true;
    const contenders=live();
    const ranks=new Map(contenders.map(seat=>[seat.id,handRank(seat)]));
    const levels=Array.from(new Set(state.seats.map(s=>s.totalCommitted).filter(n=>n>0))).sort((a,b)=>a-b);
    let previous=0;
    const awards=[];
    for(const level of levels){
      const contributors=state.seats.filter(s=>s.totalCommitted>=level);
      const amount=(level-previous)*contributors.length;
      previous=level;
      const eligible=contributors.filter(s=>!s.folded);
      if(!eligible.length){
        const share=Math.floor(amount/contributors.length),remainder=amount-share*contributors.length;
        contributors.forEach((s,i)=>s.stack+=share+(i<remainder?1:0));
        continue;
      }
      let best=eligible[0];
      for(const seat of eligible.slice(1))if(compareRank(ranks.get(seat.id),ranks.get(best.id))>0)best=seat;
      const winners=eligible.filter(s=>compareRank(ranks.get(s.id),ranks.get(best.id))===0);
      const share=Math.floor(amount/winners.length),remainder=amount-share*winners.length;
      winners.forEach((s,i)=>s.stack+=share+(i<remainder?1:0));
      awards.push(winners.map(s=>s.isYou?"You":s.name).join(" / ")+" win "+amount+" with "+rankName(ranks.get(best.id)));
    }
    state.pot=0;state.stage="showdown";
    state.last=awards.length?awards.join(" · "):"Showdown complete. Uncalled chips returned.";
    const won=awards.some(a=>a.startsWith("You "));
    const lost=!won&&you().stack<1000;
    result(state.last,won?"win":lost?"loss":"");
  }
  function runOut(){
    while(state.board.length<5)state.board.push(state.deck.pop());
    finishShowdown();
  }
  function advanceStreet(){
    if(state.street>=3){finishShowdown();return;}
    if(state.street===0)state.board.push(state.deck.pop(),state.deck.pop(),state.deck.pop());
    else state.board.push(state.deck.pop());
    state.street++;
    state.currentBet=0;state.minRaise=10;state.currentSeat=state.button;
    state.seats.forEach(s=>{s.streetCommitted=0;s.acted=s.folded||s.allIn;});
    if(active().length<=1){runOut();return;}
    state.last=["","Flop dealt.","Turn dealt.","River dealt."][state.street]||"Next street.";
    processTurn();
  }
  function roundComplete(){
    const players=active();
    return players.every(s=>s.acted&&s.streetCommitted>=state.currentBet);
  }
  function processTurn(){
    let guard=0;
    while(state.stage==="action"&&guard++<60){
      if(live().length<=1){awardFold();render();return;}
      if(roundComplete()){
        if(active().length<=1){runOut();render();return;}
        advanceStreet();return;
      }
      const next=findNextActor();
      if(next<0){
        if(state.street>=3){finishShowdown();render();return;}
        advanceStreet();return;
      }
      state.currentSeat=next;
      const seat=state.seats[next];
      if(seat.isYou){render();return;}
      botAction(seat);
    }
    if(state.stage==="action"){state.last="Betting round reached its safety limit; the hand was completed.";runOut();render();}
  }
  function raiseFor(seat,target){
    const previous=state.currentBet;
    const paid=pay(seat,Math.max(0,target-seat.streetCommitted));
    if(seat.streetCommitted>state.currentBet){
      const raiseBy=seat.streetCommitted-previous;
      state.currentBet=seat.streetCommitted;
      if(raiseBy>=state.minRaise)state.minRaise=raiseBy;
      state.seats.forEach(other=>{if(other!==seat&&!other.folded&&!other.allIn)other.acted=false;});
    }
    seat.acted=true;
    return paid;
  }
  function botAction(seat){
    const cost=Math.max(0,state.currentBet-seat.streetCommitted);
    const strength=estimateStrength(seat.hole,state.board,isOmaha);
    const opponents=Math.max(1,live().length-1);
    const pot=potTotal();
    const potOdds=cost===0?0:cost/(pot+cost);
    const threshold=Math.max(.12,potOdds+.07+Math.max(0,opponents-1)*.035-(seat.loose||0)*.32-(seat.skill||0)*.08);
    const adjusted=strength+(Math.random()-.5)*(.025+(seat.skill||0)*.08);
    const canRaise=active().length>1&&seat.stack>cost+state.minRaise;
    const aggressive=adjusted>(.64-(seat.aggression||0)*.12)&&Math.random()<(seat.aggression||.3);
    if(cost>0&&adjusted<threshold){
      seat.folded=true;seat.acted=true;
      state.last=seat.name+" folds to the bet.";
      return;
    }
    if(canRaise&&aggressive&&adjusted>.68){
      let raiseBy=Math.max(state.minRaise,Math.floor((pot+cost)*(.18+(seat.aggression||.3)*.18)));
      let target=state.currentBet+raiseBy;
      if(isOmaha)target=Math.min(target,state.currentBet+pot+cost);
      target=Math.min(target,seat.streetCommitted+seat.stack);
      if(target>state.currentBet&&target-seat.streetCommitted>0){
        raiseFor(seat,target);
        state.last=seat.name+" raises to "+state.currentBet+".";
        return;
      }
    }
    if(cost>0){
      const paid=pay(seat,cost);
      seat.acted=true;
      state.last=seat.name+" calls "+paid+".";
    }else{
      seat.acted=true;
      state.last=seat.name+" checks.";
    }
  }
  function startHand(){
    if(!you()||you().stack<=0){state.stage="over";result("Your stack is empty. Cash out the table balance.","loss");render();return;}
    state.seats.forEach((s,i)=>{
      if(!s.isYou&&s.stack<=0)s.stack=1000;
      s.folded=false;s.allIn=false;s.acted=false;s.streetCommitted=0;s.totalCommitted=0;s.hole=[];
    });
    state.button=(state.button+1)%state.seats.length;
    state.deck=shuffledDeck();state.board=[];state.street=0;state.currentBet=0;state.minRaise=10;state.pot=0;state.showCards=false;state.stage="action";
    const holeCount=isOmaha?4:2;
    for(let n=0;n<holeCount;n++)for(const seat of state.seats)seat.hole.push(state.deck.pop());
    const smallBlind=(state.button+1)%state.seats.length, bigBlind=(state.button+2)%state.seats.length;
    pay(state.seats[smallBlind],5);pay(state.seats[bigBlind],10);
    state.currentBet=Math.max(...state.seats.map(s=>s.streetCommitted));
    state.currentSeat=bigBlind;
    state.last="Blinds posted (5/10). Five opponents are at the table.";
    processTurn();
  }
  function playerAction(type){
    if(state.stage!=="action"||state.currentSeat!==0)return;
    const seat=you(),due=Math.max(0,state.currentBet-seat.streetCommitted);
    if(type==="fold"){
      seat.folded=true;seat.acted=true;state.last="You fold. The hand continues between the remaining seats.";
    } else if(type==="call"){
      const paid=pay(seat,due);seat.acted=true;
      state.last=due>0?"You call "+paid+".":"You check.";
    } else if(type==="allin"){
      const target=seat.streetCommitted+seat.stack;
      const paid=raiseFor(seat,target);
      state.last="You move all-in for "+paid+" chips.";
    } else if(type==="raise"){
      if(active().length<2){result("There is nobody left who can call a raise.","loss");return;}
      let target=Number(root.querySelector("#raiseTo")?.value||state.currentBet+state.minRaise);
      const maxStack=seat.streetCommitted+seat.stack;
      if(isOmaha){
        const pot=potTotal(),maxPot=state.currentBet+pot+due;
        target=Math.min(target,maxPot);
      }
      target=Math.min(target,maxStack);
      if(!Number.isFinite(target)||target<=state.currentBet){result("Enter a raise-to amount above the current bet.","loss");return;}
      if(target<state.currentBet+state.minRaise&&target<maxStack){result("The minimum raise is "+(state.currentBet+state.minRaise)+".","loss");return;}
      raiseFor(seat,target);
      state.last="You raise to "+state.currentBet+".";
    }
    processTurn();
  }
  function cashout(){
    if(!state.buyIn||state.cashed)return;
    if(state.stage==="action")state.stage="over";
    const stack=Math.max(0,you().stack);
    const payout=Math.max(0,Math.floor(state.buyIn*stack/1000));
    state.cashed=true;
    wallet.settle(state.buyIn,payout,game.name);
    state.last="Cashed out "+payout+" credits from "+stack+" table chips.";
    result(state.last,payout>state.buyIn?"win":payout<state.buyIn?"loss":"");
    render();
  }
  function click(e){
    const button=e.target.closest("[data-act]");if(!button)return;
    const act=button.dataset.act;
    if(act==="buy"){
      if(state.buyIn&&!state.cashed)return;
      const amount=Number(root.querySelector("#stake")?.value||0);
      if(!Number.isInteger(amount)||amount<10){result("Minimum buy-in is 10 credits.","loss");return;}
      if(!wallet.charge(amount)){result("Not enough credits for that buy-in.","loss");return;}
      state.buyIn=amount;state.seats=makeSeats();state.cashed=false;state.button=-1;startHand();
    } else if(act==="next"){
      if(!state.cashed&&you().stack>0&&(state.stage==="showdown"||state.stage==="over"))startHand();
      else {state.stage="over";result("The table is finished. Cash out your remaining stack.","");render();}
    } else if(act==="cashout")cashout();
    else playerAction(act);
  }
  root.addEventListener("click",click);
  render();
  return {close:cashout,destroy:()=>{root.removeEventListener("click",click);arena?.destroy();}};
}
