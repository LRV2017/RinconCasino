const universes = [
  "Dragon Ball", "Naruto", "One Piece", "Jujutsu Kaisen", "My Hero Academia",
  "Demon Slayer", "Bleach", "JoJo's Bizarre Adventure", "Hunter x Hunter", "Attack on Titan",
  "Pokémon", "Sonic the Hedgehog", "Super Mario", "The Legend of Zelda", "Metroid",
  "Kirby", "Minecraft", "Terraria", "Undertale", "Five Nights at Freddy's",
  "Halo", "DOOM", "Destiny", "God of War", "Elden Ring",
  "Dark Souls", "The Elder Scrolls", "Cyberpunk 2077", "The Witcher", "Final Fantasy",
  "Kingdom Hearts", "Star Wars", "Marvel", "DC", "Spider-Man",
  "X-Men", "Avatar: The Last Airbender", "Ben 10", "Transformers", "Power Rangers",
  "Teenage Mutant Ninja Turtles", "Invincible", "The Boys", "Stranger Things", "Harry Potter",
  "Percy Jackson", "The Lord of the Rings", "The Matrix", "Tron", "Sailor Moon"
];

const signaturePowers = [
  "Kamehameha", "Rasenshuriken", "Gum-Gum Gatling", "Hollow Purple", "One For All",
  "Hinokami Kagura", "Getsuga Tensho", "The World", "Jajanken", "Titan Shift",
  "Thunderbolt", "Chaos Control", "Fire Flower", "Triforce Burst", "Morph Ball",
  "Star Beam", "Ender Pearl", "Terra Beam", "Gaster Blaster", "Phantom Lure",
  "Energy Sword", "BFG Blast", "Golden Gun", "Spartan Rage", "Comet Azur",
  "Soul Spear", "Fus Ro Dah", "Sandevistan", "Quen Sign", "Limit Break",
  "Keyblade Release", "Force Push", "Repulsor Blast", "Speed Force Dash", "Web Snare",
  "Optic Blast", "Lightning Generation", "Alien X", "Energon Pulse", "Morphin Strike",
  "Turtle Power", "Viltrumite Charge", "Compound V Surge", "Eleven's Telekinesis", "Expelliarmus",
  "Riptide Strike", "Ring of Power", "Bullet Time", "Identity Disc", "Moon Tiara Action"
];

const techniques = [
  { name:"Energy Wave", effectId:"rocket", icon:"☄", cost:3, range:2, rarity:"common", description:"Blast an enemy piece within range of one of your pieces." },
  { name:"Shadow Echo", effectId:"clone", icon:"👥", cost:4, rarity:"epic", description:"Create a copy of one friendly non-king piece on an empty square." },
  { name:"Warp Step", effectId:"teleport", icon:"🌀", cost:3, rarity:"common", description:"Warp a friendly non-king piece to an empty square or take an unshielded enemy square." },
  { name:"Corruption Touch", effectId:"convert", icon:"🟣", cost:4, rarity:"epic", description:"Turn one enemy pawn into a pawn on your side." },
  { name:"Frost Bind", effectId:"freeze", icon:"❄", cost:2, rarity:"common", description:"Freeze one enemy non-king piece for its next turn." },
  { name:"Time Stop", effectId:"timeStop", icon:"⏸", cost:5, rarity:"legendary", description:"Freeze every enemy non-king piece for one enemy turn." },
  { name:"Aegis Guard", effectId:"shield", icon:"🛡", cost:2, rarity:"common", description:"Protect one friendly non-king piece from its next capture." },
  { name:"Fortress Field", effectId:"fortify", icon:"🏰", cost:4, rarity:"epic", description:"Shield a friendly piece and adjacent friendly pieces from one capture each." },
  { name:"Piercing Shot", effectId:"sniper", icon:"⌖", cost:4, rarity:"rare", description:"Remove an enemy piece on a clear rook, bishop, or queen line." },
  { name:"Energy Drain", effectId:"drain", icon:"🧲", cost:3, rarity:"rare", description:"Steal up to two energy from your opponent." },
  { name:"Mirror Exchange", effectId:"swap", icon:"⇄", cost:3, rarity:"rare", description:"Swap the positions of two friendly non-king pieces." },
  { name:"Enemy Exchange", effectId:"exchange", icon:"⚛", cost:5, rarity:"legendary", description:"Trade the positions of one friendly and one enemy non-king piece." },
  { name:"Time Surge", effectId:"haste", icon:"⏱", cost:4, rarity:"rare", description:"Take two consecutive normal moves before the opponent can respond." },
  { name:"Overdrive", effectId:"surge", icon:"⚡", cost:2, rarity:"common", description:"Refill three energy before ending your turn." },
  { name:"Summoning Spark", effectId:"summon", icon:"✨", cost:4, rarity:"epic", description:"Summon an extra pawn onto an empty square on your pawn rank." },
  { name:"Force Pulse", effectId:"push", icon:"💨", cost:3, rarity:"rare", description:"Push an enemy non-king piece one square away from your nearest piece." },
  { name:"Power Seal", effectId:"silence", icon:"🔇", cost:4, rarity:"epic", description:"Suppress the opponent's power until they complete their next move." },
  { name:"Ascension", effectId:"promote", icon:"👑", cost:4, rarity:"legendary", description:"Transform one friendly pawn into a queen, wherever it stands." },
  { name:"Gravity Prison", effectId:"prison", icon:"⛓", cost:4, rarity:"epic", description:"Freeze every enemy non-king piece on the chosen rank for one turn." },
  { name:"Gravity Pull", effectId:"pull", icon:"🪝", cost:3, rarity:"rare", description:"Pull an enemy non-king piece one square toward your nearest piece." }
];

export const POWER_CATALOG = Object.freeze(universes.flatMap((universe, universeIndex) =>
  techniques.map((technique, techniqueIndex) => ({
    id: "rb-" + String(universeIndex * techniques.length + techniqueIndex + 1).padStart(4, "0"),
    name: universe + " · " + signaturePowers[universeIndex] + " / " + technique.name,
    universe,
    technique: technique.name,
    effectId: technique.effectId,
    icon: technique.icon,
    cost: technique.cost,
    range: technique.range || 0,
    rarity: technique.rarity,
    description: technique.description,
    index: universeIndex * techniques.length + techniqueIndex
  }))
));

if (POWER_CATALOG.length !== 1000 || new Set(POWER_CATALOG.map(power => power.id)).size !== 1000) {
  throw new Error("Rogueboard power catalogue must contain exactly 1,000 unique entries.");
}

export function getPowerById(id) {
  return POWER_CATALOG.find(power => power.id === id) || null;
}

export function rollPowerChoices(count = 3, excluded = []) {
  const blocked = new Set(excluded);
  const pool = POWER_CATALOG.filter(power => !blocked.has(power.id));
  const chosen = [];
  while (chosen.length < Math.min(count, pool.length)) {
    const random = new Uint32Array(1);
    crypto.getRandomValues(random);
    const at = random[0] % pool.length;
    chosen.push(pool.splice(at, 1)[0]);
  }
  return chosen;
}

export const POWER_COUNT = POWER_CATALOG.length;
export const POWER_ARCHETYPES = techniques.length;
export const POWER_UNIVERSES = universes.length;

export const POWER_MECHANICS = new Set(techniques.map(technique => technique.effectId)).size;
