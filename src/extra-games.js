import { mountArena3D } from "./arena3d.js";
const SUITS=["♠","♥","♦","♣"];
const RANKS="23456789TJQKA";
const COLORS=["🟥","🟦","🟩","🟨","🟪","🟧"];
const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function deck(){
  const cards=[];for(const suit of SUITS)for(const rank of RANKS)cards.push({suit,rank});
  for(let i=cards.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[cards[i],cards[j]]=[cards[j],cards[i]];}
  return cards;
}
function value(c){return RANKS.indexOf(c.rank)+2;}
function card(c,hidden=false){
  if(hidden)return '<span class="playing-card back">◆</span>';
  const red="♥♦".includes(c.suit);
  return '<span class="playing-card '+(red?"red":"")+'"><b>'+ (c.rank==="T"?"10":c.rank) +'</b><span class="suit">'+c.suit+'</span></span>';
}
function rankFive(cards){
  const vals=cards.map(value).sort((a,b)=>b-a),counts={};vals.forEach(v=>counts[v]=(counts[v]||0)+1);
  const groups=Object.keys(counts).map(Number).sort((a,b)=>counts[b]-counts[a]||b-a);
  const flush=cards.every(c=>c.suit===cards[0].suit),unique=[...new Set(vals)];
  let straight=0;if(unique.length===5&&unique[0]-unique[4]===4)straight=unique[0];if(unique.join(",")==="14,5,4,3,2")straight=5;
  if(flush&&straight)return [8,straight];
  if(counts[groups[0]]===4)return [7,groups[0],groups[1]];
  if(counts[groups[0]]===3&&counts[groups[1]]===2)return [6,groups[0],groups[1]];
  if(flush)return [5,...vals];if(straight)return [4,straight];
  if(counts[groups[0]]===3)return [3,groups[0],...vals.filter(x=>x!==groups[0])];
  if(counts[groups[0]]===2&&counts[groups[1]]===2)return [2,groups[0],groups[1],groups[2]];
  if(counts[groups[0]]===2)return [1,groups[0],...vals.filter(x=>x!==groups[0])];
  return [0,...vals];
}
function rankThree(cards){
  const vals=cards.map(value).sort((a,b)=>b-a),counts={};vals.forEach(v=>counts[v]=(counts[v]||0)+1);
  const groups=Object.keys(counts).map(Number).sort((a,b)=>counts[b]-counts[a]||b-a);
  const flush=cards.every(c=>c.suit===cards[0].suit),unique=[...new Set(vals)];
  let straight=0;if(unique.length===3&&unique[0]-unique[2]===2)straight=unique[0];if(unique.join(",")==="14,3,2")straight=3;
  if(flush&&straight)return [6,straight];
  if(counts[groups[0]]===3)return [5,groups[0]];
  if(straight)return [4,straight];
  if(flush)return [3,...vals];
  if(counts[groups[0]]===2)return [2,groups[0],...vals.filter(x=>x!==groups[0])];
  return [1,...vals];
}
function cmp(a,b){for(let i=0;i<Math.max(a.length,b.length);i++){if((a[i]||0)!==(b[i]||0))return (a[i]||0)-(b[i]||0);}return 0;}
function handLabel(rank){return ["High card","One pair","Two pair","Three of a kind","Straight","Flush","Full house","Four of a kind","Straight flush"][rank[0]]||"High card";}
function combos(items,size){
  const out=[];function go(start,chosen){if(chosen.length===size){out.push(chosen.slice());return;}for(let i=start;i<=items.length-(size-chosen.length);i++){chosen.push(items[i]);go(i+1,chosen);chosen.pop();}}
  go(0,[]);return out;
}
function makeGame(game,root,wallet){
  let state=null,listener=null,settled=false,activeStake=0;
  const intro='<div class="game-intro"><div class="game-icon-large">'+esc(game.icon||"✦")+'</div><h3>'+esc(game.name)+'</h3><p>'+esc(game.description)+'</p></div>';
  const balance=()=>Math.floor(wallet.balance).toLocaleString();
  function betInput(defaultValue=25){return '<div class="bet-controls"><label for="extraStake">STAKE</label><input id="extraStake" class="bet-input" type="number" min="10" step="5" value="'+defaultValue+'"><span class="tiny-note">'+balance()+' credits available</span></div>';}
  function takeBet(){
    if(activeStake>0&&!settled){message("Finish the current round before starting another.","loss");return null;}
    const amount=Number(root.querySelector("#extraStake")?.value||0);
    if(!Number.isInteger(amount)||amount<10){message("Enter a whole-number stake of at least 10 credits.","loss");return null;}
    if(!wallet.charge(amount)){message("Not enough fictional credits.","loss");return null;}
    settled=false;activeStake=amount;return amount;
  }
  function chargeAdditional(amount){
    if(!Number.isInteger(amount)||amount<1||!wallet.charge(amount)){message("Not enough fictional credits for that action.","loss");return false;}
    activeStake+=amount;return true;
  }
  function refund(amount){
    const value=Math.min(activeStake,Math.max(0,Math.floor(amount)));
    if(value){wallet.refund(value);activeStake-=value;}
  }
  function settle(stake,payout,text){
    if(settled)return;
    if(state)state.done=true;
    settled=true;activeStake=0;
    wallet.settle(stake,Math.max(0,Math.floor(payout)),game.name);
    const el=root.querySelector("#extraResult");
    if(el){el.textContent=text;el.className="result-banner"+(payout>stake?" win":payout<stake?" loss":"");}
    root.innerHTML+='<div class="action-row"><button class="game-action primary" data-act="again">Play another round</button></div>';
  }
  function message(text,type=""){const el=root.querySelector("#extraResult");if(el){el.textContent=text;el.className="result-banner"+(type?" "+type:"");}else root.innerHTML+='<div class="result-banner">'+esc(text)+'</div>';}
  function page(body,status="Ready to play.",type=""){
    root.innerHTML=intro+body+'<div id="extraResult" class="result-banner '+type+'">'+esc(status)+'</div>';
  }
  function bind(handler){
    listener=e=>{
      const button=e.target.closest("[data-act]");
      const action=button?.dataset.act;
      if(settled&&!["again","deal","start"].includes(action))return;
      handler(e);
    };
    root.addEventListener("click",listener);
  }
  function render(status="Ready to play.",type=""){if(state&&state.render)state.render(status,type);}
  function close(){if(activeStake>0&&!settled){wallet.settle(activeStake,0,game.name);activeStake=0;settled=true;if(state)state.done=true;}}
  function destroy(){if(listener)root.removeEventListener("click",listener);}
  return {game,root,wallet,intro,betInput,takeBet,chargeAdditional,refund,settle,message,page,bind,render,get state(){return state;},set state(v){state=v;},close,destroy};
}

