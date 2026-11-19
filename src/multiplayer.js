const PEER_SCRIPT="https://cdn.jsdelivr.net/npm/peerjs@1.5.5/dist/peerjs.min.js";
const ROOM_PREFIX="rincon-";
const CODE_CHARS="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const GAMES=[["ttt","Tic-Tac-Toe","3×3 · first to three"],["connect4","Connect Four","7×6 · connect four"],["reversi","Reversi","8×8 · most discs wins"],["gomoku","Gomoku","15×15 · connect five"]];
const esc=value=>String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
let peerLoader;
function loadPeer(){
  if(window.Peer)return Promise.resolve(window.Peer);
  if(!peerLoader)peerLoader=new Promise((resolve,reject)=>{
    const script=document.createElement("script");script.src=PEER_SCRIPT;script.async=true;
    script.onload=()=>window.Peer?resolve(window.Peer):reject(new Error("PeerJS did not expose its browser API."));
    script.onerror=()=>reject(new Error("Could not load PeerJS. Check your internet connection."));
    document.head.appendChild(script);
  });
  return peerLoader;
}
function randomCode(){
  const bytes=new Uint8Array(8);crypto.getRandomValues(bytes);
  return Array.from(bytes,b=>CODE_CHARS[b%CODE_CHARS.length]).join("");
}
export function createRoomBoard(mode){
  if(mode==="ttt")return {mode,board:Array(9).fill(0),turn:0,over:false,winner:null};
  if(mode==="connect4")return {mode,board:Array.from({length:6},()=>Array(7).fill(0)),turn:0,over:false,winner:null};
  if(mode==="gomoku")return {mode,board:Array.from({length:15},()=>Array(15).fill(0)),turn:0,over:false,winner:null};
  const board=Array.from({length:8},()=>Array(8).fill(0));
  board[3][3]=2;board[3][4]=1;board[4][3]=1;board[4][4]=2;
  return {mode:"reversi",board,turn:0,over:false,winner:null,passes:0};
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
    next.turn=1-player;next.passes=0;
    if(!reversiLegal(b,next.turn+1).length){
      if(!reversiLegal(b,player+1).length)finishReversi(next);
      else {next.turn=player;next.passes=1;}
    }
    return next;
  }else return null;
  if(!next.over)next.turn=1-player;
  return next;
}
function boardHTML(s,player){
  if(!s)return "";
  const myTurn=!s.over&&s.turn===player,b=s.board;
  if(s.mode==="ttt")return '<div class="p2p-board p2p-ttt">'+b.map((v,i)=>'<button data-cell="'+i+'" '+(!myTurn||v?"disabled":"")+'>'+(v===1?"✕":v===2?"◯":"")+'</button>').join("")+'</div>';
  if(s.mode==="connect4")return '<div class="p2p-connect-wrap"><div class="p2p-connect-cols">'+Array.from({length:7},(_,c)=>'<button data-col="'+c+'" '+(!myTurn||b[0][c]?"disabled":"")+'>'+String.fromCharCode(65+c)+'</button>').join("")+'</div><div class="p2p-board p2p-connect">'+b.flat().map(v=>'<span class="p2p-disc '+(v===1?"one":v===2?"two":"")+'"></span>').join("")+'</div></div>';
  if(s.mode==="gomoku")return '<div class="p2p-gomoku-scroll"><div class="p2p-board p2p-gomoku">'+b.flatMap((row,r)=>row.map((v,c)=>'<button data-cell="'+r+','+c+'" '+(!myTurn||v?"disabled":"")+'>'+(v===1?"●":v===2?"○":"")+'</button>')).join("")+'</div></div>';
  const legal=reversiLegal(b,player+1);
  return '<div class="p2p-board p2p-reversi">'+b.flatMap((row,r)=>row.map((v,c)=>'<button data-cell="'+r+','+c+'" '+(!myTurn||v||!legal.some(m=>m.r===r&&m.c===c)?"disabled":"")+'>'+(v===1?"●":v===2?"○":"")+'</button>')).join("")+'</div>';
}
export function mountMultiplayerRooms(root,{defaultName=""}={}){
  let peer=null,conn=null,isHost=false,roomCode="",name=defaultName||"Player",opponent="Opponent",mode="ttt",state=null,started=false,disposed=false,chat=[];
  function send(message){if(conn?.open)conn.send(message);}
  function roomId(){return ROOM_PREFIX+roomCode.toLowerCase();}
  function roomUrl(){return location.origin+location.pathname+"#room="+roomCode;}
  function status(message,type=""){const el=root.querySelector("#p2pStatus");if(el){el.textContent=message;el.className="result-banner"+(type?" "+type:"");}}
  function lobby(message="Create a room or join a friend's room."){
    root.innerHTML='<div class="p2p-intro"><div class="game-icon-large">⌘</div><h3>Peer-to-peer rooms</h3><p>Invite one friend into a private head-to-head room. Moves and chat go over an encrypted WebRTC data channel; the host validates every move.</p></div><div class="p2p-lobby-grid"><section class="p2p-panel"><h4>CREATE A ROOM</h4><label>Your display name<input id="p2pName" maxlength="20" value="'+esc(name)+'" placeholder="Your name"></label><label>Choose a game<select id="p2pGame">'+GAMES.map(g=>'<option value="'+g[0]+'" '+(g[0]===mode?"selected":"")+'>'+g[1]+' — '+g[2]+'</option>').join("")+'</select></label><button class="game-action primary" data-room="host">Create private room</button></section><section class="p2p-panel"><h4>JOIN A ROOM</h4><label>Your display name<input id="p2pJoinName" maxlength="20" value="'+esc(name)+'" placeholder="Your name"></label><label>Room code<input id="p2pCode" maxlength="8" autocomplete="off" autocapitalize="characters" placeholder="8-character code" value="'+esc(new URLSearchParams(location.hash.slice(1)).get("room")||"")+'"></label><button class="game-action primary" data-room="join">Join with code</button></section></div><div id="p2pStatus" class="result-banner">'+esc(message)+'</div><p class="p2p-footnote">No RinconCasino game server is used. PeerJS Cloud only brokers the WebRTC handshake; game traffic is peer-to-peer unless a network requires a TURN relay.</p>';
  }
  function render(){
    const game=GAMES.find(g=>g[0]===mode),mySide=isHost?0:1;
    const text=!started?"Waiting for host to start…":state.over?(state.winner===null?"It's a draw.":state.winner===mySide?"You win!":"Your opponent wins."):(state.turn===mySide?"Your turn.":"Opponent's turn.");
    root.innerHTML='<div class="p2p-room-head"><div><small>ROOM CODE</small><strong>'+esc(roomCode)+'</strong></div><button class="button button-outline" data-room="copy">Copy invite</button></div><div class="p2p-room-meta"><span>'+esc(game?.[1]||"Game")+'</span><span>'+esc(name)+(isHost?" · HOST":"")+'</span><span>VS</span><span>'+esc(opponent)+(conn?.open?" · CONNECTED":" · WAITING")+'</span></div><div id="p2pStatus" class="result-banner">'+esc(text)+'</div>'+(started?'<div class="p2p-match"><div class="p2p-turn"><span>✕ / ● '+esc(name)+'</span><span>◯ / ○ '+esc(opponent)+'</span></div>'+boardHTML(state,mySide)+(state.over?'<button class="game-action primary" data-room="rematch" '+(!isHost?"disabled":"")+'>New match</button>':"")+'</div>':(isHost&&conn?.open?'<button class="game-action primary" data-room="start">Start match</button>':'<div class="p2p-waiting">Share the code with a friend. The host starts after they connect.</div>'))+'<section class="p2p-chat"><h4>ROOM CHAT</h4><div class="p2p-chat-log">'+chat.map(m=>'<div><b>'+esc(m.name)+'</b> '+esc(m.text)+'</div>').join("")+'</div><form id="p2pChatForm"><input id="p2pChatInput" maxlength="180" placeholder="Say something…" autocomplete="off"><button class="game-action secondary" type="submit">Send</button></form></section><button class="game-action secondary" data-room="leave">Leave room</button>';
  }
  function startMatch(){
    if(!isHost||!conn?.open)return;
    state=createRoomBoard(mode);started=true;send({type:"START",mode,state});render();
  }
  function hostMove(player,move){
    if(!isHost||!started||!conn?.open)return;
    const next=applyRoomMove(state,player,move);if(!next)return;
    state=next;send({type:"STATE",state});render();
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
    const button=e.target.closest("[data-room],[data-cell],[data-col]");if(!button)return;
    const action=button.dataset.room;
    if(action==="host"){create();return;}if(action==="join"){join();return;}if(action==="start"){startMatch();return;}
    if(action==="copy"){navigator.clipboard?.writeText(roomUrl()).then(()=>status("Invite link copied.")).catch(()=>status("Room code: "+roomCode));return;}
    if(action==="leave"){leave();return;}
    if(action==="rematch"){if(isHost)startMatch();else send({type:"REMATCH"});return;}
    if(!started||state?.over||state.turn!==(isHost?0:1))return;
    let move=null;
    if(state.mode==="ttt")move={i:Number(button.dataset.cell)};
    else if(state.mode==="connect4")move={c:Number(button.dataset.col)};
    else {const [r,c]=String(button.dataset.cell||"").split(",").map(Number);move={r,c};}
    if(isHost)hostMove(0,move);else send({type:"MOVE",move});
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
