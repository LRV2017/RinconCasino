import { gameCatalog } from "./catalog.js";
import { mountGame } from "./engines.js";
import { mountMultiplayerRooms } from "./multiplayer.js";
import { GitHubCloudSave } from "./github-cloud.js";

const $ = (selector,scope=document) => scope.querySelector(selector);
const $$ = (selector,scope=document) => Array.from(scope.querySelectorAll(selector));
const STORAGE = {
  balance:"rincon.play.credits.v2",
  favorites:"rincon.play.favorites.v2",
  history:"rincon.play.history.v2",
  bonus:"rincon.play.daily-bonus.v2",
  stats:"rincon.play.stats.v2",
  last:"rincon.play.last-game.v2"
};
const read = (key,fallback) => { try { const value=localStorage.getItem(key);return value===null?fallback:JSON.parse(value); } catch { return fallback; } };
const write = (key,value) => { try { localStorage.setItem(key,JSON.stringify(value)); } catch {} };
let balance=Number(read(STORAGE.balance,2500));
if(!Number.isFinite(balance)||balance<0)balance=2500;
let favorites=new Set(read(STORAGE.favorites,[]));
let history=read(STORAGE.history,[]);
let stats=read(STORAGE.stats,{played:0,wins:0,losses:0,net:0,biggestWin:0});
let activeCategory="All games",searchTerm="",sortMode="featured",favoritesOnly=false,popularOnly=false,botOnly=false;
let activeGame=null,gameSession=null,toastTimer=null;
let cloudUser=null,cloudSyncTimer=null,applyingCloud=false,cloudPendingData=null,roomSession=null;
const cloudSave=new GitHubCloudSave();
const BOT_GAME_MODES=new Set(["liars","ceelo","bunco","ship","pig","dice-poker","bingo-75","mancala","russian-roulette","demons-deal"]);
function isBotGame(game){return game.engine==="board"||game.engine==="poker"||BOT_GAME_MODES.has(game.mode);}