function mountThreeCardPoker(game,root,wallet){
  const c=makeGame(game,root,wallet);let s=null;
  function render(status="Choose Play or Fold.",type=""){
    const body=s?'<div class="tiny-note">DEALER · '+(s.revealed?"REVEALED":"HIDDEN")+'</div><div class="playing-cards">'+s.dealer.map(x=>card(x,!s.revealed)).join("")+'</div><div class="tiny-note">YOUR THREE-CARD HAND · '+(s.revealed?handLabel(rankThree(s.player)):"")+'</div><div class="playing-cards">'+s.player.map(x=>card(x)).join("")+'</div><div class="action-row">'+(!s.revealed?'<button class="game-action primary" data-act="play">Play (match ante)</button><button class="game-action danger" data-act="fold">Fold</button>':'<button class="game-action primary" data-act="again">New hand</button>')+'</div>':'<div class="table-felt"><h3>Three-card poker</h3><p class="muted">Build the best three-card poker hand. Ante first, then play for an equal amount or fold.</p><div class="action-row"><button class="game-action primary" data-act="deal">Deal hand</button></div></div>';
    c.state=s;c.page(c.betInput()+body,status,type);
  }
  c.bind(e=>{
    const b=e.target.closest("[data-act]");if(!b)return;
    if(b.dataset.act==="deal"||b.dataset.act==="again"){if(s&&!s.done&&!s.revealed)return;const bet=c.takeBet();if(!bet)return;s={stake:bet,bet,deck:deck(),player:[],dealer:[],revealed:false,done:false};for(let i=0;i<3;i++){s.player.push(s.deck.pop());s.dealer.push(s.deck.pop());}render("Ante posted. Play or fold.");}
    else if(!s||s.done||s.revealed)return;
    else if(b.dataset.act==="fold"){c.settle(s.stake,0,"You folded. The ante is lost.","loss");}
    else if(b.dataset.act==="play"){
      if(!c.chargeAdditional(s.bet)){return;}
      s.stake+=s.bet;s.revealed=true;
      const you=rankThree(s.player),dealer=rankThree(s.dealer),qualifies=dealer[0]>1||(dealer[0]===1&&dealer[1]>=12),result=cmp(you,dealer);
      if(!qualifies){c.settle(s.stake,s.bet*3,"Dealer does not qualify. Ante pays 1:1; play bet pushes.");return;}
      if(result>0){const bonus=you[0]===6?5:you[0]===5?4:you[0]===4?1:0;c.settle(s.stake,s.bet*(4+bonus),"You win with "+handLabel(you)+". Dealer shows "+handLabel(dealer)+".");}
      else if(result===0)c.settle(s.stake,s.bet*2,"Tie. Both wagers are returned.");
      else c.settle(s.stake,0,"Dealer wins with "+handLabel(dealer)+".");
    }
  });
  render("Ante, then choose Play or Fold.");return c;
}

function mountCasinoWar(game,root,wallet){
  const c=makeGame(game,root,wallet);let s=null;
  function render(status="Place your wager to draw.",type=""){
    const cards=s?'<div class="table-seats"><div class="seat"><small>YOU</small><strong>'+(s.player?value(s.player):"—")+'</strong></div><div class="seat"><small>DEALER</small><strong>'+(s.dealer?value(s.dealer):"—")+'</strong></div></div><div class="playing-cards">'+card(s.player)+'</div><div class="playing-cards">'+card(s.dealer)+'</div>':'<div class="table-felt"><h3>Casino War</h3><p class="muted">Turn over one card each. Highest rank wins. On a tie, surrender half your wager or go to war with an additional three-unit wager.</p></div>';
    c.page(c.betInput()+cards+(s&&!s.done&&s.tied?'<div class="action-row"><button class="game-action primary" data-act="war">Go to war (3×)</button><button class="game-action secondary" data-act="surrender">Surrender half</button></div>':!s||s.done?'<div class="action-row"><button class="game-action primary" data-act="deal">Draw cards</button></div>':'<div class="action-row"><button class="game-action primary" data-act="again">Next round</button></div>'),status,type);
  }
  c.bind(e=>{
    const a=e.target.closest("[data-act]")?.dataset.act;if(!a)return;
    if(a==="deal"||a==="again"){const bet=c.takeBet();if(!bet)return;s={stake:bet,bet,deck:deck(),player:null,dealer:null,tied:false,done:false};s.player=s.deck.pop();s.dealer=s.deck.pop();const d=value(s.player)-value(s.dealer);if(d>0)c.settle(bet,bet*2,"You win the opening draw.", "win");else if(d<0)c.settle(bet,0,"Dealer wins the opening draw.","loss");else{s.tied=true;render("War! The cards tie. Choose to surrender or go to war.");}}
    else if(!s||s.done||!s.tied)return;
    else if(a==="surrender")c.settle(s.bet,Math.floor(s.bet/2),"You surrender and recover half your wager.");
    else if(a==="war"){const extra=s.bet*3;if(!c.chargeAdditional(extra)){return;}s.stake+=extra;s.deck.pop();s.deck.pop();s.deck.pop();s.player=s.deck.pop();s.dealer=s.deck.pop();s.tied=false;const d=value(s.player)-value(s.dealer);if(d>0)c.settle(s.stake,s.bet*8,"You win the war. The 3× side wager pays 1:1.");else if(d<0)c.settle(s.stake,0,"Dealer wins the war.");else c.settle(s.stake,s.stake,"Second tie. All wagers push.");}
  });
  render();return c;
}

function mountRedDog(game,root,wallet){
  const c=makeGame(game,root,wallet);let s=null;
  function render(status="Ante, then reveal the third card.",type=""){
    const body=s?'<div class="playing-cards">'+card(s.a)+card(s.b)+'</div><div class="tiny-note">'+(s.gap===0?"PAIR":s.gap===1?"CONSECUTIVE":s.gap+" RANKS BETWEEN")+'</div>'+(s.third?'<div class="playing-cards">'+card(s.third)+'</div>':"")+(s.third?'<div class="action-row"><button class="game-action primary" data-act="again">Next round</button></div>':'<div class="action-row"><button class="game-action primary" data-act="draw">Draw third card</button></div>'):'<div class="table-felt"><h3>Red Dog</h3><p class="muted">Two cards establish a spread. Pairs push, consecutive cards pay 11:1, and otherwise the third card must land between your two ranks.</p><div class="action-row"><button class="game-action primary" data-act="deal">Deal two cards</button></div></div>';
    c.page(c.betInput()+body,status,type);
  }
  c.bind(e=>{
    const a=e.target.closest("[data-act]")?.dataset.act;if(!a)return;
    if(a==="deal"||a==="again"){const bet=c.takeBet();if(!bet)return;const d=deck(),a=d.pop(),b=d.pop(),gap=Math.abs(value(a)-value(b))-1;s={stake:bet,bet,a,b,gap,deck:d,third:null,done:false};if(gap===0)c.settle(bet,bet,"Pair. Your wager pushes.");else if(gap<0)c.settle(bet,bet*12,"Consecutive cards. Automatic 11:1 win.");else render("Spread is "+gap+". Draw a card between them to win.");}
    else if(a==="draw"&&s&&!s.done&&!s.third){s.third=s.deck.pop();const v=value(s.third),low=Math.min(value(s.a),value(s.b)),high=Math.max(value(s.a),value(s.b));if(v>low&&v<high){const mult=s.gap===1?6:s.gap===2?5:s.gap===3?3:2;c.settle(s.bet,s.bet*mult,"Third card lands in the spread. "+mult+"× total return.");}else c.settle(s.bet,0,"Third card misses the spread.");}
  });
  render();return c;
}

