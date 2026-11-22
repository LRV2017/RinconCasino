import { Chess } from "https://cdn.jsdelivr.net/npm/chess.js@1.4.0/+esm";
import { POWER_CATALOG, POWER_COUNT, POWER_UNIVERSES, POWER_ARCHETYPES, POWER_MECHANICS, getPowerById, rollPowerChoices } from "./power-bank.js";
import { PeerRoom } from "./peer-room.js";
import { cloudConfigured, cloudGetSession, cloudOnAuthStateChange, cloudSignUp, cloudSignIn, cloudSignOut, cloudSendPasswordReset, cloudLoadSave, cloudWriteSave } from "./cloud.js";

const PROFILE_KEY = "rogueboard.profile.v1";
const PUZZLE_FEN = "7k/5Q2/6K1/8/8/8/8/8 w - - 0 1";
const PIECES = {
  w: { k: "♔", q: "♕", r: "♖", b: "♗", n: "♘", p: "♙" },
  b: { k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟" }
};
const VALUES = { p: 100, n: 315, b: 330, r: 500, q: 900, k: 0 };
const RANKS = [
  { name: "ROOKIE", min: 0, color: "#9aa69d" },
  { name: "BRONZE", min: 1100, color: "#c68c5b" },
  { name: "SILVER", min: 1250, color: "#c5d2d2" },
  { name: "GOLD", min: 1450, color: "#e4c65e" },
  { name: "DIAMOND", min: 1700, color: "#87d8ef" },
  { name: "MASTER", min: 2000, color: "#b49cff" }
];
const POWERS = [
  { id: "rocket", name: "ROCKET", icon: "🚀", cost: 3, desc: "Blast an enemy piece within 2 squares." },
  { id: "teleport", name: "BLINK", icon: "🌀", cost: 3, desc: "Warp one of your pieces to any square." },
  { id: "freeze", name: "FREEZE", icon: "❄", cost: 2, desc: "Lock one enemy piece for their next turn." },
  { id: "shield", name: "SHIELD", icon: "⬡", cost: 2, desc: "Protect one friendly piece from a capture." },
  { id: "sniper", name: "SNIPER", icon: "⌖", cost: 4, desc: "Shoot a piece along a clear line." },
  { id: "swap", name: "SWAP", icon: "⇄", cost: 3, desc: "Switch the positions of two friendly pieces." },
  { id: "haste", name: "DOUBLE TIME", icon: "⏱", cost: 4, desc: "Take two moves before your opponent." }
];
const SKINS = [
  { id: "standard", name: "FIELD ISSUE", price: 0, desc: "The original arena. Clean, cold, and ready.", light: "#c9cbb0", dark: "#607263" },
  { id: "obsidian", name: "OBSIDIAN", price: 250, desc: "Steel grey tiles for a colder kind of victory.", light: "#989c9a", dark: "#3e4544" },
  { id: "ember", name: "EMBERFALL", price: 350, desc: "Burnt oak and ash. Leave nothing standing.", light: "#d4ac83", dark: "#674235" },
  { id: "emerald", name: "VERDANT", price: 450, desc: "Deep forest green with pale stone.", light: "#bdd0b9", dark: "#315d4d" },
  { id: "royal", name: "ROYAL STATIC", price: 600, desc: "Violet marble for players above the rules.", light: "#d4c7e3", dark: "#514766" }
];
const PIECE_SKINS = [
  { id: "classic", name: "IVORY STANDARD", price: 0, desc: "The original carved chessmen.", white: "#fffdf0", black: "#242a28" },
  { id: "neon", name: "NEON CIRCUIT", price: 300, desc: "Electric cyan and ultraviolet.", white: "#d1ffff", black: "#252cbd" },
  { id: "ember", name: "EMBER FORGED", price: 400, desc: "Hot metal, ash, and molten orange.", white: "#ffe2bd", black: "#7e321b" },
  { id: "royal", name: "ROYAL RELICS", price: 550, desc: "Gilded ivory against deep amethyst.", white: "#fff0b8", black: "#4a2b76" },
  { id: "void", name: "VOID GLASS", price: 700, desc: "Cold silver and near-black glass.", white: "#e5ecf4", black: "#303840" }
];
const EMOTES = [
  { id: "gg", name: "GOOD GAME", icon: "🤝", price: 0 },
  { id: "salute", name: "SALUTE", icon: "🫡", price: 100 },
  { id: "laugh", name: "CACKLE", icon: "😂", price: 150 },
  { id: "fire", name: "ON FIRE", icon: "🔥", price: 200 },
  { id: "crown", name: "CROWN", icon: "👑", price: 250 },
  { id: "shock", name: "NO WAY", icon: "😱", price: 300 },
  { id: "sleep", name: "TOO EASY", icon: "😴", price: 350 },
  { id: "heart", name: "RESPECT", icon: "💚", price: 400 }
];
const DAILY_QUESTS = [
  { id: "play", title: "SHOW UP", icon: "♟", desc: "Finish any match today.", goal: 1, reward: 100, key: "matches" },
  { id: "capture", title: "TAKE WHAT'S YOURS", icon: "⚔", desc: "Capture 4 enemy pieces.", goal: 4, reward: 125, key: "captures" },
  { id: "win", title: "NO MERCY", icon: "✦", desc: "Win a match against the bot.", goal: 1, reward: 175, key: "wins" }
];
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
const todayKey = () => new Date().toISOString().slice(0, 10);
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const opposite = color => color === "w" ? "b" : "w";
const escapeHTML = value => String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));

function makeProfile() {
  return {
    name: "ROOKIE",
    xp: 0,
    credits: 450,
    rating: 1000,
    wins: 0,
    losses: 0,
    draws: 0,
    matches: 0,
    captures: 0,
    streak: 0,
    bestStreak: 0,
    unlockedSkins: ["standard"],
    equippedSkin: "standard",
    unlockedPieces: ["classic"],
    equippedPieces: "classic",
    unlockedEmotes: ["gg"],
    equippedEmote: "gg",
    daily: { date: todayKey(), matches: 0, captures: 0, wins: 0, claimed: [] },
    sound: true
  };
}
function loadProfile() {
  try {
    const saved = JSON.parse(localStorage.getItem(PROFILE_KEY) || "null");
    if (!saved || typeof saved !== "object") return makeProfile();
    const base = makeProfile();
    const merged = Object.assign(base, saved);
    if (!merged.daily || merged.daily.date !== todayKey()) merged.daily = { date: todayKey(), matches: 0, captures: 0, wins: 0, claimed: [] };
    if (!Array.isArray(merged.unlockedSkins)) merged.unlockedSkins = ["standard"];
    if (!merged.unlockedSkins.includes("standard")) merged.unlockedSkins.unshift("standard");
    if (!Array.isArray(merged.unlockedPieces)) merged.unlockedPieces = ["classic"];
    if (!merged.unlockedPieces.includes("classic")) merged.unlockedPieces.unshift("classic");
    if (!Array.isArray(merged.unlockedEmotes)) merged.unlockedEmotes = ["gg"];
    if (!merged.unlockedEmotes.includes("gg")) merged.unlockedEmotes.unshift("gg");
    if (!merged.daily.claimed) merged.daily.claimed = [];
    return merged;
  } catch (error) {
    return makeProfile();
  }
}
let profile = loadProfile();
let currentView = "home";
let selectedMode = "chaos";
let selectedOpponent = "bot";
let selectedDifficulty = "steady";
let chess = null;
let matchMode = "chaos";
let opponent = "bot";
let difficulty = "steady";
let gameOver = false;
let botThinking = false;
let puzzleActive = false;
let puzzleSolved = false;
let selectedSquare = null;
let pendingPower = null;
let energy = { w: 5, b: 5 };
let frozen = { w: {}, b: {} };
let shielded = { w: {}, b: {} };
let doubleMoves = 0;
let boardFlipped = false;
let actionLog = [];
let gameCaptures = 0;
let lastResult = null;
let activeSkin = profile.equippedSkin || "standard";
let resultModalVisible = false;
let activePowers = { w: null, b: null };
let powerLocked = { w: false, b: false };
let draftChoices = [];
let draftSelection = null;
let draftContext = null;
let draftRerolls = 0;
let net = { role: null, connected: false, phase: "idle", roomCode: "", status: "Create a room or join a friend.", remoteName: "OPPONENT", myPower: null, remotePower: null };
let peerRoom = null;
let handlingRemote = false;
let cloudState = { user: null, status: cloudConfigured ? "CONNECTING TO CLOUD…" : "CLOUD NOT CONFIGURED", sync: "local", lastSync: null, error: "", ready: false };
let cloudConflict = null;
let cloudSaveTimer = null;
let cloudHydratingUserId = null;
let cloudLoadedUserId = null;
let cloudAuthSubscription = null;

function saveProfile() {
  try { localStorage.setItem(PROFILE_KEY, JSON.stringify(profile)); } catch (error) { toast("Could not save this profile in your browser.", "error"); }
  syncChrome();
  scheduleCloudSave();
}
function levelInfo() {
  const level = Math.floor(profile.xp / 400) + 1;
  return { level, current: profile.xp % 400, next: 400, percent: (profile.xp % 400) / 4 };
}
function currentRank() {
  let rank = RANKS[0];
  RANKS.forEach(item => { if (profile.rating >= item.min) rank = item; });
  return rank;
}
function rankProgress() {
  const index = RANKS.findIndex(item => item.name === currentRank().name);
  const current = currentRank();
  const next = RANKS[Math.min(index + 1, RANKS.length - 1)];
  if (index === RANKS.length - 1) return { percent: 100, next: "MAX RANK", remaining: 0 };
  return {
    percent: clamp(((profile.rating - current.min) / (next.min - current.min)) * 100, 0, 100),
    next: next.name,
    remaining: Math.max(0, next.min - profile.rating)
  };
}
function syncChrome() {
  const name = (profile.name || "ROOKIE").toUpperCase();
  const rank = currentRank().name;
  $("#side-name").textContent = name;
  $("#side-rank").textContent = rank + " · LVL " + levelInfo().level;
  $("#top-coins").textContent = profile.credits.toLocaleString();
  $("#top-avatar").textContent = name.slice(0, 1);
  const saveStatus = $("#save-status");
  const saveDot = $("#save-status-dot");
  if (saveStatus) saveStatus.textContent = cloudState.user ? (cloudState.sync === "saving" ? "SYNCING CLOUD SAVE…" : cloudState.sync === "error" ? "CLOUD SYNC ISSUE" : "CLOUD SAVE CONNECTED") : "LOCAL PROFILE SAVED";
  if (saveDot) saveDot.style.background = cloudState.user && cloudState.sync === "saved" ? "#d8ff3f" : cloudState.user && cloudState.sync === "error" ? "#ff8758" : "#84918b";
  $$(".nav-item").forEach(button => button.classList.toggle("active", button.dataset.view === currentView));
  const titles = { home: "THE ARENA", play: "CHOOSE YOUR FIGHT", practice: "TRAINING LAB", armory: "THE ARMORY", quests: "DAILY CONTRACTS", rank: "SEASON 01", profile: "PLAYER PROFILE", account: "ACCOUNT & CLOUD SAVES", match: "LIVE MATCH", online: "PEER-TO-PEER ROOMS", draft: "POWER ROLL / SELECT ONE" };
  $("#top-section").textContent = titles[currentView] || "THE ARENA";
}
function toast(message, type = "success") {
  const stack = $("#toast-stack");
  const item = document.createElement("div");
  item.className = "toast" + (type === "error" ? " error" : "");
  item.textContent = message;
  stack.appendChild(item);
  window.setTimeout(() => item.remove(), 3000);
}
function heading(label, title, copy, extra = "") {
  return '<div class="page-heading"><div><div class="eyebrow">' + label + '</div><h1>' + title + '</h1><p>' + copy + '</p></div>' + extra + '</div>';
}
function miniBoardHTML() {
  const setup = [
    ["♜","♞","♝","♛","♚","♝","♞","♜"],
    ["♟","♟","♟","♟","♟","♟","♟","♟"],
    ["","","","","","","",""],
    ["","","","♞","","","",""],
    ["","","","♙","","","",""],
    ["","","","","","","",""],
    ["♙","♙","♙","♙","♙","♙","♙","♙"],
    ["♖","♘","♗","♕","♔","♗","♘","♖"]
  ];
  let html = "";
  setup.forEach((row, r) => row.forEach((piece, c) => {
    html += '<div class="hero-tile ' + ((r + c) % 2 ? "dark" : "light") + '">' + (piece ? '<span class="hero-piece">' + piece + '</span>' : "") + '</div>';
  }));
  return html;
}

function renderHome() {
  const rank = currentRank();
  const level = levelInfo();
  return '<section class="home-hero">' +
    '<div class="hero-copy"><div class="eyebrow">THE RULEBOOK IS OPTIONAL</div><h1>GOOD CHESS.<span>BAD INTENTIONS.</span></h1><p>Forget opening theory. Bring a rocket launcher. Teleport your queen. Freeze the entire board. This is chess with the safety off.</p><div class="hero-actions"><button class="btn btn-primary" data-action="go-play">ENTER THE ARENA <span>↗</span></button><span class="hero-note"><span>●</span> YOUR PROGRESS SAVES ON THIS DEVICE</span></div></div>' +
    '<div class="hero-art"><div class="hero-glow"></div><div class="hero-board">' + miniBoardHTML() + '</div><span class="hero-coordinate top">E4 // NO RULES</span><span class="hero-coordinate bottom">8 × 8 // CHAOS ENGINE</span><span class="hero-sticker">CHECKMATE IS A SUGGESTION.</span></div>' +
    '</section>' +
    '<div class="home-grid"><div>' +
      '<div class="stats-row">' +
        '<div class="stat-card"><div class="stat-top">MATCHES <span class="stat-icon">♟</span></div><div class="stat-value">' + profile.matches + '</div><div class="stat-foot">YOUR ARENA RECORD</div></div>' +
        '<div class="stat-card"><div class="stat-top">WIN RATE <span class="stat-icon">↗</span></div><div class="stat-value">' + (profile.matches ? Math.round(profile.wins / profile.matches * 100) : 0) + '<small style="font:14px var(--mono)">%</small></div><div class="stat-foot"><b>' + profile.wins + ' W</b> · ' + profile.losses + ' L · ' + profile.draws + ' D</div></div>' +
        '<div class="stat-card"><div class="stat-top">RATING <span class="stat-icon">◈</span></div><div class="stat-value">' + profile.rating + '</div><div class="stat-foot">' + rank.name + ' DIVISION</div></div>' +
        '<div class="stat-card"><div class="stat-top">PLAYER LEVEL <span class="stat-icon">✦</span></div><div class="stat-value">' + level.level + '</div><div class="stat-foot">' + level.current + ' / 400 XP TO NEXT</div></div>' +
      '</div>' +
      '<section class="panel section-gap"><div class="panel-heading"><h3>CHOOSE YOUR RULESET</h3><button class="ghost-link" data-view="play">ALL MODES ↗</button></div><div class="quick-modes">' +
        '<button class="mode-card" data-watermark="!" data-action="quick-chaos"><span class="mode-tag">01 / THE MAIN EVENT</span><strong>CHAOS CHESS</strong><p>7 abilities. 0 apologies.</p></button>' +
        '<button class="mode-card" data-watermark="♟" data-action="quick-classic"><span class="mode-tag">02 / PURE SKILL</span><strong>CLASSIC</strong><p>Just you, them, and the board.</p></button>' +
      '</div></section>' +
      '<section class="panel section-gap"><div class="panel-heading"><h3>ARENA ACTIVITY</h3><small>THIS DEVICE</small></div><div class="activity-list">' +
        '<div class="activity-item"><span class="activity-icon">✦</span><div><strong>' + (profile.wins ? "You have " + profile.wins + " victories on record" : "Your first victory is waiting") + '</strong><small>' + (profile.matches ? "Keep your streak alive." : "Play a match to start your record.") + '</small></div><span>NOW</span></div>' +
        '<div class="activity-item"><span class="activity-icon">◈</span><div><strong>' + profile.credits.toLocaleString() + ' shards in your vault</strong><small>Earn more by completing daily contracts.</small></div><span>WALLET</span></div>' +
        '<div class="activity-item"><span class="activity-icon">⬡</span><div><strong>' + profile.captures + ' pieces captured</strong><small>Every piece is a lesson. Usually a painful one.</small></div><span>CAREER</span></div>' +
      '</div></section>' +
    '</div>' +
    '<div style="display:grid;gap:13px;align-content:start">' +
      '<section class="panel challenge-card"><div class="challenge-top"><span>✦ DAILY CONTRACT</span><span>+100 ◈</span></div><div class="challenge-art"><span>♞</span><span>♛</span><span>♜</span></div><h3>THE OPENING ACT</h3><p>Finish one match today. Win or lose, show up and make a mess.</p><button class="btn btn-secondary" data-view="quests">VIEW CONTRACTS ↗</button></section>' +
      '<section class="panel"><div class="panel-heading"><h3>YOUR PROGRESSION</h3><small>LEVEL ' + level.level + '</small></div><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:7px"><span style="font:9px var(--mono);color:var(--muted)">EXPERIENCE</span><strong style="font:10px var(--mono);color:var(--lime)">' + level.current + ' / 400</strong></div><div class="xp-track"><i style="width:' + level.percent + '%"></i></div><div style="display:flex;justify-content:space-between;margin-top:17px"><span style="font:9px var(--mono);color:var(--muted)">CURRENT DIVISION</span><b style="font:11px var(--display);color:' + rank.color + '">' + rank.name + '</b></div><button class="ghost-link" style="padding:14px 0 0" data-view="rank">VIEW SEASON RANK ↗</button></section>' +
    '</div></div>';
}