function fmt(n){return Math.floor(n).toLocaleString("en-US");}
function saveBalance(){write(STORAGE.balance,balance);}
function showToast(message){
  const el=$("#toast");el.textContent=message;el.classList.add("show");
  clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove("show"),2300);
}
function updateBalance(){
  $("#balanceTop").textContent=fmt(balance);
  $("#balanceGame").textContent=fmt(balance);
  saveBalance();
  queueCloudSave();
}
function updateCounts(){
  $("#favoriteCount").textContent=favorites.size;
  $("#gameCount").textContent=gameCatalog.length;
  $("#gameCountSide").textContent=gameCatalog.length;
  $("#metricGames").textContent=gameCatalog.length;
  $("#pageCount").textContent=gameCatalog.length+" playable entries";
}
const wallet={
  get balance(){return balance;},
  charge(amount){
    if(!Number.isInteger(amount)||amount<1||amount>balance)return false;
    balance-=amount;updateBalance();return true;
  },
  refund(amount){balance+=Math.max(0,Math.floor(Number(amount)||0));updateBalance();},
  settle(amount,payout,gameName){
    const gross=Math.max(0,Math.floor(Number(payout)||0));
    balance+=gross;stats.played++;const net=gross-amount;
    if(net>0){stats.wins++;stats.biggestWin=Math.max(stats.biggestWin,net);}
    else if(net<0)stats.losses++;
    stats.net+=net;
    const entry={game:gameName,net,message:net>0?"Win":net<0?"Loss":"Push",when:new Date().toISOString()};
    history.unshift(entry);history=history.slice(0,30);
    write(STORAGE.history,history);write(STORAGE.stats,stats);updateBalance();updateSessionAside();renderHistoryIfOpen();queueCloudSave();
  }
};
function toggleFavorite(id){
  if(favorites.has(id))favorites.delete(id);else favorites.add(id);
  write(STORAGE.favorites,Array.from(favorites));updateCounts();renderGrid();queueCloudSave();
}
function visibleGames(){
  let list=gameCatalog.slice();
  if(activeCategory!=="All games"&&activeCategory!=="Favorites")list=list.filter(g=>g.category===activeCategory);
  if(favoritesOnly||activeCategory==="Favorites")list=list.filter(g=>favorites.has(g.id));
  if(popularOnly)list=list.filter(g=>g.featured);
  if(botOnly)list=list.filter(isBotGame);
  if(searchTerm){const q=searchTerm.toLowerCase();list=list.filter(g=>(g.name+" "+g.category+" "+g.description+" "+g.tags.join(" ")).toLowerCase().includes(q));}
  if(sortMode==="az")list.sort((a,b)=>a.name.localeCompare(b.name));
  else if(sortMode==="new")list.sort((a,b)=>b.number-a.number);
  else list.sort((a,b)=>Number(b.featured)-Number(a.featured)||a.number-b.number);
  return list;
}
function renderCategories(){
  const categories=["All games",...Array.from(new Set(gameCatalog.map(g=>g.category)))];
  $("#categoryFilters").innerHTML=categories.map(name=>'<button class="category-button '+(activeCategory===name?"active":"")+'" data-category="'+name+'">'+name+' <span style="opacity:.55"> '+(name==="All games"?gameCatalog.length:gameCatalog.filter(g=>g.category===name).length)+'</span></button>').join("");
}
function cardMarkup(game){
  const isFav=favorites.has(game.id);
  return '<article class="game-card" data-card="'+game.id+'"><div class="game-card-top"><span class="game-category">'+game.category.toUpperCase()+'</span><span class="game-number">#'+String(game.number).padStart(3,"0")+'</span></div><button class="favorite-star '+(isFav?"active":"")+'" data-favorite="'+game.id+'" aria-label="'+(isFav?"Remove from":"Add to")+' favorites">'+(isFav?"★":"☆")+'</button><div class="game-card-art">'+game.icon+'</div><h3>'+game.name+'</h3><p>'+game.description+'</p><div class="game-card-bottom"><small>'+(isBotGame(game)?"VS LOCAL BOTS":game.kind==="table"?"TABLE GAME":"ARCADE")+'</small><button class="play-card" data-play="'+game.id+'">PLAY ↗</button></div></article>';
}
function renderGrid(){
  const list=visibleGames();
  $("#gameGrid").innerHTML=list.map(cardMarkup).join("");
  $("#emptyState").hidden=list.length>0;
  $("#gameGrid").hidden=list.length===0;
  $("#resultsLabel").textContent="Showing "+list.length+" of "+gameCatalog.length+" games";
  renderCategories();
}
function updateFeatured(){
  const selections=["blackjack-01","roulette-01","poker-01","slots-01","board-03","dice-01"];
  $("#featuredGrid").innerHTML=selections.map(id=>gameCatalog.find(g=>g.id===id)).filter(Boolean).slice(0,3).map(g=>'<button class="featured-card" data-play="'+g.id+'"><small>'+g.category.toUpperCase()+'</small><strong>'+g.name+'</strong><span>'+g.description+'</span><b class="featured-icon">'+g.icon+'</b></button>').join("");
}
function openGame(id){
  const game=gameCatalog.find(g=>g.id===id);if(!game)return;
  if(gameSession){try{gameSession.close();gameSession.destroy();}catch{}}
  activeGame=game;write(STORAGE.last,id);
  $("#gameTitle").textContent=game.name;
  $("#gameCategory").textContent=game.category.toUpperCase();
  $("#asideType").textContent=game.category;
  $("#asideMode").textContent=isBotGame(game)?"Local bot match":"Solo table";
  $("#rulesPanel").textContent=game.rules;
  $("#rulesPanel").hidden=true;
  $("#rulesToggle").textContent="Rules & payouts ⓘ";
  $("#gameOverlay").classList.add("open");
  $("#gameOverlay").setAttribute("aria-hidden","false");
  document.body.style.overflow="hidden";
  $("#gameRoot").innerHTML='<div class="result-banner">Loading table…</div>';
  gameSession=mountGame(game,$("#gameRoot"),wallet);
  updateBalance();updateSessionAside();
}
function closeGame(){
  if(gameSession){try{gameSession.close();gameSession.destroy();}catch{}gameSession=null;}
  activeGame=null;$("#gameOverlay").classList.remove("open");$("#gameOverlay").setAttribute("aria-hidden","true");document.body.style.overflow="";
  updateBalance();renderGrid();
}
function updateSessionAside(){
  const s=history.slice(0,5);
  $("#sessionNet").textContent=(stats.net>=0?"+":"−")+fmt(Math.abs(stats.net))+" CR";
  $("#sessionHistory").innerHTML=s.length?s.map(h=>'<div class="session-history-item"><span>'+escapeHTML(h.game)+'</span><b style="color:'+(h.net>0?"#bfdc92":h.net<0?"#df9d8f":"#d8bd7c")+'">'+(h.net>0?"+":"")+fmt(h.net)+'</b></div>').join(""):"Your results will appear here.";
}
function escapeHTML(value){return String(value).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function renderHistoryIfOpen(){
  if($("#modalTitle").textContent==="Recent games")showHistory();
}
function openModal(title,html,actions){
  if(roomSession){roomSession.destroy();roomSession=null;}
  $("#modalTitle").textContent=title;$("#modalBody").innerHTML=html;$("#modalActions").innerHTML=actions||"";$("#modalBackdrop").classList.add("open");$("#modalBackdrop").setAttribute("aria-hidden","false");
}
function closeModal(){if(roomSession){roomSession.destroy();roomSession=null;}$("#modalBackdrop").classList.remove("open");$("#modalBackdrop").setAttribute("aria-hidden","true");}

function cloudPayload(){
  return {balance,favorites:Array.from(favorites),history,stats,last:read(STORAGE.last,null)};
}
function applyCloudPayload(data){
  if(!data||typeof data!=="object")throw new Error("The GitHub save file is not valid.");
  applyingCloud=true;
  try{
    const nextBalance=Number(data.balance);
    if(Number.isFinite(nextBalance)&&nextBalance>=0)balance=nextBalance;
    if(Array.isArray(data.favorites))favorites=new Set(data.favorites.filter(x=>typeof x==="string"));
    if(Array.isArray(data.history))history=data.history.slice(0,30);
    if(data.stats&&typeof data.stats==="object")stats={played:0,wins:0,losses:0,net:0,biggestWin:0,...data.stats};
    write(STORAGE.balance,balance);write(STORAGE.favorites,Array.from(favorites));write(STORAGE.history,history);write(STORAGE.stats,stats);
    if(typeof data.last==="string")write(STORAGE.last,data.last);
    updateCounts();updateBalance();renderGrid();updateSessionAside();
  }finally{applyingCloud=false;}
}
function queueCloudSave(){
  if(!cloudUser||applyingCloud)return;
  clearTimeout(cloudSyncTimer);
  cloudSyncTimer=setTimeout(()=>syncCloudNow().catch(error=>showToast("GitHub save failed: "+error.message)),1200);
}
async function syncCloudNow(){
  if(!cloudUser)return;
  await cloudSave.save(cloudPayload());
  const status=$("#githubSyncStatus");
  if(status)status.textContent="Saved to your GitHub secret Gist just now.";
}
function updateProfileButton(){
  const button=$("#profileBtn");
  if(button){button.textContent=cloudUser?String(cloudUser.login||"R").charAt(0).toUpperCase():"R";button.title=cloudUser?"Connected to GitHub as "+cloudUser.login:"Connect GitHub";}
}
function showCloudChoice(data){
  cloudPendingData=data;
  openModal("GitHub save found",'<p>A secret (unlisted) Rincon Casino save already exists on GitHub.</p><p>Choose which copy should become active on this device. Loading the cloud copy replaces the local balance, favorites, history and stats.</p><p class="aside-muted">Signed in as '+escapeHTML(cloudUser.login)+'.</p>','<button class="button button-gold" id="githubLoadSave">Load cloud save</button><button class="button button-outline" id="githubKeepLocal">Keep this browser and upload it</button>');
}
function showProfile(message=""){
  if(cloudUser){
    openModal("GitHub player account",'<div class="github-account"><div class="github-avatar">'+escapeHTML(String(cloudUser.login||"R").charAt(0).toUpperCase())+'</div><div><strong>'+escapeHTML(cloudUser.login)+'</strong><p>Connected to GitHub. Your Rincon save is stored in a secret (unlisted) Gist, not in the source repository. Anyone with its URL can read it; do not store sensitive information.</p></div></div><p id="githubSyncStatus">'+escapeHTML(message||"Cloud sync is enabled for this browser session.")+'</p><p class="aside-muted">Your access token stays in this tab&#39;s session storage. You may need to reconnect after closing the tab. Sign out here to clear it from this browser session.</p>','<button class="button button-gold" id="githubSaveNow">Save to GitHub now</button><button class="button button-outline" id="githubSignOut">Sign out</button>');
    return;
  }
  openModal("Connect your GitHub account",'<p>Connect GitHub to keep your credits, favorites, game history and statistics in a secret (unlisted) Gist associated with your account. Anyone with its URL can read it; do not store sensitive information.</p><p><a href="https://github.com/settings/tokens/new?scopes=gist,read:user&description=Rincon%20Casino" target="_blank" rel="noopener">Create a classic personal access token on GitHub ↗</a></p><p>Enable only <strong>gist</strong> and <strong>read:user</strong>. Do not give Rincon access to your repositories.</p><label class="github-token-label">Paste the token<input id="githubToken" type="password" autocomplete="off" spellcheck="false" placeholder="github_pat_… or ghp_…"></label><p class="aside-muted">The token is kept in this tab&#39;s session storage and is never written to the Gist or this repository. Any browser script running on this site could access it, so revoke the token in GitHub settings when you no longer use this browser session.</p>'+ (message?'<div class="result-banner loss">'+escapeHTML(message)+'</div>':""),'<button class="button button-gold" id="githubConnect">Connect & load save</button>');
}
async function connectGitHub(){
  const token=$("#githubToken")?.value||"";
  try{
    cloudUser=await cloudSave.signIn(token);updateProfileButton();
    const remote=await cloudSave.load();
    if(remote){showCloudChoice(remote);return;}
    await syncCloudNow();showProfile("Connected. A new secret (unlisted) Gist has been created for your Rincon save.");
  }catch(error){showProfile(error.message);}
}
async function restoreGitHubSession(){
  let user;
  try{user=await cloudSave.restore();}catch(error){showToast("GitHub connection unavailable: "+error.message);return;}
  if(!user)return;
  cloudUser=user;updateProfileButton();
  try{
    const remote=await cloudSave.load();
    if(remote)applyCloudPayload(remote);else await syncCloudNow();
  }catch(error){showToast("GitHub sync issue: "+error.message);}
}
function openRooms(){
  openModal("Online multiplayer rooms",'<div id="multiplayerRoomRoot"></div>');
  roomSession=mountMultiplayerRooms($("#multiplayerRoomRoot"),{defaultName:cloudUser?.login||""});
}

function showHistory(){
  const rows=history.length?history.map(h=>'<li><strong>'+escapeHTML(h.game)+'</strong><span>'+new Date(h.when).toLocaleDateString()+" · "+(h.net>0?"+" :"")+fmt(h.net)+" CR</span></li>").join(""):'<li>No games played yet.</li>';
  openModal("Recent games",'<p>Your latest local game results.</p><ul class="modal-list">'+rows+'</ul>');
}
function showStats(){
  openModal("My statistics",'<div class="stats-modal-grid"><div><small>GAMES PLAYED</small><strong>'+stats.played+'</strong></div><div><small>WINS</small><strong>'+stats.wins+'</strong></div><div><small>LOSSES</small><strong>'+stats.losses+'</strong></div><div><small>NET RESULT</small><strong>'+(stats.net>0?"+":"")+fmt(stats.net)+' CR</strong></div><div><small>BEST NET WIN</small><strong>+'+fmt(stats.biggestWin)+' CR</strong></div><div><small>FAVORITES</small><strong>'+favorites.size+'</strong></div></div><p>Statistics are stored only in this browser. Clearing your browser data resets them.</p>');
}
function showAchievements(){
  const achievements=[
    ["First steps","Play your first game",stats.played>=1],
    ["Regular at the tables","Play 10 games",stats.played>=10],
    ["House favorite","Save 5 games to favorites",favorites.size>=5],
    ["Table explorer","Play 5 different games",new Set(history.map(h=>h.game)).size>=5],
    ["Big moment","Win 500 credits in a single game",stats.biggestWin>=500],
    ["On a streak","Record 10 wins",stats.wins>=10]
  ];
  openModal("Achievements",'<p>Milestones unlock as you explore Rincon.</p><div class="achievement-list">'+achievements.map(a=>'<div class="achievement-item '+(a[2]?"unlocked":"")+'"><span>'+(a[2]?"✦":"◇")+'</span><div><strong>'+a[0]+'</strong><small>'+a[1]+'</small></div><b>'+(a[2]?"UNLOCKED":"LOCKED")+'</b></div>').join("")+'</div>');
}
function showHow(){
  openModal("How Rincon works",'<p>Rincon is a local, free-to-play collection. Every game uses fictional credits stored in your browser.</p><ul><li>Choose any title from the 240-entry catalog.</li><li>Read the rules panel before starting a table.</li><li>Games with opponents use local computer players. Strategy games include game-specific move selection and search; poker bots use hand strength and pot-odds decisions.</li><li>There are no deposits, payments, prizes, withdrawals or cash value.</li><li>Online accounts, live rooms and player-vs-player networking are not enabled in this release. The game UI and local match boundaries are kept separate so a server-authoritative multiplayer layer can be added later.</li></ul>');
}
function topUpDaily(){
  const today=new Date().toISOString().slice(0,10),claimed=read(STORAGE.bonus,"");
  if(claimed===today){showToast("Your daily bonus has already been claimed.");return;}
  balance+=250;write(STORAGE.bonus,today);updateBalance();showToast("Daily bonus: +250 fictional credits.");
}
function setCategory(name){
  activeCategory=name;favoritesOnly=name==="Favorites";popularOnly=false;botOnly=false;renderGrid();$("#games").scrollIntoView({behavior:"smooth",block:"start"});
}
$("#searchInput").addEventListener("input",e=>{searchTerm=e.target.value;renderGrid();});
$("#sortSelect").addEventListener("change",e=>{sortMode=e.target.value;renderGrid();});
$("#categoryFilters").addEventListener("click",e=>{const b=e.target.closest("[data-category]");if(b){favoritesOnly=false;activeCategory=b.dataset.category;renderGrid();}});
$("#gameGrid").addEventListener("click",e=>{
  const fav=e.target.closest("[data-favorite]");if(fav){e.stopPropagation();toggleFavorite(fav.dataset.favorite);return;}
  const play=e.target.closest("[data-play]");if(play){openGame(play.dataset.play);return;}
  const card=e.target.closest("[data-card]");if(card)openGame(card.dataset.card);
});
$("#featuredGrid").addEventListener("click",e=>{const b=e.target.closest("[data-play]");if(b)openGame(b.dataset.play);});
$("#categoryFilters").addEventListener("click",()=>{favoritesOnly=activeCategory==="Favorites";});
$("#favoritesNav").addEventListener("click",()=>setCategory("Favorites"));
$("#clearFilters").addEventListener("click",()=>resetFilters());
$("#emptyReset").addEventListener("click",()=>resetFilters());
function resetFilters(){activeCategory="All games";searchTerm="";favoritesOnly=false;popularOnly=false;botOnly=false;$("#searchInput").value="";renderGrid();}
$("[data-quick]").forEach(button=>button.addEventListener("click",()=>{
  const mode=button.dataset.quick;
  if(mode==="rooms"){openRooms();return;}
  activeCategory="All games";favoritesOnly=false;popularOnly=mode==="popular";botOnly=mode==="bots";
  if(mode==="table")activeCategory="Blackjack";
  $("#searchInput").value="";searchTerm="";renderGrid();$("#games").scrollIntoView({behavior:"smooth"});
}));
$("#dailyBtn").addEventListener("click",topUpDaily);
$("#continueBtn").addEventListener("click",()=>{const id=read(STORAGE.last,"blackjack-01");openGame(id);});
$("#profileBtn").addEventListener("click",()=>showProfile());
$("#roomsBtn").addEventListener("click",openRooms);
$("#modalActions").addEventListener("click",e=>{
  if(e.target.closest("#resetLocal")){if(!confirm("Reset your Rincon credits, history, favorites and statistics on this browser?"))return;Object.values(STORAGE).forEach(k=>localStorage.removeItem(k));balance=2500;favorites=new Set();history=[];stats={played:0,wins:0,losses:0,net:0,biggestWin:0};updateBalance();updateCounts();renderGrid();closeModal();showToast("Local Rincon data reset.");}
  if(e.target.closest("#githubConnect")){connectGitHub();return;}
  if(e.target.closest("#githubLoadSave")){if(cloudPendingData){applyCloudPayload(cloudPendingData);cloudPendingData=null;syncCloudNow().then(()=>showProfile("Cloud save restored and synced.")).catch(error=>showToast(error.message));}return;}
  if(e.target.closest("#githubKeepLocal")){cloudPendingData=null;syncCloudNow().then(()=>showProfile("This browser's save was uploaded to GitHub.")).catch(error=>showProfile(error.message));return;}
  if(e.target.closest("#githubSaveNow")){syncCloudNow().then(()=>showProfile("Saved to your secret GitHub Gist.")).catch(error=>showProfile(error.message));return;}
  if(e.target.closest("#githubSignOut")){cloudSave.signOut();cloudUser=null;updateProfileButton();showProfile("Signed out. Your secret GitHub Gist remains untouched.");return;}
});
$("#achievementsBtn").addEventListener("click",showAchievements);
$("#statsBtn").addEventListener("click",showStats);
$("#historyBtn").addEventListener("click",showHistory);
$("#howBtn").addEventListener("click",showHow);
$("#closeGame").addEventListener("click",closeGame);
$("#exitGame").addEventListener("click",closeGame);
$("#gameOverlay").addEventListener("click",e=>{if(e.target===$("#gameOverlay"))closeGame();});
$("#rulesToggle").addEventListener("click",()=>{
  const panel=$("#rulesPanel");panel.hidden=!panel.hidden;$("#rulesToggle").textContent=panel.hidden?"Rules & payouts ⓘ":"Hide rules ↑";
});
$("#modalClose").addEventListener("click",closeModal);
$("#modalBackdrop").addEventListener("click",e=>{if(e.target===$("#modalBackdrop"))closeModal();});
document.addEventListener("keydown",e=>{
  if(e.key==="Escape"){if($("#modalBackdrop").classList.contains("open"))closeModal();else if($("#gameOverlay").classList.contains("open"))closeGame();}
  if(e.key==="/"&&!$("#gameOverlay").classList.contains("open")&&document.activeElement.tagName!=="INPUT"){$("#searchInput").focus();e.preventDefault();}
});

function updateDeviceHint(){document.body.classList.toggle("rincon-mobile",window.matchMedia("(max-width:760px)").matches||(navigator.maxTouchPoints>0&&window.innerWidth<900));}updateDeviceHint();window.addEventListener("resize",updateDeviceHint,{passive:true});const mobileNav=document.createElement("nav");mobileNav.className="rincon-mobile-nav";mobileNav.setAttribute("aria-label","Mobile navigation");mobileNav.innerHTML='<button data-mobile-nav="lobby"><span>⌂</span>Lobby</button><button data-mobile-nav="games"><span>▦</span>Games</button><button data-mobile-nav="rooms"><span>⌘</span>Rooms</button><button data-mobile-nav="favorites"><span>☆</span>Saved</button><button data-mobile-nav="bonus"><span>◈</span>Bonus</button>';document.body.appendChild(mobileNav);mobileNav.addEventListener("click",e=>{const b=e.target.closest("[data-mobile-nav]");if(!b)return;const a=b.dataset.mobileNav;if(a==="lobby")$("#lobby").scrollIntoView({behavior:"smooth"});if(a==="games")$("#games").scrollIntoView({behavior:"smooth"});if(a==="rooms")openRooms();if(a==="favorites")setCategory("Favorites");if(a==="bonus")topUpDaily();});
renderCategories();renderGrid();updateFeatured();updateCounts();updateBalance();updateSessionAside();updateProfileButton();restoreGitHubSession();