function mountCaribbeanStud(game,root,wallet){
  const c=makeGame(game,root,wallet);let s=null;
  function render(status="Ante to receive five cards.",type=""){
    const body=s?'<div class="table-seats"><div class="seat"><small>DEALER</small><strong>'+(s.revealed?handLabel(s.dealerRank):"HIDDEN")+'</strong></div><div class="seat"><small>YOU</small><strong>'+handLabel(rankFive(s.player))+'</strong></div></div><div class="playing-cards">'+s.dealer.map((x,i)=>card(x,!s.revealed||i>0)).join("")+'</div><div class="playing-cards">'+s.player.map(x=>card(x)).join("")+'</div>'+(s.revealed?'<div class="action-row"><button class="game-action primary" data-act="again">New hand</button></div>':'<div class="action-row"><button class="game-action primary" data-act="raise">Raise 2× ante</button><button class="game-action danger" data-act="fold">Fold</button></div>'):'<div class="table-felt"><h3>Caribbean Stud Poker</h3><p class="muted">Play five cards against the dealer. The dealer needs at least Ace-King to qualify. Raise two times your ante or fold.</p><div class="action-row"><button class="game-action primary" data-act="deal">Deal hand</button></div></div>';
    c.page(c.betInput()+body,status,type);
  }
  c.bind(e=>{
    const a=e.target.closest("[data-act]")?.dataset.act;if(!a)return;
    if(a==="deal"||a==="again"){if(s&&!s.done&&!s.revealed)return;const bet=c.takeBet();if(!bet)return;const d=deck();s={stake:bet,bet,deck:d,player:Array.from({length:5},()=>d.pop()),dealer:Array.from({length:5},()=>d.pop()),revealed:false,done:false};render("Choose Raise or Fold.");}
    else if(!s||s.done||s.revealed)return;
    else if(a==="fold")c.settle(s.stake,0,"You fold. Ante is lost.");
    else if(a==="raise"){
      const raise=s.bet*2;if(!c.chargeAdditional(raise)){return;}s.stake+=raise;s.revealed=true;
      const pr=rankFive(s.player),dr=rankFive(s.dealer);s.dealerRank=dr;
      const dealerQualifies=dr[0]>0||(dr[0]===0&&dr[1]===14&&dr[2]>=13);
      if(!dealerQualifies){c.settle(s.stake,s.bet*4,"Dealer does not qualify. Ante wins 1:1 and raise pushes.");return;}
      const result=cmp(pr,dr);if(result>0)c.settle(s.stake,s.bet*6,"You beat the dealer with "+handLabel(pr)+". Ante and raise both pay 1:1.");
      else if(result===0)c.settle(s.stake,s.stake,"Tie. All wagers push.");else c.settle(s.stake,0,"Dealer wins with "+handLabel(dr)+".");
    }
  });
  render();return c;
}

function mountLetItRide(game,root,wallet){
  const c=makeGame(game,root,wallet);let s=null;
  function render(status="Ante is split across three equal bets.",type=""){
    const body=s?'<div class="tiny-note">YOUR THREE CARDS</div><div class="playing-cards">'+s.player.map(x=>card(x)).join("")+'</div><div class="tiny-note">COMMUNITY CARDS</div><div class="playing-cards">'+s.community.map(x=>card(x,s.community.length<1)).join("")+'</div><div class="aside-card" style="max-width:420px;margin:auto"><div class="aside-line"><span>Remaining bets</span><strong>'+s.activeUnits+' units</strong></div><div class="aside-line"><span>Returned bets</span><strong>'+s.returnedUnits+' units</strong></div></div>'+(s.finished?'<div class="action-row"><button class="game-action primary" data-act="again">New hand</button></div>':'<div class="action-row">'+(s.community.length<1?'<button class="game-action secondary" data-act="pull">Pull 1st bet</button>':'')+(s.community.length<2?'<button class="game-action secondary" data-act="pull">Pull '+(s.community.length+1)+'st bet</button>':'')+'<button class="game-action primary" data-act="ride">Let it ride</button></div>'):'<div class="table-felt"><h3>Let It Ride</h3><p class="muted">Place three equal bets. After seeing your cards and each community card, pull a bet back or let it ride. The best five-card hand determines the paytable.</p><div class="action-row"><button class="game-action primary" data-act="deal">Deal three-card hand</button></div></div>';
    c.page(c.betInput()+body,status,type);
  }
  function finish(){
    const final=s.player.concat(s.community),r=rankFive(final);
    const mult=r[0]===1?(r[1]>=10?1:0):([0,0,2,3,5,8,11,50,200][r[0]]||0);
    const gross=mult>0?s.activeUnits*s.bet*(1+mult):0;s.finished=true;c.settle(s.stake,gross,"You made "+handLabel(r)+". Paytable return "+mult+":1.");
  }
  c.bind(e=>{
    const a=e.target.closest("[data-act]")?.dataset.act;if(!a)return;
    if(a==="deal"||a==="again"){if(s&&!s.finished)return;const bet=c.takeBet();if(!bet)return;if(!c.chargeAdditional(bet*2)){c.settle(bet,0,"You could not cover the remaining two ante units.");return;}const d=deck();s={stake:bet*3,bet,deck:d,player:[d.pop(),d.pop(),d.pop()],community:[],activeUnits:3,returnedUnits:0,finished:false};render("Three units posted. Choose whether to pull a bet or let it ride.");}
    else if(!s||s.finished)return;
    else if(a==="pull"){if(s.community.length===0&&s.activeUnits>1){s.activeUnits--;s.returnedUnits++;s.stake-=s.bet;c.refund(s.bet);}else if(s.community.length===1&&s.activeUnits>1){s.activeUnits--;s.returnedUnits++;s.stake-=s.bet;c.refund(s.bet);}else message("No more bets can be pulled.");}
    else if(a==="ride"){s.community.push(s.deck.pop());if(s.community.length>=2)finish();else render("Community card revealed. Final decision.");}
  });
  render("Three equal units are required.");return c;
}