function renderPlay() {
  const modes = [
    { id: "chaos", title: "CHAOS CHESS", tag: "THE MAIN EVENT", pill: "RECOMMENDED", icon: "♜", desc: "Traditional chess gets thrown out the window. Use abilities to blast, freeze, teleport, and outplay your opponent.", features: ["1,000-POWER POOL", "ROLL 3 / PICK 1", "BOT OPPONENT"], banner: "chaos" },
    { id: "classic", title: "CLASSIC", tag: "NO SHORTCUTS", pill: "PURE SKILL", icon: "♔", desc: "Every move has to be earned. Full legal chess rules, promotion, castling, en passant, check and checkmate.", features: ["STANDARD RULES", "NO POWERS", "BOT OPPONENT"], banner: "classic" },
    { id: "local", title: "LOCAL DUEL", tag: "SAME DEVICE", pill: "2 PLAYERS", icon: "⚔", desc: "Challenge a friend sitting next to you. Pass the keyboard after every move. Chaos or classic rules.", features: ["HOTSEAT", "2 HUMAN PLAYERS", "PRIVATE"], banner: "training" }
  ];
  let cards = "";
  modes.forEach(mode => {
    cards += '<button class="mode-select-card ' + (selectedMode === mode.id ? "selected" : "") + '" data-mode="' + mode.id + '"><div class="mode-banner ' + mode.banner + '"><span class="big-symbol">' + mode.icon + '</span></div><div class="mode-card-content"><div class="mode-meta"><span>' + mode.tag + '</span><span class="pill">' + mode.pill + '</span></div><h3>' + mode.title + '</h3><p>' + mode.desc + '</p><div class="mode-features">' + mode.features.map(item => '<span>' + item + '</span>').join("") + '</div></div></button>';
  });
  return heading("MATCHMAKING / CONFIGURATION", "PICK YOUR POISON.", "Choose how you want to play. Your match history and unlocks stay saved in this browser.") +
    '<div class="mode-select-grid">' + cards + '</div>' +
    '<div class="setup-bar"><div class="setup-field"><label for="opponent-select">OPPONENT</label><select id="opponent-select"><option value="bot" ' + (selectedOpponent === "bot" ? "selected" : "") + '>Training bot</option><option value="local" ' + (selectedOpponent === "local" ? "selected" : "") + '>Local 2-player</option></select></div><div class="setup-field"><label for="difficulty-select">BOT DIFFICULTY</label><select id="difficulty-select"><option value="easy" ' + (selectedDifficulty === "easy" ? "selected" : "") + '>Rookie</option><option value="steady" ' + (selectedDifficulty === "steady" ? "selected" : "") + '>Tactical</option><option value="hard" ' + (selectedDifficulty === "hard" ? "selected" : "") + '>Ruthless</option></select></div><div class="setup-field"><label>YOUR LOADOUT</label><div style="height:35px;display:flex;align-items:center;color:var(--lime);font:9px var(--mono)">◈ ' + (selectedMode === "chaos" ? "ROLL 3 / LOCK 1 FROM 1,000" : "STANDARD RULESET") + '</div></div><button class="btn btn-primary" data-action="start-match">START MATCH <span>↗</span></button></div>' +
    '<div class="panel section-gap" style="display:flex;align-items:center;justify-content:space-between;gap:20px;flex-wrap:wrap"><div><div class="eyebrow">NOT READY FOR A FIGHT?</div><h3 style="font:700 23px var(--display);margin:9px 0 4px">WARM UP IN THE TRAINING LAB.</h3><p style="color:var(--muted);font-size:10px;margin:0">Learn the powers, solve a mate-in-one, or test a new idea without risking your rating.</p></div><button class="btn btn-secondary" data-view="practice">OPEN TRAINING LAB ↗</button></div>';
}

function renderPractice() {
  return heading("TRAINING / EXPERIMENTATION", "GET DANGEROUS.", "Practice the fundamentals, then learn exactly when to stop respecting them.") +
    '<div class="training-grid">' +
      '<article class="training-card"><div class="training-icon">♛</div><div class="eyebrow">PUZZLE 001 / MATE IN ONE</div><h3>ONE MOVE. NO ESCAPE.</h3><p>White to move. Find the forced checkmate in one. No powers, no gimmicks — just a clean finish.</p><button class="btn btn-primary" data-action="start-puzzle">SOLVE THE PUZZLE ↗</button></article>' +
      '<article class="training-card"><div class="training-icon">⚡</div><div class="eyebrow">SANDBOX / CHAOS MODE</div><h3>TEST THE ILLEGAL STUFF.</h3><p>Play the bot with the full ability loadout. Experiment with range, timing, and piece protection.</p><button class="btn btn-secondary" data-action="start-lab">ENTER THE POWER LAB ↗</button></article>' +
      '<article class="training-card"><div class="training-icon">⌖</div><div class="eyebrow">COMING NEXT / TACTICAL REPLAY</div><h3>REVIEW YOUR MISTAKES.</h3><p>Move-by-move analysis and a post-match review timeline are planned for a future update.</p><button class="btn btn-secondary" disabled>IN DEVELOPMENT</button></article>' +
      '<article class="training-card"><div class="training-icon">◈</div><div class="eyebrow">FIELD GUIDE / POWERS</div><h3>KNOW YOUR ADVANTAGE.</h3><p>Review every ability, its energy cost, and the situations where it can turn a losing position around.</p><button class="btn btn-secondary" data-view="armory">EXPLORE THE ARMORY ↗</button></article>' +
    '</div>';
}


function renderPieceSkins() {
  return PIECE_SKINS.map(item => {
    const owned = profile.unlockedPieces.includes(item.id);
    const equipped = profile.equippedPieces === item.id;
    const action = equipped ? '<button class="btn btn-secondary btn-small" disabled>EQUIPPED</button>' :
      owned ? '<button class="btn btn-primary btn-small" data-action="equip-piece" data-piece="' + item.id + '">EQUIP</button>' :
      '<button class="btn btn-secondary btn-small" data-action="buy-piece" data-piece="' + item.id + '">UNLOCK</button>';
    return '<article class="skin-card"><div class="skin-preview"><div class="piece-set-preview" style="--piece-white:' + item.white + ';--piece-black:' + item.black + '"><span>♔♕♖♘</span><span>♚♛♜♞</span></div></div><div class="skin-info"><div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><h3>' + item.name + '</h3><span class="skin-price">' + (item.price ? item.price + " ◈" : "FREE") + '</span></div><p>' + item.desc + '</p><div class="skin-foot"><span style="font:8px var(--mono);color:' + (owned ? "var(--lime)" : "var(--muted)") + '">' + (owned ? "OWNED" : "LOCKED") + '</span>' + action + '</div></div></article>';
  }).join("");
}
function renderEmoteStore() {
  return EMOTES.map(item => {
    const owned = profile.unlockedEmotes.includes(item.id);
    const equipped = profile.equippedEmote === item.id;
    const action = equipped ? '<button class="btn btn-secondary btn-small" disabled>EQUIPPED</button>' :
      owned ? '<button class="btn btn-primary btn-small" data-action="equip-emote" data-emote-id="' + item.id + '">EQUIP</button>' :
      '<button class="btn btn-secondary btn-small" data-action="buy-emote" data-emote-id="' + item.id + '">UNLOCK</button>';
    return '<article class="emote-store-card"><div class="emote-store-icon">' + item.icon + '</div><div class="emote-store-meta"><strong>' + item.name + '</strong><small>' + (owned ? "OWNED" : item.price + " SHARDS") + '</small></div>' + action + '</article>';
  }).join("");
}
function buyPieceSkin(id) {
  const item = PIECE_SKINS.find(entry => entry.id === id);
  if (!item || profile.unlockedPieces.includes(id)) return;
  if (profile.credits < item.price) { toast("Not enough shards to unlock that piece set.", "error"); return; }
  profile.credits -= item.price;
  profile.unlockedPieces.push(id);
  saveProfile();
  render();
  toast(item.name + " unlocked.");
}
function equipPieceSkin(id) {
  if (!profile.unlockedPieces.includes(id)) return;
  profile.equippedPieces = id;
  saveProfile();
  render();
  toast("Piece set equipped.");
}
function buyEmote(id) {
  const item = EMOTES.find(entry => entry.id === id);
  if (!item || profile.unlockedEmotes.includes(id)) return;
  if (profile.credits < item.price) { toast("Not enough shards to unlock that emote.", "error"); return; }
  profile.credits -= item.price;
  profile.unlockedEmotes.push(id);
  saveProfile();
  render();
  toast(item.name + " unlocked.");
}
function equipEmote(id) {
  if (!profile.unlockedEmotes.includes(id)) return;
  profile.equippedEmote = id;
  saveProfile();
  render();
  toast("Quick emote equipped.");
}
function renderEmoteDeck() {
  const owned = EMOTES.filter(item => profile.unlockedEmotes.includes(item.id));
  if (!owned.length) return '<p class="mode-note">Unlock an emote in the Armory to use match reactions.</p>';
  return owned.map(item => '<button class="match-emote ' + (profile.equippedEmote === item.id ? "equipped" : "") + '" data-emote="' + item.id + '" title="' + item.name + '"><span>' + item.icon + '</span><small>' + item.name + '</small></button>').join("");
}
function sendMatchEmote(id) {
  const item = EMOTES.find(entry => entry.id === id);
  if (!item || !profile.unlockedEmotes.includes(id)) return;
  if (opponent === "online") {
    if (!net.connected || !peerRoom) { toast("Your peer connection is not active.", "error"); return; }
    peerRoom.send({ type: "emote", id: item.id, name: profile.name });
  }
  toast((profile.name || "PLAYER") + " " + item.icon + " " + item.name);
}

function renderArmory() {
  const items = SKINS.map(skin => {
    const owned = profile.unlockedSkins.includes(skin.id);
    const equipped = profile.equippedSkin === skin.id;
    let action = equipped ? '<button class="btn btn-secondary btn-small" disabled>EQUIPPED</button>' : owned ? '<button class="btn btn-primary btn-small" data-action="equip-skin" data-skin="' + skin.id + '">EQUIP</button>' : '<button class="btn btn-secondary btn-small" data-action="buy-skin" data-skin="' + skin.id + '">UNLOCK</button>';
    return '<article class="skin-card"><div class="skin-preview"><div class="swatch-board" style="--swatch-light:' + skin.light + ';--swatch-dark:' + skin.dark + '">' + Array.from({ length: 16 }, () => "<span></span>").join("") + '</div></div><div class="skin-info"><div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><h3>' + skin.name + '</h3><span class="skin-price">' + (skin.price ? skin.price + " ◈" : "FREE") + '</span></div><p>' + skin.desc + '</p><div class="skin-foot"><span style="font:8px var(--mono);color:' + (owned ? "var(--lime)" : "var(--muted)") + '">' + (owned ? "OWNED" : "LOCKED") + '</span>' + action + '</div></div></article>';
  }).join("");
  return heading("COSMETICS / LOADOUT", "MAKE IT YOURS.", "No pay-to-win nonsense. Every item is cosmetic, and all unlocks use earned in-game shards.") +
    '<div class="panel" style="display:flex;align-items:center;justify-content:space-between;margin-bottom:15px;gap:12px"><div><div class="eyebrow">YOUR WALLET</div><div style="font:700 26px var(--display);margin-top:5px">' + profile.credits.toLocaleString() + ' <span style="color:var(--lime)">◈ SHARDS</span></div></div><span style="color:var(--muted);font-size:9px;text-align:right">Earn shards by finishing matches<br>and claiming daily contracts.</span></div>' +
    '<div class="panel-heading section-gap"><h3>PIECE COLLECTION</h3><small>UNLOCKABLE SETS</small></div><div class="inventory-grid">' + renderPieceSkins() + '</div>' +
    '<div class="panel-heading section-gap"><h3>EMOTE COLLECTION</h3><small>QUICK MATCH REACTIONS</small></div><div class="emote-store-grid">' + renderEmoteStore() + '</div>' +
    '<div class="panel section-gap"><div class="eyebrow">1,000-CARD POWER VAULT</div><h3 style="font:700 24px var(--display);margin:8px 0 5px">ROLL YOUR POWER BEFORE THE MATCH.</h3><p style="color:var(--muted);font-size:10px;line-height:1.6;margin:0 0 14px">Each Chaos match starts with a three-card roll. Lock one crossover-inspired power for the game. The vault has 1,000 cards built from 20 distinct chess-effect archetypes.</p><div class="mode-features">' + POWER_CATALOG.slice(0, 12).map(power => '<span>' + power.icon + " " + escapeHTML(power.name) + "</span>").join("") + '</div><button class="btn btn-secondary btn-small" style="margin-top:14px" data-view="play">GO TO MATCH SETUP ↗</button></div>';
}

