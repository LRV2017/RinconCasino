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

const techniques = [
  { name:"Energy Wave", effectId:"rocket", icon:"☄", cost:3, range:2, rarity:"common", description:"Fire a burst that removes an enemy piece within two squares of one of your pieces." },
  { name:"Overcharged Blast", effectId:"rocket", icon:"💥", cost:4, range:3, rarity:"rare", description:"A longer-range blast removes an enemy piece within three squares of your forces." },
  { name:"Warp Step", effectId:"teleport", icon:"🌀", cost:3, rarity:"common", description:"Warp one of your non-king pieces to an empty square or remove an enemy piece by taking its square." },
  { name:"Rift Walk", effectId:"teleport", icon:"🪐", cost:4, rarity:"epic", description:"Teleport one non-king piece anywhere on the board, including an occupied enemy square." },
  { name:"Frost Bind", effectId:"freeze", icon:"❄", cost:2, rarity:"common", description:"Freeze one enemy non-king piece so it cannot move during its next turn." },
  { name:"Absolute Zero", effectId:"freeze", icon:"🧊", cost:4, rarity:"legendary", description:"Freeze one enemy non-king piece for the next two enemy turns." },
  { name:"Aegis Guard", effectId:"shield", icon:"🛡", cost:2, rarity:"common", description:"Protect one of your non-king pieces from its next capture." },
  { name:"Perfect Barrier", effectId:"shield", icon:"🔰", cost:4, rarity:"epic", description:"Protect one friendly non-king piece from its next two capture attempts." },
  { name:"Piercing Shot", effectId:"sniper", icon:"⌖", cost:4, rarity:"rare", description:"Remove an enemy piece on a clear rook, bishop, or queen line." },
  { name:"Longshot", effectId:"sniper", icon:"🎯", cost:3, rarity:"common", description:"A precision shot removes an enemy piece visible along a clear line." },
  { name:"Mirror Exchange", effectId:"swap", icon:"⇄", cost:3, rarity:"rare", description:"Swap the positions of two friendly non-king pieces." },
  { name:"Quantum Trade", effectId:"swap", icon:"⚛", cost:4, rarity:"epic", description:"Exchange two friendly non-king pieces across the board." },
  { name:"Time Surge", effectId:"haste", icon:"⏱", cost:4, rarity:"rare", description:"Take two consecutive normal moves before the opponent can respond." },
  { name:"Overdrive", effectId:"haste", icon:"⚡", cost:3, rarity:"common", description:"Gain a second move immediately after your next normal move." },
  { name:"Comet Barrage", effectId:"rocket", icon:"🌠", cost:5, range:3, rarity:"legendary", description:"Launch a devastating long-range strike against one enemy piece." },
  { name:"Phase Shift", effectId:"teleport", icon:"🫥", cost:2, rarity:"rare", description:"Phase one friendly non-king piece to any empty square." },
  { name:"Cryo Lock", effectId:"freeze", icon:"🧬", cost:3, rarity:"epic", description:"Temporarily lock one enemy non-king piece in place." },
  { name:"Fortress Stance", effectId:"shield", icon:"🏰", cost:3, rarity:"rare", description:"Surround a friendly piece with a one-hit defensive field." },
  { name:"Rail Lance", effectId:"sniper", icon:"🔭", cost:5, rarity:"legendary", description:"Fire a high-energy shot through a clear rank, file, or diagonal." },
  { name:"Twin Souls", effectId:"swap", icon:"♊", cost:2, rarity:"common", description:"Switch two friendly non-king pieces to rewrite the position." }
];

export const POWER_CATALOG = Object.freeze(universes.flatMap((universe, universeIndex) =>
  techniques.map((technique, techniqueIndex) => ({
    id: "rb-" + String(universeIndex * techniques.length + techniqueIndex + 1).padStart(4, "0"),
    name: universe + " · " + technique.name,
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
