const FILES="abcdefgh";
const PIECE_VALUE={p:100,n:320,b:335,r:500,q:900,k:20000};
const KNIGHT_STEPS=[[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
const KING_STEPS=[[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
const BISHOP_DIRS=[[-1,-1],[-1,1],[1,-1],[1,1]];
const ROOK_DIRS=[[-1,0],[1,0],[0,-1],[0,1]];
const Q_DIRS=BISHOP_DIRS.concat(ROOK_DIRS);
const inside=(r,c)=>r>=0&&r<8&&c>=0&&c<8;
const copyBoard=b=>b.map(row=>row.slice());
const sideOf=p=>p?(p===p.toUpperCase()?"w":"b"):null;
const isFriend=(p,side)=>p&&sideOf(p)===side;
const isEnemy=(p,side)=>p&&sideOf(p)!==side;
const makePosition=()=>({
  board:[
    ["r","n","b","q","k","b","n","r"],
    ["p","p","p","p","p","p","p","p"],
    ["","","","","","","",""],
    ["","","","","","","",""],
    ["","","","","","","",""],
    ["","","","","","","",""],
    ["P","P","P","P","P","P","P","P"],
    ["R","N","B","Q","K","B","N","R"]
  ],
  turn:"w",
  castle:{wK:true,wQ:true,bK:true,bQ:true},
  ep:null
});
function findKing(board,side){
  const king=side==="w"?"K":"k";
  for(let r=0;r<8;r++)for(let c=0;c<8;c++)if(board[r][c]===king)return {r,c};
  return null;
}
function isAttacked(board,r,c,bySide){
  const pawn=bySide==="w"?"P":"p";
  const pawnSource=bySide==="w"?r+1:r-1;
  for(const dc of [-1,1])if(inside(pawnSource,c+dc)&&board[pawnSource][c+dc]===pawn)return true;
  const knight=bySide==="w"?"N":"n";
  for(const [dr,dc] of KNIGHT_STEPS)if(inside(r+dr,c+dc)&&board[r+dr][c+dc]===knight)return true;
  const king=bySide==="w"?"K":"k";
  for(const [dr,dc] of KING_STEPS)if(inside(r+dr,c+dc)&&board[r+dr][c+dc]===king)return true;
  for(const [dr,dc] of Q_DIRS){
    let rr=r+dr,cc=c+dc,distance=1;
    while(inside(rr,cc)){
      const p=board[rr][cc];
      if(p){
        if(sideOf(p)===bySide){
          const type=p.toLowerCase();
          if(type==="q"||type==="r"&&ROOK_DIRS.some(([x,y])=>x===dr&&y===dc)||type==="b"&&BISHOP_DIRS.some(([x,y])=>x===dr&&y===dc))return true;
        }
        break;
      }
      rr+=dr;cc+=dc;distance++;
    }
  }
  return false;
}
function inCheck(position,side){
  const king=findKing(position.board,side);
  return !king||isAttacked(position.board,king.r,king.c,side==="w"?"b":"w");
}
function addMove(moves,from,to,extra={}){
  moves.push({from:{r:from.r,c:from.c},to:{r:to.r,c:to.c},...extra});
}
function pseudoMoves(position,side){
  const board=position.board,moves=[];
  for(let r=0;r<8;r++)for(let c=0;c<8;c++){
    const piece=board[r][c];if(!piece||sideOf(piece)!==side)continue;
    const type=piece.toLowerCase(),from={r,c};
    if(type==="p"){
      const dir=side==="w"?-1:1,start=side==="w"?6:1,last=side==="w"?0:7;
      const one=r+dir;
      if(inside(one,c)&&!board[one][c]){
        addMove(moves,from,{r:one,c},{promotion:one===last?"q":null});
        const two=r+dir*2;
        if(r===start&&!board[two][c])addMove(moves,from,{r:two,c},{doublePawn:true});
      }
      for(const dc of [-1,1]){
        const rr=r+dir,cc=c+dc;
        if(!inside(rr,cc))continue;
        if(isEnemy(board[rr][cc],side))addMove(moves,from,{r:rr,c:cc},{promotion:rr===last?"q":null});
        else if(position.ep&&position.ep.r===rr&&position.ep.c===cc)addMove(moves,from,{r:rr,c:cc},{enPassant:true});
      }
    } else if(type==="n"){
      for(const [dr,dc] of KNIGHT_STEPS){const rr=r+dr,cc=c+dc;if(inside(rr,cc)&&!isFriend(board[rr][cc],side))addMove(moves,from,{r:rr,c:cc});}
    } else if(type==="k"){
      for(const [dr,dc] of KING_STEPS){const rr=r+dr,cc=c+dc;if(inside(rr,cc)&&!isFriend(board[rr][cc],side))addMove(moves,from,{r:rr,c:cc});}
      const home=side==="w"?7:0,enemy=side==="w"?"b":"w";
      if(r===home&&c===4&&!isAttacked(board,home,4,enemy)){
        const kingRight=side==="w"?"wK":"bK";
        if(position.castle[kingRight]&&!board[home][5]&&!board[home][6]&&board[home][7]===(side==="w"?"R":"r")&&!isAttacked(board,home,5,enemy)&&!isAttacked(board,home,6,enemy))
          addMove(moves,from,{r:home,c:6},{castle:"K"});
        const queenRight=side==="w"?"wQ":"bQ";
        if(position.castle[queenRight]&&!board[home][1]&&!board[home][2]&&!board[home][3]&&board[home][0]===(side==="w"?"R":"r")&&!isAttacked(board,home,3,enemy)&&!isAttacked(board,home,2,enemy))
          addMove(moves,from,{r:home,c:2},{castle:"Q"});
      }
    } else {
      const dirs=type==="q"?Q_DIRS:type==="r"?ROOK_DIRS:BISHOP_DIRS;
      for(const [dr,dc] of dirs){
        let rr=r+dr,cc=c+dc;
        while(inside(rr,cc)){
          if(isFriend(board[rr][cc],side))break;
          addMove(moves,from,{r:rr,c:cc});
          if(board[rr][cc])break;
          rr+=dr;cc+=dc;
        }
      }
    }
  }
  return moves;
}
function applyMove(position,move){
  const board=copyBoard(position.board),castle={...position.castle};
  const piece=board[move.from.r][move.from.c],side=sideOf(piece),target=board[move.to.r][move.to.c];
  board[move.from.r][move.from.c]="";
  if(move.enPassant)board[move.from.r][move.to.c]="";
  board[move.to.r][move.to.c]=move.promotion?(side==="w"?"Q":"q"):piece;
  if(move.castle){
    const row=move.from.r;
    if(move.castle==="K"){board[row][5]=board[row][7];board[row][7]="";}
    else {board[row][3]=board[row][0];board[row][0]="";}
  }
  if(piece==="K"){castle.wK=false;castle.wQ=false;}
  if(piece==="k"){castle.bK=false;castle.bQ=false;}
  if(piece==="R"&&move.from.r===7&&move.from.c===0)castle.wQ=false;
  if(piece==="R"&&move.from.r===7&&move.from.c===7)castle.wK=false;
  if(piece==="r"&&move.from.r===0&&move.from.c===0)castle.bQ=false;
  if(piece==="r"&&move.from.r===0&&move.from.c===7)castle.bK=false;
  if(target==="R"&&move.to.r===7&&move.to.c===0)castle.wQ=false;
  if(target==="R"&&move.to.r===7&&move.to.c===7)castle.wK=false;
  if(target==="r"&&move.to.r===0&&move.to.c===0)castle.bQ=false;
  if(target==="r"&&move.to.r===0&&move.to.c===7)castle.bK=false;
  const ep=move.doublePawn?{r:(move.from.r+move.to.r)/2,c:move.from.c}:null;
  return {board,turn:side==="w"?"b":"w",castle,ep};
}
function legalMoves(position,side=position.turn){
  const moves=pseudoMoves(position,side),legal=[];
  for(const move of moves){const next=applyMove(position,move);if(!inCheck(next,side))legal.push(move);}
  return legal;
}
function evaluate(position){
  let score=0;
  for(let r=0;r<8;r++)for(let c=0;c<8;c++){
    const p=position.board[r][c];if(!p)continue;
    const type=p.toLowerCase(),side=sideOf(p),value=PIECE_VALUE[type];
    const center=3.5-(Math.abs(3.5-r)+Math.abs(3.5-c))/2;
    let bonus=0;
    if(type==="p")bonus=(side==="w"?6-r:r-1)*5+center*2;
    else if(type==="n"||type==="b")bonus=center*7;
    else if(type==="q")bonus=center*2;
    else if(type==="k")bonus=-center*2;
    score+=(side==="w"?1:-1)*(value+bonus);
  }
  return score;
}
function search(position,depth,alpha,beta){
  const moves=legalMoves(position);
  if(!moves.length){
    if(inCheck(position,position.turn))return position.turn==="w"?-30000-depth:30000+depth;
    return 0;
  }
  if(depth<=0)return evaluate(position);
  if(position.turn==="w"){
    let best=-Infinity;
    for(const move of moves){best=Math.max(best,search(applyMove(position,move),depth-1,alpha,beta));alpha=Math.max(alpha,best);if(beta<=alpha)break;}
    return best;
  }
  let best=Infinity;
  for(const move of moves){best=Math.min(best,search(applyMove(position,move),depth-1,alpha,beta));beta=Math.min(beta,best);if(beta<=alpha)break;}
  return best;
}
function chooseBotMove(position){
  const moves=legalMoves(position,"b");let best=Infinity,choice=moves[0];
  for(const move of moves){
    const score=search(applyMove(position,move),2,-Infinity,Infinity);
    if(score<best){best=score;choice=move;}
  }
  return choice||null;
}
function squareName(square){return FILES[square.c]+(8-square.r);}
function notation(before,move,after){
  if(move.castle)return move.castle==="K"?"O-O":"O-O-O";
  const piece=before.board[move.from.r][move.from.c],type=piece.toUpperCase()==="P"?"":piece.toUpperCase();
  const capture=before.board[move.to.r][move.to.c]||move.enPassant?"x":"";
  const suffix=inCheck(after,after.turn)?(legalMoves(after).length?" +":" #"):"";
  return type+capture+squareName(move.to)+(move.promotion?"=Q":"")+suffix;
}
const GLYPHS={K:"♔",Q:"♕",R:"♖",B:"♗",N:"♘",P:"♙",k:"♚",q:"♛",r:"♜",b:"♝",n:"♞",p:"♟"};
function mountChess(game,root,wallet){
  let position=null,stake=0,done=false,selected=null,message="Start a game, then move the white pieces.";
  let history=[];
  function settle(winner,text){
    if(done)return;done=true;const payout=winner==="you"?stake*2:winner==="draw"?stake:0;
    wallet.settle(stake,payout,game.name);message=text;render();
  }
  function getEndResult(){
    const moves=legalMoves(position);
    if(moves.length)return false;
    if(inCheck(position,position.turn)){
      if(position.turn==="b")settle("you","Checkmate. You win.");
      else settle("bot","Checkmate. The house bot wins.");
    } else settle("draw","Stalemate. Your stake is returned.");
    return true;
  }
  function start(){
    if(position&&!done){message="Finish or close the current match before starting another.";render();return;}
    const amount=Number(root.querySelector("#stake")?.value||0);
    if(!Number.isInteger(amount)||amount<10){message="Enter a whole-number stake of at least 10 credits.";render();return;}
    if(!wallet.charge(amount)){message="Not enough demo credits.";render();return;}
    stake=amount;position=makePosition();history=[];selected=null;done=false;message="Your move. You play White; the house bot plays Black.";render();
  }
  function click(e){
    const button=e.target.closest("[data-act],[data-cell]");if(!button)return;
    if(button.dataset.act==="start"){start();return;}
    if(!position||done||!button.dataset.cell)return;
    const [r,c]=button.dataset.cell.split(",").map(Number),piece=position.board[r][c];
    if(!selected){
      if(piece&&sideOf(piece)==="w"){selected={r,c};render();}
      return;
    }
    if(piece&&sideOf(piece)==="w"){selected={r,c};render();return;}
    const candidates=legalMoves(position,"w").filter(m=>m.from.r===selected.r&&m.from.c===selected.c);
    const move=candidates.find(m=>m.to.r===r&&m.to.c===c);
    if(!move){selected=null;render();return;}
    const before=position;position=applyMove(position,move);history.push(notation(before,move,position));selected=null;
    if(getEndResult())return;
    const reply=chooseBotMove(position);
    if(!reply){getEndResult();return;}
    const botBefore=position;position=applyMove(position,reply);history.push(notation(botBefore,reply,position));
    if(!getEndResult()){
      message=inCheck(position,"w")?"The bot checks you. Your move.":"Your move.";
      render();
    }
  }
  function render(){
    const symbols=["♜","♞","♝","♛","♚","♝","♞","♜"];
    const intro='<div class="game-intro"><div class="game-icon-large">♚</div><h3>'+game.name+'</h3><p>Full chessboard against a local search-based opponent. Legal moves, check, checkmate, stalemate, castling, en passant and automatic queen promotion are handled by the rules engine.</p></div>';
    const buy='<div class="bet-controls"><label for="stake">MATCH STAKE</label><input class="bet-input" id="stake" type="number" min="10" step="10" value="100"><button class="game-action primary" data-act="start" '+(position&&!done?"disabled":"")+'>'+(position?"New match":"Start match")+'</button><span class="tiny-note">Winner earns 2× · draw returns stake</span></div>';
    let boardHTML="";
    if(position){
      const possible=selected?legalMoves(position,"w").filter(m=>m.from.r===selected.r&&m.from.c===selected.c).map(m=>m.to.r+","+m.to.c):[];
      boardHTML='<div class="tiny-note">'+(position.turn==="w"?"WHITE TO MOVE":"BLACK TO MOVE")+' · '+(inCheck(position,position.turn)?"CHECK":"")+'</div><div class="board-grid" style="grid-template-columns:repeat(8,44px);gap:2px">'+position.board.map((row,r)=>row.map((p,c)=>{
        const sq=r+","+c,chosen=selected&&selected.r===r&&selected.c===c,legal=possible.includes(sq),light=(r+c)%2===0;
        return '<button class="board-cell '+(light?"light":"dark")+'" data-cell="'+sq+'" style="width:44px;height:44px;padding:0;font-size:25px;'+(chosen?"outline:3px solid #e6d08f;":legal?"box-shadow:inset 0 0 0 3px #bdd990;":"")+'" aria-label="'+(p?GLYPHS[p]:"empty")+' '+squareName({r,c})+'">'+(GLYPHS[p]||"")+'</button>';
      }).join("")).join("")+'</div><div class="tiny-note">YOU PLAY WHITE · HOUSE BOT PLAYS BLACK</div>';
    } else boardHTML='<div class="table-felt"><div class="playing-cards" style="font-size:45px">'+symbols.slice(0,4).join(" ")+'</div><h3>64 squares. One opponent.</h3><p class="muted">The CPU searches legal continuations and evaluates material and piece activity.</p></div>';
    const moveList=history.slice(-12).map((m,i)=>'<div class="session-history-item"><span>'+(i+1)+'. '+m+'</span></div>').join("");
    root.innerHTML=intro+buy+boardHTML+'<div class="result-banner">'+message+'</div>'+(history.length?'<div class="aside-card" style="max-width:520px;margin:14px auto"><small class="aside-label">RECENT MOVES</small>'+moveList+'</div>':'');
  }
  root.addEventListener("click",click);render();
  return {close:()=>{if(stake&&!done){done=true;wallet.settle(stake,0,game.name);}},destroy:()=>root.removeEventListener("click",click)};
}
export { mountChess };