function mountPaiGow(game,root,wallet){
  const c=makeGame(game,root,wallet);let s=null;
  function splitRank(cards){
    if(cards.length===5)return rankFive(cards);
    const vals=cards.map(value).sort((a,b)=>b-a);
    return vals[0]===vals[1]?[1,vals[0]]:[0,...vals];
  }
  function bestHouse(cards){
    let best=null;
    for(const high of combos(cards,5)){
      const low=cards.filter(x=>!high.includes(x));
      const candidate={high,low,hr:splitRank(high),lr:splitRank(low)};
      if(!best||cmp(candidate.hr,best.hr)>0||cmp(candidate.hr,best.hr)===0&&cmp(candidate.lr,best.lr)>0)best=candidate;
    }
    return best;
  }
  function render(status="Choose five cards for your high hand.",type=""){
    const chosen=s?s.selected:[];
    const body=s?'<div class="tiny-note">SELECT EXACTLY FIVE FOR THE HIGH HAND · REMAINING TWO BECOME THE LOW HAND</div><div class="playing-cards">'+s.player.map((x,i)=>'<button class="playing-card '+("♥♦".includes(x.suit)?"red":"")+'" data-card="'+i+'" style="transform:'+(chosen.includes(i)?"translateY(-8px)":"none")+'"><b>'+x.rank+'</b><span class="suit">'+x.suit+'</span></button>').join("")+'</div><div class="action-row"><button class="game-action primary" data-act="set" '+(chosen.length!==5?"disabled":"")+' >Set hands</button><button class="game-action secondary" data-act="reset">Clear selection</button></div>'+(s.result?'<div class="table-seats"><div class="seat"><small>YOUR HIGH / LOW</small><strong>'+handLabel(s.result.my.hr)+' / '+s.result.my.lr.map(x=>x===14?"A":x).join("-")+'</strong></div><div class="seat"><small>HOUSE HIGH / LOW</small><strong>'+handLabel(s.result.bot.hr)+' / '+s.result.bot.lr.map(x=>x===14?"A":x).join("-")+'</strong></div></div><button class="game-action primary" data-act="again">New hand</button>':''):'<div class="table-felt"><h3>Pai Gow Poker</h3><p class="muted">Split seven cards into a five-card high hand and two-card low hand. Both of your hands must beat the house to win.</p><button class="game-action primary" data-act="deal">Deal seven cards</button></div>';
    c.page(c.betInput()+body,status,type);
  }
  c.bind(e=>{
    const b=e.target.closest("[data-act],[data-card]");if(!b)return;const a=b.dataset.act;
    if(a==="deal"||a==="again"){if(s&&!s.result)return;const bet=c.takeBet();if(!bet)return;const d=deck();s={stake:bet,bet,deck:d,player:Array.from({length:7},()=>d.pop()),selected:[],result:null,done:false};render("Select five cards for the high hand.");}
    else if(!s||s.done)return;
    else if(b.dataset.card!==undefined){const i=Number(b.dataset.card);s.selected=s.selected.includes(i)?s.selected.filter(x=>x!==i):s.selected.concat([i]).slice(0,5);render();}
    else if(a==="reset"){s.selected=[];render();}
    else if(a==="set"&&s.selected.length===5){
      const high=s.selected.map(i=>s.player[i]),low=s.player.filter((x,i)=>!s.selected.includes(i)),my={high,low,hr:rankFive(high),lr:splitRank(low)},bot=bestHouse(s.deck.splice(0,7));
      // House-way chooses the strongest five-card hand, then the strongest two-card remainder.
      const highResult=cmp(my.hr,bot.hr),lowResult=cmp(my.lr,bot.lr);s.result={my,bot};s.done=true;
      if(highResult>0&&lowResult>0)c.settle(s.bet,s.bet*2,"You win both hands. High: "+handLabel(my.hr)+". Low: "+my.lr.join("-")+".");
      else if(highResult<0&&lowResult<0)c.settle(s.bet,0,"House wins both hands.");
      else c.settle(s.bet,s.bet,"Pai Gow push: the hands split.");
    }
  });
  render();return c;
}

function mountDiceSideBet(game,root,wallet,mode){
  const c=makeGame(game,root,wallet);let s=null,pick=1;
  const die=x=>["","⚀","⚁","⚂","⚃","⚄","⚅"][x];
  function render(status="Choose your face and roll three dice.",type=""){
    const choices=mode==="chuck"?[1,2,3,4,5,6]:["Crown","Anchor","Heart","Diamond","Club","Spade"];
    const selector=choices.map((x,i)=>'<button class="game-action '+(pick===i+1?"primary":"secondary")+'" data-pick="'+(i+1)+'">'+(mode==="chuck"?die(i+1):x)+'</button>').join("");
    c.page(c.betInput()+'<div class="tiny-note">'+(mode==="chuck"?"CHUCK-A-LUCK · PICK A NUMBER":"CROWN & ANCHOR · PICK A SYMBOL")+'</div><div class="choice-row">'+selector+'</div><div class="dice-tray">'+(s?s.dice.map(x=>'<div class="die">'+(mode==="chuck"?die(x):choices[x-1])+'</div>').join(""):'<div class="die">⚄</div>'.repeat(3))+'</div><div class="action-row"><button class="game-action primary" data-act="roll">Roll all three</button></div>',status,type);
  }
  c.bind(e=>{
    const b=e.target.closest("[data-act],[data-pick]");if(!b)return;
    if(b.dataset.pick){pick=Number(b.dataset.pick);render();return;}
    if(b.dataset.act==="roll"||b.dataset.act==="again"){const bet=c.takeBet();if(!bet)return;const dice=Array.from({length:3},()=>1+Math.floor(Math.random()*6)),hits=dice.filter(x=>x===pick).length,mult=hits===3?4:hits===2?3:hits===1?2:0,payout=bet*mult;s={dice};c.settle(bet,payout,hits+" matching dice. "+(hits?"Payout "+mult+"×.":"No matches."));}
  });
  render();return c;
}