function renderQuests() {
  const cards = DAILY_QUESTS.map(quest => {
    const progress = profile.daily[quest.key] || 0;
    const claimed = profile.daily.claimed.includes(quest.id);
    const done = progress >= quest.goal;
    return '<article class="quest-card"><div class="quest-icon">' + quest.icon + '</div><h3>' + quest.title + '</h3><p>' + quest.desc + '</p><div class="quest-progress"><i style="width:' + clamp(progress / quest.goal * 100, 0, 100) + '%"></i></div><div class="quest-foot"><span>' + Math.min(progress, quest.goal) + ' / ' + quest.goal + ' COMPLETE</span><span>' + (done ? "READY" : "IN PROGRESS") + '</span></div><div class="quest-reward"><span>◈ ' + quest.reward + ' SHARDS</span>' + (claimed ? '<button class="btn btn-secondary btn-small" disabled>CLAIMED</button>' : '<button class="btn ' + (done ? "btn-primary" : "btn-secondary") + ' btn-small" data-action="claim-quest" data-quest="' + quest.id + '" ' + (done ? "" : "disabled") + '>CLAIM</button>') + '</div></article>';
  }).join("");
  return heading("DAILY / RESET AT MIDNIGHT UTC", "EARN YOUR EDGE.", "Complete small contracts to stack shards and XP. Daily progress is saved on this device.") +
    '<div class="quest-grid">' + cards + '</div>' +
    '<div class="panel section-gap"><div class="panel-heading"><h3>CONTRACT RULES</h3><small>NO PURCHASES / NO SHORTCUTS</small></div><p style="color:var(--muted);font-size:10px;line-height:1.7;margin:0">Finish matches against the bot to advance your daily contracts. A capture only counts when you make it. Claim each completed contract once before the daily reset.</p></div>';
}

function renderRank() {
  const rank = currentRank();
  const progress = rankProgress();
  const level = levelInfo();
  const ladder = [
    ["I", "ROOKIE", "0 – 1,099", "You are here"],
    ["II", "BRONZE", "1,100 – 1,249", "Earn your first stripe"],
    ["III", "SILVER", "1,250 – 1,449", "Prove your consistency"],
    ["IV", "GOLD", "1,450 – 1,699", "A serious contender"],
    ["V", "DIAMOND", "1,700 – 1,999", "The upper board"],
    ["VI", "MASTER", "2,000+", "No more excuses"]
  ];
  return heading("SEASON 01 / LOCAL LADDER", "CLIMB THE BOARD.", "Your rating changes after bot matches. This is a local progression system; a worldwide online leaderboard is not connected yet.") +
    '<div class="rank-layout"><section class="panel rank-card"><div class="rank-label">CURRENT DIVISION / SEASON 01</div><div class="rank-name" style="color:' + rank.color + '">' + rank.name + '</div><div class="rank-rating"><strong>' + profile.rating + '</strong> ELO · LEVEL ' + level.level + '</div><div class="rank-bar"><div class="rank-bar-track"><i style="width:' + progress.percent + '%"></i></div><small><span>' + rank.name + '</span><span>' + (progress.remaining ? progress.remaining + ' POINTS TO ' + progress.next : 'TOP DIVISION') + '</span></small></div></section>' +
    '<section class="panel"><div class="panel-heading"><h3>DIVISION LADDER</h3><small>SEASON 01</small></div><div class="rank-ladder">' + ladder.map(item => '<div class="ladder-row"><span class="ladder-medal">' + item[0] + '</span><div><strong>' + item[1] + '</strong><small>' + item[2] + '</small></div><em>' + (item[1] === rank.name ? "CURRENT" : item[3]) + '</em></div>').join("") + '</div></section></div>' +
    '<section class="panel section-gap"><div class="panel-heading"><h3>SEASON STATS</h3><small>LOCAL PROFILE</small></div><div class="stats-row"><div class="stat-card"><div class="stat-top">WINS</div><div class="stat-value">' + profile.wins + '</div><div class="stat-foot">CAREER TOTAL</div></div><div class="stat-card"><div class="stat-top">BEST STREAK</div><div class="stat-value">' + profile.bestStreak + '</div><div class="stat-foot">CONSECUTIVE WINS</div></div><div class="stat-card"><div class="stat-top">CAPTURES</div><div class="stat-value">' + profile.captures + '</div><div class="stat-foot">PIECES REMOVED</div></div><div class="stat-card"><div class="stat-top">WIN RATE</div><div class="stat-value">' + (profile.matches ? Math.round(profile.wins / profile.matches * 100) : 0) + '%</div><div class="stat-foot">ALL RECORDED MATCHES</div></div></div></section>';
}

function renderProfile() {
  const level = levelInfo();
  const rank = currentRank();
  const achievements = [
    { icon: "♟", title: "FIRST BLOOD", desc: profile.matches ? "First match completed" : "Finish your first match", done: profile.matches >= 1 },
    { icon: "✦", title: "THE FINISHER", desc: "Win 5 matches", done: profile.wins >= 5 },
    { icon: "⚔", title: "COLLECTOR", desc: "Capture 25 pieces", done: profile.captures >= 25 },
    { icon: "◈", title: "ON THE RISE", desc: "Reach 1,250 rating", done: profile.rating >= 1250 }
  ];
  return heading("PLAYER / IDENTITY", "YOUR FILE.", "Your profile, match record, unlocks, and achievements. Everything here is stored locally in your browser.") +
    '<div class="profile-layout"><section class="panel profile-card"><div class="profile-large-avatar">' + escapeHTML((profile.name || "R").slice(0, 1).toUpperCase()) + '</div><h2>' + escapeHTML(profile.name || "ROOKIE") + '</h2><p>' + rank.name + ' DIVISION · PLAYER LEVEL ' + level.level + '</p><div class="profile-xp"><div><span>EXPERIENCE POINTS</span><span>' + level.current + ' / ' + level.next + '</span></div><div class="xp-track"><i style="width:' + level.percent + '%"></i></div></div><div class="profile-edit"><input class="text-input" id="profile-name-input" maxlength="16" value="' + escapeHTML(profile.name) + '" aria-label="Player callsign"><button class="btn btn-primary btn-small" data-action="save-name">SAVE</button></div><button class="text-button" style="margin-top:14px" data-action="reset-profile">RESET LOCAL PROFILE</button></section>' +
    '<section class="panel"><div class="panel-heading"><h3>CAREER SNAPSHOT</h3><small>ALL TIME</small></div><div class="stats-row"><div class="stat-card"><div class="stat-top">MATCHES</div><div class="stat-value">' + profile.matches + '</div></div><div class="stat-card"><div class="stat-top">WINS</div><div class="stat-value">' + profile.wins + '</div></div><div class="stat-card"><div class="stat-top">LOSSES</div><div class="stat-value">' + profile.losses + '</div></div><div class="stat-card"><div class="stat-top">RATING</div><div class="stat-value">' + profile.rating + '</div></div></div><div class="panel-heading" style="margin-top:22px"><h3>ACHIEVEMENTS</h3><small>' + achievements.filter(item => item.done).length + ' / ' + achievements.length + ' UNLOCKED</small></div><div class="achievement-grid">' + achievements.map(item => '<div class="achievement" style="opacity:' + (item.done ? "1" : ".48") + '"><span class="achievement-icon">' + item.icon + '</span><div><strong>' + item.title + '</strong><small>' + item.desc + '</small></div></div>').join("") + '</div></section></div>' +
    '<div class="panel section-gap"><div class="panel-heading"><h3>PRIVACY & SAVES</h3><small>LOCAL + CLOUD</small></div><p style="color:var(--muted);font-size:10px;line-height:1.7;margin:0">Your progress is cached in this browser. Connect an account from the Account page to back up your callsign, rating, shards, matches, quests, achievements, and cosmetics to your own cloud save. Peer-to-peer invite rooms are supported for live matches. Public leaderboards and server-verified competitive stats are not enabled yet.</p></div>';
}

function playerName(color) {
  if (opponent === "local") return color === "w" ? (profile.name || "PLAYER 1") : "PLAYER 2";
  if (opponent === "online") {
    if (net.role === "host") return color === "w" ? (profile.name || "HOST") : (net.remoteName || "GUEST");
    return color === "b" ? (profile.name || "GUEST") : (net.remoteName || "HOST");
  }
  return color === "w" ? (profile.name || "YOU") : "ROGUE BOT";
}
function pieceAt(square) { return chess ? chess.get(square) : null; }
function currentLegalMoves(square) {
  if (!chess) return [];
  try {
    return chess.moves({ square: square, verbose: true }).filter(move => !frozen[chess.turn()][move.from] && !shielded[opposite(chess.turn())][move.to]);
  } catch (error) { return []; }
}
function kingSquare(color) {
  if (!chess) return null;
  const board = chess.board();
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    const piece = board[r][c];
    if (piece && piece.type === "k" && piece.color === color) return String.fromCharCode(97 + c) + (8 - r);
  }
  return null;
}
function renderBoard() {
  if (!chess) return "";
  const board = chess.board();
  const legal = selectedSquare ? currentLegalMoves(selectedSquare) : [];
  const legalTargets = legal.map(move => move.to);
  const last = chess.history({ verbose: true }).slice(-1)[0];
  const checkedKing = chess.isCheck() ? kingSquare(chess.turn()) : null;
  const rows = boardFlipped ? [7,6,5,4,3,2,1,0] : [0,1,2,3,4,5,6,7];
  const cols = boardFlipped ? [7,6,5,4,3,2,1,0] : [0,1,2,3,4,5,6,7];
  let html = "";
  rows.forEach((r, ri) => cols.forEach((c, ci) => {
    const square = String.fromCharCode(97 + c) + (8 - r);
    const piece = board[r][c];
    const isLegal = legalTargets.includes(square);
    let classes = "square " + ((r + c) % 2 === 0 ? "light" : "dark");
    if (selectedSquare === square) classes += " selected";
    if (last && (last.from === square || last.to === square)) classes += last.from === square ? " last-from" : " last-to";
    if (checkedKing === square) classes += " check-square";
    const rankLabel = ci === 0 ? '<span class="coord rank">' + (8 - r) + '</span>' : "";
    const fileLabel = ri === 7 ? '<span class="coord file">' + String.fromCharCode(97 + c) + '</span>' : "";
    const marker = isLegal ? (piece ? '<i class="legal-ring"></i>' : '<i class="legal-dot"></i>') : "";
    const shield = piece && shielded[piece.color][square] ? '<span style="position:absolute;right:5px;top:3px;z-index:4;color:#d8ff3f;font-size:10px">⬡</span>' : "";
    const frozenMark = piece && frozen[piece.color][square] ? '<span style="position:absolute;left:5px;top:3px;z-index:4;color:#8bd6ff;font-size:10px">❄</span>' : "";
    const pieceHtml = piece ? '<span class="piece ' + (piece.color === "w" ? "white" : "black") + '">' + PIECES[piece.color][piece.type] + '</span>' : "";
    html += '<button class="' + classes + '" data-square="' + square + '" aria-label="' + square + (piece ? " " + piece.color + " " + piece.type : " empty") + '">' + rankLabel + fileLabel + marker + pieceHtml + shield + frozenMark + '</button>';
  }));
  return '<div class="board-frame"><div class="chess-board skin-' + escapeHTML(activeSkin) + ' pieces-' + escapeHTML(profile.equippedPieces || "classic") + '" id="chess-board">' + html + '</div></div>';
}
function energyPips(color) {
  let html = "";
  for (let i = 0; i < 6; i++) html += '<i class="energy-pip ' + (i < energy[color] ? "filled" : "") + '"></i>';
  return html;
}
function renderLog() {
  if (!actionLog.length) return '<div class="log-empty">No moves yet. Make the first one.</div>';
  return actionLog.slice(-8).reverse().map((item, index) => '<div class="log-item"><span class="log-turn">' + String(actionLog.length - index).padStart(2, "0") + '</span><span class="log-name">' + item.who + '</span><span>' + escapeHTML(item.text) + '</span></div>').join("");
}
function renderPowerDeck() {
  if (matchMode !== "chaos") return '<div class="mode-note">Classic rules are active. No powers, no shortcuts. Just legal moves and good decisions.</div>';
  const turn = chess.turn();
  const power = activePowers[turn];
  if (!power) return '<div class="mode-note">Waiting for both players to lock their rolled powers.</div>';
  const isTurn = isHumanTurn() && !gameOver && !botThinking;
  const canUse = isTurn && energy[turn] >= power.cost && (!pendingPower || pendingPower.id === power.effectId);
  const desc = power.description || power.desc || "A rolled crossover power.";
  const label = net.connected ? (net.role === "host" ? (turn === "w" ? "YOUR PICK" : "OPPONENT PICK") : (turn === "b" ? "YOUR PICK" : "OPPONENT PICK")) : (turn === "w" ? "YOUR PICK" : "BOT PICK");
  return '<div class="power-selected"><div class="power-picked-label">' + label + ' · ' + escapeHTML(power.rarity || "ROLLED").toUpperCase() + '</div><button class="ability-card single-power ' + (pendingPower && pendingPower.id === power.effectId ? "active" : "") + '" data-power="' + power.effectId + '" ' + (canUse ? "" : "disabled") + '><span class="ability-top"><span class="ability-icon">' + (power.icon || "✦") + '</span><span class="ability-cost">' + power.cost + ' ENERGY</span></span><strong>' + escapeHTML(power.name) + '</strong><small>' + escapeHTML(desc) + '</small><em>' + escapeHTML(power.universe || "ROGUEBOARD ORIGINAL") + '</em></button></div>' +
  (pendingPower ? '<div class="target-hint">' + powerHint() + '<br><button class="text-button" style="margin-top:6px;color:var(--lime)" data-action="cancel-power">CANCEL TARGETING ×</button></div>' : '');
}
function powerHint() {
  if (!pendingPower) return "";
  const hints = {
    rocket: "SELECT AN ENEMY PIECE WITHIN 2 SQUARES OF ONE OF YOUR PIECES.",
    teleport: pendingPower.from ? "SELECT AN EMPTY OR ENEMY-OCCUPIED DESTINATION." : "SELECT ONE OF YOUR NON-KING PIECES.",
    freeze: "SELECT AN ENEMY NON-KING PIECE TO FREEZE.",
    shield: "SELECT ONE OF YOUR NON-KING PIECES TO PROTECT.",
    sniper: "SELECT AN ENEMY PIECE ON A CLEAR ROOK / BISHOP / QUEEN LINE.",
    clone: pendingPower.from ? "SELECT AN EMPTY DESTINATION FOR THE COPY." : "SELECT ONE OF YOUR NON-KING PIECES TO COPY.",
    convert: "SELECT AN ENEMY PAWN TO TURN TO YOUR SIDE.",
    push: "SELECT AN ENEMY NON-KING PIECE TO KNOCK BACK.",
    pull: "SELECT AN ENEMY NON-KING PIECE TO DRAG TOWARD YOU.",
    summon: "SELECT AN EMPTY SQUARE ON YOUR ORIGINAL PAWN RANK.",
    promote: "SELECT ONE OF YOUR PAWNS TO ASCEND INTO A QUEEN.",
    fortify: "SELECT A FRIENDLY NON-KING PIECE TO FORTIFY.",
    exchange: pendingPower.from ? "SELECT AN ENEMY NON-KING PIECE TO TRADE." : "SELECT ONE OF YOUR NON-KING PIECES.",
    silence: "SELECT AN ENEMY NON-KING PIECE TO SEAL THEIR POWER.",
    prison: "SELECT A RANK TO IMPRISON ITS ENEMY PIECES.",
    swap: pendingPower.from ? "SELECT A SECOND FRIENDLY NON-KING PIECE." : "SELECT THE FIRST FRIENDLY NON-KING PIECE."
  };
  return hints[pendingPower.id] || "SELECT A TARGET ON THE BOARD.";
}
function renderMatch() {
  const modeName = matchMode === "chaos" ? "CHAOS CHESS" : matchMode === "classic" ? "CLASSIC RULESET" : "TRAINING PUZZLE";
  const label = puzzleActive ? "TACTICAL PUZZLE / MATE IN ONE" : modeName + " / " + (opponent === "local" ? "LOCAL DUEL" : opponent === "online" ? "ONLINE DUEL" : "VS BOT");
  const turn = chess.turn();
  const turnText = gameOver ? "MATCH COMPLETE" : botThinking ? "BOT IS THINKING" : opponent === "online" ? (isHumanTurn() ? "YOUR TURN" : "OPPONENT TURN") : (opponent === "local" && turn === "b" ? "PLAYER 2'S TURN" : turn === "w" ? "YOUR TURN" : "BOT'S TURN");
  const blackTag = opponent === "local" ? "LOCAL PLAYER" : opponent === "online" ? "REMOTE PLAYER" : "TACTICAL AI";
  const whiteTag = "LEVEL " + levelInfo().level + " / " + currentRank().name;
  const logTitle = actionLog.length ? actionLog.length + " EVENTS" : "AWAITING FIRST MOVE";
  return '<div class="match-topline"><div class="match-title"><div><div class="eyebrow">' + label + '</div><h1>' + (puzzleActive ? "ONE MOVE TO FINISH." : "MAKE YOUR MOVE.") + '</h1><p>' + (matchMode === "chaos" ? "THE BOARD IS THE SAME. THE RULES ARE NOT." : "EVERY SQUARE MATTERS. EVERY MOVE IS LEGAL.") + '</p></div></div><div class="match-controls"><button class="btn btn-secondary btn-small" data-action="flip-board">FLIP BOARD ↻</button><button class="btn btn-secondary btn-small" data-action="new-match">NEW MATCH</button><button class="btn btn-danger btn-small" data-action="resign" ' + (gameOver ? "disabled" : "") + '>RESIGN</button></div></div>' +
    '<div class="match-layout"><section class="board-panel">' +
      '<div class="player-strip"><div class="player-identity"><span class="player-avatar enemy">♟</span><span class="player-text"><strong>' + escapeHTML(playerName("b")) + '</strong><small>' + blackTag + ' / BLACK</small></span></div><div class="player-meter">' + energyPips("b") + '</div></div>' +
      renderBoard() +
      '<div class="board-footer"><span class="turn-indicator">' + turnText + '</span><span>' + (matchMode === "chaos" ? "ENERGY REGENERATES ON MOVES" : "STANDARD CHESS") + '</span></div>' +
      '<div class="player-strip" style="margin:14px 0 0"><div class="player-identity"><span class="player-avatar">♙</span><span class="player-text"><strong>' + escapeHTML(playerName("w")) + '</strong><small>' + whiteTag + ' / WHITE</small></span></div><div class="player-meter">' + energyPips("w") + '</div></div>' +
    '</section><aside class="match-side">' +
      '<section class="match-panel"><div class="panel-heading" style="margin-bottom:7px"><h3>ARSENAL</h3><small>' + (matchMode === "chaos" ? "YOUR ENERGY " + energy[turn] + " / 6" : "DISABLED") + '</small></div><p class="sub">' + (matchMode === "chaos" ? "Choose a power, then select a target on the board. Powers spend your turn." : "Play by the book. Every move must be legal.") + '</p>' + renderPowerDeck() + '</section>' +
      '<section class="match-panel"><div class="panel-heading"><h3>COMBAT LOG</h3><small>' + logTitle + '</small></div><div class="log-list">' + renderLog() + '</div></section>' +
      '<section class="match-panel"><div class="panel-heading"><h3>QUICK EMOTES</h3><small>REACTIONS</small></div><div class="match-emote-row">' + renderEmoteDeck() + '</div></section>' +
      '<section class="match-panel"><div class="panel-heading"><h3>FIELD NOTES</h3><small>RULES</small></div><p class="mode-note">' + (matchMode === "chaos" ? "Abilities cost energy and end your turn. Your king still has to survive. A rocket or sniper shot can finish the match by taking the enemy king." : "Standard chess is active: legal moves, check, checkmate, stalemate, castling, promotion, and en passant.") + '</p></section>' +
    '</aside></div>';
}

