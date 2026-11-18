import { mountPoker } from "./poker.js";
import { mountBoard } from "./board.js";
import { mountExtraGame } from "./extra-games.js";
import { mountArena3D } from "./arena3d.js";

function cardDeck(decks) {
  const suits=["♠","♥","♦","♣"],ranks=["A","2","3","4","5","6","7","8","9","10","J","Q","K"],out=[];
  for(let d=0;d<(decks||1);d++)for(const suit of suits)for(const rank of ranks)out.push({suit,rank});
  for(let i=out.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[out[i],out[j]]=[out[j],out[i]];}
  return out;
}
function value(card){return card.rank==="A"?11:["J","Q","K","10"].includes(card.rank)?10:Number(card.rank);}
function total(hand){let t=hand.reduce((a,c)=>a+value(c),0),aces=hand.filter(c=>c.rank==="A").length;while(t>21&&aces){t-=10;aces--;}return t;}
function cardHTML(card,back){
  if(back)return '<div class="playing-card back">◆</div>';
  return '<div class="playing-card '+("♥♦".includes(card.suit)?"red":"")+'"><span>'+card.rank+'</span><span class="suit">'+card.suit+'</span><span style="align-self:flex-end;transform:rotate(180deg)">'+card.rank+'</span></div>';
}
function rankHand(cards){
  const vals=cards.map(c=>c.rank==="A"?14:c.rank==="K"?13:c.rank==="Q"?12:c.rank==="J"?11:Number(c.rank)).sort((a,b)=>b-a);
  const counts={};vals.forEach(v=>counts[v]=(counts[v]||0)+1);
  const pairs=Object.keys(counts).map(Number).filter(v=>counts[v]===2).sort((a,b)=>b-a),trips=Object.keys(counts).map(Number).filter(v=>counts[v]===3),quads=Object.keys(counts).map(Number).filter(v=>counts[v]===4);
  const flush=cards.length===5&&cards.every(c=>c.suit===cards[0].suit);
  const unique=Array.from(new Set(vals));let straight=0;
  if(unique.length===5&&unique[0]-unique[4]===4)straight=unique[0];
  if(unique.join(",")==="14,5,4,3,2")straight=5;
  if(flush&&straight===14)return {name:"Royal flush",rank:250};
  if(flush&&straight)return {name:"Straight flush",rank:50};
  if(quads.length)return {name:"Four of a kind",rank:25};
  if(trips.length&&pairs.length)return {name:"Full house",rank:9};
  if(flush)return {name:"Flush",rank:6};
  if(straight)return {name:"Straight",rank:4};
  if(trips.length)return {name:"Three of a kind",rank:3};
  if(pairs.length===2)return {name:"Two pair",rank:2};
  if(pairs.length===1&&pairs[0]>=11)return {name:"Jacks or better",rank:1};
  if(pairs.length===1)return {name:"Low pair",rank:0};
  return {name:"High card",rank:0};
}
function rankValue(cards){
  const vals=cards.map(c=>c.rank==="A"?14:c.rank==="K"?13:c.rank==="Q"?12:c.rank==="J"?11:Number(c.rank)).sort((a,b)=>b-a);
  const counts={};vals.forEach(v=>counts[v]=(counts[v]||0)+1);
  const groups=Object.keys(counts).map(Number).sort((a,b)=>counts[b]-counts[a]||b-a);
  const flush=cards.every(c=>c.suit===cards[0].suit);
  const unique=Array.from(new Set(vals));let straight=0;
  if(unique.length===5&&unique[0]-unique[4]===4)straight=unique[0];
  if(unique.join(",")==="14,5,4,3,2")straight=5;
  if(flush&&straight)return [8,straight];
  if(counts[groups[0]]===4)return [7,groups[0],groups[1]];
  if(counts[groups[0]]===3&&counts[groups[1]]===2)return [6,groups[0],groups[1]];
  if(flush)return [5,...vals];
  if(straight)return [4,straight];
  if(counts[groups[0]]===3)return [3,groups[0],...vals.filter(v=>v!==groups[0])];
  if(counts[groups[0]]===2&&counts[groups[1]]===2)return [2,groups[0],groups[1],groups[2]];
  if(counts[groups[0]]===2)return [1,groups[0],...vals.filter(v=>v!==groups[0])];
  return [0,...vals];
}
function compare(a,b){for(let i=0;i<Math.max(a.length,b.length);i++){if((a[i]||0)!==(b[i]||0))return (a[i]||0)-(b[i]||0);}return 0;}
function shuffleNumbers(max){const a=Array.from({length:max},(_,i)=>i+1);for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function common(game,root,wallet){
  let currentStatus="";
  const intro='<div class="game-intro"><div class="game-icon-large">'+game.icon+'</div><h3>'+game.name+'</h3><p>'+game.description+'</p></div>';
  const betBar='<div class="bet-controls"><label for="stake">WAGER</label><input class="bet-input" id="stake" type="number" min="10" max="'+Math.floor(wallet.balance)+'" step="5" value="25"><span class="tiny-note">Fictional credits · '+Math.floor(wallet.balance).toLocaleString()+' available</span></div>';
  function status(message,type){currentStatus=message;const el=root.querySelector("#gameResult");if(el){el.textContent=message;el.className="result-banner"+(type?" "+type:"");}}
  function stake(){const amount=Number(root.querySelector("#stake")?.value||0);if(!Number.isInteger(amount)||amount<10){status("Enter a whole-number wager of at least 10 credits.","loss");return null;}if(amount>wallet.balance){status("That wager is higher than your available credit balance.","loss");return null;}return amount;}
  function charge(){const amount=stake();if(amount===null)return null;if(!wallet.charge(amount)){status("Insufficient demo credits.","loss");return null;}return amount;}
  function settle(amount,payout,message){wallet.settle(amount,Math.max(0,Math.floor(payout)),game.name);status(message+(payout>amount?" Net +" +(payout-amount)+" credits.":payout<amount?" Net −"+(amount-payout)+" credits.":" Stake returned."),payout>amount?"win":payout<amount?"loss":"");}
  function page(body,withBet){
    root.innerHTML=intro+(withBet===false?"":betBar)+'<div class="game-content">'+body+'</div><div id="gameResult" class="result-banner">'+currentStatus+'</div>';
  }
  function bind(handler){root.addEventListener("click",handler);return ()=>root.removeEventListener("click",handler);}
  return {status,stake,charge,settle,page,bind,root,wallet,game};
}
function mountRoulette(game,root,wallet){
  const c=common(game,root,wallet);let pick="red",last=null;
  const render=()=>{
    const american=game.name.toLowerCase().includes("american")||game.name.toLowerCase().includes("double zero");
    const max=american?38:37;const nums=Array.from({length:american?37:37},(_,i)=>i);
    let body='<div class="tiny-note">WHEEL · '+(american?"0 AND 00 · 38 POCKETS":"SINGLE ZERO · 37 POCKETS")+'</div><div class="choice-row">'+["red","black","odd","even","low","high","green","number"].map(p=>'<button class="game-action '+(pick===p?"primary":"secondary")+'" data-pick="'+p+'">'+(p==="low"?"1–18":p==="high"?"19–36":p.toUpperCase())+'</button>').join("")+'</div>'+
      '<div class="roulette-board" style="display:grid;grid-template-columns:repeat(7,minmax(28px,1fr));gap:5px;max-width:470px;margin:18px auto">'+nums.map(n=>'<button class="board-cell" data-number="'+n+'" style="font-size:12px;height:38px;background:'+(n===0?"#42654a":([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36].includes(n)?"#8e4140":"#222a21"))+';border-color:'+(pick==="number"&&last&&last.pick===n?"#e7d28f":"#596449")+'">'+n+'</button>').join("")+(american?'<button class="board-cell" data-number="00" style="font-size:11px;height:38px;background:#42654a">00</button>':"")+'</div>'+
      '<div class="action-row"><button class="game-action primary" data-act="spin">Spin wheel</button></div>'+
      '<div class="tiny-note">STRAIGHT UP 35:1 · RED / BLACK / EVEN / ODD / LOW / HIGH 1:1 · ZERO WINS ONLY ON GREEN</div>';
    c.page(body,true);
    if(last)c.status(last.message,last.win?"win":"loss");
  };
  const click=c.bind(e=>{
    const p=e.target.closest("[data-pick],[data-number],[data-act]");if(!p)return;
    if(p.dataset.pick){pick=p.dataset.pick;render();return;}
    if(p.dataset.number!==undefined&&pick==="number"){last={pick:p.dataset.number,message:"Number "+p.dataset.number+" selected.",win:false};c.status(last.message);render();return;}
    if(p.dataset.act==="spin"){
      const bet=c.charge();if(bet===null)return;
      const american=game.name.toLowerCase().includes("american")||game.name.toLowerCase().includes("double zero");
      const pocket=Math.floor(Math.random()*(american?38:37));
      const red=[1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
      const color=pocket===0?"green":pocket===37?"green":red.includes(pocket)?"red":"black";
      let won=false,mult=0,desc="No win. "+(pocket===37?"00":pocket)+" "+color+".";
      const french=game.name.toLowerCase().includes("french")||game.name.toLowerCase().includes("la partage");
      if(pick==="number"&&last&&String(last.pick)===(pocket===37?"00":String(pocket))){won=true;mult=36;desc="Straight-up hit! "+(pocket===37?"00":pocket)+" pays 35:1.";}
      else if(pick==="red"||pick==="black"){won=pick===color;mult=2;}
      else if(pick==="green"){won=color==="green";mult=american?18:36;}
      else if(pick==="odd"||pick==="even"){won=pocket!==0&&pocket!==37&&(pick==="odd"?pocket%2===1:pocket%2===0);mult=2;}
      else if(pick==="low"||pick==="high"){won=pocket>=1&&pocket<=36&&(pick==="low"?pocket<=18:pocket>=19);mult=2;}
      let payout=won?bet*mult:0;
      if(french&&color==="green"&&["red","black","odd","even","low","high"].includes(pick)){payout=Math.floor(bet/2);desc="Zero landed. La Partage returns half your even-money stake.";}
      if(won)desc=(pocket===37?"00":pocket)+" "+color+" — winning bet!";last={pick:null,message:"Wheel result: "+desc,win:won};c.settle(bet,payout,"Wheel result: "+desc);render();
    }
  });
  render();return {close:()=>{},destroy:click};
}
function mountBlackjack(game,root,wallet){
  const c=common(game,root,wallet);
  const hitSoft17=game.name.toLowerCase().includes("hits soft 17");
  let s=null;
  function isPair(cards){
    return cards.length===2&&value(cards[0])===value(cards[1]);
  }
  function activeHand(){return s&&s.hands[s.active];}
  function handName(i){return "Hand "+(i+1);}
  function settleHands(){
    while(total(s.dealer)<17||(hitSoft17&&total(s.dealer)===17&&s.dealer.some(x=>x.rank==="A")))s.dealer.push(s.deck.pop());
    const dealerTotal=total(s.dealer),dealerBust=dealerTotal>21;
    let gross=0,results=[];
    for(let i=0;i<s.hands.length;i++){
      const hand=s.hands[i],playerTotal=total(hand.cards);
      let payout=0,outcome="loss";
      if(hand.busted){payout=0;outcome="bust";}
      else if(hand.natural&&s.hands.length===1){
        if(dealerTotal===21){payout=hand.bet;outcome="push";}
        else {payout=Math.floor(hand.bet*2.5);outcome="natural blackjack";}
      } else if(dealerBust||playerTotal>dealerTotal){payout=hand.bet*2;outcome=dealerBust?"dealer bust":"win";}
      else if(playerTotal===dealerTotal){payout=hand.bet;outcome="push";}
      gross+=payout;results.push(handName(i)+": "+outcome+" ("+playerTotal+" vs "+dealerTotal+")");
    }
    s.finished=true;s.payout=gross;s.message=results.join(" · ");s.win=gross>s.totalBet;s.loss=gross<s.totalBet;
    c.settle(s.totalBet,gross,s.message);render();
  }
  function advanceHand(){
    while(s.active<s.hands.length&&s.hands[s.active].status!=="active")s.active++;
    if(s.active>=s.hands.length){settleHands();return;}
    s.message="Your turn: "+handName(s.active)+".";
    render();
  }
  function dealerNatural(){
    return total(s.dealer)===21&&s.dealer.length===2;
  }
  function render(){
    let body='<div class="tiny-note">'+game.name.toUpperCase()+' · SIX-DECK TABLE · DEALER STANDS ON SOFT 17 · PAIR SPLITS AND DOUBLE DOWN</div>';
    if(!s){
      body+='<div class="table-felt"><h3>Twenty-one</h3><p class="muted">Beat the dealer without going over 21. Split matching-value pairs into two hands, double down on a two-card hand, or stand.</p><div class="playing-cards" style="font-size:40px">♠ ♥ ♦ ♣</div><div class="action-row"><button class="game-action primary" data-act="deal">Deal cards</button></div></div>';
    } else {
      body+='<div class="table-felt"><div class="table-seats"><div class="seat"><small>DEALER</small><strong>'+(s.finished?total(s.dealer):"?")+'</strong></div><div class="seat"><small>YOUR TOTAL WAGER</small><strong>'+s.totalBet+'</strong></div></div><div class="tiny-note">DEALER HAND</div><div class="playing-cards">'+s.dealer.map((x,i)=>cardHTML(x,!s.finished&&i===1)).join("")+'</div>';
      body+='<div class="tiny-note">YOUR HANDS</div>';
      body+=s.hands.map((hand,i)=>'<div class="aside-card" style="max-width:650px;margin:10px auto;border-color:'+(i===s.active&&!s.finished?"#8b9561":"#394333")+'"><div class="aside-line"><strong>'+handName(i)+(i===s.active&&!s.finished?" · YOUR TURN":"")+'</strong><span>'+total(hand.cards)+' · '+hand.bet+' credits</span></div><div class="playing-cards">'+hand.cards.map(x=>cardHTML(x,false)).join("")+'</div><div class="tiny-note">'+(hand.status==="active"?"PLAYING":hand.status.toUpperCase())+'</div></div>').join("");
      if(!s.finished){
        const hand=activeHand();
        body+='<div class="action-row"><button class="game-action primary" data-act="hit">Hit</button><button class="game-action secondary" data-act="stand">Stand</button><button class="game-action secondary" data-act="double" '+(hand.cards.length!==2?"disabled":"")+' >Double down</button><button class="game-action secondary" data-act="split" '+(!isPair(hand.cards)||s.hands.length>=2?"disabled":"")+' >Split pair</button></div>';
      } else {
        body+='<div class="action-row"><button class="game-action primary" data-act="again">New hand</button></div>';
      }
    }
    c.page(body,true);
    if(s&&s.message)c.status(s.message,s.win?"win":s.loss?"loss":"");
  }
  function startHand(){
    if(s&&!s.finished)return;
    const bet=c.charge();if(bet===null)return;
    const deck=cardDeck(6),player=[deck.pop(),deck.pop()],dealer=[deck.pop(),deck.pop()];
    s={bet,totalBet:bet,deck,hands:[{cards:player,bet,status:"active",busted:false,natural:total(player)===21}],dealer,active:0,finished:false,message:"You have "+total(player)+". Hit, stand, split or double down.",payout:0};
    if(total(player)===21||dealerNatural()){
      s.active=0;
      if(total(player)===21&&!dealerNatural()){s.finished=true;s.payout=Math.floor(bet*2.5);s.message="Natural blackjack!";s.win=true;s.loss=false;c.settle(bet,s.payout,s.message);render();return;}
      if(total(player)===21&&dealerNatural()){s.finished=true;s.payout=bet;s.message="Both player and dealer have natural blackjack. Push.";s.win=false;s.loss=false;c.settle(bet,bet,s.message);render();return;}
      if(dealerNatural()){s.finished=true;s.payout=0;s.message="Dealer has natural blackjack.";s.win=false;s.loss=true;c.settle(bet,0,s.message);render();return;}
    }
    render();
  }
  function click(e){
    const b=e.target.closest("[data-act]");if(!b)return;
    const action=b.dataset.act;
    if(action==="deal"||action==="again"){startHand();return;}
    if(!s||s.finished)return;
    const hand=activeHand();if(!hand||hand.status!=="active")return;
    if(action==="hit"){
      hand.cards.push(s.deck.pop());
      const score=total(hand.cards);
      if(score>21){hand.status="bust";hand.busted=true;advanceHand();}
      else if(score===21){hand.status="stood";advanceHand();}
      else{s.message=handName(s.active)+" has "+score+". Hit or stand.";render();}
    } else if(action==="stand"){
      hand.status="stood";advanceHand();
    } else if(action==="double"){
      if(hand.cards.length!==2)return;
      if(!wallet.charge(hand.bet)){c.status("Not enough credits to double down.","loss");return;}
      s.totalBet+=hand.bet;hand.bet*=2;hand.cards.push(s.deck.pop());
      hand.busted=total(hand.cards)>21;hand.status=hand.busted?"bust":"stood";
      advanceHand();
    } else if(action==="split"){
      if(!isPair(hand.cards)||s.hands.length>=2)return;
      if(!wallet.charge(hand.bet)){c.status("Not enough credits to split this hand.","loss");return;}
      s.totalBet+=hand.bet;
      const first=hand.cards[0],second=hand.cards[1],aces=first.rank==="A";
      s.hands=[{cards:[first,s.deck.pop()],bet:hand.bet,status:"active",busted:false,natural:false},{cards:[second,s.deck.pop()],bet:hand.bet,status:"active",busted:false,natural:false}];
      s.active=0;
      if(aces){s.hands.forEach(h=>h.status="stood");advanceHand();}
      else{s.message="Pairs split. Play "+handName(0)+", then "+handName(1)+".";render();}
    }
  }
  const off=c.bind(click);render();
  return {close:()=>{if(s&&!s.finished)wallet.settle(s.totalBet,0,game.name);},destroy:off};
}
function mountBaccarat(game,root,wallet){
  const c=common(game,root,wallet);let pick="banker",last=null;
  function score(hand){return hand.reduce((a,x)=>a+(x.rank==="A"?1:["10","J","Q","K"].includes(x.rank)?0:Number(x.rank)),0)%10;}
  function deal(){
    const deck=cardDeck(8),p=[deck.pop(),deck.pop()],b=[deck.pop(),deck.pop()];
    let ps=score(p),bs=score(b);
    if(ps<8&&bs<8){
      let third=null;if(ps<=5){third=deck.pop();p.push(third);ps=score(p);}
      let draw=false;
      if(!third)draw=bs<=5;
      else {const v=third.rank==="A"?1:["10","J","Q","K"].includes(third.rank)?0:Number(third.rank);draw=bs<=2||(bs===3&&v!==8)||(bs===4&&v>=2&&v<=7)||(bs===5&&v>=4&&v<=7)||(bs===6&&(v===6||v===7));}
      if(draw)b.push(deck.pop());
    }
    return {p,b,ps:score(p),bs:score(b)};
  }
  const render=()=>{
    const d=last?'<div class="table-felt"><div class="table-seats"><div class="seat"><small>PLAYER</small><strong>'+last.ps+'</strong></div><div class="seat"><small>BANKER</small><strong>'+last.bs+'</strong></div></div><div class="tiny-note">PLAYER HAND</div><div class="playing-cards">'+last.p.map(x=>cardHTML(x)).join("")+'</div><div class="tiny-note">BANKER HAND</div><div class="playing-cards">'+last.b.map(x=>cardHTML(x)).join("")+'</div></div>':'<div class="table-felt"><h3>Which hand will win?</h3><div class="playing-cards" style="font-size:44px">♦ ♣ ♥ ♠</div><p class="muted">Select Player, Banker or Tie. The cards are dealt using standard baccarat drawing rules.</p></div>';
    c.page('<div class="choice-row">'+["player","banker","tie"].map(x=>'<button class="game-action '+(pick===x?"primary":"secondary")+'" data-pick="'+x+'">'+x.toUpperCase()+(x==="banker"?" · 0.95:1":x==="tie"?" · 8:1":" · 1:1")+'</button>').join("")+'</div>'+d+'<div class="action-row"><button class="game-action primary" data-act="deal">Deal baccarat</button></div><div class="tiny-note">PLAYER / BANKER NATURAL ON 8 OR 9 · BANKER THIRD-CARD RULES APPLIED</div>',true);
    if(last&&last.message)c.status(last.message,last.win?"win":"loss");
  };
  const off=c.bind(e=>{
    const b=e.target.closest("[data-pick],[data-act]");if(!b)return;if(b.dataset.pick){pick=b.dataset.pick;render();return;}
    if(b.dataset.act==="deal"){const bet=c.charge();if(bet===null)return;const r=deal(),winner=r.ps>r.bs?"player":r.bs>r.ps?"banker":"tie";let gross=0;if(pick===winner)gross=pick==="tie"?bet*9:pick==="banker"?Math.floor(bet*1.95):bet*2;const message="Player "+r.ps+" · Banker "+r.bs+". "+winner.toUpperCase()+" wins.";last={...r,message,win:gross>bet};c.settle(bet,gross,message);render();}
  });
  render();return {close:()=>{},destroy:off};
}
function mountVideoPoker(game,root,wallet){
  const c=common(game,root,wallet);let s=null;
  const render=()=>{
    const cards=s?s.hand.map((x,i)=>'<button class="playing-card '+("♥♦".includes(x.suit)?"red":"")+'" data-hold="'+i+'" style="opacity:'+(s.phase==="draw"&&s.holds.includes(i)?".65":"1")+';transform:'+(s.phase==="draw"&&s.holds.includes(i)?"translateY(-7px)":"none")+'"><span>'+x.rank+'</span><span class="suit">'+x.suit+'</span><span style="align-self:flex-end;transform:rotate(180deg)">'+x.rank+'</span></button>').join(""):'<span class="muted">Five cards will be dealt here.</span>';
    const pay=[["Royal flush","250×"],["Straight flush","50×"],["Four of a kind","25×"],["Full house","9×"],["Flush","6×"],["Straight","4×"],["Three of a kind","3×"],["Two pair","2×"],["Jacks or better","1×"]];
    c.page('<div class="tiny-note">FIVE-CARD DRAW · HOLD THE CARDS YOU WANT TO KEEP</div><div class="playing-cards">'+cards+'</div><div class="action-row">'+(!s?'<button class="game-action primary" data-act="deal">Deal 5 cards</button>':s.phase==="draw"?'<button class="game-action primary" data-act="draw">Draw replacements</button>':'<button class="game-action primary" data-act="again">Deal next hand</button>')+'</div><div class="aside-card" style="max-width:440px;margin:17px auto"><small class="aside-label">PAY TABLE · '+(game.name==="Deuces Wild"?"DEUCES WILD":game.name.toUpperCase())+'</small>'+pay.map(x=>'<div class="aside-line"><span>'+x[0]+'</span><strong>'+x[1]+'</strong></div>').join("")+'</div>',true);
    if(s&&s.message)c.status(s.message,s.win?"win":"loss");
  };
  const off=c.bind(e=>{
    const b=e.target.closest("[data-act],[data-hold]");if(!b)return;
    if(b.dataset.hold!==undefined&&s&&s.phase==="draw"){const i=Number(b.dataset.hold);s.holds=s.holds.includes(i)?s.holds.filter(x=>x!==i):s.holds.concat([i]);render();return;}
    if(b.dataset.act==="deal"||b.dataset.act==="again"){
      if(s&&s.phase==="draw")return;const bet=c.charge();if(bet===null)return;s={bet,deck:cardDeck(1),hand:[],holds:[],phase:"draw"};s.hand=Array.from({length:5},()=>s.deck.pop());s.message="Choose which cards to hold, then draw.";render();
    } else if(b.dataset.act==="draw"&&s&&s.phase==="draw"){
      for(let i=0;i<5;i++)if(!s.holds.includes(i))s.hand[i]=s.deck.pop();const r=rankHand(s.hand);
      const factor=r.rank;
      let gross=factor===250?s.bet*250:factor?s.bet*factor:0;
      if(game.name==="Deuces Wild"&&s.hand.some(x=>x.rank==="2"))gross=Math.max(gross,s.bet*(r.name==="Four of a kind"?30:r.rank));
      s.phase="done";s.win=gross>s.bet;s.message=r.name==="Low pair"||r.name==="High card"?"No paying hand. "+r.name+".":r.name+" — "+(gross>0?"pays "+(gross/s.bet).toFixed(0)+"×.":"no payout.");
      c.settle(s.bet,gross,s.message);render();
    }
  });
  render();return {close:()=>{if(s&&s.phase==="draw")wallet.settle(s.bet,0,game.name);},destroy:off};
}
function mountSlots(game,root,wallet){
  const c=common(game,root,wallet);let result=null;
  const symbols=["🍒","🍋","🔔","💎","7️⃣","🍀","👑"];
  function spin(){
    const bet=c.charge();if(bet===null)return;
    const reels=Array.from({length:5},()=>Array.from({length:3},()=>symbols[Math.floor(Math.random()*symbols.length)]));
    const lines=[[1,1,1,1,1],[0,0,0,0,0],[2,2,2,2,2],[0,1,2,1,0],[2,1,0,1,2],[0,0,1,2,2],[2,2,1,0,0],[1,0,0,0,1],[1,2,2,2,1],[0,1,1,1,2]];
    const mult={"7️⃣":100,"💎":35,"👑":20,"🔔":10,"🍀":8,"🍒":5,"🍋":3};let payout=0,winning=[];
    for(const line of lines){const row=line.map((r,i)=>reels[i][r]);let symbol=row[0],count=1;while(count<5&&(row[count]===symbol||row[count]==="🍀"))count++;if(count>=3){const factor=(mult[symbol]||2)*(count===3?.08:count===4?.45:1);const amount=Math.floor(bet*factor);if(amount>payout){payout=amount;winning=row;}}}
    if(payout===0&&reels.every(col=>col.includes("🍀")))payout=bet*2;
    result={reels,payout,message:payout>0?"Payline hit! Gross payout "+payout+" credits.":"No winning line this spin."};
    c.settle(bet,payout,result.message);render();
  }
  function render(){
    const reels=result?result.reels:Array.from({length:5},()=>["🍒","🔔","💎"]);
    c.page('<div class="tiny-note">5 REELS · 3 ROWS · 10 PAYLINES · MATCH 3 OR MORE FROM LEFT TO RIGHT</div><div class="reels">'+reels.map(col=>'<div class="reel" style="display:flex;flex-direction:column;justify-content:space-around;font-size:26px">'+col.map(x=>'<span>'+x+'</span>').join("")+'</div>').join("")+'</div><div class="tiny-note">7️⃣ 100× · 💎 35× · 👑 20× · 🔔 10× · 🍀 8× · 🍒 5× · 🍋 3×</div><div class="action-row"><button class="game-action primary" data-act="spin">Spin reels</button></div>',true);
    if(result)c.status(result.message,result.payout>0?"win":"loss");
  }
  const off=c.bind(e=>{if(e.target.closest('[data-act="spin"]'))spin();});render();return {close:()=>{},destroy:off};
}
function mountKeno(game,root,wallet){
  const c=common(game,root,wallet);let picks=new Set([3,7,11,19,23,29]),drawn=[],last=null;
  const payouts={
    1:[0,3],2:[0,1,5],3:[0,1,2,10],4:[0,0,2,5,20],5:[0,0,1,3,10,35],
    6:[0,0,1,2,5,15,60],7:[0,0,0,2,4,10,35,100],8:[0,0,0,1,3,8,25,75,250],
    9:[0,0,0,1,2,5,15,45,150,400],10:[0,0,0,1,2,4,10,30,80,250,700]
  };
  function render(){
    const cells=Array.from({length:80},(_,i)=>{const n=i+1,chosen=picks.has(n),hit=drawn.includes(n);return '<button class="number-pick '+(chosen?"selected ":"")+(hit?"hit":"")+'" data-num="'+n+'">'+n+'</button>';}).join("");
    c.page('<div class="tiny-note">PICK 1–10 NUMBERS · 20 BALLS DRAWN FROM 80</div><div class="tiny-note">SELECTED: '+picks.size+' / 10</div><div class="number-grid">'+cells+'</div><div class="action-row"><button class="game-action secondary" data-act="random">Quick pick</button><button class="game-action primary" data-act="draw">Draw 20 balls</button></div><div class="tiny-note">PAYOUTS DEPEND ON HOW MANY OF YOUR SELECTED NUMBERS ARE DRAWN.</div>',true);
    if(last)c.status(last.message,last.win?"win":"loss");
  }
  const off=c.bind(e=>{
    const b=e.target.closest("[data-num],[data-act]");if(!b)return;
    if(b.dataset.num){const n=Number(b.dataset.num);if(picks.has(n))picks.delete(n);else if(picks.size<10)picks.add(n);render();return;}
    if(b.dataset.act==="random"){picks=new Set(shuffleNumbers(80).slice(0,6));render();return;}
    if(b.dataset.act==="draw"){
      if(picks.size<1||picks.size>10){c.status("Choose between 1 and 10 spots.","loss");return;}const bet=c.charge();if(bet===null)return;drawn=shuffleNumbers(80).slice(0,20);const hits=Array.from(picks).filter(n=>drawn.includes(n)).length,table=payouts[picks.size]||payouts[10],mult=table[Math.min(hits,table.length-1)]||0,payout=Math.floor(bet*mult);last={message:"You hit "+hits+" of "+picks.size+" spots. Payout multiplier: "+mult+"×.",win:payout>bet};c.settle(bet,payout,last.message);render();
    }
  });
  render();return {close:()=>{},destroy:off};
}
function mountDice(game,root,wallet){
  const c=common(game,root,wallet),mode=game.mode;
  let s=null,arena=null;
  const arenaModes=new Set(["liars","ceelo","bunco","ship","pig","dice-poker"]);
  const faces=["","⚀","⚁","⚂","⚃","⚄","⚅"];
  const roll=n=>Array.from({length:n},()=>1+Math.floor(Math.random()*6));
  const sum=a=>a.reduce((x,y)=>x+y,0);
  function finish(message,payout){
    s.done=true;s.message=message;s.win=payout>s.bet;c.settle(s.bet,payout,message);render();
  }
  function start(){
    const bet=c.charge();if(bet===null)return null;return bet;
  }
  function scoreDice(dice){
    if(dice.length===6){
      const sorted=dice.slice().sort((a,b)=>a-b);
      if(sorted.join("")==="123456")return 1500;
      const counts={};dice.forEach(d=>counts[d]=(counts[d]||0)+1);
      if(Object.values(counts).filter(x=>x===2).length===3)return 1500;
    }
    const counts={};dice.forEach(d=>counts[d]=(counts[d]||0)+1);
    for(let n=6;n>=3;n--)for(let face=1;face<=6;face++)if(counts[face]>=n)return (face===1?1000:face*100)*Math.pow(2,n-3);
    return dice.reduce((a,d)=>a+(d===1?100:d===5?50:0),0);
  }
  function pokerDiceRank(dice){
    const sorted=dice.slice().sort((a,b)=>a-b),counts={};dice.forEach(d=>counts[d]=(counts[d]||0)+1);
    const vals=Object.values(counts).sort((a,b)=>b-a);
    if(vals[0]===5)return [7,sorted[0]];
    if(vals[0]===4)return [6,Number(Object.keys(counts).find(k=>counts[k]===4))];
    if(vals[0]===3&&vals[1]===2)return [5,Number(Object.keys(counts).find(k=>counts[k]===3))];
    if(sorted.join("")==="12345"||sorted.join("")==="23456")return [4,sorted[4]];
    if(vals[0]===3)return [3,Number(Object.keys(counts).find(k=>counts[k]===3))];
    if(vals[0]===2&&vals[1]===2)return [2,...Object.keys(counts).filter(k=>counts[k]===2).map(Number).sort((a,b)=>b-a)];
    if(vals[0]===2)return [1,Number(Object.keys(counts).find(k=>counts[k]===2))];
    return [0,...sorted.slice().reverse()];
  }
  function compareRank(a,b){for(let i=0;i<Math.max(a.length,b.length);i++){if((a[i]||0)!==(b[i]||0))return (a[i]||0)-(b[i]||0);}return 0;}
  function combinations(target,tiles){
    const out=[];
    for(let mask=1;mask<(1<<tiles.length);mask++){let values=[],total=0;for(let i=0;i<tiles.length;i++)if(mask&(1<<i)){values.push(tiles[i]);total+=tiles[i];}if(total===target)out.push(values);}
    return out.sort((a,b)=>a.length-b.length);
  }
  function shutBotTurn(tiles){
    let remaining=tiles.slice(),score=0;
    for(let turn=0;turn<9;turn++){
      const totalLeft=remaining.reduce((a,b)=>a+b,0),dice=roll(totalLeft<=6?1:2),options=combinations(sum(dice),remaining);
      if(!options.length)break;
      const pick=options[0];for(const n of pick){const i=remaining.indexOf(n);if(i>=0)remaining.splice(i,1);}
      score+=pick.length;
      if(!remaining.length)return {remaining,score:0,closed:true};
    }
    return {remaining,score:remaining.reduce((a,b)=>a+b,0),closed:false};
  }
  const botNames=["Rico","Maya","Ace","Nova"];
  function botPoker(){
    let dice=roll(5);
    for(let turn=1;turn<3;turn++){
      const counts={};dice.forEach(x=>counts[x]=(counts[x]||0)+1);
      const keepFace=Number(Object.keys(counts).sort((a,b)=>counts[b]-counts[a]||Number(b)-Number(a))[0]);
      const keepCount=counts[keepFace]||0;
      dice=dice.filter(x=>x===keepFace).concat(roll(5-keepCount));
    }
    return dice;
  }
  function pigBotTurn(total,threshold){
    let score=0,steps=0;
    while(score<threshold&&steps++<30){
      const die=roll(1)[0];
      if(die===1){score=0;break;}
      score+=die;
    }
    return total+score;
  }
  function runPigBots(){
    const thresholds=[16,20,24];
    for(let i=0;i<s.botTotals.length;i++){
      s.botTotals[i]=pigBotTurn(s.botTotals[i],thresholds[i]);
      if(s.botTotals[i]>=100)return i;
    }
    return -1;
  }
  function botShip(){
    let dice=roll(5),held=[],cargo=0,need=[6,5,4];
    for(let turn=0;turn<3;turn++){
      while(need.length){const required=need[0],i=dice.indexOf(required);if(i<0)break;held.push(required);dice.splice(i,1);need.shift();}
      if(!need.length)break;
      if(turn<2)dice=roll(5-held.length);
    }
    if(held.length===3)cargo=sum(dice);
    return {dice:held.concat(dice),held,cargo};
  }
  function cLoRank(dice){
    const a=dice.slice().sort((x,y)=>y-x);
    if(a.join("")==="654")return 3;
    if(a.join("")==="321")return -1;
    if(a[0]===a[1]&&a[1]===a[2])return 2+a[0]/10;
    if(a[0]===a[1])return 1+a[2]/100;
    return 0;
  }
  function render(){
    let body='<div class="tiny-note">'+game.name.toUpperCase()+' · LOCAL BOT TABLE</div>'+(arenaModes.has(mode)?'<section class="arena3d-stage" aria-label="Interactive 3D multiplayer dice table"></section>':"");
    if(mode==="craps"){
      body+='<div class="table-felt"><h3>Pass Line</h3><p class="muted">7 or 11 wins on the come-out roll. 2, 3 or 12 loses. Any other total becomes your point; hit it before a 7.</p><div class="dice-tray">'+(s?s.dice.map(d=>'<div class="die">'+faces[d]+'</div>').join(""):'<div class="die">⚄</div><div class="die">⚁</div>')+'</div><div class="tiny-note">'+(s&&s.point?"POINT: "+s.point:"COME-OUT ROLL")+'</div><div class="action-row"><button class="game-action primary" data-act="craps">'+(s&&!s.done?"Roll again":"Play pass line")+'</button></div></div>';
    } else if(mode==="sicbo"){
      body+='<div class="choice-row">'+["big","small","odd","even","triple"].map(x=>'<button class="game-action '+((s?s.pick:"big")===x?"primary":"secondary")+'" data-pick="'+x+'">'+x.toUpperCase()+'</button>').join("")+'</div><div class="dice-tray">'+(s?s.dice.map(d=>'<div class="die">'+faces[d]+'</div>').join(""):'<div class="die">⚄</div><div class="die">⚁</div><div class="die">⚂</div>')+'</div><div class="tiny-note">BIG / SMALL / ODD / EVEN PAY 1:1 · ANY TRIPLE PAYS 30:1</div><div class="action-row"><button class="game-action primary" data-act="sicbo">Roll three dice</button></div>';
    } else if(mode==="yahtzee"||mode==="dice-poker"){
      body+='<div class="tiny-note">UP TO THREE ROLLS · TAP DICE TO HOLD THEM'+(mode==="dice-poker"?" · FOUR LOCAL OPPONENTS":"")+'</div><div class="dice-tray">'+(s?s.dice.map((d,i)=>'<button class="die '+(s.holds.includes(i)?"held":"")+'" data-die="'+i+'">'+faces[d]+'</button>').join(""):'<div class="die">⚄</div>'.repeat(5))+'</div>'+(mode==="dice-poker"&&s&&s.opponents?'<div class="table-seats">'+s.opponents.map(o=>'<div class="seat"><small>'+o.name+'</small><strong>'+o.dice.join(" · ")+'</strong></div>').join("")+'</div>':"")+'<div class="action-row"><button class="game-action primary" data-act="roll" '+(s&&s.rolls>=3?"disabled":"")+'>'+(s?"Roll "+(3-s.rolls)+" remaining":"Start roll")+'</button><button class="game-action secondary" data-act="score" '+(!s||!s.rolls||s.done?"disabled":"")+'>'+(mode==="dice-poker"?"Showdown":"Score hand")+'</button></div>';
    } else if(mode==="farkle"){
      body+='<div class="tiny-note">SELECT A VALID SCORING SET · KEEP IT · ROLL THE REST OR BANK</div><div class="dice-tray">'+(s?s.dice.map((d,i)=>'<button class="die '+(s.selected.includes(i)?"held":"")+'" data-die="'+i+'">'+faces[d]+'</button>').join(""):'<div class="die">⚄</div>'.repeat(6))+'</div><div class="score-card"><strong>'+(s?s.points:0)+'</strong><span>TURN POINTS</span></div><div class="action-row"><button class="game-action primary" data-act="roll">Roll</button><button class="game-action secondary" data-act="keep" '+(!s||!s.selected.length||s.done?"disabled":"")+' >Keep selection</button><button class="game-action secondary" data-act="bank" '+(!s||!s.points||s.done?"disabled":"")+' >Bank points</button></div>';
    } else if(mode==="liars"){
      body+='<div class="tiny-note">LIAR’S DICE · 4 PLAYERS · 5 HIDDEN DICE EACH</div><div class="dice-tray">'+(s?s.mine.map(d=>'<div class="die">'+faces[d]+'</div>').join(""):'<div class="die">?</div>'.repeat(5))+'</div><div class="table-seats"><div class="seat"><small>YOUR DICE</small><strong>5 hidden</strong></div><div class="seat"><small>HOUSE BOTS</small><strong>15 hidden</strong></div></div><div class="action-row"><label class="tiny-note">COUNT <input id="bidCount" class="bet-input" type="number" min="1" max="20" value="'+(s&&s.lastBid?s.lastBid.count+1:1)+'"></label><label class="tiny-note">FACE <select id="bidFace" class="bet-input"><option>2</option><option>3</option><option>4</option><option>5</option><option>6</option><option>1</option></select></label><button class="game-action primary" data-act="bid">Bid</button><button class="game-action danger" data-act="challenge" '+(!s||!s.lastBid||s.done?"disabled":"")+' >Challenge</button></div>';
    } else if(mode==="ceelo"){
      body+='<div class="tiny-note">Cee-lo · 3 DICE · FOUR-PLAYER TABLE · 4-5-6 WINS · 1-2-3 LOSES · TRIPLES BEAT POINTS</div><div class="table-seats"><div class="seat"><small>YOU</small><strong>'+(s?s.you.join(" · "):"—")+'</strong></div>'+(s&&s.bots?s.bots.map(o=>'<div class="seat"><small>'+o.name+'</small><strong>'+o.dice.join(" · ")+'</strong><span>'+o.rank.toFixed(2)+'</span></div>').join(""):'<div class="seat"><small>3 LOCAL BOTS</small><strong>READY</strong></div>')+'</div><div class="action-row"><button class="game-action primary" data-act="ceelo">Roll at the table</button></div>';
    } else if(mode==="bunco"){
      body+='<div class="tiny-note">BUNCO · SIX ROUNDS · FOUR-PLAYER SCOREBOARD · TARGET '+(s?s.target:1)+'</div><div class="table-seats"><div class="seat"><small>YOU</small><strong>'+(s?s.scores[0]:0)+'</strong></div>'+(s?s.scores.slice(1).map((score,i)=>'<div class="seat"><small>'+botNames[i]+'</small><strong>'+score+'</strong></div>').join(""):'<div class="seat"><small>RICO · MAYA · ACE</small><strong>READY</strong></div>')+'</div><div class="dice-tray">'+(s?s.dice.map(d=>'<div class="die">'+faces[d]+'</div>').join(""):'<div class="die">⚄</div>'.repeat(3))+'</div><div class="action-row"><button class="game-action primary" data-act="bunco">Roll round '+(s?s.turn+1:1)+'</button></div>';
    } else if(mode==="ship"){
      body+='<div class="tiny-note">SHIP · CAPTAIN · CREW · CARGO · FOUR-PLAYER SHOWDOWN · HOLD 6, THEN 5, THEN 4</div><div class="dice-tray">'+(s?s.dice.map((d,i)=>'<button class="die '+(s.holds.includes(i)?"held":"")+'" data-die="'+i+'">'+faces[d]+'</button>').join(""):'<div class="die">⚄</div>'.repeat(5))+'</div>'+(s&&s.opponents?'<div class="table-seats">'+s.opponents.map(o=>'<div class="seat"><small>'+o.name+' · CARGO</small><strong>'+o.cargo+'</strong></div>').join("")+'</div>':"")+'<div class="action-row"><button class="game-action primary" data-act="ship">Roll / lock dice</button></div>';
    } else if(mode==="pig"){
      body+='<div class="tiny-note">PIG DICE · FOUR-PLAYER RACE TO 100 · ROLL OR BANK YOUR TURN</div><div class="table-seats"><div class="seat"><small>YOU</small><strong>'+(s?s.youTotal:0)+' + '+(s?s.turnScore:0)+'</strong></div>'+(s?s.botTotals.map((score,i)=>'<div class="seat"><small>'+botNames[i]+'</small><strong>'+score+'</strong></div>').join(""):'<div class="seat"><small>RICO · MAYA · ACE</small><strong>READY</strong></div>')+'</div><div class="dice-tray">'+(s?'<div class="die">'+faces[s.die]+'</div>':'<div class="die">⚀</div>')+'</div><div class="action-row"><button class="game-action primary" data-act="pigroll" '+(s&&s.done?"disabled":"")+' >Roll</button><button class="game-action secondary" data-act="pigbank" '+(!s||!s.turnScore||s.done?"disabled":"")+' >Hold turn</button></div>';
    } else if(mode==="shutbox"){
      body+='<div class="tiny-note">SHUT THE BOX · ROLL 2 DICE · CLOSE TILES THAT ADD TO THE TOTAL</div><div class="choice-row">'+(s?s.tiles.map(n=>'<button class="game-action '+(s.selected.includes(n)?"primary":"secondary")+'" data-tile="'+n+'" '+(!s.tiles.includes(n)||s.done?"disabled":"")+'>'+n+'</button>').join(""):Array.from({length:9},(_,i)=>'<button class="game-action secondary">'+(i+1)+'</button>').join(""))+'</div><div class="dice-tray">'+(s?s.dice.map(d=>'<div class="die">'+faces[d]+'</div>').join(""):'<div class="die">⚄</div><div class="die">⚁</div>')+'</div><div class="action-row"><button class="game-action primary" data-act="boxroll">Roll</button><button class="game-action secondary" data-act="boxclose" '+(!s||!s.selected.length||s.done?"disabled":"")+' >Close selected tiles</button><button class="game-action secondary" data-act="boxbank" '+(!s||s.done?"disabled":"")+' >End turn</button></div>';
    } else {
      body+='<div class="tiny-note">HIGH / LOW DICE · GUESS THE TOTAL</div><div class="choice-row"><button class="game-action primary" data-pick="high">HIGH 11–18</button><button class="game-action secondary" data-pick="low">LOW 3–10</button></div><div class="dice-tray">'+(s?s.dice.map(d=>'<div class="die">'+faces[d]+'</div>').join(""):'<div class="die">⚄</div>'.repeat(3))+'</div><div class="action-row"><button class="game-action primary" data-act="highlow">Roll</button></div>';
    }
    c.page(body,true);
    if(s&&s.message)c.status(s.message,s.win?"win":s.done?"loss":"");
    if(arenaModes.has(mode)){
      let players=[];
      if(mode==="liars"){
        players=[{name:"You",human:true,dice:s?s.mine:[],status:s&&s.lastBid?"BIDDING":"ROLL READY"},...botNames.slice(0,3).map(name=>({name,hiddenDice:5,status:s?"THINKING":"READY"}))];
      }else if(mode==="ceelo"){
        players=[{name:"You",human:true,dice:s?s.you:[],status:s?"ROLLED":"READY"},...(s?s.bots:botNames.slice(0,3).map(name=>({name,dice:[]}))).map(o=>({name:o.name,dice:o.dice||[],score:o.rank===undefined?undefined:o.rank.toFixed(2),status:s?"SHOWDOWN":"READY"}))];
      }else if(mode==="bunco"){
        players=[{name:"You",human:true,dice:s?s.dice:[],score:s?s.scores[0]:0},...botNames.slice(0,3).map((name,i)=>({name,dice:s&&s.botDice?s.botDice[i]:[],score:s?s.scores[i+1]:0,status:s?"ROUND "+s.turn:"READY"}))];
      }else if(mode==="ship"){
        players=[{name:"You",human:true,dice:s?s.dice:[],score:s&&s.cargo!==undefined?s.cargo:undefined},...botNames.slice(0,3).map(name=>{const o=s&&s.opponents&&s.opponents.find(x=>x.name===name);return {name,dice:o&&o.dice?o.dice:[],score:o&&o.cargo!==undefined?o.cargo:undefined,status:o?"CARGO":"THINKING"};})];
      }else if(mode==="pig"){
        players=[{name:"You",human:true,dice:s&&s.die?[s.die]:[],score:s?s.youTotal+(s.turnScore||0):0},...botNames.slice(0,3).map((name,i)=>({name,score:s?s.botTotals[i]:0,status:"RACE TO 100"}))];
      }else if(mode==="dice-poker"){
        players=[{name:"You",human:true,dice:s?s.dice:[],status:s?"YOUR ROLL":"READY"},...botNames.map(name=>{const o=s&&s.opponents&&s.opponents.find(x=>x.name===name);return {name,dice:o?o.dice:[],hiddenDice:s&&!o?5:0,status:o?"SHOWDOWN":"THINKING"};})];
      }
      const sceneConfig={kind:"dice",title:game.name,players,centerDice:mode==="liars"?[]:mode==="dice-poker"?(s&&s.dice||[]):mode==="ceelo"?(s&&s.you||[]):mode==="bunco"?(s&&s.dice||[]):[],centerText:mode==="liars"?(s&&s.lastBid?"BID · "+s.lastBid.count+" OF "+s.lastBid.face:"HIDDEN DICE"):mode==="pig"?"RACE TO 100":mode==="bunco"?"ROUND "+(s?s.turn:0)+" / 6":mode==="ship"?"SHIP · CAPTAIN · CREW":"DICE SHOWDOWN"};
      if(!arena)arena=mountArena3D(root,sceneConfig);else arena.update(sceneConfig);
    }
  }
  function action(e){
    const b=e.target.closest("[data-act],[data-pick],[data-die],[data-tile]");if(!b)return;
    if(b.dataset.pick){
      if(!s||s.done)s={pick:b.dataset.pick};else s.pick=b.dataset.pick;
      render();return;
    }
    if(mode==="craps"&&b.dataset.act==="craps"){
      if(!s||s.done){const bet=start();if(bet===null)return;s={bet,point:0,dice:[],done:false};}
      s.dice=roll(2);const n=sum(s.dice);
      if(!s.point){if(n===7||n===11){finish("Natural "+n+" — pass line wins.",s.bet*2);return;}if(n===2||n===3||n===12){finish("Craps "+n+" — pass line loses.",0);return;}s.point=n;s.message="Point is "+n+". Roll the point before a 7.";}
      else if(n===s.point){finish("Made the point "+n+". You win.",s.bet*2);return;}
      else if(n===7){finish("Seven-out. Pass line loses.",0);return;}
      else s.message="Rolled "+n+". Point remains "+s.point+".";
      render();
    } else if(mode==="sicbo"&&b.dataset.act==="sicbo"){
      const bet=start();if(bet===null)return;const dice=roll(3),n=sum(dice),pick=s&&!s.done?s.pick||"big":s&&s.pick||"big",triple=dice.every(x=>x===dice[0]);
      let win=false,mult=0;
      if(pick==="triple"){win=triple;mult=31;}
      else if(pick==="big"){win=n>=11&&!triple;mult=2;}
      else if(pick==="small"){win=n<=10&&!triple;mult=2;}
      else if(pick==="odd"){win=n%2===1&&!triple;mult=2;}
      else {win=n%2===0&&!triple;mult=2;}
      s={bet,dice,pick,done:false};finish("Rolled "+dice.join(" · ")+" for "+n+". "+(win?"Your "+pick+" bet wins.":"No hit."),win?bet*mult:0);
    } else if((mode==="yahtzee"||mode==="dice-poker")){
      if(b.dataset.act==="roll"){
        if(!s||s.done){const bet=start();if(bet===null)return;s={bet,dice:roll(5),holds:[],rolls:1,done:false};}
        else if(s.rolls<3){s.dice=s.dice.map((d,i)=>s.holds.includes(i)?d:roll(1)[0]);s.rolls++;s.message="Roll "+s.rolls+" of 3. Hold dice or score.";}
      } else if(b.dataset.die!==undefined&&s&&!s.done){const i=Number(b.dataset.die);s.holds=s.holds.includes(i)?s.holds.filter(x=>x!==i):s.holds.concat([i]);}
      else if(b.dataset.act==="score"&&s&&!s.done){
        const rank=pokerDiceRank(s.dice);let multiplier=0,label="";
        if(mode==="dice-poker"){
          label=["High dice","Pair","Two pair","Three of a kind","Straight","Full house","Four of a kind","Five of a kind"][rank[0]];
          const opponents=botNames.map(name=>{const dice=botPoker();return {name,dice,rank:pokerDiceRank(dice)};});
          const allRanks=[rank,...opponents.map(o=>o.rank)];
          const best=allRanks.reduce((top,current)=>compareRank(current,top)>0?current:top,rank);
          const topBots=opponents.filter(o=>compareRank(o.rank,best)===0);
          const playerTied=compareRank(rank,best)===0;
          s.opponents=opponents;
          const names=topBots.map(o=>o.name).join(", ");
          if(playerTied&&!topBots.length){finish("You win the table with "+label+".",Math.floor(s.bet*2));return;}
          if(playerTied){finish("Shared top hand: you and "+names+" tie with "+label+". Stake returned.",s.bet);return;}
          finish(names+" win with "+["High dice","Pair","Two pair","Three of a kind","Straight","Full house","Four of a kind","Five of a kind"][best[0]]+".",0);return;
        } else {
          const counts={};s.dice.forEach(d=>counts[d]=(counts[d]||0)+1);const vals=Object.values(counts).sort((a,b)=>b-a),sorted=s.dice.slice().sort((a,b)=>a-b).join("");
          let score=sum(s.dice);
          if(vals[0]===5){multiplier=50;label="Yahtzee";}
          else if(vals[0]===4){multiplier=8;label="Four of a kind";}
          else if(vals[0]===3&&vals[1]===2){multiplier=5;label="Full house";}
          else if(sorted==="12345"||sorted==="23456"){multiplier=6;label="Straight";}
          else if(vals[0]===3){multiplier=2.5;label="Three of a kind";}
          else if(vals[0]===2&&vals[1]===2){multiplier=1.5;label="Two pair";}
          else {multiplier=0;label="Chance";}
          finish(label+" · score "+score+".",Math.floor(s.bet*multiplier));return;
        }
      }
      render();
    } else if(mode==="farkle"){
      if(b.dataset.act==="roll"){
        if(!s||s.done){const bet=start();if(bet===null)return;s={bet,dice:roll(6),selected:[],points:0,remaining:6,phase:"select",done:false};}
        else if(s.phase==="ready"){s.dice=roll(s.remaining);s.selected=[];s.phase="select";if(scoreDice(s.dice)===0){finish("Farkle! No scoring dice. Your turn points are lost.",0);return;}}
        else {c.status("Select and keep scoring dice first.","loss");return;}
        if(scoreDice(s.dice)===0){finish("Farkle! No scoring dice. Stake lost.",0);return;}
        s.message="Choose a valid scoring combination, then keep or roll again.";
      } else if(b.dataset.die!==undefined&&s&&!s.done&&s.phase==="select"){
        const i=Number(b.dataset.die);s.selected=s.selected.includes(i)?s.selected.filter(x=>x!==i):s.selected.concat([i]);
      } else if(b.dataset.act==="keep"&&s&&!s.done&&s.phase==="select"){
        const chosen=s.selected.map(i=>s.dice[i]),score=scoreDice(chosen);
        if(!score){c.status("That selection is not a scoring set.","loss");return;}
        s.points+=score;s.remaining-=chosen.length;if(s.remaining<=0)s.remaining=6;s.dice=[];s.selected=[];s.phase="ready";s.message="Kept "+score+" points. Roll the remaining dice or bank.";
      } else if(b.dataset.act==="bank"&&s&&!s.done&&s.points>0){
        finish("Banked "+s.points+" Farkle points.",Math.floor(s.bet*Math.min(6,s.points/400)));return;
      }
      render();
    } else if(mode==="liars"){
      const actualCount=(face)=>s.mine.concat(...s.bots).filter(d=>d===face).length;
      const faceRank=face=>face===1?6:face-1;
      const probabilityAtLeast=(known,face,totalNeeded)=>{
        const needed=totalNeeded-s.mine.filter(d=>d===face).length;
        if(needed<=0)return 1;if(needed>15)return 0;
        let probability=0;
        for(let k=needed;k<=15;k++){
          let choose=1;for(let j=1;j<=k;j++)choose=choose*(16-j)/j;
          probability+=choose*Math.pow(1/6,k)*Math.pow(5/6,15-k);
        }
        return Math.max(0,Math.min(1,probability));
      };
      const resolveChallenge=(challenger)=>{
        const bid=s.lastBid,actual=actualCount(bid.face),truth=actual>=bid.count;
        const bidder=bid.by,winner=truth?bidder:challenger;
        const winnerName=winner===0?"You":botNames[winner-1];
        const resultText="Reveal: "+actual+" of 20 dice show "+bid.face+". "+(truth?"The bid was true. ":"The bid was a bluff. ")+winnerName+" wins the challenge.";
        finish(resultText,winner===0?s.bet*2:0);return true;
      };
      const botsRespond=()=>{
        const decisions=[];
        for(let i=0;i<3;i++){
          const seat=i+1,dice=s.bots[i],bid=s.lastBid;
          const own=dice.filter(d=>d===bid.face).length;
          const unseenExpected=15/6;
          const truthProbability=probabilityAtLeast(dice,bid.face,bid.count);
          const challengeThreshold=[.2,.28,.16][i];
          if(truthProbability<challengeThreshold){
            decisions.push(botNames[i]+" challenges");
            s.lastAction=decisions.join(" · ");
            resolveChallenge(seat);return true;
          }
          const rank=faceRank(bid.face);
          let next={count:bid.count,face:rank>=5?2:bid.face+1};
          if(next.face===2&&rank>=5)next.count=bid.count+1;
          if(own>=2&&Math.random()<([.72,.5,.82][i]))next={count:bid.count+1,face:bid.face};
          if(next.count>20){decisions.push(botNames[i]+" passes the challenge");resolveChallenge(seat);return true;}
          s.lastBid={...next,by:seat};
          decisions.push(botNames[i]+" bids "+next.count+" of "+next.face);
        }
        s.message=decisions.join(" · ")+" · Your turn. Raise or challenge.";
        return false;
      };
      if(b.dataset.act==="bid"){
        if(!s||s.done){const bet=start();if(bet===null)return;s={bet,mine:roll(5),bots:[roll(5),roll(5),roll(5)],lastBid:null,done:false};}
        const count=Math.max(1,Math.min(20,Number(root.querySelector("#bidCount").value||1))),face=Number(root.querySelector("#bidFace").value||2);
        const validFace=[1,2,3,4,5,6].includes(face);
        const rank=faceRank(face);
        const raises=s.lastBid&&(count>s.lastBid.count||count===s.lastBid.count&&rank>faceRank(s.lastBid.face));
        if(!validFace||s.lastBid&&!raises){c.status("Your bid must increase the quantity or the face value.","loss");return;}
        s.lastBid={count,face,by:0};
        if(botsRespond())return;
      } else if(b.dataset.act==="challenge"&&s&&!s.done&&s.lastBid){
        resolveChallenge(0);return;
      }
      render();
    } else if(mode==="ceelo"&&b.dataset.act==="ceelo"){
      const bet=start();if(bet===null)return;
      const rollRanked=()=>{let dice=roll(3),rank=cLoRank(dice),attempt=0;while(rank===0&&attempt++<30){dice=roll(3);rank=cLoRank(dice);}return {dice,rank};};
      const you=rollRanked(),bots=botNames.slice(0,3).map(name=>({name,...rollRanked()}));
      const best=Math.max(you.rank,...bots.map(o=>o.rank)),top=bots.filter(o=>o.rank===best),playerTop=you.rank===best;
      s={bet,you:you.dice,bots,done:false};
      const names=top.map(o=>o.name).join(", ");
      if(playerTop&&!top.length){finish("You take the Cee-lo table with "+you.rank.toFixed(2)+".",bet*2);return;}
      if(playerTop){finish("Cee-lo tie: you share the top roll with "+names+". Stake returned.",bet);return;}
      finish(names+" win the Cee-lo table with "+best.toFixed(2)+".",0);
    } else if(mode==="bunco"&&b.dataset.act==="bunco"){
      if(!s||s.done){const bet=start();if(bet===null)return;s={bet,target:1,turn:0,scores:[0,0,0,0],dice:[],done:false};}
      s.target=(s.turn%6)+1;
      const scoreRound=d=>d.every(x=>x===s.target)?21:d.filter(x=>x===s.target).length;
      const your=roll(3);s.scores[0]+=scoreRound(your);
      for(let i=1;i<s.scores.length;i++)s.scores[i]+=scoreRound(roll(3));
      s.dice=your;s.turn++;
      if(s.turn>=6){
        const best=Math.max(...s.scores),winners=s.scores.map((score,i)=>score===best?i:-1).filter(i=>i>=0);
        const standings=s.scores.map((score,i)=>(i===0?"You":botNames[i-1])+" "+score).join(" · ");
        const playerWon=winners.includes(0);
        finish("Bunco final scores — "+standings+". "+(playerWon&&winners.length===1?"You win!":playerWon?"Shared first place.":"The bots win."),playerWon?(winners.length===1?s.bet*2:s.bet):0);return;
      }
      s.message="Round "+s.turn+" complete. Scores: "+s.scores.join(" / ")+". Target was "+s.target+".";
      render();
    } else if(mode==="ship"&&b.dataset.act==="ship"){
      if(!s||s.done){const bet=start();if(bet===null)return;s={bet,dice:roll(5),holds:[],rolls:1,done:false};}
      else if(s.rolls<3){
        const desired=[6,5,4];
        while(s.holds.length<3){const need=desired[s.holds.length],ix=s.dice.findIndex((d,i)=>d===need&&!s.holds.includes(i));if(ix<0)break;s.holds.push(ix);}
        if(s.holds.length===3){
          const cargo=s.dice.filter((d,i)=>!s.holds.includes(i));s.cargo=sum(cargo);
          s.opponents=botNames.slice(0,3).map(name=>({name,cargo:botShip().cargo}));
          const best=Math.max(s.cargo,...s.opponents.map(o=>o.cargo)),top=s.opponents.filter(o=>o.cargo===best),playerTop=s.cargo===best;
          const payout=playerTop?(top.length?s.bet:s.bet*2):0;
          finish("Your cargo "+s.cargo+". "+s.opponents.map(o=>o.name+" "+o.cargo).join(" · ")+". "+(playerTop?(top.length?"Shared top cargo.":"You win the table."):"A bot wins the cargo contest."),payout);return;
        }
        s.dice=s.dice.map((d,i)=>s.holds.includes(i)?d:roll(1)[0]);s.rolls++;s.message="Locked "+s.holds.length+" of 3 ship pieces. Roll again.";
      } else {
        const cargo=s.holds.length===3?sum(s.dice.filter((d,i)=>!s.holds.includes(i))):0;
        s.cargo=cargo;s.opponents=botNames.slice(0,3).map(name=>({name,cargo:botShip().cargo}));
        const best=Math.max(cargo,...s.opponents.map(o=>o.cargo)),top=s.opponents.filter(o=>o.cargo===best),playerTop=cargo===best;
        finish("Your cargo "+cargo+". "+s.opponents.map(o=>o.name+" "+o.cargo).join(" · ")+". "+(playerTop?(top.length?"Shared top cargo.":"You win the table."):"A bot wins the cargo contest."),playerTop?(top.length?s.bet:s.bet*2):0);return;
      }
      render();
    } else if(mode==="pig"){
      if(!s||s.done){const bet=start();if(bet===null)return;s={bet,youTotal:0,botTotals:[0,0,0],turnScore:0,die:0,done:false};}
      if(b.dataset.act==="pigroll"){
        s.die=roll(1)[0];
        if(s.die===1){
          s.turnScore=0;
          const winner=runPigBots();
          if(winner>=0){finish(botNames[winner]+" reaches 100 and wins the race.",0);return;}
          s.message="You rolled 1 and lost your turn. The bots take their turns.";
        } else s.turnScore+=s.die;
        if(s.youTotal+s.turnScore>=100){finish("You reached 100. You win.",s.bet*2);return;}
        render();
      } else if(b.dataset.act==="pigbank"){
        s.youTotal+=s.turnScore;s.turnScore=0;
        if(s.youTotal>=100){finish("You reached 100. You win.",s.bet*2);return;}
        const winner=runPigBots();
        if(winner>=0){finish(botNames[winner]+" reaches 100 first. Final bot scores: "+s.botTotals.join(" / "),0);return;}
        s.message="You banked your points. Bot totals: "+s.botTotals.join(" / ")+". Your total: "+s.youTotal+".";
        render();
      } else render();
    } else if(mode==="shutbox"){
      if(!s||s.done){const bet=start();if(bet===null)return;s={bet,tiles:[1,2,3,4,5,6,7,8,9],selected:[],dice:[],bot:shutBotTurn([1,2,3,4,5,6,7,8,9]),done:false};}
      if(b.dataset.act==="boxroll"){
        const count=s.tiles.reduce((a,b)=>a+b,0)<=6?1:2;s.dice=roll(count);s.target=sum(s.dice);s.selected=[];s.message="Roll total "+s.target+". Choose open tiles that sum exactly to it.";render();return;
      } else if(b.dataset.tile){
        const tile=Number(b.dataset.tile);s.selected=s.selected.includes(tile)?s.selected.filter(x=>x!==tile):s.selected.concat([tile]);s.message="Selected sum: "+sum(s.selected)+" / Target: "+(s.target||0);render();return;
      } else if(b.dataset.act==="boxclose"){
        if(sum(s.selected)!==s.target){c.status("Selected tiles must equal the dice total.","loss");return;}
        for(const tile of s.selected){const i=s.tiles.indexOf(tile);if(i>=0)s.tiles.splice(i,1);}
        s.selected=[];if(!s.tiles.length){finish("You shut the box! Bot score "+s.bot.score+".",s.bet*2);return;}
        s.message="Tiles closed. Roll again.";
      } else if(b.dataset.act==="boxbank"){
        const score=s.tiles.reduce((a,b)=>a+b,0),bot=s.bot.score,diff=bot-score;
        finish("Your remaining total "+score+" · Bot remaining total "+bot+". "+(diff>0?"You win.":diff===0?"Push.":"Bot wins."),diff>0?s.bet*2:diff===0?s.bet:0);return;
      }
      render();
    } else if(b.dataset.act==="highlow"){
      const bet=start();if(bet===null)return;const dice=roll(3),n=sum(dice),pick=s&&s.pick||"high",win=pick==="high"?n>=11:n<=10;s={bet,dice,pick};finish("Rolled "+n+". "+(win?"Your "+pick+" call wins.":"Your "+pick+" call loses."),win?bet*2:0);
    }
  }
  const off=c.bind(action);render();
  return {close:()=>{if(s&&!s.done&&s.bet)wallet.settle(s.bet,0,game.name);arena?.destroy();},destroy:()=>{off();arena?.destroy();}};
}
function mountWheel(game,root,wallet){
  const c=common(game,root,wallet),mode=game.mode;let s=null,timer=null;
  function render(){
    let content="";
    if(mode==="coin")content='<div class="table-felt"><h3>Heads or tails?</h3><div class="playing-cards" style="font-size:48px">'+(s?s.result:"◉")+'</div><div class="choice-row"><button class="game-action primary" data-pick="heads">Heads</button><button class="game-action secondary" data-pick="tails">Tails</button></div><div class="action-row"><button class="game-action primary" data-act="flip">Flip coin</button></div></div>';
    else if(mode==="plinko")content='<div class="tiny-note">PLINKO · 10 ROWS · DROP A CHIP THROUGH THE PEGS</div><div class="table-felt"><div class="playing-cards" style="font-size:43px">'+(s?s.path:"◉")+'</div><div class="choice-row"><button class="game-action secondary" data-pick="low">LOW RISK</button><button class="game-action primary" data-pick="medium">MEDIUM</button><button class="game-action secondary" data-pick="high">HIGH RISK</button></div><div class="action-row"><button class="game-action primary" data-act="drop">Drop chip</button></div></div>';
    else if(mode==="limbo")content='<div class="table-felt"><h3>Beat the target</h3><p class="muted">Choose a multiplier. The higher your target, the less likely you are to hit it.</p><div class="big-number" style="font:800 55px var(--mono)">'+(s?s.result.toFixed(2)+"×":"1.00×")+'</div><div class="action-row"><label class="tiny-note">TARGET <input class="bet-input" id="target" type="number" min="1.01" max="50" step=".1" value="2.00"></label><button class="game-action primary" data-act="limbo">Play limbo</button></div></div>';
    else if(mode==="crash")content='<div class="table-felt"><h3>Crash Run</h3><div class="big-number" style="font:800 55px var(--mono)">'+(s?s.mult.toFixed(2)+"×":"1.00×")+'</div><p class="muted">'+(s?s.message:"Start a run and cash out before the flight ends.")+'</p><div class="action-row"><button class="game-action primary" data-act="crash">'+(s&&s.running?"Cash out":"Start run")+'</button></div></div>';
    else if(mode==="mines")content='<div class="tiny-note">MINES · 5×5 GRID · FIND GEMS AND CASH OUT BEFORE HITTING A MINE</div><div class="board-grid" style="grid-template-columns:repeat(5,48px)">'+Array.from({length:25},(_,i)=>'<button class="board-cell" data-tile="'+i+'" '+(s&&s.revealed.includes(i)||s&&s.done?'disabled':'')+'>'+(s&&s.revealed.includes(i)?(s.mines.includes(i)?"✹":"◆"):"?")+'</button>').join("")+'</div><div class="action-row"><button class="game-action secondary" data-act="cash" '+(!s||!s.revealed.length||s.done?"disabled":"")+'>Cash out</button><button class="game-action primary" data-act="startmines">New mines round</button></div>';
    else if(mode==="hilo")content='<div class="table-felt"><h3>Higher or lower?</h3><div class="playing-cards">'+(s?cardHTML2(s.card):'<span class="muted">?</span>')+'</div><div class="tiny-note">CURRENT MULTIPLIER '+(s?s.mult.toFixed(2):"1.00")+'×</div><div class="action-row"><button class="game-action primary" data-act="higher" '+(!s||s.done?"disabled":"")+'>Higher</button><button class="game-action secondary" data-act="lower" '+(!s||s.done?"disabled":"")+'>Lower</button><button class="game-action secondary" data-act="cash" '+(!s||s.done?"disabled":"")+'>Cash out</button><button class="game-action primary" data-act="starthilo">New hand</button></div></div>';
    else content='<div class="table-felt"><h3>Spin the prize wheel</h3><div class="big-number" style="font:800 55px var(--mono)">'+(s?s.mult+"×":"◎")+'</div><p class="muted">Choose a segment. Multipliers are weighted from low to high.</p><div class="action-row"><button class="game-action primary" data-act="wheel">Spin wheel</button></div></div>';
    c.page(content,true);if(s&&s.message)c.status(s.message,s.win?"win":"loss");
  }
  function cardHTML2(card){return '<div class="playing-card"><span>'+card.r+'</span><span class="suit">'+card.s+'</span></div>';}
  function endRound(bet,mult,message){const gross=Math.floor(bet*mult);if(timer){clearInterval(timer);timer=null;}s.done=true;s.message=message;s.win=gross>bet;c.settle(bet,gross,message);render();}
  const off=c.bind(e=>{
    const b=e.target.closest("[data-act],[data-pick],[data-tile]");if(!b)return;
    if(b.dataset.pick){if(!s)s={pick:b.dataset.pick};else{s.pick=b.dataset.pick;s.risk=b.dataset.pick;}render();return;}
    if(mode==="coin"&&b.dataset.act==="flip"){const bet=c.charge();if(bet===null)return;const face=Math.random()<.5?"heads":"tails",win=face===(s&&s.pick||"heads");s={result:face==="heads"?"🟡 HEADS":"🟡 TAILS",message:"It landed "+face+". "+(win?"You called it.":"Not this time."),win};endRound(bet,win?1.95:0,s.message);}
    else if(mode==="plinko"&&b.dataset.act==="drop"){const bet=c.charge();if(bet===null)return;const risk=s&&(s.risk||s.pick)||"medium",path=Array.from({length:10},()=>Math.random()<.5?"◀":"▶").join(" "),score=path.split("▶").length-1,offset=Math.abs(score-5),table=risk==="low"?[.7,.8,.9,1,1.1,1.2,1.5,2]:risk==="high"?[0,0,.1,.5,1,3,8,20]:[0,.3,.7,1,1.5,2.5,4,8],mult=table[Math.min(offset,7)];s={path,mult,message:"Chip landed after "+score+" right turns. "+mult+"× payout."};endRound(bet,mult,s.message);}
    else if(mode==="limbo"&&b.dataset.act==="limbo"){const bet=c.charge();if(bet===null)return;const target=Math.max(1.01,Math.min(50,Number(root.querySelector("#target").value||2))),roll=Math.max(1,Math.min(50,1/Math.max(.02,Math.random()))),win=roll>=target,mult=win?target*.97:0;s={result:roll,message:"Multiplier was "+roll.toFixed(2)+"×. "+(win?"Target cleared.":"Target missed."),win};endRound(bet,mult,s.message);}
    else if(mode==="crash"&&b.dataset.act==="crash"){
      if(!s||!s.running){const bet=c.charge();if(bet===null)return;const crash=Math.max(1.01,Math.min(20,Math.exp(Math.random()*2.2)));s={bet,crash,mult:1,running:true,done:false,message:"Multiplier is climbing."};render();timer=setInterval(()=>{if(!s||!s.running){clearInterval(timer);timer=null;return;}s.mult*=1.035;if(s.mult>=s.crash){s.running=false;endRound(s.bet,0,"Crashed at "+s.crash.toFixed(2)+"×. Your stake is lost.");}else{const el=root.querySelector(".big-number");if(el)el.textContent=s.mult.toFixed(2)+"×";}},120);}
      else if(s.running){s.running=false;endRound(s.bet,s.mult,"Cashed out at "+s.mult.toFixed(2)+"×.");}
    } else if(mode==="mines"){
      if(b.dataset.act==="startmines"){const bet=c.charge();if(bet===null)return;s={bet,mines:shuffleNumbers(25).slice(0,3).map(x=>x-1),revealed:[],mult:1,done:false};render();}
      else if(b.dataset.tile!==undefined&&s&&!s.done){const i=Number(b.dataset.tile);if(s.mines.includes(i)){s.revealed.push(i);endRound(s.bet,0,"Mine hit. Round over.");}else{s.revealed.push(i);s.mult*=1.12;render();}}
      else if(b.dataset.act==="cash"&&s&&!s.done&&s.revealed.length){endRound(s.bet,s.mult,"Cashed out after "+s.revealed.length+" gems at "+s.mult.toFixed(2)+"×.");}
    } else if(mode==="hilo"){
      if(b.dataset.act==="starthilo"){const bet=c.charge();if(bet===null)return;const deck=cardDeck(1);s={bet,deck,card:deck.pop(),mult:1,done:false};render();}
      else if(s&&!s.done&&(b.dataset.act==="higher"||b.dataset.act==="lower")){
        const next=s.deck.pop(),v=x=>x.rank==="A"?14:x.rank==="K"?13:x.rank==="Q"?12:x.rank==="J"?11:Number(x.rank),a=v(s.card),n=v(next),win=b.dataset.act==="higher"?n>a:n<a;
        s.card=next;if(!win){endRound(s.bet,0,"The next card was "+next.rank+". Wrong call.");}else{s.mult*=1.8;s.message="Correct. Current multiplier "+s.mult.toFixed(2)+"×.";render();}
      } else if(b.dataset.act==="cash"&&s&&!s.done){endRound(s.bet,s.mult,"Cashed out at "+s.mult.toFixed(2)+"×.");}
    } else if(mode==="wheel"&&b.dataset.act==="wheel"){const bet=c.charge();if(bet===null)return;const choices=[0,0,.5,1,1.5,2,3,5,10],mult=choices[Math.floor(Math.random()*choices.length)];s={mult,message:mult?"Wheel landed on "+mult+"×.":"Wheel landed on zero.",win:mult>1};endRound(bet,mult,s.message);}
  });
  render();return {close:()=>{if(timer){clearInterval(timer);timer=null;}if(s&&s.running){s.running=false;wallet.settle(s.bet,0,game.name);s.done=true;}else if(s&&!s.done&&s.bet){wallet.settle(s.bet,0,game.name);s.done=true;}},destroy:()=>{off();if(timer)clearInterval(timer);}};
}
function mountScratch(game,root,wallet){
  const c=common(game,root,wallet);let s=null;
  const symbols=["🍒","🍀","💎","7️⃣","👑","🔔"];
  function render(){
    const cells=s?s.cells.map((x,i)=>'<button class="board-cell" style="width:70px;height:70px;font-size:25px" data-scratch="'+i+'" '+(s.revealed.includes(i)?"disabled":"")+'>'+(s.revealed.includes(i)?x:"✦")+'</button>').join(""):'<div class="muted">Buy a card to reveal the covered spaces.</div>';
    c.page('<div class="tiny-note">SCRATCH CARD · MATCH THREE SYMBOLS TO WIN THE PRINTED PRIZE</div><div class="board-grid" style="grid-template-columns:repeat(3,70px)">'+cells+'</div><div class="action-row"><button class="game-action primary" data-act="buy">Buy scratch card</button><button class="game-action secondary" data-act="reveal" '+(!s||s.done?"disabled":"")+'>Reveal all</button></div><div class="tiny-note">3 SEVENS 50× · 3 DIAMONDS 20× · 3 CROWNS 10× · 3 MATCHING SYMBOLS 3×</div>',true);
    if(s&&s.message)c.status(s.message,s.win?"win":"loss");
  }
  const off=c.bind(e=>{
    const b=e.target.closest("[data-act],[data-scratch]");if(!b)return;
    if(b.dataset.act==="buy"){if(s&&!s.done)return;const bet=c.charge();if(bet===null)return;s={bet,cells:Array.from({length:9},()=>symbols[Math.floor(Math.random()*symbols.length)]),revealed:[],done:false};s.message="Scratch each square or reveal the whole card.";render();}
    else if(s&&!s.done&&b.dataset.scratch!==undefined){s.revealed.push(Number(b.dataset.scratch));if(s.revealed.length===9)finish();else render();}
    else if(s&&!s.done&&b.dataset.act==="reveal"){s.revealed=Array.from({length:9},(_,i)=>i);finish();}
  });
  function finish(){const counts={};s.cells.forEach(x=>counts[x]=(counts[x]||0)+1);const max=Math.max(...Object.values(counts)),sym=Object.keys(counts).find(x=>counts[x]===max),mult=max>=3?(sym==="7️⃣"?50:sym==="💎"?20:sym==="👑"?10:3):0;s.done=true;s.win=mult>1;s.message=mult?"Three "+sym+" symbols — "+mult+"× payout.":"No three-of-a-kind. Better luck next card.";c.settle(s.bet,s.bet*mult,s.message);render();}
  render();return {close:()=>{if(s&&!s.done&&s.bet)wallet.settle(s.bet,0,game.name);},destroy:off};
}
function mountDraw(game,root,wallet){
  const c=common(game,root,wallet);let picks=new Set([4,12,18,27,35,46]),result=null;
  const render=()=>{
    const cells=Array.from({length:49},(_,i)=>{const n=i+1,sel=picks.has(n),hit=result&&result.draw.includes(n);return '<button class="number-pick '+(sel?"selected ":"")+(hit?"hit":"")+'" data-num="'+n+'">'+n+'</button>';}).join("");
    c.page('<div class="tiny-note">6 NUMBERS FROM 49 · MATCH MORE NUMBERS FOR A LARGER PRIZE</div><div class="tiny-note">YOUR PICKS: '+picks.size+' / 6</div><div class="number-grid" style="grid-template-columns:repeat(7,minmax(25px,1fr))">'+cells+'</div><div class="action-row"><button class="game-action secondary" data-act="quick">Quick pick</button><button class="game-action primary" data-act="draw">Enter draw</button></div>',true);
    if(result)c.status(result.message,result.payout>0?"win":"loss");
  };
  const off=c.bind(e=>{
    const b=e.target.closest("[data-num],[data-act]");if(!b)return;
    if(b.dataset.num){const n=Number(b.dataset.num);if(picks.has(n))picks.delete(n);else if(picks.size<6)picks.add(n);render();}
    else if(b.dataset.act==="quick"){picks=new Set(shuffleNumbers(49).slice(0,6));render();}
    else if(b.dataset.act==="draw"){
      if(picks.size!==6){c.status("Choose exactly six numbers.","loss");return;}const bet=c.charge();if(bet===null)return;const drawn=shuffleNumbers(49).slice(0,6),hits=Array.from(picks).filter(n=>drawn.includes(n)).length,mults={0:0,1:0,2:.5,3:2,4:10,5:100,6:1000},mult=mults[hits],payout=bet*mult;result={draw:drawn,message:"Drawn "+drawn.sort((a,b)=>a-b).join(", ")+". You matched "+hits+" numbers. Prize "+mult+"×.",payout};c.settle(bet,payout,result.message);render();
    }
  });
  render();return {close:()=>{},destroy:off};
}
export function mountGame(game,root,wallet){
  if(game.engine==="extra")return mountExtraGame(game,root,wallet);
  if(game.engine==="poker")return mountPoker(game,root,wallet);
  if(game.engine==="board")return mountBoard(game,root,wallet);
  if(game.engine==="roulette")return mountRoulette(game,root,wallet);
  if(game.engine==="blackjack")return mountBlackjack(game,root,wallet);
  if(game.engine==="baccarat")return mountBaccarat(game,root,wallet);
  if(game.engine==="videopoker")return mountVideoPoker(game,root,wallet);
  if(game.engine==="slots")return mountSlots(game,root,wallet);
  if(game.engine==="keno")return mountKeno(game,root,wallet);
  if(game.engine==="dice")return mountDice(game,root,wallet);
  if(game.engine==="wheel")return mountWheel(game,root,wallet);
  if(game.engine==="scratch")return mountScratch(game,root,wallet);
  if(game.engine==="draw")return mountDraw(game,root,wallet);
  root.innerHTML='<div class="result-banner">This game engine is not available.</div>';return {close:()=>{},destroy:()=>{}};
}
