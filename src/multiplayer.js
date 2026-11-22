import { createOnlineChessPosition, applyOnlineChessMove, getOnlineChessStatus, getOnlineChessMoves } from "./chess.js";
const PEER_SCRIPT="https://cdn.jsdelivr.net/npm/peerjs@1.5.5/dist/peerjs.min.js";
const ROOM_PREFIX="rincon-";
const CODE_CHARS="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const GAMES=[
  ["ttt","Tic-Tac-Toe","3×3 · first to three"],
  ["connect4","Connect Four","7×6 · connect four"],
  ["reversi","Reversi","8×8 · most discs wins"],
  ["gomoku","Gomoku","15×15 · connect five"],
  ["chess","Chess","standard chess · full legal moves"],
  ["checkers","Checkers","8×8 · captures and kings"],
  ["battleship","Battleship","10×10 · hidden fleets"],
  ["mancala","Mancala (Kalah)","sowing · captures · extra turns"],
  ["nim","Nim","four piles · take the last token"],
  ["dots","Dots and Boxes","3×3 boxes · draw edges"]
];
export const ONLINE_ROOM_MODES=GAMES.map(game=>game[0]);
export const isOnlineRoomGame=mode=>ONLINE_ROOM_MODES.includes(mode);
const esc=value=>String(value??"").replace(/[&<>\"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
let peerLoader;
function loadPeer(){
  if(window.Peer)return Promise.resolve(window.Peer);
  if(!peerLoader)peerLoader=new Promise((resolve,reject)=>{
    const script=document.createElement("script");script.src=PEER_SCRIPT;script.async=true;
    script.onload=()=>window.Peer?resolve(window.Peer):reject(new Error("PeerJS did not expose its browser API."));
    script.onerror=()=>{peerLoader=null;reject(new Error("Could not load PeerJS. Check your internet connection."));};
    document.head.appendChild(script);
  });
  return peerLoader;
}
function randomCode(){
  const bytes=new Uint8Array(8);crypto.getRandomValues(bytes);
  return Array.from(bytes,b=>CODE_CHARS[b%CODE_CHARS.length]).join("");
}
function randomFleet(){
  const fleet=Array.from({length:10},()=>Array(10).fill(0));
  [4,3,3,2].forEach((length,index)=>{
    let placed=false,tries=0;
    while(!placed&&tries++<1000){
      const horizontal=Math.random()<.5,r=Math.floor(Math.random()*10),c=Math.floor(Math.random()*10),cells=[];
      for(let i=0;i<length;i++){
        const rr=r+(horizontal?0:i),cc=c+(horizontal?i:0);
        if(rr>=10||cc>=10||fleet[rr][cc]){cells.length=0;break;}
        cells.push([rr,cc]);
      }
      if(cells.length===length){cells.forEach(([rr,cc])=>fleet[rr][cc]=index+1);placed=true;}
    }
  });
  return fleet;
}
export function createRoomBoard(mode){
  if(mode==="ttt")return {mode,board:Array(9).fill(0),turn:0,over:false,winner:null};
  if(mode==="connect4")return {mode,board:Array.from({length:6},()=>Array(7).fill(0)),turn:0,over:false,winner:null};
  if(mode==="gomoku")return {mode,board:Array.from({length:15},()=>Array(15).fill(0)),turn:0,over:false,winner:null};
  if(mode==="reversi"){
    const board=Array.from({length:8},()=>Array(8).fill(0));
    board[3][3]=2;board[3][4]=1;board[4][3]=1;board[4][4]=2;
    return {mode,board,turn:0,over:false,winner:null,passes:0};
  }
  if(mode==="chess")return {mode,position:createOnlineChessPosition(),turn:0,over:false,winner:null};
  if(mode==="checkers"){
    const board=Array.from({length:8},()=>Array(8).fill(0));
    for(let r=0;r<3;r++)for(let c=0;c<8;c++)if((r+c)%2)board[r][c]=2;
    for(let r=5;r<8;r++)for(let c=0;c<8;c++)if((r+c)%2)board[r][c]=1;
    return {mode,board,turn:0,over:false,winner:null,mustContinue:null};
  }
  if(mode==="battleship")return {mode,fleets:[randomFleet(),randomFleet()],shots:[[],[]],turn:0,over:false,winner:null,lastShot:null};
  if(mode==="mancala")return {mode,pits:[4,4,4,4,4,4,0,4,4,4,4,4,4,0],turn:0,over:false,winner:null};
  if(mode==="nim")return {mode,piles:[3,4,5,7],turn:0,over:false,winner:null};
  if(mode==="dots")return {mode,h:Array.from({length:4},()=>Array(3).fill(0)),v:Array.from({length:3},()=>Array(4).fill(0)),boxes:Array.from({length:3},()=>Array(3).fill(0)),scores:[0,0],turn:0,over:false,winner:null};
  throw new Error("Unsupported online game mode: "+mode);
}
function checkersMoves(state,player){
  const board=state.board,moves=[],dirs=player===0?[-1]:[1];
  const addFrom=(r,c)=>{
    const piece=board[r][c],king=piece===3||piece===4,forward=king?[-1,1]:dirs;
    for(const dr of forward)for(const dc of [-1,1]){
      const rr=r+dr,cc=c+dc;
      if(rr<0||rr>=8||cc<0||cc>=8)continue;
      if(!board[rr][cc])moves.push({from:{r,c},to:{r:rr,c:cc},capture:null});
      else if((player===0?board[rr][cc]===2||board[rr][cc]===4:board[rr][cc]===1||board[rr][cc]===3)){
        const jr=rr+dr,jc=cc+dc;
        if(jr>=0&&jr<8&&jc>=0&&jc<8&&!board[jr][jc])moves.push({from:{r,c},to:{r:jr,c:jc},capture:{r:rr,c:cc}});
      }
    }
  };
  if(state.mustContinue){const {r,c}=state.mustContinue;addFrom(r,c);}
  else for(let r=0;r<8;r++)for(let c=0;c<8;c++)if(board[r][c]&&((player===0&&(board[r][c]===1||board[r][c]===3))||(player===1&&(board[r][c]===2||board[r][c]===4))))addFrom(r,c);
  const captures=moves.filter(move=>move.capture);return captures.length?captures:moves;
}
function finishMancala(state){
  const side0=state.pits.slice(0,6).reduce((a,b)=>a+b,0),side1=state.pits.slice(7,13).reduce((a,b)=>a+b,0);
  if(side0===0||side1===0){
    for(let i=0;i<6;i++){state.pits[6]+=state.pits[i];state.pits[i]=0;}
    for(let i=7;i<13;i++){state.pits[13]+=state.pits[i];state.pits[i]=0;}
    state.over=true;state.winner=state.pits[6]===state.pits[13]?null:state.pits[6]>state.pits[13]?0:1;
  }
}
export function getPublicRoomState(state,player){
  if(!state)return null;
  if(state.mode!=="battleship")return JSON.parse(JSON.stringify(state));
  return {
    mode:"battleship",turn:state.turn,over:state.over,winner:state.winner,lastShot:state.lastShot,
    ownFleet:state.fleets[player],
    outgoingShots:state.shots[player],
    incomingShots:state.shots[1-player]
  };
}
const DIRS=[[0,1],[1,0],[1,1],[1,-1]];
const ALL_DIRECTIONS=[[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
function lineCount(board,r,c,dr,dc,p){
  let n=0,rr=r+dr,cc=c+dc;
  while(rr>=0&&rr<board.length&&cc>=0&&cc<board[0].length&&board[rr][cc]===p){n++;rr+=dr;cc+=dc;}
  return n;
}
function lineWin(board,r,c,p,need){
  return DIRS.some(([dr,dc])=>1+lineCount(board,r,c,dr,dc,p)+lineCount(board,r,c,-dr,-dc,p)>=need);
}
function reversiLegal(board,p){
  const moves=[];
  for(let r=0;r<8;r++)for(let c=0;c<8;c++){
    if(board[r][c])continue;
    const flips=[];
    for(const [dr,dc] of ALL_DIRECTIONS){
      let rr=r+dr,cc=c+dc,line=[];
      while(rr>=0&&rr<8&&cc>=0&&cc<8&&board[rr][cc]===3-p){line.push([rr,cc]);rr+=dr;cc+=dc;}
      if(line.length&&rr>=0&&rr<8&&cc>=0&&cc<8&&board[rr][cc]===p)flips.push(...line);
    }
    if(flips.length)moves.push({r,c,flips});
  }
  return moves;
}
function finishReversi(s){
  let one=0,two=0;for(const row of s.board)for(const v of row){if(v===1)one++;if(v===2)two++;}
  s.over=true;s.winner=one===two?null:one>two?0:1;s.score=[one,two];
}
export function applyRoomMove(state,player,move){
  if(!state||state.over||state.turn!==player||!move)return null;
  const next=JSON.parse(JSON.stringify(state)),b=next.board;
  if(state.mode==="ttt"){
    const i=Number(move.i);if(!Number.isInteger(i)||i<0||i>8||b[i])return null;
    b[i]=player+1;
    const wins=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    const line=wins.find(row=>row.every(k=>b[k]===player+1));
    if(line){next.over=true;next.winner=player;next.line=line;}else if(b.every(Boolean))next.over=true;
  }else if(state.mode==="connect4"){
    const col=Number(move.c);if(!Number.isInteger(col)||col<0||col>6)return null;
    let row=-1;for(let r=5;r>=0;r--)if(!b[r][col]){row=r;break;}
    if(row<0)return null;b[row][col]=player+1;
    if(lineWin(b,row,col,player+1,4)){next.over=true;next.winner=player;}
    else if(b.every(row=>row.every(Boolean)))next.over=true;
  }else if(state.mode==="gomoku"){
    const r=Number(move.r),c=Number(move.c);
    if(!Number.isInteger(r)||!Number.isInteger(c)||r<0||r>=15||c<0||c>=15||b[r][c])return null;
    b[r][c]=player+1;
    if(lineWin(b,r,c,player+1,5)){next.over=true;next.winner=player;}
    else if(b.every(row=>row.every(Boolean)))next.over=true;
  }else if(state.mode==="reversi"){
    const r=Number(move.r),c=Number(move.c),valid=reversiLegal(b,player+1).find(m=>m.r===r&&m.c===c);
    if(!valid)return null;b[r][c]=player+1;valid.flips.forEach(([rr,cc])=>b[rr][cc]=player+1);
    next.passes=0;const otherMoves=reversiLegal(b,2-player);
    if(!otherMoves.length){
      if(!reversiLegal(b,player+1).length)finishReversi(next);
      else {next.turn=player;next.passes=1;}
    }else next.turn=1-player;
    return next;
  }else if(state.mode==="chess"){
    if((state.position.turn==="w"?0:1)!==player)return null;
    const position=applyOnlineChessMove(state.position,move);
    if(!position)return null;
    next.position=position;
    const result=getOnlineChessStatus(position);
    next.over=result.done;next.winner=result.winner;next.turn=position.turn==="w"?0:1;next.status=result.text;
    return next;
  }else if(state.mode==="checkers"){
    const from=move.from||{},to=move.to||{};
    const valid=checkersMoves(state,player).find(m=>m.from.r===Number(from.r)&&m.from.c===Number(from.c)&&m.to.r===Number(to.r)&&m.to.c===Number(to.c));
    if(!valid)return null;
    const piece=b[valid.from.r][valid.from.c];b[valid.from.r][valid.from.c]=0;b[valid.to.r][valid.to.c]=piece;
    if(valid.capture)b[valid.capture.r][valid.capture.c]=0;
    if(player===0&&valid.to.r===0&&piece===1)b[valid.to.r][valid.to.c]=3;
    if(player===1&&valid.to.r===7&&piece===2)b[valid.to.r][valid.to.c]=4;
    const more=valid.capture?checkersMoves({...next,mustContinue:{...valid.to}},player):[];
    const opponentPieces=b.flat().filter(piece=>player===0?(piece===2||piece===4):(piece===1||piece===3)).length;
    if(!opponentPieces||!checkersMoves({...next,turn:1-player,mustContinue:null},1-player).length){next.over=true;next.winner=player;next.mustContinue=null;return next;}
    if(more.some(m=>m.capture)){next.turn=player;next.mustContinue={...valid.to};}
    else {next.turn=1-player;next.mustContinue=null;}
    return next;
  }else if(state.mode==="battleship"){
    const r=Number(move.r),c=Number(move.c);
    if(!Number.isInteger(r)||!Number.isInteger(c)||r<0||r>=10||c<0||c>=10||state.shots[player].some(shot=>shot.r===r&&shot.c===c))return null;
    const hit=state.fleets[1-player][r][c]>0;
    next.shots[player].push({r,c,hit});next.lastShot={player,r,c,hit};
    const remaining=next.fleets[1-player].flat().filter(id=>id>0).length-next.shots[player].filter(shot=>shot.hit).length;
    if(remaining===0){next.over=true;next.winner=player;}
    else next.turn=1-player;
    return next;
  }else if(state.mode==="mancala"){
    const pit=Number(move.pit),own=player===0?pit>=0&&pit<=5:pit>=7&&pit<=12;
    if(!Number.isInteger(pit)||!own||!next.pits[pit])return null;
    let seeds=next.pits[pit];next.pits[pit]=0;let index=pit;
    while(seeds>0){
      index=(index+1)%14;
      if(player===0&&index===13||player===1&&index===6)continue;
      next.pits[index]++;seeds--;
    }
    const ownPit=player===0?index>=0&&index<=5:index>=7&&index<=12;
    if(ownPit&&next.pits[index]===1){
      const opposite=12-index;
      if(next.pits[opposite]>0){next.pits[player===0?6:13]+=next.pits[opposite]+1;next.pits[opposite]=0;next.pits[index]=0;}
    }
    const extra=index===(player===0?6:13);
    finishMancala(next);
    if(!next.over)next.turn=extra?player:1-player;
    return next;
  }else if(state.mode==="nim"){
    const pile=Number(move.pile),count=Number(move.count);
    if(!Number.isInteger(pile)||pile<0||pile>=next.piles.length||!Number.isInteger(count)||count<1||count>next.piles[pile])return null;
    next.piles[pile]-=count;
    if(next.piles.every(value=>value===0)){next.over=true;next.winner=player;}
    else next.turn=1-player;
    return next;
  }else if(state.mode==="dots"){
    const type=String(move.type),r=Number(move.r),c=Number(move.c);
    if(type==="h"){
      if(!Number.isInteger(r)||r<0||r>=4||!Number.isInteger(c)||c<0||c>=3||next.h[r][c])return null;
      next.h[r][c]=player+1;
    }else if(type==="v"){
      if(!Number.isInteger(r)||r<0||r>=3||!Number.isInteger(c)||c<0||c>=4||next.v[r][c])return null;
      next.v[r][c]=player+1;
    }else return null;
    let scored=0;
    for(let rr=0;rr<3;rr++)for(let cc=0;cc<3;cc++){
      if(next.boxes[rr][cc])continue;
      if(next.h[rr][cc]&&next.h[rr+1][cc]&&next.v[rr][cc]&&next.v[rr][cc+1]){
        next.boxes[rr][cc]=player+1;scored++;
      }
    }
    next.scores[player]+=scored;
    if(next.boxes.flat().every(Boolean)){
      next.over=true;next.winner=next.scores[0]===next.scores[1]?null:next.scores[0]>next.scores[1]?0:1;
    }else next.turn=scored?player:1-player;
    return next;
  }else return null;
  if(!next.over)next.turn=1-player;
  return next;
}
function boardHTML(s,player,selectedCell=null){
  if(!s)return "";
  const myTurn=!s.over&&s.turn===player,b=s.board;
  if(s.mode==="ttt")return '<div class="p2p-board p2p-ttt">'+b.map((v,i)=>'<button data-cell="'+i+'" '+(!myTurn||v?"disabled":"")+'>'+(v===1?"✕":v===2?"◯":"")+'</button>').join("")+'</div>';
  if(s.mode==="connect4")return '<div class="p2p-connect-wrap"><div class="p2p-connect-cols">'+Array.from({length:7},(_,c)=>'<button data-col="'+c+'" '+(!myTurn||b[0][c]?"disabled":"")+'>'+String.fromCharCode(65+c)+'</button>').join("")+'</div><div class="p2p-board p2p-connect">'+b.flat().map(v=>'<span class="p2p-disc '+(v===1?"one":v===2?"two":"")+'"></span>').join("")+'</div></div>';
  if(s.mode==="gomoku")return '<div class="p2p-gomoku-scroll"><div class="p2p-board p2p-gomoku">'+b.flatMap((row,r)=>row.map((v,c)=>'<button data-cell="'+r+','+c+'" '+(!myTurn||v?"disabled":"")+'>'+(v===1?"●":v===2?"○":"")+'</button>')).join("")+'</div></div>';
  if(s.mode==="reversi"){
    const legal=reversiLegal(b,player+1);
    return '<div class="p2p-board p2p-reversi">'+b.flatMap((row,r)=>row.map((v,c)=>'<button data-cell="'+r+','+c+'" '+(!myTurn||v||!legal.some(m=>m.r===r&&m.c===c)?"disabled":"")+'>'+(v===1?"●":v===2?"○":"")+'</button>')).join("")+'</div>';
  }
  if(s.mode==="chess"||s.mode==="checkers"){
    const board=s.mode==="chess"?s.position.board:s.board;
    const moves=s.mode==="chess"?getOnlineChessMoves(s.position):checkersMoves(s,player);
    const targets=moves.filter(m=>m.from&&m.from.r+","+m.from.c===selectedCell).map(m=>m.to.r+","+m.to.c);
    const order=player===0?[0,1,2,3,4,5,6,7]:[7,6,5,4,3,2,1,0];
    const glyph={"K":"♔","Q":"♕","R":"♖","B":"♗","N":"♘","P":"♙","k":"♚","q":"♛","r":"♜","b":"♝","n":"♞","p":"♟"};
    return '<div class="p2p-chess-wrap"><div class="p2p-chess-grid '+(s.mode==="checkers"?"checkers":"")+'">'+order.map(r=>order.map(c=>{
      const piece=board[r][c],key=r+","+c,owned=s.mode==="chess"?(piece&&(player===0?piece===piece.toUpperCase():piece===piece.toLowerCase())):(player===0?(piece===1||piece===3):(piece===2||piece===4));
      let mark="";
      if(s.mode==="chess")mark=glyph[piece]||"";
      else mark=piece===1?"●":piece===2?"○":piece===3?"♔":piece===4?"♕":"";
      return '<button class="p2p-chess-square '+(((r+c)%2)?"dark":"light")+(selectedCell===key?" selected":"")+(targets.includes(key)?" target":"")+'" data-cell="'+key+'" '+(!myTurn||(!owned&&!targets.includes(key))?"disabled":"")+'><span>'+mark+'</span></button>';
    }).join("")).join("")+'</div><div class="tiny-note">'+(s.mode==="chess"?(s.status||((s.position.turn==="w"?"White":"Black")+" to move")):"Red and black checkers · captures are mandatory")+'</div></div>';
  }
  if(s.mode==="battleship"){
    const shot=(list,r,c)=>list.find(value=>value.r===r&&value.c===c);
    const own=Array.from({length:10},(_,r)=>Array.from({length:10},(_,c)=>{
      const incoming=shot(s.incomingShots,r,c),ship=s.ownFleet[r][c];
      return '<span class="p2p-ship-cell '+(ship?"ship":"")+(incoming?(incoming.hit?" hit":" miss"):"")+'">'+(incoming?(incoming.hit?"✹":"·"):ship?"▰":"")+'</span>';
    }).join("")).join("");
    const enemy=Array.from({length:10},(_,r)=>Array.from({length:10},(_,c)=>{
      const previous=shot(s.outgoingShots,r,c);
      return '<button class="p2p-ship-cell '+(previous?(previous.hit?" hit":" miss"):"")+'" data-shot="'+r+','+c+'" '+(!myTurn||previous?"disabled":"")+'>'+(previous?(previous.hit?"✹":"·"):"")+'</button>';
    }).join("")).join("");
    return '<div class="p2p-fleet-pair"><section><small>YOUR FLEET</small><div class="p2p-fleet-grid">'+own+'</div></section><section><small>ENEMY WATERS</small><div class="p2p-fleet-grid">'+enemy+'</div></section></div>';
  }
  if(s.mode==="mancala"){
    const pit=(i)=>'<button class="p2p-mancala-pit" data-pit="'+i+'" '+(!myTurn||(player===0?(i<0||i>5):(i<7||i>12))||!s.pits[i]?"disabled":"")+'><small>'+s.pits[i]+'</small></button>';
    return '<div class="p2p-mancala"><div class="p2p-store">'+s.pits[13]+'</div><div class="p2p-mancala-main"><div class="p2p-mancala-row">'+[12,11,10,9,8,7].map(pit).join("")+'</div><div class="p2p-mancala-row">'+[0,1,2,3,4,5].map(pit).join("")+'</div></div><div class="p2p-store">'+s.pits[6]+'</div></div>';
  }
  if(s.mode==="nim"){
    return '<div class="p2p-nim-piles">'+s.piles.map((count,pile)=>'<section><small>PILE '+(pile+1)+'</small><strong>'+count+' stones</strong><div>'+Array.from({length:Math.min(3,count)},(_,i)=>'<button data-pile="'+pile+'" data-count="'+(i+1)+'" '+(!myTurn?"disabled":"")+'>Take '+(i+1)+'</button>').join("")+'</div></section>').join("")+'</div>';
  }
  if(s.mode==="dots"){
    const hrow=r=>'<div class="p2p-dots-row">'+Array.from({length:4},(_,c)=>'<span class="p2p-dot">●</span>'+(c<3?'<button class="p2p-dot-edge horizontal '+(s.h[r][c]?"p"+s.h[r][c]:"")+'" data-dot="h,'+r+','+c+'" '+(!myTurn||s.h[r][c]?"disabled":"")+'></button>':"")).join("")+'</div>';
    const vrow=r=>'<div class="p2p-dots-row">'+Array.from({length:4},(_,c)=>'<button class="p2p-dot-edge vertical '+(s.v[r][c]?"p"+s.v[r][c]:"")+'" data-dot="v,'+r+','+c+'" '+(!myTurn||s.v[r][c]?"disabled":"")+'></button>'+(c<3?'<span class="p2p-dot-gap">'+(s.boxes[r][c]?(s.boxes[r][c]===1?"✕":"○"):"")+'</span>':"")).join("")+'</div>';
    return '<div class="p2p-dots">'+[hrow(0),vrow(0),hrow(1),vrow(1),hrow(2),vrow(2),hrow(3)].join("")+'</div><div class="tiny-note">Score · '+s.scores[0]+' — '+s.scores[1]+'</div>';
  }
  return "";
}
export function mountMultiplayerRooms(root,{defaultName="",defaultMode=""}={}){
  let peer=null,conn=null,isHost=false,roomCode="",name=defaultName||"Player",opponent="Opponent",mode=isOnlineRoomGame(defaultMode)?defaultMode:"ttt",state=null,started=false,disposed=false,chat=[],selectedCell=null;
  function send(message){
    if(!conn?.open)return;
    const packet={...message};
    if(packet.state)packet.state=getPublicRoomState(packet.state,1);
    conn.send(packet);
  }
  function roomId(){return ROOM_PREFIX+roomCode.toLowerCase();}
  function roomUrl(){return location.origin+location.pathname+"#room="+roomCode;}
  function status(message,type=""){const el=root.querySelector("#p2pStatus");if(el){el.textContent=message;el.className="result-banner"+(type?" "+type:"");}}
  function lobby(message="Create a room or join a friend's room."){
    root.innerHTML='<div class="p2p-intro"><div class="game-icon-large">⌘</div><h3>Peer-to-peer rooms</h3><p>Invite a friend into a private head-to-head match. The host checks legal moves and shares the resulting game state over a direct peer connection.</p></div><div class="p2p-lobby-grid"><section class="p2p-panel"><h4>CREATE A ROOM</h4><label>Your display name<input id="p2pName" maxlength="20" value="'+esc(name)+'" placeholder="Your name"></label><label>Choose a game<select id="p2pGame">'+GAMES.map(g=>'<option value="'+g[0]+'" '+(g[0]===mode?"selected":"")+'>'+g[1]+' — '+g[2]+'</option>').join("")+'</select></label><button class="game-action primary" data-room="host">Create private room</button></section><section class="p2p-panel"><h4>JOIN A ROOM</h4><label>Your display name<input id="p2pJoinName" maxlength="20" value="'+esc(name)+'" placeholder="Your name"></label><label>Room code<input id="p2pCode" maxlength="8" autocomplete="off" autocapitalize="characters" placeholder="8-character code" value="'+esc(new URLSearchParams(location.hash.slice(1)).get("room")||"")+'"></label><button class="game-action primary" data-room="join">Join with code</button></section></div><div id="p2pStatus" class="result-banner">'+esc(message)+'</div><p class="p2p-footnote">No RinconCasino game server is used. PeerJS Cloud only brokers the WebRTC handshake; game traffic is peer-to-peer unless a network requires a TURN relay.</p>';
  }
  function render(){
    const game=GAMES.find(g=>g[0]===mode),mySide=isHost?0:1,view=state?getPublicRoomState(state,mySide):null;
    const text=!started?"Waiting for host to start…":state.over?(state.winner===null?"It's a draw.":state.winner===mySide?"You win!":"Your opponent wins."):(state.turn===mySide?"Your turn.":"Opponent's turn.");
    root.innerHTML='<div class="p2p-room-head"><div><small>ROOM CODE</small><strong>'+esc(roomCode)+'</strong></div><button class="button button-outline" data-room="copy">Copy invite</button></div><div class="p2p-room-meta"><span>'+esc(game?.[1]||"Game")+'</span><span>'+esc(name)+(isHost?" · HOST":"")+'</span><span>VS</span><span>'+esc(opponent)+(conn?.open?" · CONNECTED":" · WAITING")+'</span></div><div id="p2pStatus" class="result-banner">'+esc(text)+'</div>'+(started?'<div class="p2p-match"><div class="p2p-turn"><span>✕ / ● '+esc(name)+'</span><span>◯ / ○ '+esc(opponent)+'</span></div>'+boardHTML(view,mySide,selectedCell)+(state.over?'<button class="game-action primary" data-room="rematch" '+(!isHost?"disabled":"")+'>New match</button>':"")+'</div>':(isHost&&conn?.open?'<button class="game-action primary" data-room="start">Start match</button>':'<div class="p2p-waiting">Share the code with a friend. The host starts after they connect.</div>'))+'<section class="p2p-chat"><h4>ROOM CHAT</h4><div class="p2p-chat-log">'+chat.map(m=>'<div><b>'+esc(m.name)+'</b> '+esc(m.text)+'</div>').join("")+'</div><form id="p2pChatForm"><input id="p2pChatInput" maxlength="180" placeholder="Say something…" autocomplete="off"><button class="game-action secondary" type="submit">Send</button></form></section><button class="game-action secondary" data-room="leave">Leave room</button>';
  }
  function startMatch(){
    if(!isHost||!conn?.open)return;
    state=createRoomBoard(mode);selectedCell=null;started=true;send({type:"START",mode,state});render();
  }
  function hostMove(player,move){
    if(!isHost||!started||!conn?.open)return;
    const next=applyRoomMove(state,player,move);if(!next)return;
    state=next;selectedCell=null;send({type:"STATE",state});render();
  }
  function hostData(data){
    if(!data||typeof data!=="object")return;
    if(data.type==="HELLO"){
      opponent=String(data.name||"Guest").slice(0,20);
      send({type:"WELCOME",hostName:name,mode,started,state});render();
    }else if(data.type==="MOVE")hostMove(1,data.move);
    else if(data.type==="CHAT"){chat.push({name:opponent,text:String(data.text||"").slice(0,180)});chat=chat.slice(-30);render();}
    else if(data.type==="REMATCH")startMatch();
  }
  function guestData(data){
    if(!data||typeof data!=="object")return;
    if(data.type==="WELCOME"){opponent=String(data.hostName||"Host").slice(0,20);mode=data.mode||mode;started=!!data.started;state=data.state||null;render();}
    else if(data.type==="START"){mode=data.mode;state=data.state;started=true;render();}
    else if(data.type==="STATE"){state=data.state;render();}
    else if(data.type==="CHAT"){chat.push({name:opponent,text:String(data.text||"").slice(0,180)});chat=chat.slice(-30);render();}
    else if(data.type==="ROOM_CLOSED")status("The host closed this room.","loss");
  }
  function attach(connection,hostSide){
    conn=connection;
    conn.on("open",()=>{
      if(hostSide){opponent="Guest";send({type:"WELCOME",hostName:name,mode,started,state});render();}
      else send({type:"HELLO",name});
    });
    conn.on("data",data=>hostSide?hostData(data):guestData(data));
    conn.on("close",()=>{conn=null;opponent="Opponent";if(!disposed){if(hostSide)render();else status("The host disconnected.","loss");}});
    conn.on("error",error=>status("Connection error: "+(error?.message||"unknown"),"loss"));
  }
  async function create(){
    name=(root.querySelector("#p2pName")?.value||"Player").trim().slice(0,20)||"Player";
    mode=root.querySelector("#p2pGame")?.value||"ttt";roomCode=randomCode();isHost=true;disposed=false;
    status("Connecting to PeerJS Cloud…");
    try{
      const Peer=await loadPeer();if(disposed)return;
      peer=new Peer(roomId(),{debug:0});
      peer.on("open",()=>render());
      peer.on("connection",connection=>{if(conn?.open){connection.close();return;}attach(connection,true);});
      peer.on("error",error=>{
        if(error.type==="unavailable-id"){peer.destroy();peer=null;create();}
        else status("Room error: "+(error.message||error.type||"unknown"),"loss");
      });
    }catch(error){lobby(error.message);}
  }
  async function join(){
    name=(root.querySelector("#p2pJoinName")?.value||"Player").trim().slice(0,20)||"Player";
    roomCode=(root.querySelector("#p2pCode")?.value||"").replace(/[^A-Z0-9]/gi,"").toUpperCase();
    if(roomCode.length!==8){status("Enter the full 8-character room code.","loss");return;}
    isHost=false;disposed=false;status("Finding room "+roomCode+"…");
    try{
      const Peer=await loadPeer();if(disposed)return;
      peer=new Peer(undefined,{debug:0});
      peer.on("open",()=>attach(peer.connect(roomId(),{reliable:true}),false));
      peer.on("error",error=>status(error.type==="peer-unavailable"?"Room not found. Check the code and ask the host to keep the room open.":(error.message||error.type),"loss"));
    }catch(error){lobby(error.message);}
  }
  function leave(){
    if(isHost&&conn?.open)send({type:"ROOM_CLOSED"});
    disposed=true;try{conn?.close();peer?.destroy();}catch{}
    conn=null;peer=null;state=null;started=false;roomCode="";chat=[];lobby("You left the room.");
  }
  function click(e){
    const button=e.target.closest("[data-room],[data-cell],[data-col],[data-shot],[data-pit],[data-dot],[data-pile]");if(!button)return;
    const action=button.dataset.room;
    if(action==="host"){create();return;}if(action==="join"){join();return;}if(action==="start"){startMatch();return;}
    if(action==="copy"){
      if(navigator.clipboard?.writeText)navigator.clipboard.writeText(roomUrl()).then(()=>status("Invite link copied.")).catch(()=>status("Room code: "+roomCode));
      else status("Room code: "+roomCode);
      return;
    }
    if(action==="leave"){leave();return;}
    if(action==="rematch"){if(isHost)startMatch();else send({type:"REMATCH"});return;}
    if(!started||state?.over||state.turn!==(isHost?0:1))return;
    let move=null;
    const play=(action)=>{selectedCell=null;if(isHost)hostMove(0,action);else send({type:"MOVE",move:action});};
    if(state.mode==="ttt")move={i:Number(button.dataset.cell)};
    else if(state.mode==="connect4")move={c:Number(button.dataset.col)};
    else if(state.mode==="chess"||state.mode==="checkers"){
      const [r,c]=String(button.dataset.cell||"").split(",").map(Number),key=r+","+c;
      const board=state.mode==="chess"?state.position.board:state.board,piece=board[r]?.[c];
      const owned=state.mode==="chess"?(piece&&(isHost?piece===piece.toUpperCase():piece===piece.toLowerCase())):(isHost?(piece===1||piece===3):(piece===2||piece===4));
      const possible=state.mode==="chess"?getOnlineChessMoves(state.position):checkersMoves(state,isHost?0:1);
      if(!selectedCell){
        if(owned&&possible.some(m=>m.from.r===r&&m.from.c===c)){selectedCell=key;render();}
        return;
      }
      if(owned&&possible.some(m=>m.from.r===r&&m.from.c===c)){selectedCell=key;render();return;}
      const [fr,fc]=selectedCell.split(",").map(Number);play({from:{r:fr,c:fc},to:{r,c}});
    }else if(state.mode==="battleship"){
      const [r,c]=String(button.dataset.shot||"").split(",").map(Number);move={r,c};
    }else if(state.mode==="mancala")move={pit:Number(button.dataset.pit)};
    else if(state.mode==="nim")move={pile:Number(button.dataset.pile),count:Number(button.dataset.count)};
    else if(state.mode==="dots"){
      const [type,r,c]=String(button.dataset.dot||"").split(",");move={type,r:Number(r),c:Number(c)};
    }else if(state.mode==="reversi"||state.mode==="gomoku"){
      const [r,c]=String(button.dataset.cell||"").split(",").map(Number);move={r,c};
    }
    if(move)play(move);
  }
  function submit(e){
    if(e.target.id!=="p2pChatForm")return;e.preventDefault();
    const input=root.querySelector("#p2pChatInput"),text=String(input?.value||"").trim().slice(0,180);if(!text)return;
    chat.push({name,text});chat=chat.slice(-30);send({type:"CHAT",text});render();
  }
  root.addEventListener("click",click);root.addEventListener("submit",submit);lobby();
  return {
    destroy(){disposed=true;root.removeEventListener("click",click);root.removeEventListener("submit",submit);try{conn?.close();peer?.destroy();}catch{}},
    leave
  };
}