function render() {
  const view = $("#view");
  if (!view) return;
  syncChrome();
  if (currentView === "account") view.innerHTML = renderAccount();
  else if (currentView === "online") {
    view.innerHTML = renderOnline();
    $("#top-section").textContent = "PEER-TO-PEER ROOMS";
  } else if (currentView === "draft") {
    view.innerHTML = renderPowerDraft();
    $("#top-section").textContent = "ROLL 3 / PICK 1";
  } else if (currentView === "home") view.innerHTML = renderHome();
  else if (currentView === "play") view.innerHTML = renderPlay();
  else if (currentView === "practice") view.innerHTML = renderPractice();
  else if (currentView === "armory") view.innerHTML = renderArmory();
  else if (currentView === "quests") view.innerHTML = renderQuests();
  else if (currentView === "rank") view.innerHTML = renderRank();
  else if (currentView === "profile") view.innerHTML = renderProfile();
  else if (currentView === "match") view.innerHTML = chess ? renderMatch() : renderPlay();
  else view.innerHTML = renderHome();
  if (currentView === "play") {
    view.insertAdjacentHTML("beforeend", '<section class="panel section-gap online-cta"><div><div class="eyebrow">FRIEND MATCH / PEER TO PEER</div><h3>ROLL POWERS. INVITE A FRIEND. BREAK THE BOARD.</h3><p>Create a private code and play a live match directly between two browsers.</p></div><button class="btn btn-primary" data-view="online">OPEN ONLINE ROOMS ↗</button></section>');
  }
  view.focus({ preventScroll: true });
}

function isHumanTurn() {
  if (!chess || gameOver || botThinking) return false;
  if (opponent === "online") return net.connected && (net.role === "host" ? chess.turn() === "w" : chess.turn() === "b");
  return opponent === "local" || chess.turn() === "w";
}
function startGame(mode = "chaos", who = "bot", level = "steady", isPuzzle = false, chosenPower = null, skipDraft = false, powerLoadout = null) {
  const resolvedMode = mode === "local" ? selectedLocalMode : mode;
  if (resolvedMode === "chaos" && !isPuzzle && !skipDraft) {
    beginPowerDraft({ mode: resolvedMode, who: who, level: level });
    return;
  }
  matchMode = resolvedMode;
  opponent = mode === "local" ? "local" : who;
  difficulty = level;
  puzzleActive = isPuzzle;
  puzzleSolved = false;
  chess = new Chess(isPuzzle ? PUZZLE_FEN : undefined);
  gameOver = false;
  botThinking = false;
  selectedSquare = null;
  pendingPower = null;
  energy = { w: 5, b: 5 };
  frozen = { w: {}, b: {} };
  shielded = { w: {}, b: {} };
  doubleMoves = 0;
  boardFlipped = opponent === "online" && net.role === "guest";
  actionLog = [];
  gameCaptures = 0;
  lastResult = null;
  resultModalVisible = false;
  activeSkin = profile.equippedSkin || "standard";
  const firstPower = chosenPower || (matchMode === "chaos" ? rollPowerChoices(1)[0] : null);
  activePowers = matchMode === "chaos" ? (powerLoadout || { w: firstPower, b: opponent === "online" ? null : rollPowerChoices(1)[0] }) : { w: null, b: null };
  powerLocked = { w: false, b: false };
  recordLog("SYSTEM", isPuzzle ? "Puzzle loaded: mate in one." : matchMode === "chaos" ? "Chaos rules armed. One rolled power per player." : "Standard chess rules loaded.");
  if (opponent === "online") net.phase = "match";
  currentView = "match";
  $("#modal-root").innerHTML = "";
  render();
  if (opponent === "online" && net.role === "host") publishNetState();
  toast(isPuzzle ? "Find the forced checkmate in one." : "The board is live. Make it count.");
}
let selectedLocalMode = "chaos";
function recordLog(who, text) {
  actionLog.push({ who: who.toUpperCase(), text: String(text) });
  if (actionLog.length > 30) actionLog = actionLog.slice(-30);
}
function fileOf(square) { return square.charCodeAt(0) - 97; }
function rankOf(square) { return Number(square[1]) - 1; }
function squareDistance(a, b) {
  return Math.max(Math.abs(fileOf(a) - fileOf(b)), Math.abs(rankOf(a) - rankOf(b)));
}
function friendlyPieceExistsOnLine(fromPiece, from, to) {
  const dx = Math.sign(fileOf(to) - fileOf(from));
  const dy = Math.sign(rankOf(to) - rankOf(from));
  const fileDiff = Math.abs(fileOf(to) - fileOf(from));
  const rankDiff = Math.abs(rankOf(to) - rankOf(from));
  const straight = fileDiff === 0 || rankDiff === 0;
  const diagonal = fileDiff === rankDiff;
  if (!straight && !diagonal) return false;
  if (straight && !["r", "q"].includes(fromPiece.type)) return false;
  if (diagonal && !["b", "q"].includes(fromPiece.type)) return false;
  let file = fileOf(from) + dx;
  let rank = rankOf(from) + dy;
  while (file !== fileOf(to) || rank !== rankOf(to)) {
    const square = String.fromCharCode(97 + file) + (rank + 1);
    if (chess.get(square)) return false;
    file += dx;
    rank += dy;
  }
  return true;
}
function sniperCanReach(target, color) {
  const enemy = chess.get(target);
  if (!enemy || enemy.color === color) return false;
  const board = chess.board();
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    const piece = board[r][c];
    if (!piece || piece.color !== color || !["r", "b", "q"].includes(piece.type)) continue;
    const from = String.fromCharCode(97 + c) + (8 - r);
    if (friendlyPieceExistsOnLine(piece, from, target)) return true;
  }
  return false;
}
function rocketCanReach(target, color) {
  const board = chess.board();
  const range = activePowers[color]?.range || 2;
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    const piece = board[r][c];
    if (!piece || piece.color !== color) continue;
    const from = String.fromCharCode(97 + c) + (8 - r);
    if (squareDistance(from, target) <= range) return true;
  }
  return false;
}
function forceTurn(color) {
  const fields = chess.fen().split(" ");
  fields[1] = color;
  fields[3] = "-";
  fields[4] = "0";
  try {
    chess = new Chess(fields.join(" "));
    return true;
  } catch (error) {
    toast("That action created an invalid board position.", "error");
    return false;
  }
}
function clearFrozen(color) { frozen[color] = {}; }
function checkGameEnd() {
  if (!chess || gameOver) return true;
  if (chess.isCheckmate()) {
    finishGame(opposite(chess.turn()), "CHECKMATE");
    return true;
  }
  if (chess.isDraw()) {
    finishGame("draw", chess.isStalemate() ? "STALEMATE" : "DRAW");
    return true;
  }
  return false;
}
function doNormalMove(from, to) {
  if (opponent === "online" && net.role === "guest" && !handlingRemote) {
    peerRoom?.send({ type: "action", action: "move", from: from, to: to });
    return;
  }
  if (!isHumanTurn() && !handlingRemote) return;
  const color = chess.turn();
  const destinationPiece = chess.get(to);
  if (destinationPiece && shielded[destinationPiece.color][to]) {
    delete shielded[destinationPiece.color][to];
    selectedSquare = null;
    toast("Shield absorbed the capture. That piece survives.", "error");
    recordLog("SHIELD", to.toUpperCase() + " absorbed an attack.");
    render();
    publishNetState();
    return;
  }
  let result;
  try { result = chess.move({ from: from, to: to, promotion: "q" }); } catch (error) { result = null; }
  if (!result) return;
  const captured = Boolean(result.captured);
  if (captured) {
    gameCaptures++;
    energy[color] = clamp(energy[color] + 2, 0, 6);
    if (opponent === "local" || (opponent === "bot" && color === "w") || (opponent === "online" && ((net.role === "host" && color === "w") || (net.role === "guest" && color === "b")))) {
      profile.captures++;
      profile.daily.captures++;
      saveProfile();
    }
  } else {
    energy[color] = clamp(energy[color] + 1, 0, 6);
  }
  clearFrozen(color);
  selectedSquare = null;
  pendingPower = null;
  recordLog(color === "w" ? "WHITE" : "BLACK", result.san + (captured ? " / CAPTURE" : ""));
  powerLocked[color] = false;
  if (puzzleActive) {
    if (chess.isCheckmate()) {
      finishGame("w", "PUZZLE SOLVED");
    } else {
      toast("Not quite. The puzzle resets — look for the forcing move.", "error");
      window.setTimeout(() => {
        if (puzzleActive && !gameOver) {
          chess = new Chess(PUZZLE_FEN);
          selectedSquare = null;
          actionLog = [{ who: "SYSTEM", text: "Puzzle reset. Find mate in one." }];
          render();
        }
      }, 700);
    }
    render();
    return;
  }
  if (doubleMoves > 0) {
    doubleMoves--;
    if (!chess.isCheck() && forceTurn(doubleMoves > 0 ? color : opposite(color))) {
      recordLog("HASTE", doubleMoves > 0 ? "Extra move granted." : "Extra moves exhausted.");
      toast(doubleMoves > 0 ? "DOUBLE TIME — ONE MORE MOVE." : "DOUBLE TIME COMPLETE.");
      render();
      publishNetState();
      return;
    }
    doubleMoves = 0;
    toast("Your extra move was cancelled because the opponent is in check.", "error");
  }
  render();
  if (checkGameEnd()) { publishNetState(); return; }
  publishNetState();
  if (opponent === "bot" && chess.turn() === "b") maybeBotTurn();
}
function handleSquareClick(square) {
  if (!chess || gameOver || botThinking) return;
  if (!isHumanTurn()) return;
  if (pendingPower) {
    handlePowerTarget(square);
    return;
  }
  const color = chess.turn();
  const piece = chess.get(square);
  if (selectedSquare) {
    const moves = currentLegalMoves(selectedSquare);
    const move = moves.find(item => item.to === square);
    if (move) {
      doNormalMove(selectedSquare, square);
      return;
    }
    if (piece && piece.color === color && !frozen[color][square]) {
      selectedSquare = square;
      render();
      return;
    }
    selectedSquare = null;
    render();
    return;
  }
  if (piece && piece.color === color && !frozen[color][square]) {
    selectedSquare = square;
    render();
  }
}