function mountBingo(game,root,wallet){
  const c=makeGame(game,root,wallet);let s=null,arena=null;
  function newCard(){
    const colRanges=[[1,15],[16,30],[31,45],[46,60],[61,75]];
    const cols=colRanges.map(([a,b])=>{const nums=Array.from({length:b-a+1},(_,i)=>a+i);for(let i=nums.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[nums[i],nums[j]]=[nums[j],nums[i]];}return nums.slice(0,5).sort((x,y)=>x-y);});
    const grid=Array.from({length:5},(_,r)=>Array.from({length:5},(_,col)=>r===2&&col===2?0:cols[col][r]));
    return {grid,marked:new Set([12])};
  }
  function bingo(card){const g=card.grid,m=card.marked;for(let r=0;r<5;r++)if(g[r].every((n,col)=>m.has(r*5+col)))return true;for(let col=0;col<5;col++)if(g.every((row,r)=>m.has(r*5+col)))return true;if([0,1,2,3,4].every(i=>m.has(i*5+i))||[0,1,2,3,4].every(i=>m.has(i*5+(4-i))))return true;return false;}
  function render(status="Start a round and draw numbered balls.",type=""){
    const cardHTML=s?s.player.grid.map((row,r)=>row.map((n,col)=>{const id=r*5+col;return '<div class="board-cell '+(s.player.marked.has(id)?"selected":"")+'" style="width:42px;height:42px;display:grid;place-items:center;font-size:12px">'+(n||"FREE")+'</div>';}).join("")).join(""):'';
    const body=s?'<div class="tiny-note">B I N G O · DRAWN BALLS: '+s.drawn.length+' / 75 · HOUSE CARDS: '+s.bots.map(b=>b.marked.size-1).join(" / ")+'</div><div class="board-grid" style="grid-template-columns:repeat(5,42px);gap:4px">'+cardHTML+'</div><div class="action-row"><button class="game-action primary" data-act="draw" '+(s.done?"disabled":"")+' >Draw next ball</button><button class="game-action secondary" data-act="auto" '+(s.done?"disabled":"")+' >Draw until winner</button></div><div class="tiny-note">LATEST: '+(s.drawn.length?s.drawn[s.drawn.length-1]:"—")+'</div>':'<div class="table-felt"><h3>75-ball Bingo</h3><p class="muted">A real 5×5 B-I-N-G-O card with a free centre, unique numbered balls and three house cards competing for a line.</p><button class="game-action primary" data-act="start">Buy card & start</button></div>';
    c.page(c.betInput()+'<section class="arena3d-stage" aria-label="Interactive 3D bingo table"></section>'+body,status,type);
    const players=[{name:"You",human:true,score:s?s.player.marked.size-1:0},...["Rico","Maya","Ace"].map((name,i)=>({name,score:s?s.bots[i].marked.size-1:0,status:s?"PLAYING":"READY"}))];
    const numberGrid=s?s.player.grid.map(row=>row.map(n=>n||"FREE")):Array.from({length:5},()=>Array(5).fill("BINGO"));
    const numberMarked=s?Array.from({length:5},(_,r)=>Array.from({length:5},(_,col)=>s.player.marked.has(r*5+col))):null;
    const sceneConfig={kind:"board",title:"75-Ball Bingo",players,numberGrid,numberMarked,centerText:s?"BALLS · "+s.drawn.length+" / 75":"BINGO · TAKE YOUR SEAT",pieces:s?s.drawn.slice(-18).map((n)=>({color:0xc7a65f,label:n})):[]};
    if(!arena)arena=mountArena3D(root,sceneConfig);else arena.update(sceneConfig);
  }
  function drawOne(){
    if(s.done)return;
    const ball=s.balls.shift();if(ball===undefined)return;
    s.drawn.push(ball);
    for(const card of [s.player,...s.bots])for(let i=0;i<25;i++)if(card.grid[Math.floor(i/5)][i%5]===ball)card.marked.add(i);
    const playerWin=bingo(s.player),botWin=s.bots.some(bingo);
    if(playerWin&&botWin){s.done=true;c.settle(s.bet,s.bet,"Bingo tie — player and house complete a line on the same ball.");render("Bingo tie on ball "+ball+".");return;}
    if(playerWin){s.done=true;c.settle(s.bet,s.bet*4,"BINGO! You complete a line on ball "+ball+".");render("BINGO! You win on ball "+ball+".","win");return;}
    if(botWin){s.done=true;c.settle(s.bet,0,"A house card called Bingo first on ball "+ball+".");render("A bot called Bingo on ball "+ball+".","loss");return;}
    render("Ball "+ball+" drawn. No line yet.");
  }
  c.bind(e=>{
    const a=e.target.closest("[data-act]")?.dataset.act;if(!a)return;
    if(a==="start"||a==="again"){if(s&&!s.done)return;const bet=c.takeBet();if(!bet)return;const balls=Array.from({length:75},(_,i)=>i+1);for(let i=74;i>0;i--){const j=Math.floor(Math.random()*(i+1));[balls[i],balls[j]]=[balls[j],balls[i]];}s={bet,drawn:[],balls,player:newCard(),bots:[newCard(),newCard(),newCard()],done:false};render("Your card is live. Start drawing.");}
    else if(s&&!s.done&&a==="draw")drawOne();
    else if(s&&!s.done&&a==="auto"){for(let i=0;i<75&&!s.done;i++)drawOne();}
  });
  render();const baseClose=c.close,baseDestroy=c.destroy;
  c.close=()=>{baseClose();arena?.destroy();};
  c.destroy=()=>{baseDestroy();arena?.destroy();};
  return c;
}

