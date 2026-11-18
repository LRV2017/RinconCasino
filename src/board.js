function stakeBar(){
  return '<div class="bet-controls"><label for="stake">MATCH STAKE</label><input class="bet-input" id="stake" type="number" min="10" step="10" value="25"><span class="tiny-note">Winner earns 2× the stake</span><button class="game-action primary" data-act="start">Start match</button></div>';
}
function randomFleet(){
  const fleet=[];
  for(const length of [4,3,3,2]){
    let placed=false,tries=0;
    while(!placed&&tries++<1000){
      const horizontal=Math.random()<.5,r=Math.floor(Math.random()*10),c=Math.floor(Math.random()*10),cells=[];
      for(let i=0;i<length;i++){const rr=r+(horizontal?0:i),cc=c+(horizontal?i:0);if(rr>=10||cc>=10||fleet.some(p=>p.r===rr&&p.c===cc)){cells.length=0;break;}cells.push({r:rr,c:cc});}
      if(cells.length===length){fleet.push(...cells);placed=true;}
    }
  }
  return fleet;
}
function checkLine(b,mark,coords){
  for(const [r,c] of coords)if(b[r][c]!==mark)return false;
  return true;
}
function tttWinner(b){
  const lines=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  for(const line of lines){if(line.every(i=>b[i]==="X"))return "X";if(line.every(i=>b[i]==="O"))return "O";}
  return b.every(Boolean)?"T":"";
}
function tttAI(board){
  function solve(b,turn){
    const win=tttWinner(b);if(win==="O")return 10;if(win==="X")return -10;if(win==="T")return 0;
    let best=turn==="O"?-Infinity:Infinity;
    for(let i=0;i<9;i++)if(!b[i]){b[i]=turn;const score=solve(b,turn==="O"?"X":"O");b[i]="";best=turn==="O"?Math.max(best,score):Math.min(best,score);}
    return best;
  }
  let best=-Infinity,move=-1;
  for(let i=0;i<9;i++)if(!board[i]){board[i]="O";const score=solve(board,"X");board[i]="";if(score>best){best=score;move=i;}}
  return move;
}
function c4Win(board,mark){
  const R=6,C=7;
  for(let r=0;r<R;r++)for(let c=0;c<C;c++)if(board[r][c]===mark){
    for(const [dr,dc] of [[0,1],[1,0],[1,1],[1,-1]]){
      let ok=true;for(let i=1;i<4;i++){const rr=r+dr*i,cc=c+dc*i;if(rr<0||rr>=R||cc<0||cc>=C||board[rr][cc]!==mark){ok=false;break;}}
      if(ok)return true;
    }
  }
  return false;
}
function c4Drop(board,col,mark){
  for(let r=5;r>=0;r--)if(!board[r][col]){board[r][col]=mark;return r;}
  return -1;
}
function c4Eval(board){
  let score=0;
  for(let r=0;r<6;r++)if(board[r][3]==="O")score+=5;
  const windows=[];
  for(let r=0;r<6;r++)for(let c=0;c<7;c++)for(const [dr,dc] of [[0,1],[1,0],[1,1],[1,-1]]){
    const cells=[];for(let i=0;i<4;i++){const rr=r+dr*i,cc=c+dc*i;if(rr<0||rr>=6||cc<0||cc>=7){cells.length=0;break;}cells.push(board[rr][cc]);}
    if(cells.length===4)windows.push(cells);
  }
  for(const w of windows){const bot=w.filter(x=>x==="O").length,me=w.filter(x=>x==="X").length,empty=w.filter(x=>!x).length;if(bot===3&&empty===1)score+=35;if(bot===2&&empty===2)score+=7;if(me===3&&empty===1)score-=42;if(me===2&&empty===2)score-=8;}
  return score;
}
function c4AI(board){
  for(let c=0;c<7;c++){const copy=board.map(r=>r.slice());if(c4Drop(copy,c,"O")>=0&&c4Win(copy,"O"))return c;}
  for(let c=0;c<7;c++){const copy=board.map(r=>r.slice());if(c4Drop(copy,c,"X")>=0&&c4Win(copy,"X"))return c;}
  function minimax(b,depth,alpha,beta,maxing){
    if(c4Win(b,"O"))return 100000+depth;if(c4Win(b,"X"))return -100000-depth;
    const moves=[3,2,4,1,5,0,6].filter(c=>!b[0][c]);
    if(depth===0||!moves.length)return c4Eval(b);
    if(maxing){let v=-Infinity;for(const c of moves){const n=b.map(r=>r.slice());c4Drop(n,c,"O");v=Math.max(v,minimax(n,depth-1,alpha,beta,false));alpha=Math.max(alpha,v);if(beta<=alpha)break;}return v;}
    let v=Infinity;for(const c of moves){const n=b.map(r=>r.slice());c4Drop(n,c,"X");v=Math.min(v,minimax(n,depth-1,alpha,beta,true));beta=Math.min(beta,v);if(beta<=alpha)break;}return v;
  }
  let best=-Infinity,move=3;
  for(const c of [3,2,4,1,5,0,6])if(!board[0][c]){const n=board.map(r=>r.slice());c4Drop(n,c,"O");const v=minimax(n,4,-Infinity,Infinity,false);if(v>best){best=v;move=c;}}
  return move;
}
function revMoves(board,side){
  const dirs=[[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]],out=[];
  for(let r=0;r<8;r++)for(let c=0;c<8;c++)if(!board[r][c]){
    const flips=[];
    for(const [dr,dc] of dirs){let rr=r+dr,cc=c+dc,line=[];while(rr>=0&&rr<8&&cc>=0&&cc<8&&board[rr][cc]&&board[rr][cc]!==side){line.push([rr,cc]);rr+=dr;cc+=dc;}if(rr>=0&&rr<8&&cc>=0&&cc<8&&board[rr][cc]===side&&line.length)flips.push(...line);}
    if(flips.length)out.push({r,c,flips});
  }
  return out;
}
function revPlay(board,side,m){board[m.r][m.c]=side;for(const [r,c] of m.flips)board[r][c]=side;}
function revEval(board){
  const weights=[[100,-20,10,5,5,10,-20,100],[-20,-40,-2,-2,-2,-2,-40,-20],[10,-2,5,1,1,5,-2,10],[5,-2,1,1,1,1,-2,5],[5,-2,1,1,1,1,-2,5],[10,-2,5,1,1,5,-2,10],[-20,-40,-2,-2,-2,-2,-40,-20],[100,-20,10,5,5,10,-20,100]];
  let score=0;for(let r=0;r<8;r++)for(let c=0;c<8;c++)if(board[r][c])score+=(board[r][c]==="O"?1:-1)*(weights[r][c]+(board[r][c]==="O"?1:-1));
  return score;
}
function revAI(board){
  const moves=revMoves(board,"O");if(!moves.length)return null;
  let best=-Infinity,choice=moves[0];
  for(const move of moves){const b=board.map(r=>r.slice());revPlay(b,"O",move);let value=revEval(b)*1.3+revMoves(b,"O").length*3-revMoves(b,"X").length*4;for(const reply of revMoves(b,"X").slice(0,6)){const c=b.map(r=>r.slice());revPlay(c,"X",reply);value+=revEval(c)*.18;}if(value>best){best=value;choice=move;}}
  return choice;
}
function gomokuWinner(b,mark){
  for(let r=0;r<15;r++)for(let c=0;c<15;c++)if(b[r][c]===mark)for(const [dr,dc] of [[0,1],[1,0],[1,1],[1,-1]]){
    let count=1;for(let i=1;i<5;i++){const rr=r+dr*i,cc=c+dc*i;if(rr<0||rr>=15||cc<0||cc>=15||b[rr][cc]!==mark)break;count++;}if(count>=5)return true;
  }
  return false;
}
function gomokuScore(b,r,c,mark){
  const other=mark==="O"?"X":"O";let score=0;
  for(const [dr,dc] of [[0,1],[1,0],[1,1],[1,-1]]){
    let own=1,open=0;
    for(const sign of [-1,1]){let rr=r+dr*sign,cc=c+dc*sign,steps=0;while(rr>=0&&rr<15&&cc>=0&&cc<15&&b[rr][cc]===mark&&steps<4){own++;rr+=dr*sign;cc+=dc*sign;steps++;}if(rr>=0&&rr<15&&cc>=0&&cc<15&&!b[rr][cc])open++;}
    score+=own>=5?100000:own===4?(open===2?12000:4000):own===3?(open===2?900:120):own===2?(open===2?45:8):0;
    let enemy=1,eopen=0;
    for(const sign of [-1,1]){let rr=r+dr*sign,cc=c+dc*sign,steps=0;while(rr>=0&&rr<15&&cc>=0&&cc<15&&b[rr][cc]===other&&steps<4){enemy++;rr+=dr*sign;cc+=dc*sign;steps++;}if(rr>=0&&rr<15&&cc>=0&&cc<15&&!b[rr][cc])eopen++;}
    score+=enemy>=5?90000:enemy===4?3500:enemy===3?(eopen===2?350:55):enemy===2?20:0;
  }
  return score;
}
function gomokuAI(b){
  let candidates=[];for(let r=0;r<15;r++)for(let c=0;c<15;c++)if(!b[r][c]&&b.some((row,rr)=>row.some((v,cc)=>v&&Math.abs(rr-r)<=2&&Math.abs(cc-c)<=2)))candidates.push({r,c});
  if(!candidates.length)return {r:7,c:7};
  candidates.sort((a,b)=>gomokuScore(b,a.r,a.c,"O")-gomokuScore(b,b.r,b.c,"O"));
  return candidates[0];
}
function checkMoves(board,side){
  let moves=[],captures=[];
  for(let r=0;r<8;r++)for(let c=0;c<8;c++){
    const p=board[r][c];if(!p||p.toLowerCase()!==side)continue;
    const dirs=p===p.toUpperCase()?[[-1,-1],[-1,1],[1,-1],[1,1]]:(side==="r"?[[-1,-1],[-1,1]]:[[1,-1],[1,1]]);
    for(const [dr,dc] of dirs){
      const rr=r+dr,cc=c+dc;
      if(rr<0||rr>7||cc<0||cc>7)continue;
      if(!board[rr][cc])moves.push({r,c,tr:rr,tc:cc});
      else if(board[rr][cc].toLowerCase()!==side){const jr=rr+dr,jc=cc+dc;if(jr>=0&&jr<8&&jc>=0&&jc<8&&!board[jr][jc])captures.push({r,c,tr:jr,tc:jc,capture:[rr,cc]});}
    }
  }
  return captures.length?captures:moves;
}
function checkApply(b,m){
  const n=b.map(r=>r.slice()),p=n[m.r][m.c];n[m.tr][m.tc]=p;n[m.r][m.c]="";if(m.capture)n[m.capture[0]][m.capture[1]]="";
  if(p==="r"&&m.tr===0)n[m.tr][m.tc]="R";if(p==="b"&&m.tr===7)n[m.tr][m.tc]="B";return n;
}
function checkEval(b){
  let s=0;for(let r=0;r<8;r++)for(let c=0;c<8;c++){const p=b[r][c];if(!p)continue;const v=p===p.toUpperCase()?5+(p.toLowerCase()==="r"?7-r:r)*.04:3+(p==="r"?(7-r)*.06:r*.06);s+=(p.toLowerCase()==="b"?v:-v);}
  return s;
}
function checkAI(b){
  function search(board,depth,alpha,beta,maxing){
    const side=maxing?"b":"r",moves=checkMoves(board,side);if(!moves.length)return maxing?-10000-depth:10000+depth;if(depth===0)return checkEval(board);
    if(maxing){let best=-Infinity;for(const m of moves){best=Math.max(best,search(checkApply(board,m),depth-1,alpha,beta,false));alpha=Math.max(alpha,best);if(beta<=alpha)break;}return best;}
    let best=Infinity;for(const m of moves){best=Math.min(best,search(checkApply(board,m),depth-1,alpha,beta,true));beta=Math.min(beta,best);if(beta<=alpha)break;}return best;
  }
  const moves=checkMoves(b,"b");let best=-Infinity,choice=moves[0];for(const m of moves){const score=search(checkApply(b,m),3,-Infinity,Infinity,false);if(score>best){best=score;choice=m;}}return choice;
}
function makeDots(){
  return {h:Array.from({length:4},()=>Array(3).fill(false)),v:Array.from({length:3},()=>Array(4).fill(false)),boxes:Array.from({length:3},()=>Array(3).fill(0)),turn:"you",scoreYou:0,scoreBot:0};
}
function dotsComplete(s){
  for(let r=0;r<3;r++)for(let c=0;c<3;c++)if(!s.boxes[r][c]&&s.h[r][c]&&s.h[r+1][c]&&s.v[r][c]&&s.v[r][c+1])return {r,c};
  return null;
}
function dotsSafeMove(s){
  const candidates=[];
  for(let r=0;r<4;r++)for(let c=0;c<3;c++)if(!s.h[r][c])candidates.push({type:"h",r,c});
  for(let r=0;r<3;r++)for(let c=0;c<4;c++)if(!s.v[r][c])candidates.push({type:"v",r,c});
  for(const m of candidates){const copy=JSON.parse(JSON.stringify(s));copy[m.type][m.r][m.c]=true;let danger=0;for(let r=0;r<3;r++)for(let c=0;c<3;c++){let edges=+copy.h[r][c]+ +copy.h[r+1][c]+ +copy.v[r][c]+ +copy.v[r][c+1];if(edges===3&&!copy.boxes[r][c])danger++;}m.danger=danger;}
  candidates.sort((a,b)=>a.danger-b.danger);return candidates[0];
}
function mountBoard(game,root,wallet){
  const mode=game.mode||"ttt",isTtt=mode==="ttt",isC4=mode==="connect4",isRev=mode==="reversi",isGomoku=mode==="gomoku",isShips=mode==="battleship",isCheck=mode==="checkers",isNim=mode==="nim",isDots=mode==="dots";
  let s=null,stake=0,done=false,status="";
  const setResult=(m,t)=>{status=m;const el=root.querySelector("#boardResult");if(el){el.textContent=m;el.className="result-banner"+(t?" "+t:"");}};
  const begin=()=>{
    const amount=Number(root.querySelector("#stake")?.value||25);if(!Number.isInteger(amount)||amount<10){setResult("Choose a whole-number match stake of at least 10.","loss");return;}if(!wallet.charge(amount)){setResult("You do not have enough credits for that stake.","loss");return;}stake=amount;done=false;
    if(isTtt)s={board:Array(9).fill(""),turn:"X"};
    else if(isC4)s={board:Array.from({length:6},()=>Array(7).fill("")),turn:"X"};
    else if(isRev){const b=Array.from({length:8},()=>Array(8).fill(""));b[3][3]="O";b[3][4]="X";b[4][3]="X";b[4][4]="O";s={board:b,turn:"X",passes:0};}
    else if(isGomoku)s={board:Array.from({length:15},()=>Array(15).fill("")),turn:"X",moves:0};
    else if(isShips)s={youFleet:randomFleet(),botFleet:randomFleet(),youShots:[],botShots:[],targetQueue:[],botHits:[],turn:"you"};
    else if(isCheck){const b=Array.from({length:8},()=>Array(8).fill(""));for(let r=0;r<3;r++)for(let c=0;c<8;c++)if((r+c)%2)b[r][c]="b";for(let r=5;r<8;r++)for(let c=0;c<8;c++)if((r+c)%2)b[r][c]="r";s={board:b,turn:"r",selected:null};}
    else if(isNim)s={piles:[3,4,5,7],turn:"you"};
    else s=makeDots();
    setResult("Match started. Your turn.","");render();
  };
  function end(winner,message){
    if(done)return;done=true;const payout=winner==="you"?stake*2:winner==="tie"?stake:0;wallet.settle(stake,payout,game.name);setResult(message,winner==="you"?"win":winner==="bot"?"loss":"");render();
  }
  function playTtt(i){
    if(done||s.turn!=="X"||s.board[i])return;s.board[i]="X";const winner=tttWinner(s.board);if(winner==="X"){end("you","You win. The bot had no winning reply.");return;}if(winner==="T"){end("tie","Draw. Your stake is returned.");return;}
    const ai=tttAI(s.board);if(ai>=0)s.board[ai]="O";const w=tttWinner(s.board);if(w==="O"){end("bot","The bot wins. It searched the full game tree.");return;}if(w==="T"){end("tie","Draw. Your stake is returned.");return;}render();
  }
  function playC4(c){
    if(done||s.turn!=="X"||s.board[0][c])return;c4Drop(s.board,c,"X");if(c4Win(s.board,"X")){end("you","Connect four! You win.");return;}
    const ai=c4AI(s.board);if(ai!==undefined)c4Drop(s.board,ai,"O");if(c4Win(s.board,"O")){end("bot","The bot connects four. Its minimax search found the line.");return;}if(s.board[0].every(Boolean)){end("tie","Board full. Draw.");return;}render();
  }
  function playRev(r,c){
    if(done||s.turn!=="X")return;const m=revMoves(s.board,"X").find(x=>x.r===r&&x.c===c);if(!m)return;revPlay(s.board,"X",m);
    const replies=revMoves(s.board,"O");if(replies.length)revPlay(s.board,"O",revAI(s.board));else s.passes++;
    const mine=s.board.flat().filter(x=>x==="X").length,bot=s.board.flat().filter(x=>x==="O").length;
    if(!revMoves(s.board,"X").length&&!revMoves(s.board,"O").length||s.passes>1){end(mine>bot?"you":mine<bot?"bot":"tie","Final count — you "+mine+", bot "+bot+".");return;}render();
  }
  function playGomoku(r,c){
    if(done||s.board[r][c])return;s.board[r][c]="X";s.moves++;if(gomokuWinner(s.board,"X")){end("you","Five in a row. You win.");return;}
    const ai=gomokuAI(s.board);s.board[ai.r][ai.c]="O";s.moves++;if(gomokuWinner(s.board,"O")){end("bot","The bot completes five in a row.");return;}if(s.moves>=225){end("tie","Full board. Draw.");return;}render();
  }
  function botShipShot(){
    let pick=null;
    if(s.targetQueue.length){while(s.targetQueue.length&&!pick){const p=s.targetQueue.shift();if(!s.botShots.some(q=>q.r===p.r&&q.c===p.c))pick=p;}}
    if(!pick){const candidates=[];for(let r=0;r<10;r++)for(let c=0;c<10;c++)if((r+c)%2===0&&!s.botShots.some(q=>q.r===r&&q.c===c))candidates.push({r,c});const pool=candidates.length?candidates:Array.from({length:100},(_,i)=>({r:Math.floor(i/10),c:i%10})).filter(p=>!s.botShots.some(q=>q.r===p.r&&q.c===p.c));pick=pool[Math.floor(Math.random()*pool.length)];}
    const hit=s.youFleet.some(p=>p.r===pick.r&&p.c===pick.c);s.botShots.push({r:pick.r,c:pick.c,hit});
    if(hit){for(const [dr,dc] of [[1,0],[-1,0],[0,1],[0,-1]]){const r=pick.r+dr,c=pick.c+dc;if(r>=0&&r<10&&c>=0&&c<10)s.targetQueue.push({r,c});}}
    return hit;
  }
  function playShip(r,c){
    if(done||s.youShots.some(p=>p.r===r&&p.c===c))return;const hit=s.botFleet.some(p=>p.r===r&&p.c===c);s.youShots.push({r,c,hit});
    if(s.botFleet.every(p=>s.youShots.some(q=>q.r===p.r&&q.c===p.c&&q.hit))){end("you","Fleet destroyed. You beat the bot's fleet.");return;}
    const botHit=botShipShot();if(s.youFleet.every(p=>s.botShots.some(q=>q.r===p.r&&q.c===p.c&&q.hit))){end("bot","The bot has located and destroyed your fleet.");return;}
    setResult((hit?"Direct hit! ":"Miss. ")+(botHit?"Bot hit one of your ships.":"Bot missed.")+" Keep hunting.","");render();
  }
  function playCheck(r,c){
    if(done||s.turn!=="r")return;
    const p=s.board[r][c];
    if(!s.selected){if(p==="r"||p==="R"){s.selected={r,c};render();}return;}
    const move=checkMoves(s.board,"r").find(m=>m.r===s.selected.r&&m.c===s.selected.c&&m.tr===r&&m.tc===c);
    if(move){s.board=checkApply(s.board,move);s.selected=null;if(!checkMoves(s.board,"b").length){end("you","The bot has no legal moves. You win.");return;}const ai=checkAI(s.board);s.board=checkApply(s.board,ai);if(!checkMoves(s.board,"r").length){end("bot","The bot wins. You have no legal moves.");return;}render();}else if(p==="r"||p==="R"){s.selected={r,c};render();}
  }
  function playNim(pile,remove){
    if(done||s.turn!=="you"||s.piles[pile]<remove)return;s.piles[pile]-=remove;
    if(s.piles.every(x=>x===0)){end("you","You took the last token. You win.");return;}
    let nim=s.piles.reduce((a,b)=>a^b,0),move=null;
    if(nim){for(let i=0;i<s.piles.length;i++){const target=s.piles[i]^nim;if(target<s.piles[i]){move={i,amount:s.piles[i]-target};break;}}}
    if(!move){const i=s.piles.findIndex(x=>x>0);move={i,amount:1};}
    s.piles[move.i]-=move.amount;
    if(s.piles.every(x=>x===0)){end("bot","The bot takes the last token.");return;}render();
  }
  function playDots(type,r,c){
    if(done||s.turn!=="you"||s[type][r][c])return;s[type][r][c]=true;
    let scored=0;for(let rr=0;rr<3;rr++)for(let cc=0;cc<3;cc++)if(!s.boxes[rr][cc]&&s.h[rr][cc]&&s.h[rr+1][cc]&&s.v[rr][cc]&&s.v[rr][cc+1]){s.boxes[rr][cc]=1;s.scoreYou++;scored++;}
    if(scored){if(s.scoreYou+s.scoreBot===9){end(s.scoreYou>s.scoreBot?"you":s.scoreYou<s.scoreBot?"bot":"tie","Final score — you "+s.scoreYou+", bot "+s.scoreBot+".");return;}render();return;}
    const m=dotsSafeMove(s);if(!m){end(s.scoreYou>s.scoreBot?"you":s.scoreYou<s.scoreBot?"bot":"tie","Final score — you "+s.scoreYou+", bot "+s.scoreBot+".");return;}
    s[m.type][m.r][m.c]=true;let botScored=0;for(let rr=0;rr<3;rr++)for(let cc=0;cc<3;cc++)if(!s.boxes[rr][cc]&&s.h[rr][cc]&&s.h[rr+1][cc]&&s.v[rr][cc]&&s.v[rr][cc+1]){s.boxes[rr][cc]=2;s.scoreBot++;botScored++;}
    if(s.scoreYou+s.scoreBot===9){end(s.scoreYou>s.scoreBot?"you":s.scoreYou<s.scoreBot?"bot":"tie","Final score — you "+s.scoreYou+", bot "+s.scoreBot+".");return;}render();
  }
  function render(){
    let content="";
    if(!s){content='<div class="game-intro"><div class="game-icon-large">'+game.icon+'</div><h3>'+game.name+'</h3><p>Challenge a local opponent. The bot uses the rules of this game, tactical move selection and search where appropriate. There is no online multiplayer connection in this release.</p></div>'+stakeBar()+'<div class="result-banner">Start a match to take your seat.</div>';root.innerHTML=content;return;}
    if(isTtt){
      content='<div class="tiny-note">YOU ARE X · BOT IS O · PERFECT-MOVE BOT</div><div class="board-grid" style="grid-template-columns:repeat(3,48px)">'+s.board.map((v,i)=>'<button class="board-cell" data-pos="'+i+'" '+(v||done?'disabled':'')+'>'+v+'</button>').join("")+'</div>';
    } else if(isC4){
      content='<div class="tiny-note">DROP A TOKEN INTO A COLUMN · FIRST TO FOUR WINS</div><div class="board-grid" style="grid-template-columns:repeat(7,42px)">'+Array.from({length:6},(_,r)=>s.board[r].map((v,c)=>'<button class="board-cell" data-col="'+c+'" style="border-radius:50%;color:'+(v==="X"?"#f4d98e":v==="O"?"#d7e2c8":"#77836d")+'" '+(v||done?'disabled':'')+'>'+(v==="X"?"●":v==="O"?"●":"·")+'</button>').join("")).join("")+'</div>';
    } else if(isRev){
      const legal=revMoves(s.board,"X");content='<div class="tiny-note">YOU: X · BOT: O · CAPTURE THE MOST SQUARES</div><div class="board-grid" style="grid-template-columns:repeat(8,36px)">'+s.board.map((row,r)=>row.map((v,c)=>'<button class="board-cell '+((r+c)%2?"dark":"light")+'" data-cell="'+r+","+c+'" '+(!legal.some(m=>m.r===r&&m.c===c)||done?'disabled':'')+'>'+(v==="X"?"●":v==="O"?"○":"")+'</button>').join("")).join("")+'</div>';
    } else if(isGomoku){
      content='<div class="tiny-note">YOU: BLACK X · BOT: WHITE O · FIVE IN A ROW</div><div class="board-grid" style="grid-template-columns:repeat(15,23px);gap:2px">'+s.board.map((row,r)=>row.map((v,c)=>'<button class="board-cell" style="width:23px;height:23px;padding:0;font-size:12px;border-radius:2px" data-cell="'+r+","+c+'" '+(v||done?'disabled':'')+'>'+(v==="X"?"●":v==="O"?"○":"")+'</button>').join("")).join("")+'</div>';
    } else if(isShips){
      content='<div class="tiny-note">FIRE AT THE ENEMY GRID · THE HOUSE BOT USES HUNT / TARGET SEARCH</div><div class="board-grid" style="grid-template-columns:repeat(10,29px)">'+Array.from({length:100},(_,i)=>{const r=Math.floor(i/10),c=i%10,shot=s.youShots.find(p=>p.r===r&&p.c===c);return '<button class="board-cell" style="width:29px;height:29px;padding:0;font-size:12px" data-cell="'+r+","+c+'" '+(shot||done?'disabled':'')+'>'+(shot?(shot.hit?"✹":"·"):"·")+'</button>';}).join("")+'</div><div class="tiny-note">YOUR FLEET IS HIDDEN · BOT SHOTS: '+s.botShots.length+' · YOUR HITS: '+s.youShots.filter(p=>p.hit).length+'</div><div class="board-grid" style="grid-template-columns:repeat(10,22px);gap:2px">'+Array.from({length:100},(_,i)=>{const r=Math.floor(i/10),c=i%10,shot=s.botShots.find(p=>p.r===r&&p.c===c);return '<div class="board-cell" style="width:22px;height:22px;font-size:10px;background:'+(shot?(shot.hit?"#804941":"#313b2e"):"#232b20")+'">'+(shot?(shot.hit?"×":"·"):"")+'</div>';}).join("")+'</div>';
    } else if(isCheck){
      content='<div class="tiny-note">YOU PLAY RED · BOT PLAYS BLACK · CAPTURES ARE MANDATORY</div><div class="board-grid" style="grid-template-columns:repeat(8,38px)">'+s.board.map((row,r)=>row.map((v,c)=>'<button class="board-cell '+((r+c)%2?"dark":"light")+'" data-cell="'+r+","+c+'" '+(!((r+c)%2)||done?'disabled':'')+'>'+(v?(v.toLowerCase()==="r"?"●":"○")+(v===v.toUpperCase()?"♛":""):"")+'</button>').join("")).join("")+'</div>';
    } else if(isNim){
      content='<div class="tiny-note">REMOVE 1–3 FROM ONE PILE · THE BOT PLAYS OPTIMAL NIM</div><div class="table-seats">'+s.piles.map((n,i)=>'<div class="seat"><small>PILE '+(i+1)+'</small><strong>'+("● ".repeat(n))+'</strong><div class="action-row">'+[1,2,3].map(k=>'<button class="game-action secondary" data-pile="'+i+'" data-remove="'+k+'" '+(n<k||done?'disabled':'')+'>−'+k+'</button>').join("")+'</div></div>').join("")+'</div>';
    } else {
      content='<div class="tiny-note">DOTS & BOXES · COMPLETE A BOX TO SCORE AND PLAY AGAIN</div><div class="board-grid" style="grid-template-columns:repeat(7,39px);gap:3px">'+Array.from({length:7},(_,i)=>Array.from({length:7},(_,j)=>{if(i%2===0&&j%2===0)return '<span style="width:7px;height:7px;border-radius:50%;background:#d6c58b;margin:auto"></span>';if(i%2===0)return '<button class="game-action" style="width:39px;height:9px;padding:0" data-dot="h" data-r="'+Math.floor(i/2)+'" data-c="'+Math.floor(j/2)+'" '+(s.h[Math.floor(i/2)][Math.floor(j/2)]||done?'disabled':'')+'></button>';if(j%2===0)return '<button class="game-action" style="width:9px;height:39px;padding:0" data-dot="v" data-r="'+Math.floor(i/2)+'" data-c="'+Math.floor(j/2)+'" '+(s.v[Math.floor(i/2)][Math.floor(j/2)]||done?'disabled':'')+'></button>';const box=s.boxes[Math.floor(i/2)][Math.floor(j/2)];return '<span style="display:grid;place-items:center;width:39px;height:39px;background:'+(box===1?"#697b4c":box===2?"#786b4a":"transparent")+';font-size:10px">'+(box===1?"YOU":box===2?"BOT":"")+'</span>';}).join("")).join("")+'</div><div class="tiny-note">SCORE · YOU '+s.scoreYou+' — BOT '+s.scoreBot+'</div>';
    }
    root.innerHTML='<div class="game-intro"><div class="game-icon-large">'+game.icon+'</div><h3>'+game.name+'</h3><p>Local head-to-head match. The CPU uses search, legal-move checks, position evaluation or probability-aware targeting depending on the game.</p></div>'+stakeBar()+content+'<div id="boardResult" class="result-banner">'+(status||"Your move.")+'</div>';
  }
  function click(e){
    const b=e.target.closest("[data-act],[data-pos],[data-col],[data-cell],[data-pile],[data-dot]");if(!b)return;
    if(b.dataset.act==="start"){begin();return;}
    if(!s||done)return;
    if(b.dataset.pos!==undefined&&isTtt)playTtt(Number(b.dataset.pos));
    else if(b.dataset.col!==undefined&&isC4)playC4(Number(b.dataset.col));
    else if(b.dataset.cell&&isRev){const p=b.dataset.cell.split(",").map(Number);playRev(p[0],p[1]);}
    else if(b.dataset.cell&&isGomoku){const p=b.dataset.cell.split(",").map(Number);playGomoku(p[0],p[1]);}
    else if(b.dataset.cell&&isShips){const p=b.dataset.cell.split(",").map(Number);playShip(p[0],p[1]);}
    else if(b.dataset.cell&&isCheck){const p=b.dataset.cell.split(",").map(Number);playCheck(p[0],p[1]);}
    else if(b.dataset.pile!==undefined)playNim(Number(b.dataset.pile),Number(b.dataset.remove));
    else if(b.dataset.dot)playDots(b.dataset.dot,Number(b.dataset.r),Number(b.dataset.c));
  }
  root.addEventListener("click",click);render();
  return {close:()=>{},destroy:()=>root.removeEventListener("click",click)};
}
export { mountBoard };