function activatePower(id) {
  if (!chess || gameOver || (!isHumanTurn() && !handlingRemote)) return;
  if (matchMode !== "chaos") { toast("Powers are disabled in Classic mode.", "error"); return; }
  if (chess.isCheck()) { toast("Your king is in check. Defend it before using a power.", "error"); return; }
  const power = activePowers[chess.turn()];
  if (!power || power.effectId !== id) { toast("Only your one locked-in power can be used.", "error"); return; }
  if (powerLocked[chess.turn()]) { toast("Your power is sealed for this turn.", "error"); return; }
  if (energy[chess.turn()] < power.cost) { toast("Not enough energy for " + power.name + ".", "error"); return; }
  if (opponent === "online" && net.role === "guest" && !handlingRemote && ["haste", "surge", "drain", "timeStop"].includes(id)) {
    peerRoom?.send({ type: "action", action: "instant-power", powerId: power.id, effectId: id });
    return;
  }
  if (id === "surge") {
    const color = chess.turn();
    energy[color] = clamp(energy[color] + 3, 0, 6);
    consumePower(color, id);
    advancePowerTurn(color, power.name + " restored energy.");
    toast("Energy surge. Your reserve is replenished.");
    return;
  }
  if (id === "drain") {
    const color = chess.turn();
    const enemy = opposite(color);
    energy[enemy] = Math.max(0, energy[enemy] - 2);
    consumePower(color, id);
    advancePowerTurn(color, power.name + " drained the opponent.");
    toast("Opponent energy drained.");
    return;
  }
  if (id === "timeStop") {
    const color = chess.turn();
    const enemy = opposite(color);
    const board = chess.board();
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece && piece.color === enemy && piece.type !== "k") frozen[enemy][String.fromCharCode(97 + c) + (8 - r)] = true;
    }
    consumePower(color, id);
    advancePowerTurn(color, power.name + " stopped every enemy piece except the king.");
    toast("Time stopped. The enemy king is still able to move.");
    return;
  }
  if (id === "haste") {
    if (opponent === "online" && net.role === "guest" && !handlingRemote) {
      peerRoom?.send({ type: "action", action: "haste", powerId: power.id });
      return;
    }
    if (doubleMoves) { toast("Double Time is already active.", "error"); return; }
    energy[chess.turn()] -= power.cost;
    doubleMoves = 2;
    selectedSquare = null;
    pendingPower = null;
    recordLog("POWER", power.name + " activated. Two moves queued.");
    toast(power.name + " active. Take your two moves.");
    render();
    publishNetState();
    return;
  }
  pendingPower = { id: id, from: null };
  selectedSquare = null;
  render();
  toast(power.name + " armed. Select a target on the board.");
}
function consumePower(color, id) {
  const power = activePowers[color];
  energy[color] = clamp(energy[color] - (power?.cost || 2), 0, 6);
  selectedSquare = null;
  pendingPower = null;
}
function advancePowerTurn(color, message) {
  if (chess.isCheck()) {
    toast("Your king would be exposed. The power is cancelled.", "error");
    return false;
  }
  if (!forceTurn(opposite(color))) return false;
  clearFrozen(color);
  recordLog("POWER", message);
  if (!checkGameEnd()) {
    render();
    if (opponent === "bot" && chess.turn() === "b") maybeBotTurn();
  }
  publishNetState();
  return true;
}
function nearestFriendlyPiece(target, color) {
  const board = chess.board();
  let best = null;
  let bestDistance = Infinity;
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    const piece = board[r][c];
    if (!piece || piece.color !== color) continue;
    const square = String.fromCharCode(97 + c) + (8 - r);
    const distance = squareDistance(square, target);
    if (distance < bestDistance) { bestDistance = distance; best = square; }
  }
  return best;
}
function coordSquare(file, rank) {
  if (file < 0 || file > 7 || rank < 0 || rank > 7) return null;
  return String.fromCharCode(97 + file) + (rank + 1);
}
function handlePowerTarget(square) {
  const power = pendingPower;
  if (!power) return;
  if (opponent === "online" && net.role === "guest" && !handlingRemote) {
    const piece = chess.get(square);
    if ((power.id === "teleport" || power.id === "swap" || power.id === "clone" || power.id === "exchange") && !power.from) {
      if (!piece || piece.color !== "b" || piece.type === "k") { toast("Choose one of your non-king pieces.", "error"); return; }
      power.from = square;
      render();
      toast("Now select the second square.");
      return;
    }
    peerRoom?.send({ type: "action", action: "power", powerId: activePowers.b?.id, effectId: power.id, from: power.from || null, square: square });
    pendingPower = null;
    selectedSquare = null;
    render();
    return;
  }
  const id = power.id;
  const color = chess.turn();
  const enemy = opposite(color);
  const piece = chess.get(square);
  if (id === "rocket") {
    if (!piece || piece.color !== enemy) { toast("Choose an enemy piece.", "error"); return; }
    if (!rocketCanReach(square, color)) { toast("That target is out of rocket range.", "error"); return; }
    if (piece.type === "k") {
      consumePower(color, id);
      recordLog("POWER", "ROCKET captured the king.");
      finishGame(color, "KING CAPTURED BY ROCKET");
      return;
    }
    if (shielded[enemy][square]) {
      delete shielded[enemy][square];
      consumePower(color, id);
      advancePowerTurn(color, "Rocket hit a shield at " + square + ".");
      toast("The shield absorbed your rocket.");
      return;
    }
    const before = chess.fen();
    chess.remove(square);
    if (chess.isCheck()) {
      chess = new Chess(before);
      toast("That blast would expose your king.", "error");
      return;
    }
    consumePower(color, id);
    advancePowerTurn(color, "Rocket blasted " + square + " off the board.");
    toast("Target eliminated.");
    return;
  }
  if (id === "sniper") {
    if (!piece || piece.color !== enemy) { toast("Select an enemy piece.", "error"); return; }
    if (!sniperCanReach(square, color)) { toast("No friendly rook, bishop, or queen has a clear line to that square.", "error"); return; }
    if (piece.type === "k") {
      consumePower(color, id);
      recordLog("POWER", "SNIPER captured the king.");
      finishGame(color, "KING TAKEN BY SNIPER");
      return;
    }
    if (shielded[enemy][square]) {
      delete shielded[enemy][square];
      consumePower(color, id);
      advancePowerTurn(color, "Sniper round deflected by a shield at " + square + ".");
      toast("Shield hit. Target survives.");
      return;
    }
    const before = chess.fen();
    chess.remove(square);
    if (chess.isCheck()) { chess = new Chess(before); toast("That shot would expose your king.", "error"); return; }
    consumePower(color, id);
    advancePowerTurn(color, "Sniper removed the piece at " + square + ".");
    toast("Clean shot.");
    return;
  }
  if (id === "freeze") {
    if (!piece || piece.color !== enemy || piece.type === "k") { toast("Choose an enemy non-king piece.", "error"); return; }
    frozen[enemy][square] = true;
    consumePower(color, id);
    advancePowerTurn(color, "Froze the enemy piece at " + square + ".");
    toast("Frozen. It cannot move during the opponent next turn.");
    return;
  }
  if (id === "shield") {
    if (!piece || piece.color !== color || piece.type === "k") { toast("Choose one of your non-king pieces.", "error"); return; }
    shielded[color][square] = true;
    consumePower(color, id);
    advancePowerTurn(color, "Shielded your piece at " + square + ".");
    toast("Shield online. The next capture is blocked.");
    return;
  }
  if (id === "teleport") {
    if (!power.from) {
      if (!piece || piece.color !== color || piece.type === "k") { toast("Choose one of your non-king pieces.", "error"); return; }
      power.from = square;
      render();
      toast("Now choose its destination.");
      return;
    }
    const from = power.from;
    if (square === from || (piece && piece.color === color)) { toast("Choose an empty square or an enemy target.", "error"); return; }
    if (piece && piece.type === "k" && piece.color === enemy) {
      consumePower(color, id);
      finishGame(color, "ENEMY KING TELEPORTED OFF THE BOARD");
      return;
    }
    if (piece && shielded[enemy][square]) {
      delete shielded[enemy][square];
      consumePower(color, id);
      advancePowerTurn(color, "Teleport was blocked by a shield at " + square + ".");
      toast("The shield repelled your teleport.");
      return;
    }
    const before = chess.fen();
    const moving = chess.remove(from);
    if (piece) chess.remove(square);
    if (moving) chess.put(moving, square);
    if (chess.isCheck()) {
      chess = new Chess(before);
      toast("That warp would leave your king exposed.", "error");
      return;
    }
    consumePower(color, id);
    advancePowerTurn(color, "Blink moved " + from + " to " + square + ".");
    toast("Piece blinked across the board.");
    return;
  }
  if (id === "swap") {
    if (!power.from) {
      if (!piece || piece.color !== color || piece.type === "k") { toast("Choose one of your non-king pieces.", "error"); return; }
      power.from = square;
      render();
      toast("Choose a second friendly piece to swap.");
      return;
    }
    const from = power.from;
    if (!piece || piece.color !== color || piece.type === "k" || square === from) { toast("Choose a different friendly non-king piece.", "error"); return; }
    const before = chess.fen();
    const first = chess.remove(from);
    const second = chess.remove(square);
    if (first && second) {
      chess.put(first, square);
      chess.put(second, from);
    }
    if (chess.isCheck()) {
      chess = new Chess(before);
      toast("That swap would expose your king.", "error");
      return;
    }
    consumePower(color, id);
    advancePowerTurn(color, "Swapped " + from + " with " + square + ".");
    toast("Positions swapped.");
    return;
  }
  if (id === "clone") {
    if (!power.from) {
      if (!piece || piece.color !== color || piece.type === "k") { toast("Choose one of your non-king pieces.", "error"); return; }
      power.from = square;
      render();
      toast("Choose an empty square for its copy.");
      return;
    }
    const source = chess.get(power.from);
    if (!source || source.color !== color || piece || (source.type === "p" && (square[1] === "1" || square[1] === "8"))) { toast("Choose a valid empty destination.", "error"); return; }
    const before = chess.fen();
    chess.put({ type: source.type, color: source.color }, square);
    if (chess.isCheck()) { chess = new Chess(before); toast("The clone would leave your king exposed.", "error"); return; }
    consumePower(color, id);
    advancePowerTurn(color, "Copied " + source.type.toUpperCase() + " onto " + square + ".");
    toast("Piece cloned.");
    return;
  }
  if (id === "convert") {
    if (!piece || piece.color !== enemy || piece.type !== "p") { toast("Choose an enemy pawn.", "error"); return; }
    const before = chess.fen();
    chess.remove(square);
    chess.put({ type: "p", color: color }, square);
    if (chess.isCheck()) { chess = new Chess(before); toast("That conversion would expose your king.", "error"); return; }
    consumePower(color, id);
    advancePowerTurn(color, "Converted the pawn on " + square + ".");
    toast("Pawn converted.");
    return;
  }
  if (id === "summon") {
    const homeRank = color === "w" ? "2" : "7";
    if (piece || square[1] !== homeRank) { toast("Choose an empty square on your original pawn rank.", "error"); return; }
    chess.put({ type: "p", color: color }, square);
    if (chess.isCheck()) { chess.remove(square); toast("That summon would expose your king.", "error"); return; }
    consumePower(color, id);
    advancePowerTurn(color, "Summoned a pawn at " + square + ".");
    toast("A new pawn joins the board.");
    return;
  }
  if (id === "promote") {
    if (!piece || piece.color !== color || piece.type !== "p") { toast("Choose one of your pawns.", "error"); return; }
    const before = chess.fen();
    chess.remove(square);
    chess.put({ type: "q", color: color }, square);
    if (chess.isCheck()) { chess = new Chess(before); toast("That promotion would expose your king.", "error"); return; }
    consumePower(color, id);
    advancePowerTurn(color, "Promoted the pawn on " + square + " into a queen.");
    toast("Pawn ascended to queen.");
    return;
  }
  if (id === "fortify") {
    if (!piece || piece.color !== color || piece.type === "k") { toast("Choose a friendly non-king piece.", "error"); return; }
    const rank = rankOf(square);
    const file = fileOf(square);
    for (let df = -1; df <= 1; df++) for (let dr = -1; dr <= 1; dr++) {
      const target = coordSquare(file + df, rank + dr);
      const targetPiece = target && chess.get(target);
      if (targetPiece && targetPiece.color === color && targetPiece.type !== "k") shielded[color][target] = true;
    }
    consumePower(color, id);
    advancePowerTurn(color, "Fortified the friendly formation around " + square + ".");
    toast("Nearby pieces fortified.");
    return;
  }
  if (id === "silence") {
    if (!piece || piece.color !== enemy || piece.type === "k") { toast("Choose an enemy non-king piece.", "error"); return; }
    powerLocked[enemy] = true;
    consumePower(color, id);
    advancePowerTurn(color, "Sealed the opponent's power for one turn.");
    toast("Opponent power sealed.");
    return;
  }
  if (id === "prison") {
    const rank = square[1];
    const board = chess.board();
    let caught = 0;
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
      const target = board[r][c];
      const targetSquare = String.fromCharCode(97 + c) + (8 - r);
      if (target && target.color === enemy && target.type !== "k" && targetSquare[1] === rank) { frozen[enemy][targetSquare] = true; caught++; }
    }
    if (!caught) { toast("There are no enemy pieces on that rank.", "error"); return; }
    consumePower(color, id);
    advancePowerTurn(color, "Imprisoned " + caught + " enemy piece(s) on rank " + rank + ".");
    toast(caught + " enemy piece(s) imprisoned.");
    return;
  }
  if (id === "push" || id === "pull") {
    if (!piece || piece.color !== enemy || piece.type === "k") { toast("Choose an enemy non-king piece.", "error"); return; }
    const allySquare = nearestFriendlyPiece(square, color);
    if (!allySquare) return;
    const dx = Math.sign(fileOf(square) - fileOf(allySquare));
    const dy = Math.sign(rankOf(square) - rankOf(allySquare));
    const direction = id === "push" ? 1 : -1;
    const destination = coordSquare(fileOf(square) + dx * direction, rankOf(square) + dy * direction);
    if (!destination || chess.get(destination)) { toast("There is no open square in that direction.", "error"); return; }
    const before = chess.fen();
    const moving = chess.remove(square);
    if (!moving || !chess.put(moving, destination) || chess.isCheck()) {
      chess = new Chess(before);
      toast("That displacement is blocked or would expose your king.", "error");
      return;
    }
    consumePower(color, id);
    advancePowerTurn(color, (id === "push" ? "Pushed " : "Pulled ") + square + " to " + destination + ".");
    toast(id === "push" ? "Enemy piece knocked back." : "Enemy piece pulled closer.");
    return;
  }
  if (id === "exchange") {
    if (!power.from) {
      if (!piece || piece.color !== color || piece.type === "k") { toast("Choose one friendly non-king piece.", "error"); return; }
      power.from = square;
      render();
      toast("Choose an enemy non-king piece to trade.");
      return;
    }
    if (!piece || piece.color !== enemy || piece.type === "k") { toast("Choose an enemy non-king piece.", "error"); return; }
    const before = chess.fen();
    const first = chess.remove(power.from);
    const second = chess.remove(square);
    if (first && second) { chess.put(first, square); chess.put(second, power.from); }
    if (chess.isCheck()) { chess = new Chess(before); toast("That exchange would expose your king.", "error"); return; }
    consumePower(color, id);
    advancePowerTurn(color, "Exchanged " + power.from + " with " + square + ".");
    toast("Pieces exchanged.");
  }
}