function mountMancala(game,root,wallet){
  const c=makeGame(game,root,wallet);let s=null,arena=null;
  const initial=()=>({pits:[4,4,4,4,4,4,0,4,4,4,4,4,4,0],turn:"you",done:false});
  function moves(pos,side){return side==="you"?[0,1,2,3,4,5].filter(i=>pos.pits[i]>0):[7,8,9,10,11,12].filter(i=>pos.pits[i]>0);}
  function sweep(pos){
    const low=pos.pits.slice(0,6).reduce((a,b)=>a+b,0),high=pos.pits.slice(7,13).reduce((a,b)=>a+b,0);
    if(low===0||high===0){pos.pits[6]+=low;pos.pits[13]+=high;for(let i=0;i<6;i++)pos.pits[i]=0;for(let i=7;i<13;i++)pos.pits[i]=0;pos.done=true;}
  }
  function apply(pos,pit){
    const next={pits:pos.pits.slice(),turn:pos.turn,done:false};let stones=next.pits[pit];next.pits[pit]=0;let at=pit;
    while(stones>0){at=(at+1)%14;if(pos.turn==="you"&&at===13||pos.turn==="bot"&&at===6)continue;next.pits[at]++;stones--;}
    if(pos.turn==="you"&&at>=0&&at<=5&&next.pits[at]===1&&next.pits[12-at]>0){next.pits[6]+=next.pits[at]+next.pits[12-at];next.pits[at]=0;next.pits[12-at]=0;}
    if(pos.turn==="bot"&&at>=7&&at<=12&&next.pits[at]===1&&next.pits[12-at]>0){next.pits[13]+=next.pits[at]+next.pits[12-at];next.pits[at]=0;next.pits[12-at]=0;}
    const extra=pos.turn==="you"?at===6:at===13;next.turn=extra?pos.turn:pos.turn==="you"?"bot":"you";sweep(next);return next;
  }
  function evaluate(pos){return (pos.pits[6]-pos.pits[13])*2+(pos.pits.slice(0,6).reduce((a,b)=>a+b,0)-pos.pits.slice(7,13).reduce((a,b)=>a+b,0))*.12;}
  function botMove(pos,depth,alpha=-Infinity,beta=Infinity){
    if(depth===0||pos.done)return {score:evaluate(pos),move:null};
    const side=pos.turn,choices=moves(pos,side);if(!choices.length)return {score:evaluate(pos),move:null};
    let best=side==="bot"?Infinity:-Infinity,bestMove=choices[0];
    for(const move of choices){const next=apply(pos,move),result=botMove(next,depth-1,alpha,beta);if(side==="bot"?result.score<best:result.score>best){best=result.score;bestMove=move;}
      if(side==="bot")beta=Math.min(beta,best);else alpha=Math.max(alpha,best);if(beta<=alpha)break;}
    return {score:best,move:bestMove};
  }
  function finish(){
    if(!s.done)return;
    const you=s.pits[6],bot=s.pits[13];
    if(you>bot)c.settle(s.bet,s.bet*2,"You win Mancala "+you+" to "+bot+".");
    else if(you===bot)c.settle(s.bet,s.bet,"Mancala tie. Stake returned.");
    else c.settle(s.bet,0,"House bot wins Mancala "+bot+" to "+you+".");
  }
  function render(status="Choose one of your six pits.",type=""){
    const body=s?'<div class="tiny-note">HOUSE BOT · TOP ROW · YOU · BOTTOM ROW</div><div class="table-seats"><div class="seat"><small>HOUSE STORE</small><strong>'+s.pits[13]+'</strong></div><div class="seat"><small>YOUR STORE</small><strong>'+s.pits[6]+'</strong></div></div><div class="board-grid" style="grid-template-columns:repeat(6,minmax(40px,1fr));max-width:520px"><div style="grid-column:span 6;display:grid;grid-template-columns:repeat(6,1fr);gap:5px">'+[12,11,10,9,8,7].map(i=>'<div class="seat"><small>'+s.pits[i]+'</small><strong>●</strong></div>').join("")+'</div><div style="grid-column:span 6;display:grid;grid-template-columns:repeat(6,1fr);gap:5px">'+[0,1,2,3,4,5].map(i=>'<button class="game-action '+(s.turn==="you"?"primary":"secondary")+'" data-pit="'+i+'" '+(s.done||s.turn!=="you"||s.pits[i]===0?"disabled":"")+'>'+s.pits[i]+' stones</button>').join("")+'</div></div>':'<div class="table-felt"><h3>Mancala (Kalah)</h3><p class="muted">Sow stones counter-clockwise, capture opposite pits when your last stone lands in an empty pit, and take an extra turn when you land in your store. The house bot searches several moves ahead.</p><button class="game-action primary" data-act="start">Start match</button></div>';
    c.page(c.betInput()+'<section class="arena3d-stage" aria-label="Interactive 3D Mancala board"></section>'+body,status,type);
    const players=[{name:"You",human:true,score:s?s.pits[6]:0,status:s&&s.turn==="you"?"YOUR TURN":"PLAYER"},{name:"HAL",score:s?s.pits[13]:0,status:s&&s.turn==="bot"?"THINKING":"CPU"}];
    const sceneConfig={kind:"board",title:"Mancala",players,pits:s?s.pits:initial().pits,centerText:s?(s.turn==="you"?"YOUR TURN":"BOT THINKING"):"KALAH"};
    if(!arena)arena=mountArena3D(root,sceneConfig);else arena.update(sceneConfig);
  }
  function start(){const bet=c.takeBet();if(!bet)return;s={...initial(),bet};render("Your move.");}
  function click(e){
    const b=e.target.closest("[data-act],[data-pit]");if(!b)return;
    if(b.dataset.act==="start"||b.dataset.act==="again"){if(s&&!s.done)return;start();return;}
    if(!s||s.done||s.turn!=="you"||b.dataset.pit===undefined)return;
    const pit=Number(b.dataset.pit);if(!moves(s,"you").includes(pit))return;
    s=apply(s,pit);if(s.done){finish();return;}
    while(s.turn==="bot"&&!s.done){const move=botMove(s,5).move;if(move===null)break;s=apply(s,move);}
    if(s.done){finish();return;}render("House bot moved. Your turn.");
  }
  c.bind(click);render("Start a match.");const baseClose=c.close,baseDestroy=c.destroy;
  c.close=()=>{baseClose();arena?.destroy();};
  c.destroy=()=>{baseDestroy();arena?.destroy();};
  return c;
}

function mountMastermind(game,root,wallet){
  const c=makeGame(game,root,wallet);let s=null;
  function render(status="Crack the four-colour code in ten guesses.",type=""){
    const rows=s?s.guesses.map(g=>'<div class="action-row">'+g.colors.map(x=>'<span class="die">'+COLORS[x]+'</span>').join("")+'<small class="tiny-note">'+g.exact+' exact · '+g.close+' colour only</small></div>').join(""):"";
    const current=s?s.current:[0,1,2,3];
    const body=s?'<div class="tiny-note">SELECT EACH PEG TO CYCLE COLOURS · DUPLICATES ARE ALLOWED</div><div class="action-row">'+current.map((x,i)=>'<button class="die held" data-slot="'+i+'">'+COLORS[x]+'</button>').join("")+'</div><div class="action-row"><button class="game-action primary" data-act="guess" '+(s.done?"disabled":"")+' >Submit guess ('+s.guesses.length+'/10)</button><button class="game-action secondary" data-act="reset" '+(s.done?"disabled":"")+' >Reset pegs</button></div><div class="aside-card"><small class="aside-label">GUESS HISTORY</small>'+rows+'</div>'+(s.done?'<div class="result-banner">'+(s.won?"Code cracked!":"The code was "+s.code.map(x=>COLORS[x]).join(" "))+'</div><button class="game-action primary" data-act="again">New code</button>':''):'<div class="table-felt"><h3>Mastermind</h3><p class="muted">Break the hidden four-colour code. Exact markers mean correct colour and position; colour-only markers mean the colour exists elsewhere.</p><button class="game-action primary" data-act="start">Start puzzle</button></div>';
    c.page(c.betInput()+body,status,type);
  }
  function start(){const bet=c.takeBet();if(!bet)return;s={bet,code:Array.from({length:4},()=>Math.floor(Math.random()*6)),current:[0,1,2,3],guesses:[],done:false,won:false};render();}
  function click(e){
    const b=e.target.closest("[data-act],[data-slot]");if(!b)return;
    if(b.dataset.act==="start"||b.dataset.act==="again"){if(s&&!s.done)return;start();}
    else if(s&&!s.done&&b.dataset.slot!==undefined){const i=Number(b.dataset.slot);s.current[i]=(s.current[i]+1)%6;render();}
    else if(s&&!s.done&&b.dataset.act==="reset"){s.current=[0,1,2,3];render();}
    else if(s&&!s.done&&b.dataset.act==="guess"){
      const exact=s.current.filter((x,i)=>x===s.code[i]).length,counts={};s.code.forEach(x=>counts[x]=(counts[x]||0)+1);
      let total=0;s.current.forEach(x=>{if(counts[x]>0){total++;counts[x]--;}});const close=total-exact;
      s.guesses.push({colors:s.current.slice(),exact,close});
      if(exact===4){s.done=true;s.won=true;c.settle(s.bet,s.bet*3,"Code cracked in "+s.guesses.length+" guesses.");}
      else if(s.guesses.length>=10){s.done=true;c.settle(s.bet,0,"Out of guesses. The code was "+s.code.map(x=>COLORS[x]).join(" ")+".");}
      else render("Feedback: "+exact+" exact, "+close+" colour-only.");
    }
  }
  c.bind(click);render();return c;
}

