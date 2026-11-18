import { mountPoker } from "./poker.js";
import { mountBoard } from "./board.js";

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
      if(pick==="number"&&last&&String(last.pick)===(pocket===37?"00":String(pocket))){won=true;mult=36;desc="Straight-up hit! "+(pocket===37?"00":pocket)+" pays 35:1.";}
      else if(pick==="red"||pick==="black"){won=pick===color;mult=2;}
      else if(pick==="green"){won=color==="green";mult=american?18:36;}
      else if(pick==="odd"||pick==="even"){won=pocket!==0&&pocket!==37&&(pick==="odd"?pocket%2===1:pocket%2===0);mult=2;}
      else if(pick==="low"||pick==="high"){won=pocket>=1&&pocket<=36&&(pick==="low"?pocket<=18:pocket>=19);mult=2;}
      if(won)desc=(pocket===37?"00":pocket)+" "+color+" — winning bet!";
      const payout=won?bet*mult:0;last={pick:null,message:"Wheel result: "+desc,win:won};c.settle(bet,payout,"Wheel result: "+desc);render();
    }
  });
  render();return {close:()=>{},destroy:click};
}
function mountBlackjack(game,root,wallet){
  const c=common(game,root,wallet);let s=null;
  const payout=game.name.toLowerCase().includes("spanish")||game.name.toLowerCase().includes("pontoon")?2.0:2.5;
  const soft17=game.name.toLowerCase().includes("vegas")||game.name.toLowerCase().includes("atlantic");
  function render(){
    let body='<div class="tiny-note">'+game.name.toUpperCase()+' · '+(soft17?"DEALER HITS SOFT 17":"DEALER STANDS ON SOFT 17")+' · NATURAL PAYS '+(payout===2.5?"3:2":"1:1")+'</div>';
    if(!s){body+='<div class="table-felt"><h3>Twenty-one</h3><p class="muted">Beat the house without going over 21. Blackjack is an Ace plus a ten-value card on the initial deal.</p><div class="playing-cards" style="font-size:40px">♠ ♥ ♦ ♣</div><div class="action-row"><button class="game-action primary" data-act="deal">Deal cards</button></div></div>';}
    else {
      body+='<div class="table-felt"><div class="table-seats"><div class="seat"><small>DEALER</small><strong>'+ (s.finished?total(s.dealer):"?")+'</strong></div><div class="seat"><small>YOU</small><strong>'+total(s.player)+'</strong></div></div><div class="tiny-note">DEALER HAND</div><div class="playing-cards">'+s.dealer.map((x,i)=>cardHTML(x,!s.finished&&i===1)).join("")+'</div><div class="tiny-note">YOUR HAND</div><div class="playing-cards">'+s.player.map(x=>cardHTML(x,false)).join("")+'</div><div class="action-row">'+
        '<button class="game-action primary" data-act="hit" '+(s.finished?"disabled":"")+'>Hit</button><button class="game-action secondary" data-act="stand" '+(s.finished?"disabled":"")+'>Stand</button><button class="game-action secondary" data-act="double" '+(s.finished||s.player.length!==2?"disabled":"")+'>Double down</button><button class="game-action secondary" data-act="again" '+(!s.finished?"disabled":"")+'>New hand</button></div></div>';
    }
    c.page(body,true);
    if(s&&s.message)c.status(s.message,s.outcome==="win"?"win":s.outcome==="loss"?"loss":"");
  }
  function finish(outcome,message,gross){
    if(s.finished)return;s.finished=true;s.outcome=outcome;s.message=message;c.settle(s.bet,gross,message);render();
  }
  function dealerPlay(){
    while(total(s.dealer)<17||(soft17&&total(s.dealer)===17&&s.dealer.some(x=>x.rank==="A")))s.dealer.push(s.deck.pop());
    const p=total(s.player),d=total(s.dealer);
    if(d>21||p>d)finish("win",d>21?"Dealer busts at "+d+". You win.":"You win "+p+" to "+d+".",s.bet*2);
    else if(d===p)finish("push","Push at "+p+".",s.bet);
    else finish("loss","Dealer wins "+d+" to "+p+".",0);
  }
  function click(e){
    const b=e.target.closest("[data-act]");if(!b)return;
    if(b.dataset.act==="deal"||b.dataset.act==="again"){
      if(s&&!s.finished)return;const bet=c.charge();if(bet===null)return;s={bet,deck:cardDeck(6),player:[],dealer:[],finished:false};
      s.player=[s.deck.pop(),s.deck.pop()];s.dealer=[s.deck.pop(),s.deck.pop()];
      const p=total(s.player),d=total(s.dealer);
      if(p===21&&d===21)finish("push","Both have a natural blackjack. Push.",bet);
      else if(p===21)finish("win","Natural blackjack!",Math.floor(bet*payout));
      else if(d===21)finish("loss","Dealer has natural blackjack.",0);
      else {s.message="You have "+p+". Hit, stand or double down.";render();}
    } else if(!s||s.finished)return;
    else if(b.dataset.act==="hit"){
      s.player.push(s.deck.pop());const p=total(s.player);if(p>21)finish("loss","Bust at "+p+".",0);else if(p===21)dealerPlay();else{s.message="You have "+p+". Hit or stand?";render();}
    } else if(b.dataset.act==="stand")dealerPlay();
    else if(b.dataset.act==="double"){
      if(s.player.length!==2)return;if(!wallet.charge(s.bet)){c.status("Not enough credits to double.","loss");return;}s.bet*=2;s.player.push(s.deck.pop());if(total(s.player)>21)finish("loss","Double down busts at "+total(s.player)+".",0);else dealerPlay();
    }
  }
  const off=c.bind(click);render();return {close:()=>{if(s&&!s.finished)wallet.settle(s.bet,0,game.name);},destroy:off};
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
  const c=common(game,root,wallet);const mode=game.mode;let s=null;
  function roll(n){return Array.from({length:n},()=>1+Math.floor(Math.random()*6));}
  function render(){
    let body='<div class="tiny-note">'+game.name.toUpperCase()+' · LOCAL DICE TABLE</div>';
    if(mode==="craps"){
      body+='<div class="table-felt"><h3>Pass Line</h3><p class="muted">7 or 11 wins on the come-out roll. 2, 3 or 12 loses. Any other total becomes your point; hit it before a 7.</p><div class="dice-tray">'+(s?s.dice.map(d=>'<div class="die">'+["","⚀","⚁","⚂","⚃","⚄","⚅"][d]+'</div>').join(""):'<div class="die">⚄</div><div class="die">⚁</div>')+'</div><div class="tiny-note">'+(s&&s.point?"POINT: "+s.point:"COME-OUT ROLL")+'</div><div class="action-row"><button class="game-action primary" data-act="roll">Roll pass line</button></div></div>';
    } else if(mode==="sicbo"){
      body+='<div class="choice-row">'+["big","small","odd","even","triple"].map(x=>'<button class="game-action '+((s?s.pick:"big")===x?"primary":"secondary")+'" data-pick="'+x+'">'+x.toUpperCase()+'</button>').join("")+'</div><div class="dice-tray">'+(s?s.dice.map(d=>'<div class="die">⚀⚁⚂⚃⚄⚅'.charAt(d-1)+'</div>').join(""):'<div class="die">⚄</div><div class="die">⚁</div><div class="die">⚂</div>')+'</div><div class="tiny-note">BIG / SMALL / ODD / EVEN PAY 1:1 · ANY TRIPLE PAYS 30:1</div><div class="action-row"><button class="game-action primary" data-act="roll">Roll three dice</button></div>';
    } else if(mode==="yahtzee"){
      body+='<div class="tiny-note">UP TO THREE ROLLS · TAP DICE TO HOLD THEM · SCORE THE BEST COMBINATION</div><div class="dice-tray">'+(s?s.dice.map((d,i)=>'<button class="die '+(s.holds.includes(i)?"held":"")+'" data-die="'+i+'">⚀⚁⚂⚃⚄⚅'.charAt(d-1)+'</button>').join(""):'<div class="die">⚄</div>'.repeat(5))+'</div><div class="action-row"><button class="game-action primary" data-act="roll" '+(s&&s.rolls>=3?"disabled":"")+'>'+(s?"Roll "+(3-s.rolls)+" remaining":"Start roll")+'</button><button class="game-action secondary" data-act="score" '+(!s||!s.rolls?"disabled":"")+'>Score hand</button></div>';
    } else if(mode==="farkle"){
      if(b.dataset.act==="roll"){
        if(!s||s.done){const bet=c.charge();if(bet===null)return;s={bet,dice:roll(6),selected:[],points:0,remaining:6,phase:"select"};if(scoreFarkle(s.dice)===0){finishDice(bet,0,"Farkle! None of the six dice scored.");return;}s.message="Select scoring dice, then keep them or bank your points.";}
        else if(s.phase==="ready"){s.dice=roll(s.remaining);s.selected=[];s.phase="select";if(scoreFarkle(s.dice)===0){finishDice(s.bet,0,"Farkle! No scoring dice on the reroll.");return;}s.message="Reroll complete. Select scoring dice.";}
        else {c.status("Choose and keep scoring dice before rolling again.","loss");return;}
      } else if(b.dataset.die!==undefined&&s&&!s.done&&s.phase==="select"){
        const i=Number(b.dataset.die);s.selected=s.selected.includes(i)?s.selected.filter(x=>x!==i):s.selected.concat([i]);
      } else if(b.dataset.act==="keep"&&s&&!s.done&&s.phase==="select"){
        const chosen=s.selected.map(i=>s.dice[i]),score=scoreFarkle(chosen);
        if(score===0){c.status("Those dice do not form a scoring combination.","loss");return;}
        s.points+=score;s.remaining-=chosen.length;if(s.remaining<=0)s.remaining=6;
        s.dice=[];s.selected=[];s.phase="ready";s.message="Scored "+score+" points. Roll the remaining dice or bank your turn.";
      } else if(b.dataset.act==="bank"&&s&&!s.done&&s.points>0){
        const payout=Math.floor(s.bet*Math.min(8,Math.max(0,s.points/250)));
        finishDice(s.bet,payout,"Banked "+s.points+" points. Gross payout "+payout+" credits.");return;
      }
      render();
    } else if(mode==="liars"){
      if(b.dataset.act==="bid"){
        if(!s||s.done){const bet=c.charge();if(bet===null)return;s={bet,mine:roll(5),bots:[roll(5),roll(5),roll(5)],lastBid:null,done:false};}
        const count=Math.max(1,Math.min(20,Number(root.querySelector("#bidCount").value||1))),face=Number(root.querySelector("#bidFace").value||2);
        if(s.lastBid&&(count<s.lastBid.count||count===s.lastBid.count&&face<=s.lastBid.face)){c.status("Your bid must raise the quantity or the face value.","loss");return;}
        const actual=s.mine.concat(...s.bots).filter(x=>x===face).length;
        s.lastBid={count,face,by:"you"};
        const visible=s.bots[0].filter(x=>x===face).length,expected=visible+2.5;
        if(count>Math.ceil(expected+1)){
          const wins=actual>=count;
          finishDice(s.bet,wins?s.bet*2:0,"The bot challenges. There are "+actual+" dice showing "+face+". "+(wins?"Your bid was correct.":"The bid was too high."));return;
        }
        const raiseCount=count+1;
        s.lastBid={count:raiseCount,face,by:"bot"};
        s.message="Bot raises the bid to "+raiseCount+" of "+face+". Raise again or call bluff.";
      } else if(b.dataset.act==="challenge"&&s&&!s.done&&s.lastBid){
        const actual=s.mine.concat(...s.bots).filter(x=>x===s.lastBid.face).length,wins=actual>=s.lastBid.count;
        finishDice(s.bet,wins?s.bet*2:0,"There are "+actual+" dice showing "+s.lastBid.face+". "+(wins?"The bid was correct.":"The bid was a bluff."));return;
      }
      render();
    } else if(b.dataset.act==="roll"){
      const bet=c.charge();if(bet===null)return;const dice=roll(3),sum=dice.reduce((a,x)=>a+x,0),pick=s&&s.pick||"high",win=pick==="high"?sum>=11:sum<=10,payout=win?bet*2:0;s={dice,pick,win,message:"Rolled "+sum+". "+(win?"Your "+pick+" call wins.":"Your "+pick+" call loses.")};finishDice(bet,payout,s.message);
    }
  });
  render();return {close:()=>{},destroy:off};
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
  render();return {close:()=>{if(timer){clearInterval(timer);timer=null;}if(s&&s.running){s.running=false;wallet.settle(s.bet,0,game.name);}},destroy:()=>{off();if(timer)clearInterval(timer);}};
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
  render();return {close:()=>{},destroy:off};
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