function maybeBotTurn() {
  if (opponent !== "bot" || !chess || gameOver || chess.turn() !== "b" || puzzleActive) return;
  botThinking = true;
  render();
  window.setTimeout(() => {
    if (gameOver || !chess || chess.turn() !== "b") { botThinking = false; render(); return; }
    let moves = getAllowedMoves(chess);
    if (!moves.length && Object.keys(frozen.b).length) {
      clearFrozen("b");
      moves = getAllowedMoves(chess);
      recordLog("SYSTEM", "Freeze expired. Bot turn restored.");
    }
    if (!moves.length) {
      botThinking = false;
      checkGameEnd();
      render();
      return;
    }
    const chosen = chooseBotMove(chess, difficulty, moves);
    if (!chosen) { botThinking = false; return; }
    const before = chess.get(chosen.to);
    if (before && shielded.w[chosen.to]) {
      delete shielded.w[chosen.to];
      recordLog("SHIELD", "White shield absorbed " + chosen.to + ".");
      const alternatives = moves.filter(move => move.to !== chosen.to);
      const backup = alternatives.length ? chooseBotMove(chess, "easy", alternatives) : null;
      if (!backup) {
        botThinking = false;
        render();
        return;
      }
      applyBotMove(backup);
    } else {
      applyBotMove(chosen);
    }
  }, 520);
}
function getAllowedMoves(position) {
  return position.moves({ verbose: true }).filter(move => {
    const color = position.turn();
    return !frozen[color][move.from] && !shielded[opposite(color)][move.to];
  });
}
function evaluatePosition(position, rootColor) {
  if (position.isCheckmate()) return position.turn() === rootColor ? -100000 : 100000;
  if (position.isDraw()) return 0;
  let score = 0;
  const board = position.board();
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    const piece = board[r][c];
    if (!piece) continue;
    const value = VALUES[piece.type] || 0;
    const center = 3.5 - (Math.abs(3.5 - r) + Math.abs(3.5 - c)) / 2;
    const positional = piece.type === "p" ? center * 3 : (piece.type === "n" || piece.type === "b") ? center * 5 : 0;
    const sign = piece.color === rootColor ? 1 : -1;
    score += sign * (value + positional);
  }
  if (position.isCheck()) score += position.turn() === rootColor ? -35 : 35;
  return score;
}
function minimax(position, depth, alpha, beta, rootColor) {
  if (depth <= 0 || position.isGameOver()) return evaluatePosition(position, rootColor);
  const moves = getAllowedMoves(position);
  if (!moves.length) return evaluatePosition(position, rootColor);
  const maximizing = position.turn() === rootColor;
  let best = maximizing ? -Infinity : Infinity;
  for (const move of moves) {
    const next = new Chess(position.fen());
    next.move({ from: move.from, to: move.to, promotion: move.promotion || "q" });
    const score = minimax(next, depth - 1, alpha, beta, rootColor);
    if (maximizing) {
      best = Math.max(best, score);
      alpha = Math.max(alpha, best);
    } else {
      best = Math.min(best, score);
      beta = Math.min(beta, best);
    }
    if (beta <= alpha) break;
  }
  return best;
}
function chooseBotMove(position, level, moveList = null) {
  const moves = moveList || getAllowedMoves(position);
  if (!moves.length) return null;
  if (level === "easy") {
    const scored = moves.map(move => ({ move, score: (move.captured ? VALUES[move.captured] || 0 : 0) + Math.random() * 180 }));
    scored.sort((a, b) => b.score - a.score);
    return scored[0].move;
  }
  const depth = level === "hard" ? 3 : 2;
  let bestMove = null;
  let bestScore = -Infinity;
  const shuffled = moves.slice().sort(() => Math.random() - .5);
  for (const move of shuffled) {
    const next = new Chess(position.fen());
    next.move({ from: move.from, to: move.to, promotion: move.promotion || "q" });
    const score = minimax(next, depth - 1, -Infinity, Infinity, "b") + Math.random() * 1.5;
    if (score > bestScore) { bestScore = score; bestMove = move; }
  }
  return bestMove;
}
function applyBotMove(move) {
  const before = chess.get(move.to);
  let result;
  try { result = chess.move({ from: move.from, to: move.to, promotion: "q" }); } catch (error) { result = null; }
  if (result) {
    if (result.captured) energy.b = clamp(energy.b + 2, 0, 6);
    else energy.b = clamp(energy.b + 1, 0, 6);
    clearFrozen("b");
    recordLog("BOT", result.san + (result.captured ? " / CAPTURE" : ""));
  }
  botThinking = false;
  render();
  if (!checkGameEnd() && chess.turn() === "w") toast("Your move.");
}

function finishGame(winner, reason) {
  if (gameOver) return;
  gameOver = true;
  botThinking = false;
  pendingPower = null;
  selectedSquare = null;
  let xpReward = 0;
  let shardReward = 0;
  let ratingChange = 0;
  if (!puzzleActive && (opponent === "bot" || opponent === "online")) {
    profile.matches++;
    profile.daily.matches++;
    const localWon = opponent === "online" ? (net.role === "host" ? winner === "w" : winner === "b") : winner === "w";
    if (localWon) {
      profile.wins++;
      profile.streak++;
      profile.bestStreak = Math.max(profile.bestStreak, profile.streak);
      profile.daily.wins++;
      xpReward = matchMode === "chaos" ? 140 : 120;
      shardReward = matchMode === "chaos" ? 125 : 100;
      ratingChange = difficulty === "hard" ? 24 : difficulty === "steady" ? 18 : 12;
      profile.rating += ratingChange;
    } else if (opponent === "online" ? !localWon && winner !== "draw" : winner === "b") {
      profile.losses++;
      profile.streak = 0;
      xpReward = 45;
      shardReward = 35;
      ratingChange = -Math.min(14, Math.max(0, profile.rating - 800));
      profile.rating += ratingChange;
    } else {
      profile.draws++;
      profile.streak = 0;
      xpReward = 65;
      shardReward = 55;
    }
    profile.xp += xpReward;
    profile.credits += shardReward;
    saveProfile();
  }
  lastResult = { winner: winner, reason: reason, xp: xpReward, shards: shardReward, rating: ratingChange };
  render();
  showResultModal(lastResult);
  if (opponent === "online" && net.role === "host") publishNetState();
}
function showResultModal(result) {
  const win = opponent === "online" ? (net.role === "host" ? result.winner === "w" : result.winner === "b") : result.winner === "w";
  const draw = result.winner === "draw";
  const title = puzzleActive ? (win ? "PUZZLE SOLVED." : "PUZZLE FAILED.") : draw ? "NO WINNER." : win ? "BOARD DOMINATED." : "OUTPLAYED.";
  const subtitle = puzzleActive ? "You found the forced mate in one." : result.reason + " / " + (win ? "You took the match." : draw ? "The game ended level." : "The bot takes this round. Run it back.");
  const icon = puzzleActive ? (win ? "✦" : "↻") : draw ? "＝" : win ? "♛" : "♟";
  $("#modal-root").innerHTML = '<div class="modal-backdrop"><section class="modal-card match-result"><div class="result-symbol">' + icon + '</div><div class="eyebrow" style="justify-content:center">' + (puzzleActive ? "TRAINING LAB" : "MATCH COMPLETE") + '</div><h2>' + title + '</h2><p>' + subtitle + '</p>' +
    (!puzzleActive && opponent === "bot" ? '<div class="result-rewards"><span>+' + result.xp + ' XP</span><span>+' + result.shards + ' SHARDS</span><span>' + (result.rating > 0 ? "+" : "") + result.rating + ' ELO</span></div>' : "") +
    '<div class="modal-actions"><button class="btn btn-secondary" data-action="back-lobby">BACK TO LOBBY</button><button class="btn btn-primary" data-action="' + (puzzleActive ? "retry-puzzle" : "rematch") + '">' + (puzzleActive ? "TRY AGAIN" : "REMATCH") + ' ↗</button></div></section></div>';
}
function updateDailyClaim(questId) {
  const quest = DAILY_QUESTS.find(item => item.id === questId);
  if (!quest) return;
  if (profile.daily.claimed.includes(questId)) { toast("That contract has already been claimed.", "error"); return; }
  if ((profile.daily[quest.key] || 0) < quest.goal) { toast("Finish the contract first.", "error"); return; }
  profile.daily.claimed.push(questId);
  profile.credits += quest.reward;
  profile.xp += 45;
  saveProfile();
  render();
  toast("Contract claimed. +" + quest.reward + " shards and 45 XP.");
}
function buySkin(id) {
  const skin = SKINS.find(item => item.id === id);
  if (!skin) return;
  if (profile.unlockedSkins.includes(id)) { toast("You already own this skin."); return; }
  if (profile.credits < skin.price) { toast("Not enough shards. Play more matches or claim a contract.", "error"); return; }
  profile.credits -= skin.price;
  profile.unlockedSkins.push(id);
  saveProfile();
  render();
  toast(skin.name + " unlocked.");
}
function equipSkin(id) {
  if (!profile.unlockedSkins.includes(id)) return;
  profile.equippedSkin = id;
  activeSkin = id;
  saveProfile();
  render();
  toast("Arena skin equipped.");
}
function resetProfile() {
  $("#modal-root").innerHTML = '<div class="modal-backdrop"><section class="modal-card"><div class="eyebrow">LOCAL DATA / CONFIRMATION</div><h2>WIPE YOUR FILE?</h2><p>This resets your local rating, matches, shards, quests, and cosmetics. This cannot be undone.</p><div class="modal-actions"><button class="btn btn-secondary" data-action="close-modal">CANCEL</button><button class="btn btn-danger" data-action="confirm-reset">RESET PROFILE</button></div></section></div>';
}
function setView(view) {
  currentView = view;
  $("#sidebar").classList.remove("open");
  render();
}
function startFromSetup() {
  const opponentSelect = $("#opponent-select");
  const difficultySelect = $("#difficulty-select");
  selectedOpponent = opponentSelect ? opponentSelect.value : selectedOpponent;
  selectedDifficulty = difficultySelect ? difficultySelect.value : selectedDifficulty;
  if (selectedMode === "local") {
    selectedLocalMode = "chaos";
    startGame("local", "local", selectedDifficulty, false);
  } else {
    startGame(selectedMode, selectedOpponent, selectedDifficulty, false);
  }
}
function handleAction(action, element) {
  if (action === "account-signup") accountCreate();
  else if (action === "account-signin") accountLogin();
  else if (action === "account-signout") accountLogout();
  else if (action === "account-reset") accountResetPassword();
  else if (action === "cloud-sync") cloudSaveNow(true);
  else if (action === "use-cloud-save") useCloudConflict();
  else if (action === "use-device-save") useLocalConflict();
  else if (action === "open-online") setView("online");
  else if (action === "create-room") createOnlineRoom();
  else if (action === "join-room") joinOnlineRoom();
  else if (action === "copy-room") copyRoomCode();
  else if (action === "leave-room") leaveOnlineRoom();
  else if (action === "roll-power") rerollPowerChoices();
  else if (action === "lock-power") lockDraftChoice();
  else if (action === "go-play") setView("play");
  else if (action === "quick-chaos") { selectedMode = "chaos"; setView("play"); startGame("chaos", "bot", selectedDifficulty, false); }
  else if (action === "quick-classic") { selectedMode = "classic"; setView("play"); startGame("classic", "bot", selectedDifficulty, false); }
  else if (action === "start-match") startFromSetup();
  else if (action === "start-puzzle") startGame("classic", "puzzle", "steady", true);
  else if (action === "start-lab") startGame("chaos", "bot", "easy", false);
  else if (action === "flip-board") { boardFlipped = !boardFlipped; render(); }
  else if (action === "new-match") { $("#modal-root").innerHTML = '<div class="modal-backdrop"><section class="modal-card"><div class="eyebrow">MATCH CONTROL</div><h2>START OVER?</h2><p>Your current match will be abandoned. This does not affect your saved match record.</p><div class="modal-actions"><button class="btn btn-secondary" data-action="close-modal">KEEP PLAYING</button><button class="btn btn-primary" data-action="confirm-new">NEW MATCH</button></div></section></div>'; }
  else if (action === "confirm-new") { $("#modal-root").innerHTML = ""; startGame(matchMode, opponent, difficulty, puzzleActive); }
  else if (action === "resign") {
    if (opponent === "online" && net.role === "guest") peerRoom?.send({ type: "resign" });
    else finishGame("b", "RESIGNATION");
  }
  else if (action === "cancel-power") { pendingPower = null; render(); }
  else if (action === "rematch") { $("#modal-root").innerHTML = ""; startGame(matchMode, opponent, difficulty, false); }
  else if (action === "retry-puzzle") { $("#modal-root").innerHTML = ""; startGame("classic", "puzzle", "steady", true); }
  else if (action === "back-lobby") { $("#modal-root").innerHTML = ""; puzzleActive = false; setView(opponent === "online" ? "online" : "play"); }
  else if (action === "claim-quest") updateDailyClaim(element.dataset.quest);
  else if (action === "buy-skin") buySkin(element.dataset.skin);
  else if (action === "equip-skin") equipSkin(element.dataset.skin);
  else if (action === "buy-piece") buyPieceSkin(element.dataset.piece);
  else if (action === "equip-piece") equipPieceSkin(element.dataset.piece);
  else if (action === "buy-emote") buyEmote(element.dataset.emoteId);
  else if (action === "equip-emote") equipEmote(element.dataset.emoteId);
  else if (action === "save-name") {
    const input = $("#profile-name-input");
    const name = (input.value || "").trim().replace(/\s+/g, " ").slice(0, 16);
    if (!name) { toast("Choose a callsign first.", "error"); return; }
    profile.name = name.toUpperCase();
    saveProfile();
    render();
    toast("Callsign updated.");
  }
  else if (action === "reset-profile") resetProfile();
  else if (action === "close-modal") $("#modal-root").innerHTML = "";
  else if (action === "confirm-reset") { profile = makeProfile(); saveProfile(); $("#modal-root").innerHTML = ""; setView("profile"); toast("Local profile reset."); }
}
document.addEventListener("click", event => {
  const nav = event.target.closest("[data-view]");
  if (nav) {
    event.preventDefault();
    setView(nav.dataset.view);
    return;
  }
  const square = event.target.closest("[data-square]");
  if (square) { handleSquareClick(square.dataset.square); return; }
  const power = event.target.closest("[data-power]");
  if (power) { activatePower(power.dataset.power); return; }
  const emote = event.target.closest("[data-emote]");
  if (emote) { sendMatchEmote(emote.dataset.emote); return; }
  const mode = event.target.closest("[data-mode]");
  if (mode) {
    selectedMode = mode.dataset.mode;
    render();
    return;
  }
  const action = event.target.closest("[data-action]");
  if (action) { handleAction(action.dataset.action, action); return; }
});
$("#mobile-menu").addEventListener("click", () => $("#sidebar").classList.toggle("open"));
document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    if (pendingPower) { pendingPower = null; render(); }
    $("#sidebar").classList.remove("open");
    if ($("#modal-root").innerHTML) $("#modal-root").innerHTML = "";
  }
});
window.addEventListener("storage", event => {
  if (event.key === PROFILE_KEY && event.newValue) {
    profile = loadProfile();
    render();
  }
});
if (!profile.daily || profile.daily.date !== todayKey()) {
  profile.daily = { date: todayKey(), matches: 0, captures: 0, wins: 0, claimed: [] };
  saveProfile();
}


function renderOnline() {
  const hasRoom = Boolean(net.roomCode && peerRoom && !peerRoom.closed);
  const room = hasRoom ? '<div class="room-code-box"><small>YOUR INVITE CODE</small><strong id="room-code-value">' + escapeHTML(net.roomCode) + '</strong><button class="btn btn-secondary btn-small" data-action="copy-room">COPY CODE</button></div>' : "";
  return heading("ONLINE / DIRECT INVITE", "PLAY A REAL PERSON.", "Create a private room and send the six-character code to a friend. Both players roll three powers, lock one, and play the same live board.") +
    '<div class="online-layout"><section class="panel online-create"><div class="online-icon">⇄</div><div class="eyebrow">HOST A MATCH</div><h2>MAKE A ROOM.</h2><p>Your browser becomes the match host. Share the code with one friend; they join from their own device.</p><button class="btn btn-primary" data-action="create-room" ' + (hasRoom ? "disabled" : "") + '>CREATE PRIVATE ROOM ↗</button>' + room + '</section>' +
    '<section class="panel online-join"><div class="online-icon">⌁</div><div class="eyebrow">JOIN A MATCH</div><h2>ENTER THE CODE.</h2><p>Got a code from a friend? Type it below to connect directly to their game.</p><input class="text-input room-input" id="room-code-input" maxlength="6" placeholder="ABC123" autocomplete="off" aria-label="Six character room code"><button class="btn btn-secondary" data-action="join-room" ' + (hasRoom ? "disabled" : "") + '>JOIN ROOM ↗</button></section></div>' +
    (hasRoom ? '<section class="panel section-gap room-status"><span class="status-dot"></span><div><strong>' + escapeHTML(net.status) + '</strong><small>' + (net.connected ? "CONNECTED · " + (net.role === "host" ? "HOST" : "GUEST") : "WAITING FOR CONNECTION") + '</small></div><button class="btn btn-danger btn-small" data-action="leave-room">LEAVE ROOM</button></section>' : '<section class="panel section-gap"><div class="eyebrow">HOW THE CONNECTION WORKS</div><h3 style="font:700 24px var(--display);margin:8px 0">NO GAME SERVER TO RUN.</h3><p style="color:var(--muted);font-size:10px;line-height:1.7;margin:0">The room code uses a lightweight public signalling service to find the other browser. Chess moves then travel over a WebRTC data channel between players. Some restrictive networks may require a relay, and the host must keep their tab open.</p></section>') +
    '<section class="panel section-gap"><div class="panel-heading"><h3>ONLINE MATCH RULES</h3><small>PRIVATE FRIEND ROOM</small></div><div class="mode-features"><span>2 PLAYERS</span><span>1 POWER EACH</span><span>HOST VALIDATES MOVES</span><span>LIVE STATE SYNC</span><span>NO GLOBAL MATCHMAKING YET</span></div></section>';
}