function mountMemory(game,root,wallet){
  const c=makeGame(game,root,wallet);let s=null;
  const icons=["♠","♥","♦","♣","★","☀","☂","♫"];
  function render(status="Find all eight matching pairs.",type=""){
    const body=s?'<div class="tiny-note">MOVES: '+s.moves+' · MATCHED: '+s.matched.size+' / 8 PAIRS</div><div class="board-grid" style="grid-template-columns:repeat(4,54px)">'+s.cards.map((x,i)=>'<button class="board-cell" style="width:54px;height:54px" data-card="'+i+'" '+(s.matched.has(i)||s.flipped.includes(i)||s.done?"disabled":"")+'>'+(s.flipped.includes(i)||s.matched.has(i)?x:"?")+'</button>').join("")+'</div>'+(s.done?'<button class="game-action primary" data-act="again">New puzzle</button>':'<div class="tiny-note">Turn over two cards per move. Mismatches remain visible until the next selection.</div>'):'<div class="table-felt"><h3>Memory Match</h3><p class="muted">A 4×4 concentration board with eight pairs. Find all pairs in as few moves as possible.</p><button class="game-action primary" data-act="start">Start memory game</button></div>';
    c.page(c.betInput()+body,status,type);
  }
  function start(){const bet=c.takeBet();if(!bet)return;const cards=icons.concat(icons);for(let i=cards.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[cards[i],cards[j]]=[cards[j],cards[i]];}s={bet,cards,flipped:[],matched:new Set(),moves:0,done:false};render();}
  function click(e){
    const b=e.target.closest("[data-act],[data-card]");if(!b)return;
    if(b.dataset.act==="start"||b.dataset.act==="again"){if(s&&!s.done)return;start();return;}
    if(!s||s.done||b.dataset.card===undefined)return;
    if(s.flipped.length===2){const [a,d]=s.flipped;if(s.cards[a]===s.cards[d]){s.matched.add(a);s.matched.add(d);}s.flipped=[];}
    const i=Number(b.dataset.card);if(s.matched.has(i)||s.flipped.includes(i))return;s.flipped.push(i);
    if(s.flipped.length===2){s.moves++;if(s.cards[s.flipped[0]]===s.cards[s.flipped[1]]){s.matched.add(s.flipped[0]);s.matched.add(s.flipped[1]);s.flipped=[];}}
    if(s.matched.size===16){s.done=true;const payout=s.moves<=12?s.bet*4:s.moves<=18?s.bet*3:s.bet*2;c.settle(s.bet,payout,"All pairs found in "+s.moves+" moves.");}
    else render();
  }
  c.bind(click);render();return c;
}

function mountMinesweeper(game,root,wallet){
  const c=makeGame(game,root,wallet);let s=null,flags=false;
  const SIZE=9,MINES=10;
  function neighbours(i){const r=Math.floor(i/SIZE),col=i%SIZE,out=[];for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++){const rr=r+dr,cc=col+dc;if((dr||dc)&&rr>=0&&rr<SIZE&&cc>=0&&cc<SIZE)out.push(rr*SIZE+cc);}return out;}
  function init(){const mines=new Set();while(mines.size<MINES)mines.add(Math.floor(Math.random()*81));const counts=Array.from({length:81},(_,i)=>neighbours(i).filter(n=>mines.has(n)).length);s={bet:0,mines,counts,revealed:new Set(),marked:new Set(),done:false};}
  function reveal(i){
    if(s.done||s.marked.has(i)||s.revealed.has(i))return;
    if(s.mines.has(i)){s.revealed.add(i);s.done=true;c.settle(s.bet,0,"Mine hit. Puzzle failed.");return;}
    const queue=[i];
    while(queue.length){const n=queue.pop();if(s.revealed.has(n)||s.mines.has(n))continue;s.revealed.add(n);if(s.counts[n]===0)for(const next of neighbours(n))if(!s.revealed.has(next))queue.push(next);}
    if(s.revealed.size===81-MINES){s.done=true;c.settle(s.bet,s.bet*3,"All safe squares revealed. Minesweeper cleared.");}
    else render("Safe square. "+s.revealed.size+" / 71 revealed.");
  }
  function render(status="Find every safe square and avoid the mines.",type=""){
    const board=s?s.counts.map((n,i)=>'<button class="board-cell" style="width:34px;height:34px;padding:0;font-size:11px" data-cell="'+i+'" '+(s.revealed.has(i)||s.done?"disabled":"")+'>'+(s.revealed.has(i)?(s.mines.has(i)?"✹":n||""):(s.marked.has(i)?"⚑":""))+'</button>').join(""):"";
    c.page(c.betInput()+(s?'<div class="tiny-note">9×9 BOARD · 10 MINES · '+s.revealed.size+' SAFE SQUARES REVEALED</div><div class="board-grid" style="grid-template-columns:repeat(9,34px);gap:3px">'+board+'</div><div class="action-row"><button class="game-action secondary" data-act="flag">Toggle flag mode: '+(flags?"ON":"OFF")+'</button><button class="game-action primary" data-act="again">New board</button></div>':'<div class="table-felt"><h3>Minesweeper</h3><p class="muted">A classic 9×9 logic puzzle. Number clues count adjacent mines. Flag suspected mines and reveal all 71 safe squares.</p><button class="game-action primary" data-act="start">Start puzzle</button></div>'),status,type);
  }
  function click(e){
    const b=e.target.closest("[data-act],[data-cell]");if(!b)return;
    if(b.dataset.act==="start"||b.dataset.act==="again"){if(s&&!s.done)return;const bet=c.takeBet();if(!bet)return;flags=false;init();s.bet=bet;render();}
    else if(b.dataset.act==="flag"){flags=!flags;render();}
    else if(s&&!s.done&&b.dataset.cell!==undefined){const i=Number(b.dataset.cell);if(flags){if(s.marked.has(i))s.marked.delete(i);else s.marked.add(i);render("Flag placement changed.");}else reveal(i);}
  }
  c.bind(click);render();return c;
}