function renderPowerDraft() {
  const online = draftContext?.who === "online";
  const selected = draftSelection ? getPowerById(draftSelection) : null;
  const options = draftChoices.map(power => '<button class="draft-power-card ' + (draftSelection === power.id ? "chosen" : "") + '" data-draft-power="' + power.id + '"><div class="draft-card-top"><span class="draft-rarity ' + power.rarity + '">' + power.rarity.toUpperCase() + '</span><span class="draft-icon">' + power.icon + '</span></div><small>' + escapeHTML(power.universe) + '</small><strong>' + escapeHTML(power.technique) + '</strong><p>' + escapeHTML(power.description) + '</p><div class="draft-card-foot"><span>' + power.cost + ' ENERGY</span><span>' + power.effectId.toUpperCase() + '</span></div></button>').join("");
  return heading("POWER ROLL / 1,000 IN THE VAULT", "ROLL YOUR DESTINY.", "Three random powers. One pick. Your selected ability is your only power for the entire match. Every player gets their own roll.") +
    '<div class="draft-summary"><div><strong>' + POWER_COUNT.toLocaleString() + '</strong><small>UNIQUE POWER CARDS</small></div><div><strong>' + POWER_UNIVERSES + '</strong><small>UNIVERSES</small></div><div><strong>' + POWER_ARCHETYPES + '</strong><small>NAMED TECHNIQUES</small></div><div><strong>' + POWER_MECHANICS + '</strong><small>CORE MECHANICS</small></div></div>' +
    '<div class="draft-instruction"><span class="draft-step">01</span><div><strong>CHOOSE ONE POWER.</strong><small>Click a card to preview it. Locking your choice starts the match when both players are ready.</small></div><span class="draft-count">' + (draftSelection ? "1 / 1 SELECTED" : "0 / 1 SELECTED") + '</span></div>' +
    '<div class="draft-grid">' + options + '</div>' +
    '<div class="draft-actions"><button class="btn btn-secondary" data-action="roll-power" ' + (online && net.myPower ? "disabled" : "") + '>↻ ' + (draftRerolls === 0 ? 'FREE REROLL' : 'ROLL AGAIN · 25 ◈') + '</button>' + '<div class="draft-selected">' + (selected ? '<strong>' + escapeHTML(selected.name) + '</strong><small>LOCK THIS POWER FOR YOUR MATCH</small>' : '<strong>NO POWER SELECTED</strong><small>CHOOSE ONE OF THE THREE CARDS ABOVE</small>') + '</div><button class="btn btn-primary" data-action="lock-power" ' + (!selected || (online && net.myPower) ? "disabled" : "") + '>LOCK POWER ↗</button></div>' +
    (online ? '<div class="panel section-gap room-status"><span class="status-dot"></span><div><strong>' + (net.myPower ? "Your power is locked. Waiting for your opponent…" : "Connected to " + escapeHTML(net.remoteName) + ".") + '</strong><small>' + (net.role === "host" ? "YOU ARE WHITE / ROOM HOST" : "YOU ARE BLACK / ROOM GUEST") + '</small></div></div>' : '<p class="draft-footnote">The power names are crossover references for a fan-made game. No official character artwork, logos, music, or franchise assets are used.</p>');
}

function beginPowerDraft(context) {
  draftContext = context;
  draftChoices = rollPowerChoices(3);
  draftSelection = null;
  draftRerolls = 0;
  if (context.who === "online") {
    net.phase = "draft";
    net.myPower = null;
    net.remotePower = null;
    net.status = "Both players are choosing a power.";
  }
  currentView = "draft";
  $("#modal-root").innerHTML = "";
  render();
}

function rerollPowerChoices() {
  if (draftSelection) { toast("Your choice is already selected. Clear it by returning to the arena.", "error"); return; }
  const price = draftRerolls === 0 ? 0 : 25;
  if (profile.credits < price) { toast("You need 25 shards to reroll.", "error"); return; }
  if (price) {
    profile.credits -= price;
    saveProfile();
  }
  draftChoices = rollPowerChoices(3, draftChoices.map(power => power.id));
  draftRerolls++;
  draftSelection = null;
  render();
  toast(price ? "Three new powers rolled." : "Free roll refreshed.");
}

function lockDraftChoice() {
  if (!draftSelection) { toast("Choose one power first.", "error"); return; }
  const power = getPowerById(draftSelection);
  if (!power) { toast("That power is not in the catalogue.", "error"); return; }
  if (draftContext?.who === "online") {
    if (!net.connected || !peerRoom) { toast("Your peer connection is no longer active.", "error"); return; }
    net.myPower = power;
    peerRoom.send({ type: "power-pick", id: power.id });
    render();
    if (net.role === "host" && net.remotePower) launchOnlineMatch();
    else toast("Power locked. Waiting for the other player.");
    return;
  }
  const context = draftContext || { mode: "chaos", who: "bot", level: "steady" };
  const botPower = rollPowerChoices(1, [power.id])[0];
  startGame(context.mode, context.who, context.level, false, power, true, { w: power, b: botPower });
}

function launchOnlineMatch() {
  if (net.role !== "host" || !net.myPower || !net.remotePower || !net.connected) return;
  net.phase = "match";
  const loadout = { w: net.myPower, b: net.remotePower };
  peerRoom?.send({ type: "start", whitePower: loadout.w.id, blackPower: loadout.b.id, hostName: profile.name });
  startGame("chaos", "online", "steady", false, null, true, loadout);
}

function createRoomCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, value => alphabet[value % alphabet.length]).join("");
}

async function createOnlineRoom() {
  try {
    leaveOnlineRoom(false);
    const code = createRoomCode();
    net = { role: "host", connected: false, phase: "waiting", roomCode: code, status: "Opening private room…", remoteName: "GUEST", myPower: null, remotePower: null };
    peerRoom = new PeerRoom({ onData: handlePeerData, onStatus: handlePeerStatus });
    currentView = "online";
    render();
    await peerRoom.host(code);
    net.status = "Room is open. Send the code to your friend.";
    render();
    toast("Room " + code + " created.");
  } catch (error) {
    net.status = error?.message || "Could not create this room.";
    toast(net.status, "error");
    render();
  }
}