function mountKlondike(game,root,wallet){
  const c=makeGame(game,root,wallet);let s=null,selected=null;
  const seq=["23456789TJQKA"];
  function suitColor(card){return "♥♦".includes(card.suit)?"red":"black";}
  function canStack(card,target){return value(card)===value(target)-1&&suitColor(card)!==suitColor(target);}
  function canFoundation(card,pile){return pile.length?pile[pile.length-1].suit===card.suit&&value(card)===value(pile[pile.length-1])+1:value(card)===14;}
  function start(){const bet=c.takeBet();if(!bet)return;const d=deck(),tableau=Array.from({length:7},(_,i)=>{const pile=d.splice(0,i+1);return pile.map((x,j)=>({...x,face:j===i}));});s={bet,stock:d,waste:[],tableau,foundations:[[],[],[],[]],moves:0,done:false};selected=null;render("Build four foundations from Ace to King.");}
  function render(status="Select a face-up card to move.",type=""){
    const body=s?'<div class="tiny-note">STOCK / WASTE · MOVES '+s.moves+'</div><div class="action-row"><button class="game-action secondary" data-act="stock">Draw stock ('+s.stock.length+')</button><button class="game-action secondary" data-card="waste">'+(s.waste.length?card(s.waste[s.waste.length-1]):"Waste")+'</button><button class="game-action secondary" data-act="foundation" data-pile="0">♠ '+s.foundations[0].length+'</button><button class="game-action secondary" data-act="foundation" data-pile="1">♥ '+s.foundations[1].length+'</button><button class="game-action secondary" data-act="foundation" data-pile="2">♦ '+s.foundations[2].length+'</button><button class="game-action secondary" data-act="foundation" data-pile="3">♣ '+s.foundations[3].length+'</button></div><div class="board-grid" style="grid-template-columns:repeat(7,minmax(48px,1fr));gap:5px;align-items:start">'+s.tableau.map((pile,i)=>'<div class="aside-card" data-col="'+i+'" style="min-height:180px;padding:5px"><small class="aside-label">PILE '+(i+1)+'</small>'+pile.map((x,j)=>'<button class="playing-card '+(suitColor(x)==="red"?"red":"")+'" data-card="'+i+':'+j+'" style="width:44px;height:58px;margin:2px;padding:4px;'+(!x.face?"background:repeating-linear-gradient(45deg,#37452e 0 4px,#596e43 4px 8px);color:transparent":selected&&selected.col===i&&selected.index===j?"outline:3px solid #d7bd7c":"")+'">'+(x.face?x.rank+x.suit:"◆")+'</button>').join("")+'</div>').join("")+'</div><div class="action-row"><button class="game-action primary" data-act="to-foundation" '+(!selected?"disabled":"")+' >Move selected to foundation</button><button class="game-action secondary" data-act="clear">Clear selection</button></div>':'<div class="table-felt"><h3>Klondike Solitaire</h3><p class="muted">Seven tableau columns, a stock and four suit foundations. Build descending alternating-colour runs and move Aces to Kings to win.</p><button class="game-action primary" data-act="start">Deal solitaire</button></div>';
    c.page(c.betInput()+body,status,type);
  }
  function revealTop(col){const pile=s.tableau[col];if(pile.length&&!pile[pile.length-1].face)pile[pile.length-1].face=true;}
  function moveToFoundation(cardObj){
    const idx=SUITS.indexOf(cardObj.suit),pile=s.foundations[idx];if(!canFoundation(cardObj,pile))return false;
    pile.push(cardObj);return true;
  }
  function click(e){
    const b=e.target.closest("[data-act],[data-card],[data-col]");if(!b)return;
    const a=b.dataset.act;
    if(a==="start"||a==="again"){if(s&&!s.done)return;start();return;}
    if(!s||s.done)return;
    if(a==="stock"){
      if(s.stock.length)s.waste.push(s.stock.pop());
      else if(s.waste.length)s.stock=s.waste.splice(0).reverse();
      s.moves++;render();return;
    }
    if(a==="clear"){selected=null;render();return;}
    const selectedCards=()=>{
      if(!selected)return [];
      return selected.col==="waste"?(s.waste.length?[s.waste[s.waste.length-1]]:[]):s.tableau[selected.col].slice(selected.index);
    };
    const removeSelected=()=>{
      if(selected.col==="waste")s.waste.pop();
      else {s.tableau[selected.col].splice(selected.index);revealTop(selected.col);}
      selected=null;
    };
    if((a==="to-foundation"||a==="foundation")&&selected){
      const cards=selectedCards(),foundation=s.foundations[a==="foundation"?Number(b.dataset.pile):SUITS.indexOf(cards[0]?.suit)]||[];
      if(cards.length!==1||!canFoundation(cards[0],foundation)){c.message("Only a single valid top card can move to that foundation.");return;}
      foundation.push(cards[0]);removeSelected();s.moves++;checkWin();render();return;
    }
    if(b.dataset.card!==undefined){
      if(b.dataset.card==="waste"){
        if(!s.waste.length)return;
        if(selected&&selected.col==="waste"){selected=null;}
        else selected={col:"waste",index:0};
        render();return;
      }
      const [col,index]=b.dataset.card.split(":").map(Number),pile=s.tableau[col],obj=pile[index];
      if(!obj.face)return;
      if(!selected){selected={col,index};render();return;}
      if(selected.col===col&&selected.index===index){selected=null;render();return;}
      const moving=selectedCards(),target=pile[pile.length-1];
      if(moving.length&&(!target&&value(moving[0])===13||target&&canStack(moving[0],target))){
        removeSelected();pile.push(...moving);selected=null;s.moves++;checkWin();render();return;
      }
      selected={col,index};render();return;
    }
    if(b.dataset.col!==undefined&&selected){
      const col=Number(b.dataset.col),pile=s.tableau[col],target=pile[pile.length-1],moving=selectedCards();
      if(!moving.length||target||value(moving[0])!==13){c.message("Only a King can start an empty tableau column.");return;}
      removeSelected();pile.push(...moving);selected=null;s.moves++;checkWin();render();
    }
  }
  function checkWin(){if(s.foundations.every(p=>p.length===13)){s.done=true;c.settle(s.bet,s.bet*5,"Solitaire complete. All 52 cards are in the foundations.");}}
  c.bind(click);render();return c;
}

export function mountExtraGame(game,root,wallet){
  switch(game.mode){
    case "three-card-poker":return mountThreeCardPoker(game,root,wallet);
    case "casino-war":return mountCasinoWar(game,root,wallet);
    case "red-dog":return mountRedDog(game,root,wallet);
    case "caribbean-stud":return mountCaribbeanStud(game,root,wallet);
    case "let-it-ride":return mountLetItRide(game,root,wallet);
    case "pai-gow":return mountPaiGow(game,root,wallet);
    case "chuck-a-luck":return mountDiceSideBet(game,root,wallet,"chuck");
    case "crown-anchor":return mountDiceSideBet(game,root,wallet,"crown");
    case "bingo-75":return mountBingo(game,root,wallet);
    case "mancala":return mountMancala(game,root,wallet);
    case "mastermind":return mountMastermind(game,root,wallet);
    case "memory-match":return mountMemory(game,root,wallet);
    case "minesweeper":return mountMinesweeper(game,root,wallet);
    case "klondike":return mountKlondike(game,root,wallet);
    default:root.innerHTML='<div class="result-banner">This game mode is not available.</div>';return {close:()=>{},destroy:()=>{}};
  }
}