async function joinOnlineRoom() {
  const input = $("#room-code-input");
  const code = (input?.value || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
  if (code.length !== 6) { toast("Enter the full six-character room code.", "error"); return; }
  try {
    leaveOnlineRoom(false);
    net = { role: "guest", connected: false, phase: "joining", roomCode: code, status: "Connecting to host…", remoteName: "HOST", myPower: null, remotePower: null };
    peerRoom = new PeerRoom({ onData: handlePeerData, onStatus: handlePeerStatus });
    currentView = "online";
    render();
    await peerRoom.join(code);
    net.connected = true;
    net.status = "Connected. Waiting for the host.";
    peerRoom.send({ type: "hello", name: profile.name });
    render();
  } catch (error) {
    net.status = error?.message || "Could not join that room.";
    toast(net.status, "error");
    render();
  }
}

function handlePeerStatus(message) {
  net.status = message;
  if (message === "Peer-to-peer connection ready." && net.role === "host") {
    peerRoom?.send({ type: "hello", name: profile.name });
  }
  if (message === "Opponent disconnected.") {
    net.connected = false;
    toast("Your opponent disconnected.", "error");
  }
  if (currentView === "online" || currentView === "draft") render();
}

function handlePeerData(message) {
  if (!message || typeof message !== "object") return;
  if (message.type === "emote") {
    const item = EMOTES.find(entry => entry.id === message.id);
    if (!item) return;
    const speaker = String(message.name || net.remoteName || "OPPONENT").slice(0, 16);
    if (net.role === "host" && peerRoom) peerRoom.send({ type: "emote", id: item.id, name: speaker });
    toast(speaker + " " + item.icon + " " + item.name);
    return;
  }
  if (message.type === "disconnect") {
    net.connected = false;
    net.status = "Opponent disconnected.";
    if (currentView === "online" || currentView === "match") render();
    return;
  }
  if (message.type === "hello") {
    if (net.role === "host") {
      net.connected = true;
      net.remoteName = String(message.name || "GUEST").slice(0, 16);
      peerRoom?.send({ type: "welcome", name: profile.name });
      if (net.phase !== "draft" && net.phase !== "match") beginPowerDraft({ mode: "chaos", who: "online", level: "steady" });
      else if (currentView === "online") render();
    } else {
      net.remoteName = String(message.name || "HOST").slice(0, 16);
    }
    return;
  }
  if (message.type === "welcome" && net.role === "guest") {
    net.connected = true;
    net.remoteName = String(message.name || "HOST").slice(0, 16);
    net.status = "Connected. Roll your power.";
    beginPowerDraft({ mode: "chaos", who: "online", level: "steady" });
    return;
  }
  if (message.type === "power-pick" && net.role === "host" && net.phase === "draft") {
    const power = getPowerById(message.id);
    if (!power) { peerRoom?.send({ type: "error", message: "Invalid power selection." }); return; }
    net.remotePower = power;
    if (net.myPower) launchOnlineMatch();
    else { net.status = "Opponent picked. Lock your power to start."; render(); }
    return;
  }
  if (message.type === "start" && net.role === "guest") {
    const whitePower = getPowerById(message.whitePower);
    const blackPower = getPowerById(message.blackPower);
    if (!whitePower || !blackPower) { toast("Host sent an invalid loadout.", "error"); return; }
    net.phase = "match";
    net.connected = true;
    net.remoteName = String(message.hostName || net.remoteName || "HOST").slice(0, 16);
    startGame("chaos", "online", "steady", false, null, true, { w: whitePower, b: blackPower });
    return;
  }
  if (message.type === "action" && net.role === "host" && opponent === "online" && !gameOver) {
    if (chess.turn() !== "b") return;
    handlingRemote = true;
    try {
      if (message.action === "move" && typeof message.from === "string" && typeof message.to === "string") {
        doNormalMove(message.from, message.to);
      } else if (message.action === "power") {
        const power = activePowers.b;
        if (power && power.id === message.powerId && power.effectId === message.effectId) {
          pendingPower = { id: power.effectId, from: message.from || null };
          handlePowerTarget(message.square);
          if (pendingPower) pendingPower = null;
          publishNetState();
        }
      } else if (message.action === "instant-power") {
        const power = activePowers.b;
        if (power && power.id === message.powerId && power.effectId === message.effectId && ["haste", "surge", "drain", "timeStop"].includes(power.effectId)) activatePower(power.effectId);
      }
    } finally {
      handlingRemote = false;
    }
    return;
  }
  if (message.type === "resign" && net.role === "host" && opponent === "online") {
    finishGame("w", "OPPONENT RESIGNED");
    return;
  }
  if (message.type === "state" && net.role === "guest" && opponent === "online") {
    const wasOver = gameOver;
    try { chess = new Chess(message.fen); } catch (error) { toast("Received an invalid board snapshot.", "error"); return; }
    energy = message.energy || energy;
    frozen = message.frozen || { w: {}, b: {} };
    shielded = message.shielded || { w: {}, b: {} };
    doubleMoves = Number(message.doubleMoves || 0);
    powerLocked = message.powerLocked || { w: false, b: false };
    actionLog = Array.isArray(message.actionLog) ? message.actionLog : actionLog;
    gameCaptures = Number(message.gameCaptures || 0);
    gameOver = false;
    if (message.gameOver && !wasOver) {
      finishGame(message.winner, message.reason || "MATCH COMPLETE", true);
    } else {
      gameOver = Boolean(message.gameOver);
      render();
    }
  }
  if (message.type === "error") toast(String(message.message || "Network action rejected."), "error");
}

function publishNetState() {
  if (opponent !== "online" || net.role !== "host" || !net.connected || !peerRoom || !chess) return;
  peerRoom.send({
    type: "state",
    fen: chess.fen(),
    energy: energy,
    frozen: frozen,
    shielded: shielded,
    doubleMoves: doubleMoves,
    powerLocked: powerLocked,
    actionLog: actionLog,
    gameCaptures: gameCaptures,
    gameOver: gameOver,
    winner: lastResult?.winner || null,
    reason: lastResult?.reason || null
  });
}

async function copyRoomCode() {
  if (!net.roomCode) return;
  try {
    await navigator.clipboard.writeText(net.roomCode);
    toast("Room code copied.");
  } catch (error) {
    toast("Copy was blocked by your browser. Select the code manually.", "error");
  }
}

function leaveOnlineRoom(returnToLobby = true) {
  peerRoom?.close();
  peerRoom = null;
  net = { role: null, connected: false, phase: "idle", roomCode: "", status: "Create a room or join a friend.", remoteName: "OPPONENT", myPower: null, remotePower: null };
  if (returnToLobby) {
    currentView = "play";
    render();
  }
}

document.addEventListener("click", event => {
  const card = event.target.closest("[data-draft-power]");
  if (!card) return;
  if (net.phase === "draft" && net.myPower) return;
  draftSelection = card.dataset.draftPower;
  render();
});

render();


function normalizeCloudProfile(data) {
  const merged = Object.assign(makeProfile(), data || {});
  if (!merged.daily || merged.daily.date !== todayKey()) merged.daily = { date: todayKey(), matches: 0, captures: 0, wins: 0, claimed: [] };
  if (!Array.isArray(merged.unlockedSkins)) merged.unlockedSkins = ["standard"];
  if (!merged.unlockedSkins.includes("standard")) merged.unlockedSkins.unshift("standard");
  if (!Array.isArray(merged.unlockedPieces)) merged.unlockedPieces = ["classic"];
  if (!merged.unlockedPieces.includes("classic")) merged.unlockedPieces.unshift("classic");
  if (!Array.isArray(merged.unlockedEmotes)) merged.unlockedEmotes = ["gg"];
  if (!merged.unlockedEmotes.includes("gg")) merged.unlockedEmotes.unshift("gg");
  if (!merged.daily.claimed) merged.daily.claimed = [];
  return merged;
}

function scheduleCloudSave() {
  if (!cloudConfigured || !cloudState.user || cloudConflict) return;
  if (cloudSaveTimer) window.clearTimeout(cloudSaveTimer);
  cloudState.sync = "pending";
  syncChrome();
  cloudSaveTimer = window.setTimeout(() => cloudSaveNow(false), 900);
}

async function cloudSaveNow(showToast = false) {
  if (!cloudConfigured || !cloudState.user) {
    if (showToast) toast("Sign in to an account to sync your progress.", "error");
    return;
  }
  if (cloudConflict) {
    if (showToast) toast("Choose which save to keep first.", "error");
    return;
  }
  if (cloudSaveTimer) {
    window.clearTimeout(cloudSaveTimer);
    cloudSaveTimer = null;
  }
  cloudState.sync = "saving";
  cloudState.status = "Saving to your cloud account…";
  syncChrome();
  if (currentView === "account") render();
  try {
    const snapshot = {
      app: "rogueboard",
      version: 1,
      profile: JSON.parse(JSON.stringify(profile)),
      savedAt: new Date().toISOString()
    };
    const result = await cloudWriteSave(cloudState.user.id, snapshot);
    cloudState.sync = "saved";
    cloudState.status = "Cloud save is up to date.";
    cloudState.lastSync = result.updated_at || new Date().toISOString();
    cloudState.error = "";
    syncChrome();
    if (currentView === "account") render();
    if (showToast) toast("Progress saved to your account.");
  } catch (error) {
    cloudState.sync = "error";
    cloudState.status = error?.message || "Cloud save failed.";
    cloudState.error = cloudState.status;
    syncChrome();
    if (currentView === "account") render();
    if (showToast) toast("Cloud save failed: " + cloudState.status, "error");
  }
}

async function hydrateCloudSave(user) {
  if (!user || !cloudConfigured) return;
  if (cloudLoadedUserId === user.id || cloudHydratingUserId === user.id) return;
  cloudHydratingUserId = user.id;
  cloudState.user = user;
  cloudState.status = "Loading your cloud save…";
  cloudState.sync = "loading";
  syncChrome();
  try {
    const remote = await cloudLoadSave(user.id);
    const localText = localStorage.getItem(PROFILE_KEY);
    const localData = localText ? normalizeCloudProfile(JSON.parse(localText)) : null;
    const remoteData = remote?.save_data?.profile ? normalizeCloudProfile(remote.save_data.profile) : null;

    if (remoteData && localData && JSON.stringify(remoteData) !== JSON.stringify(localData)) {
      cloudConflict = {
        local: localData,
        remote: remoteData,
        remoteUpdatedAt: remote.updated_at || null
      };
      cloudState.status = "Two different saves found. Choose which one to keep.";
      cloudState.sync = "conflict";
      cloudLoadedUserId = user.id;
      currentView = "account";
      render();
      return;
    }

    if (remoteData) {
      profile = remoteData;
      localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
      cloudState.status = "Cloud save loaded on this device.";
      cloudState.sync = "saved";
      cloudState.lastSync = remote.updated_at || null;
    } else {
      cloudState.status = "Account is ready. Uploading this device's progress…";
      cloudState.sync = "saving";
      const snapshot = {
        app: "rogueboard",
        version: 1,
        profile: JSON.parse(JSON.stringify(profile)),
        savedAt: new Date().toISOString()
      };
      const result = await cloudWriteSave(user.id, snapshot);
      cloudState.status = "This device's progress is now backed up to the cloud.";
      cloudState.sync = "saved";
      cloudState.lastSync = result.updated_at || new Date().toISOString();
    }
    cloudState.error = "";
    cloudLoadedUserId = user.id;
    saveProfile();
    syncChrome();
    if (currentView === "account") render();
  } catch (error) {
    cloudState.status = error?.message || "Could not load the cloud save.";
    cloudState.sync = "error";
    cloudState.error = cloudState.status;
    syncChrome();
    if (currentView === "account") render();
  } finally {
    cloudHydratingUserId = null;
  }
}

async function handleCloudSession(user) {
  if (!user) {
    cloudState.user = null;
    cloudState.sync = "local";
    cloudState.status = cloudConfigured ? "Signed out. Progress is saved on this device." : "Cloud not configured.";
    cloudConflict = null;
    cloudLoadedUserId = null;
    syncChrome();
    if (currentView === "account") render();
    return;
  }
  cloudState.user = user;
  await hydrateCloudSave(user);
}

async function initCloud() {
  if (!cloudConfigured) {
    cloudState.ready = true;
    cloudState.status = "Add your Supabase project settings to enable accounts.";
    syncChrome();
    return;
  }
  cloudState.status = "Connecting to Supabase…";
  try {
    cloudAuthSubscription = cloudOnAuthStateChange((event, session) => {
      window.setTimeout(() => handleCloudSession(session?.user || null), 0);
    });
    const { data, error } = await cloudGetSession();
    if (error) throw error;
    await handleCloudSession(data.session?.user || null);
    cloudState.ready = true;
    if (!data.session?.user) cloudState.status = "Ready. Sign in or create an account.";
  } catch (error) {
    cloudState.status = error?.message || "Could not initialize account services.";
    cloudState.sync = "error";
    cloudState.error = cloudState.status;
  }
  syncChrome();
  if (currentView === "account") render();
}

function renderAccount() {
  const configured = cloudConfigured;
  if (!configured) {
    return heading("ACCOUNT / CLOUD SAVE", "YOUR PROGRESS, EVERYWHERE.", "Create a player account and back up your rating, shards, cosmetics, quests, and match record across devices.") +
      '<section class="panel cloud-setup-panel"><div class="cloud-setup-icon">☁</div><div class="eyebrow">ONE-TIME BACKEND SETUP REQUIRED</div><h2>CONNECT A CLOUD DATABASE.</h2><p>Accounts use Supabase Auth and your saves live in a private Postgres row. This is ready to connect, but a Supabase project belongs to you, so its project URL and publishable key must be added before registration can work.</p><div class="cloud-steps"><div><b>01</b><span>Create a free Supabase project.</span></div><div><b>02</b><span>Run the SQL in supabase/rogueboard.sql.</span></div><div><b>03</b><span>Put the Project URL and publishable key in illegal-chess/cloud-config.js.</span></div></div><div class="cloud-setup-actions"><a class="btn btn-primary" href="https://supabase.com/dashboard" target="_blank" rel="noreferrer">OPEN SUPABASE ↗</a><a class="btn btn-secondary" href="https://github.com/LRV2017/RinconCasino/blob/main/illegal-chess/ACCOUNTS.md" target="_blank" rel="noreferrer">SETUP GUIDE ↗</a></div><p class="cloud-safety-note">Only the public publishable key belongs in the browser. Never use a service-role or secret key here.</p></section>' +
      '<section class="panel section-gap"><div class="panel-heading"><h3>YOUR CURRENT SAVE</h3><span class="account-state-badge">LOCAL CACHE</span></div><p class="mode-note">You can keep playing right now. Your existing local progress remains intact while cloud accounts are being connected.</p></section>';
  }

  if (cloudState.user && cloudConflict) {
    const local = cloudConflict.local;
    const remote = cloudConflict.remote;
    return heading("ACCOUNT / SAVE CONFLICT", "WHICH FILE IS YOURS?", "This browser and your account both contain progress. Nothing has been overwritten. Choose the version you want to keep.") +
      '<div class="conflict-grid"><section class="panel conflict-card"><div class="eyebrow">THIS DEVICE</div><h2>LOCAL SAVE</h2><div class="conflict-stat"><strong>' + local.name + '</strong><small>CALLSIGN</small></div><div class="conflict-stat"><strong>' + local.rating + '</strong><small>RATING</small></div><div class="conflict-stat"><strong>' + local.matches + '</strong><small>MATCHES</small></div><div class="conflict-stat"><strong>' + local.credits.toLocaleString() + '</strong><small>SHARDS</small></div><button class="btn btn-secondary" data-action="use-device-save">UPLOAD THIS DEVICE ↗</button></section>' +
      '<section class="panel conflict-card cloud-conflict-card"><div class="eyebrow">SUPABASE ACCOUNT</div><h2>CLOUD SAVE</h2><div class="conflict-stat"><strong>' + remote.name + '</strong><small>CALLSIGN</small></div><div class="conflict-stat"><strong>' + remote.rating + '</strong><small>RATING</small></div><div class="conflict-stat"><strong>' + remote.matches + '</strong><small>MATCHES</small></div><div class="conflict-stat"><strong>' + remote.credits.toLocaleString() + '</strong><small>SHARDS</small></div><button class="btn btn-primary" data-action="use-cloud-save">USE CLOUD SAVE ↗</button></section></div>' +
      '<p class="cloud-safety-note">Account: ' + escapeHTML(cloudState.user.email || "") + ' · Cloud updated: ' + (cloudConflict.remoteUpdatedAt ? new Date(cloudConflict.remoteUpdatedAt).toLocaleString() : "unknown") + '</p>';
  }

  if (cloudState.user) {
    return heading("ACCOUNT / CLOUD SAVE", "YOU'RE SIGNED IN.", "Your player profile is connected to an online account. Changes to progression sync automatically after you play.") +
      '<div class="account-layout"><section class="panel account-identity"><div class="profile-large-avatar">' + escapeHTML((profile.name || "R").slice(0, 1).toUpperCase()) + '</div><h2>' + escapeHTML(profile.name || "ROOKIE") + '</h2><p>' + escapeHTML(cloudState.user.email || "Authenticated player") + '</p><div class="account-tag"><span class="status-dot"></span> SUPABASE AUTHENTICATED</div><button class="btn btn-secondary" data-action="account-signout">SIGN OUT</button></section>' +
      '<section class="panel account-cloud"><div class="panel-heading"><h3>CLOUD SAVE STATUS</h3><span class="account-state-badge ' + (cloudState.sync === "saved" ? "is-saved" : cloudState.sync === "error" ? "is-error" : "") + '">' + cloudState.sync.toUpperCase() + '</span></div><div class="cloud-status-main"><span class="cloud-big-icon">☁</span><div><strong>' + escapeHTML(cloudState.status) + '</strong><small>' + (cloudState.lastSync ? "LAST SYNC · " + new Date(cloudState.lastSync).toLocaleString() : "WAITING FOR FIRST CLOUD SAVE") + '</small></div></div><button class="btn btn-primary" data-action="cloud-sync">SYNC NOW ↻</button>' +
      (cloudState.error ? '<p class="cloud-error">' + escapeHTML(cloudState.error) + '</p>' : '') +
      '<div class="cloud-save-includes"><span>SYNCED</span><small>Rating · XP · Shards · Matches · Quests · Achievements · Board skins</small></div></section></div>' +
      '<section class="panel section-gap"><div class="eyebrow">ACCOUNT SECURITY</div><h3 style="font:700 24px var(--display);margin:8px 0">PRIVATE SAVE. PUBLIC KEY ONLY.</h3><p class="mode-note">Your database row is restricted by Row Level Security to your authenticated user ID. Rogueboard never stores your password in the save file. The browser does retain an Auth session so you stay signed in on this device.</p></section>';
  }

  return heading("ACCOUNT / CLOUD SAVE", "MAKE IT OFFICIAL.", "Create an account so your progression follows you between browsers and devices.") +
    '<section class="panel auth-panel"><div class="auth-panel-title"><div class="eyebrow">ROGUEBOARD PLAYER ACCOUNT</div><h2>YOUR GAME. YOUR SAVE.</h2><p>One account for your callsign, rating, unlocks, and match record.</p></div><div class="auth-fields"><label for="account-name">CALLSIGN <small>USED AS YOUR PLAYER NAME</small></label><input id="account-name" class="text-input" maxlength="16" placeholder="ROOKIE" value="' + escapeHTML(profile.name || "") + '"><label for="account-email">EMAIL ADDRESS</label><input id="account-email" class="text-input" type="email" autocomplete="email" placeholder="you@example.com"><label for="account-password">PASSWORD</label><input id="account-password" class="text-input" type="password" autocomplete="current-password" minlength="8" placeholder="At least 8 characters"><div class="auth-actions"><button class="btn btn-primary" data-action="account-signup">CREATE ACCOUNT ↗</button><button class="btn btn-secondary" data-action="account-signin">SIGN IN</button></div><button class="text-button" data-action="account-reset">FORGOT PASSWORD?</button></div></section>' +
    '<section class="panel section-gap"><div class="panel-heading"><h3>LOCAL PROGRESS</h3><span class="account-state-badge is-saved">PRESERVED</span></div><p class="mode-note">Your current device profile is safe. When you create your first account, Rogueboard will back this profile up automatically. If an existing cloud save is found, you will choose which copy to keep.</p></section>' +
    (cloudState.status ? '<p class="cloud-foot-status">' + escapeHTML(cloudState.status) + '</p>' : '');
}

async function accountCreate() {
  if (!cloudConfigured) { toast("Set up Supabase first using the Account page instructions.", "error"); return; }
  const email = ($("#account-email")?.value || "").trim();
  const password = $("#account-password")?.value || "";
  const displayName = ($("#account-name")?.value || profile.name || "ROOKIE").trim().slice(0, 16);
  if (!displayName) { toast("Choose a callsign first.", "error"); return; }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { toast("Enter a valid email address.", "error"); return; }
  if (password.length < 8) { toast("Use a password with at least 8 characters.", "error"); return; }
  try {
    cloudState.status = "Creating your account…";
    profile.name = displayName.toUpperCase();
    saveProfile();
    render();
    const { data, error } = await cloudSignUp(email, password, displayName);
    if (error) throw error;
    if (data.user && data.session) await handleCloudSession(data.user);
    else {
      cloudState.status = "Account created. Check your email to confirm it, then return here to sign in.";
      toast("Check your email for the confirmation link.");
      render();
    }
  } catch (error) {
    cloudState.status = error?.message || "Could not create your account.";
    toast(cloudState.status, "error");
    render();
  }
}

async function accountLogin() {
  if (!cloudConfigured) { toast("Set up Supabase first using the Account page instructions.", "error"); return; }
  const email = ($("#account-email")?.value || "").trim();
  const password = $("#account-password")?.value || "";
  if (!email || !password) { toast("Enter your email and password.", "error"); return; }
  try {
    cloudState.status = "Signing in…";
    render();
    const { data, error } = await cloudSignIn(email, password);
    if (error) throw error;
    await handleCloudSession(data.user);
    toast("Signed in. Loading your account save.");
  } catch (error) {
    cloudState.status = error?.message || "Could not sign in.";
    toast(cloudState.status, "error");
    render();
  }
}

async function accountLogout() {
  try {
    if (cloudConfigured) await cloudSignOut();
    await handleCloudSession(null);
    currentView = "account";
    render();
    toast("Signed out. Your local cache stays on this device.");
  } catch (error) {
    toast(error?.message || "Could not sign out.", "error");
  }
}

async function accountResetPassword() {
  if (!cloudConfigured) { toast("Set up Supabase first using the Account page instructions.", "error"); return; }
  const email = ($("#account-email")?.value || "").trim();
  if (!email) { toast("Enter your email address first.", "error"); return; }
  try {
    const { error } = await cloudSendPasswordReset(email);
    if (error) throw error;
    cloudState.status = "If that account exists, a password reset link has been sent.";
    toast("Check your email for a password reset link.");
    render();
  } catch (error) {
    toast(error?.message || "Could not send the reset email.", "error");
  }
}

function useCloudConflict() {
  if (!cloudConflict) return;
  profile = normalizeCloudProfile(cloudConflict.remote);
  cloudConflict = null;
  try { localStorage.setItem(PROFILE_KEY, JSON.stringify(profile)); } catch {}
  cloudState.status = "Cloud save restored to this device.";
  cloudState.sync = "saved";
  cloudState.lastSync = new Date().toISOString();
  syncChrome();
  render();
  toast("Cloud save loaded.");
}

async function useLocalConflict() {
  if (!cloudConflict) return;
  profile = normalizeCloudProfile(cloudConflict.local);
  cloudConflict = null;
  try { localStorage.setItem(PROFILE_KEY, JSON.stringify(profile)); } catch {}
  await cloudSaveNow(true);
  render();
}



initCloud();
render();
