/**
 * farm.js — Parser e analisador de dados da fazenda
 * Converte dados brutos da API em objetos ricos com timers calculados
 */

// --- Crop grow times in milliseconds (base, without boosts) ---
const CROP_GROW_MS = {
  Sunflower: 60_000,        // 1 min
  Potato: 5 * 60_000,       // 5 min
  Rhubarb: 10 * 60_000,     // 10 min
  Pumpkin: 30 * 60_000,     // 30 min
  Zucchini: 30 * 60_000,    // 30 min
  Carrot: 3600_000,         // 1h
  Yam: 3600_000,            // 1h
  Cabbage: 2 * 3600_000,    // 2h
  Broccoli: 2 * 3600_000,   // 2h
  Soybean: 3 * 3600_000,    // 3h
  Beetroot: 4 * 3600_000,   // 4h
  Pepper: 4 * 3600_000,     // 4h
  Cauliflower: 8 * 3600_000,// 8h
  Parsnip: 12 * 3600_000,   // 12h
  Eggplant: 16 * 3600_000,  // 16h
  Corn: 20 * 3600_000,      // 20h
  Onion: 20 * 3600_000,     // 20h
  Radish: 24 * 3600_000,    // 24h
  Wheat: 24 * 3600_000,     // 24h
  Turnip: 24 * 3600_000,    // 24h
  Kale: 36 * 3600_000,      // 36h
  Artichoke: 36 * 3600_000, // 36h
  Barley: 48 * 3600_000,    // 48h
  Saltwort: 12 * 3600_000,  // 12h
};

const FRUIT_GROW_MS = {
  Tomato: 2 * 3600_000,
  Lemon: 4 * 3600_000,
  Blueberry: 6 * 3600_000,
  Orange: 8 * 3600_000,
  Apple: 12 * 3600_000,
  Banana: 12 * 3600_000,
  Celestine: 6 * 3600_000,
  Lunara: 12 * 3600_000,
  Duskberry: 24 * 3600_000,
  Grape: 12 * 3600_000,
};

const TREE_REGROW_MS   = 2 * 3600_000;  // 2h
const STONE_REGROW_MS  = 4 * 3600_000;  // 4h
const IRON_REGROW_MS   = 8 * 3600_000;  // 8h
const GOLD_REGROW_MS   = 24 * 3600_000; // 24h
const CRIMSTONE_REGROW = 24 * 3600_000;
const OIL_REFILL_MS    = 24 * 3600_000;

const ANIMAL_HUNGRY_MS = {
  Chicken: 3 * 3600_000,   // 3h
  Cow:     8 * 3600_000,   // 8h
  Sheep:   8 * 3600_000,   // 8h
  Pig:     6 * 3600_000,   // 6h
};

const BEEHIVE_HARVEST_MS = 24 * 3600_000;

// --- CROP EMOJI MAP ---
const CROP_EMOJI = {
  Sunflower: '🌻', Potato: '🥔', Pumpkin: '🎃', Carrot: '🥕', Cabbage: '🥬',
  Beetroot: '🫚', Cauliflower: '🥦', Parsnip: '🌿', Radish: '🔴', Wheat: '🌾',
  Kale: '🥬', Eggplant: '🍆', Corn: '🌽', Soybean: '🫘', Barley: '🌾',
  Rhubarb: '🌱', Zucchini: '🥒', Yam: '🍠', Broccoli: '🥦', Pepper: '🌶',
  Onion: '🧅', Turnip: '🫚', Artichoke: '🌿', Apple: '🍎', Blueberry: '🫐',
  Orange: '🍊', Banana: '🍌', Lemon: '🍋', Grape: '🍇', Rice: '🌾',
  Olive: '🫒', Tomato: '🍅',
};

const ANIMAL_EMOJI = {
  Chicken: '🐔', Cow: '🐄', Sheep: '🐑', Pig: '🐷',
};

// --- Utility: format countdown ---
function formatCountdown(ms) {
  if (ms <= 0) return 'READY';
  const s  = Math.floor(ms / 1000);
  const m  = Math.floor(s / 60);
  const h  = Math.floor(m / 60);
  const d  = Math.floor(h / 24);
  if (d > 0) return `${d}d ${h % 24}h`;
  if (h > 0) return `${h}h ${m % 60}m`;
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}s`;
}

function getTimerClass(ms) {
  if (ms <= 0) return 'ready';
  if (ms < 10 * 60_000) return 'soon'; // less than 10 min
  return 'waiting';
}

const BUMPKIN_EXP_TABLE = [0, 0, 2, 22, 205, 555, 1155, 2155, 3405, 5405, 7905, 10905, 14405, 18405, 22905, 27905, 33655, 40155, 47405, 55405, 64155, 73905, 84655, 96405, 109155, 122905, 137405, 152905, 169405, 186905, 205405, 225405, 246905, 269905, 294405, 320405, 348405, 378405, 410405, 444405, 480405, 518905, 559905, 603405, 649405, 697905, 749405, 803905, 861405, 921905, 985405, 1053905, 1127405, 1205905, 1289405, 1377905, 1476405, 1584905, 1703405, 1831905, 1970405, 2128905, 2287405, 2485905, 2704405, 2942905, 3221405, 3539905, 3898405, 4296905, 4735405, 5233905, 5743905, 6263905, 6793905, 7333905, 7883905, 8443905, 9013905, 9593905, 10183905, 10783905, 11393905, 12013905, 12643905, 13283905, 13933905, 14593905, 15263905, 15943905, 16633905, 17333905, 18043905, 18763905, 19493905, 20233905, 20983905, 21743905, 22513905, 23293905, 24083905, 24893905, 25723905, 26573905, 27443905, 28333905, 29243905, 30173905, 31123905, 32093905, 33083905];

function xpToLevel(xp) {
  let level = 1;
  for (let i = 1; i < BUMPKIN_EXP_TABLE.length; i++) {
    if (xp >= BUMPKIN_EXP_TABLE[i]) {
      level = i;
    } else {
      break;
    }
  }
  return level;
}

function xpForLevel(level) {
  if (level < 1) return 0;
  if (level >= BUMPKIN_EXP_TABLE.length) return BUMPKIN_EXP_TABLE[BUMPKIN_EXP_TABLE.length - 1];
  return BUMPKIN_EXP_TABLE[level];
}

function xpProgress(xp, knownLevel = null) {
  // Always calculate exact level from the official SFL array
  const level = xpToLevel(xp);
  const currentLevelXp = xpForLevel(level);
  const nextLevelXp    = xpForLevel(level + 1);
  const progress = nextLevelXp > currentLevelXp ? Math.min(1, Math.max(0, (xp - currentLevelXp) / (nextLevelXp - currentLevelXp))) : 1;
  return { level, progress };
}

function parseBumpkin(farm) {
  const bumpkin = farm?.bumpkin;
  if (!bumpkin) return null;

  const xp    = bumpkin.experience ?? 0;
  const { level, progress } = xpProgress(xp);

  return {
    id:         bumpkin.id,
    level,
    xp,
    xpProgress: progress,
    tokenUri:   bumpkin.tokenUri ?? null,
    equipped:   bumpkin.equipped ?? {},
    skills:     Object.keys(bumpkin.skills ?? {}),
    achievements: Object.keys(bumpkin.achievements ?? {}),
  };
}

// =============================================================
// MAIN PARSERS
// =============================================================

/**
 * Parse crops from farm data
 * Returns sorted array with ready items first
 */
function parseCrops(farm) {
  if (!farm?.crops) {
    const empty = [];
    empty.totalPlots = 0;
    empty.totalPlanted = 0;
    return empty;
  }
  const now = Date.now();
  const rawItems = [];

  const plotIds = Object.keys(farm.crops);
  
  Object.entries(farm.crops).forEach(([plotId, plot]) => {
    if (!plot.crop) return;
    const { name, plantedAt, baseDurationMs, boostedTime } = plot.crop;
    
    const defaultGrowMs = CROP_GROW_MS[name] ?? 3600_000;
    // Sunflower Land game engine sets either 'baseDurationMs' (new model) OR back-dates 'plantedAt' (legacy model)
    // If it has 'boostedTime', it's the legacy model, and we MUST use defaultGrowMs because plantedAt is already back-dated.
    const growMs = baseDurationMs !== undefined ? baseDurationMs : defaultGrowMs;
    const readyAt = plantedAt + growMs;
    
    const msLeft  = readyAt - now;

    rawItems.push({
      id:       plotId,
      name,
      emoji:    CROP_EMOJI[name] ?? '🌱',
      plantedAt,
      readyAt,
      msLeft,
      amount:   1, // Represents 1 plot
      fertiliser: plot.fertiliser ? plot.fertiliser.name : null,
      status:   getTimerClass(msLeft),
      countdown: formatCountdown(msLeft),
      type:     'crop',
    });
  });

  // Group by name, fertiliser, and readyAt (within 60 seconds)
  const grouped = [];
  rawItems.sort((a, b) => a.msLeft - b.msLeft).forEach(item => {
    const existing = grouped.find(g => g.name === item.name && g.fertiliser === item.fertiliser && Math.abs(g.readyAt - item.readyAt) < 60000);
    if (existing) {
      existing.amount += item.amount;
      if (item.readyAt > existing.readyAt) {
        existing.readyAt = item.readyAt;
        existing.msLeft = item.msLeft;
        existing.status = item.status;
        existing.countdown = item.countdown;
      }
    } else {
      grouped.push(item);
    }
  });

  grouped.totalPlots = plotIds.length;
  grouped.totalPlanted = rawItems.length;

  return grouped;
}

/**
 * Parse fruit patches
 */
function parseFruits(farm) {
  if (!farm?.fruitPatches) return [];
  const now = Date.now();
  const items = [];

  Object.entries(farm.fruitPatches).forEach(([id, patch]) => {
    if (!patch.fruit) return;
    const { name, plantedAt, harvestsLeft, harvestedAt } = patch.fruit;
    let growMs  = FRUIT_GROW_MS[name] ?? 3 * 3600_000;

    // Apply fertiliser boosts (Turbofruit Mix cuts time in half)
    if (patch.fertiliser && patch.fertiliser.name === 'Turbofruit Mix') {
      growMs = growMs / 2;
    }

    // Use harvestedAt if available and valid (> 0), else fallback to plantedAt
    const lastHarvest = harvestedAt && harvestedAt > 0 ? harvestedAt : (plantedAt ?? now);
    const readyAt = lastHarvest + growMs;
    const msLeft  = readyAt - now;

    items.push({
      id,
      name,
      emoji:    CROP_EMOJI[name] ?? '🍓',
      plantedAt,
      harvestedAt,
      readyAt,
      msLeft,
      harvestsLeft: harvestsLeft ?? '?',
      status:   getTimerClass(msLeft),
      countdown: formatCountdown(msLeft),
      type:     'fruit',
    });
  });

  return items.sort((a, b) => a.msLeft - b.msLeft);
}

/**
 * Parse trees
 */
function parseTrees(farm) {
  if (!farm?.trees) return [];
  const now = Date.now();

  return Object.entries(farm.trees).map(([id, tree]) => {
    const choppedAt = tree.wood?.choppedAt ?? null;
    const readyAt   = choppedAt ? choppedAt + TREE_REGROW_MS : null;
    const msLeft    = readyAt ? readyAt - now : -1;

    return {
      id,
      name:  'Tree',
      emoji: '🌳',
      msLeft: msLeft < 0 ? -1 : msLeft,
      status:    choppedAt ? getTimerClass(msLeft) : 'ready',
      countdown: choppedAt ? formatCountdown(msLeft) : 'Standing',
      type:  'tree',
    };
  }).filter(t => t.status !== 'ready' || true)
    .sort((a, b) => (a.msLeft < 0 ? -1 : a.msLeft) - (b.msLeft < 0 ? -1 : b.msLeft));
}

/**
 * Parse rocks (stone, iron, gold, crimstone)
 */
function parseRocks(farm) {
  const now = Date.now();
  const items = [];

  const addRocks = (collection, name, regrowMs, emoji) => {
    if (!collection) return;
    Object.entries(collection).forEach(([id, rock]) => {
      const minedAt = rock.stone?.minedAt ?? rock.minedAt ?? null;
      const readyAt = minedAt ? minedAt + regrowMs : null;
      const msLeft  = readyAt ? readyAt - now : -1;

      items.push({
        id: `${name}-${id}`,
        name,
        emoji,
        msLeft: msLeft,
        status:    minedAt ? getTimerClass(msLeft) : 'ready',
        countdown: minedAt ? formatCountdown(msLeft) : 'Available',
        type:  'rock',
      });
    });
  };

  addRocks(farm?.stones,       'Stone Rock',    STONE_REGROW_MS,  '🪨');
  addRocks(farm?.iron,         'Iron Rock',     IRON_REGROW_MS,   '🔩');
  addRocks(farm?.gold,         'Gold Rock',     GOLD_REGROW_MS,   '🥇');
  addRocks(farm?.crimstones,   'Crimstone',     CRIMSTONE_REGROW, '💎');

  return items.sort((a, b) => (a.msLeft < 0 ? -1 : a.msLeft) - (b.msLeft < 0 ? -1 : b.msLeft));
}

// Levels for animals based on experience
const ANIMAL_LEVELS = {
  Chicken: [0, 60, 120, 240, 360, 480, 660, 840, 1020, 1200, 1440, 1680, 1920, 2160, 2400, 2720],
  Cow: [0, 180, 360, 720, 1080, 1440, 1980, 2520, 3060, 3600, 4320, 5040, 5760, 6480, 7200, 8160],
  Sheep: [0, 120, 240, 480, 720, 960, 1320, 1680, 2040, 2400, 2880, 3360, 3840, 4320, 4800, 5440]
};

function getAnimalLevel(type, experience) {
  const xp = experience || 0;
  const thresholds = ANIMAL_LEVELS[type] || ANIMAL_LEVELS.Chicken;
  let level = 0;
  for (let i = 0; i < thresholds.length; i++) {
    if (xp >= thresholds[i]) {
      level = i;
    } else {
      break;
    }
  }
  return level;
}

/**
 * Parse animals (chickens, cows, sheep, pigs)
 */
function parseAnimals(farm) {
  const now = Date.now();
  const items = [];

  const addAnimals = (collection, type) => {
    if (!collection) return;
    Object.entries(collection).forEach(([id, animal]) => {
      const state    = animal.state ?? 'idle';

      // Produce readiness
      const awakeAt = animal.awakeAt ?? 0;
      const msLeft = awakeAt > 0 ? awakeAt - now : Infinity;
      
      const isSick = state === 'sick';
      
      const asleepAt = animal.asleepAt ?? 0;
      const lovedAt = animal.lovedAt ?? 0;
      const third = (awakeAt - asleepAt) / 3;
      const nextLoveAt = Math.max(asleepAt + third, lovedAt + third);
      const needsLove = awakeAt > 0 && now < awakeAt && now >= nextLoveAt;

      // If state is 'idle', it means it has been collected and is hungry.
      const isReady = state === 'ready' || (state !== 'idle' && !isSick && !needsLove && awakeAt > 0 && msLeft <= 0);
      const isSleeping = awakeAt > 0 && msLeft > 0 && !isSick && !needsLove;
      const isHungry = state === 'idle' && !isReady && !isSleeping;

      const level = getAnimalLevel(type, animal.experience);

      let statusStr = 'waiting';
      let countdownStr = formatCountdown(Math.max(0, msLeft));

      if (isReady) {
        statusStr = 'ready';
        countdownStr = 'COLLECT';
      } else if (isSick) {
        statusStr = 'sick';
        countdownStr = 'MEDICINE';
      } else if (needsLove) {
        statusStr = 'needsLove';
        countdownStr = 'PET ME';
      } else if (isHungry) {
        statusStr = 'soon';
        countdownStr = 'FEED ME';
      }

      // DEBUG - remove after fix
      console.log(`[ANIMAL DEBUG] id=${id} type=${type} state=${state} awakeAt=${awakeAt} msLeft=${msLeft === Infinity ? 'Inf' : Math.round(msLeft/1000)+'s'} => status=${statusStr}`);

      items.push({
        id,
        name:    `${type} #${parseInt(id) + 1}`,
        type,
        emoji:   ANIMAL_EMOJI[type] ?? '🐾',
        state,
        msLeft:     isReady ? 0 : (isHungry ? 0 : Math.max(0, msLeft)),
        isHungry:   isHungry,
        hasProduceReady: isReady,
        needsLove,
        level,
        experience: animal.experience || 0,
        status:     statusStr,
        countdown:  countdownStr,
        kind:    'animal',
      });
    });
  };

  if (farm?.henHouse?.animals) {
    Object.entries(farm.henHouse.animals).forEach(([id, animal]) => {
      const type   = animal.type ?? 'Chicken';
      addAnimals({ [id]: animal }, type);
    });
  } else if (farm?.chickens) {
    addAnimals(farm.chickens, 'Chicken');
  }
  if (farm?.barn?.animals) {
    Object.entries(farm.barn.animals).forEach(([id, animal]) => {
      const type   = animal.type ?? 'Cow';
      addAnimals({ [id]: animal }, type);
    });
  }

  return items.sort((a, b) => {
    if (a.isHungry !== b.isHungry) return a.isHungry ? -1 : 1;
    return (a.msLeft ?? 0) - (b.msLeft ?? 0);
  });
}

/**
 * Parse beehives
 */
function parseBeehives(farm) {
  if (!farm?.beehives) return [];
  const now = Date.now();

  return Object.entries(farm.beehives).map(([id, hive]) => {
    const producedAt = hive.honey?.updatedAt ?? 0;
    const readyAt    = producedAt + BEEHIVE_HARVEST_MS;
    const msLeft     = readyAt - now;

    return {
      id,
      name:     `Beehive #${parseInt(id) + 1}`,
      emoji:    '🍯',
      msLeft,
      status:    getTimerClass(msLeft),
      countdown: formatCountdown(msLeft),
      type:     'beehive',
      honeyAmount: hive.honey?.produced ?? 0,
    };
  }).sort((a, b) => a.msLeft - b.msLeft);
}

/**
 * Parse buildings (cooking, crafting)
 */
function parseBuildings(farm) {
  if (!farm?.buildings) return [];
  const now = Date.now();
  const items = [];

  const BUILDING_EMOJI = {
    Kitchen:     '🍳',
    Bakery:      '🥐',
    Deli:        '🥗',
    'Smoothie Shack': '🥤',
    'Fire Pit':  '🔥',
    Workbench:   '🔨'
  };

  Object.entries(farm.buildings).forEach(([name, instances]) => {
    if (!Array.isArray(instances)) return;
    instances.forEach((building, i) => {
      if (!building.crafting) return;
      const { readyAt, amount, name: itemName } = building.crafting;
      const msLeft = (readyAt ?? 0) - now;

      items.push({
        id:       `${name}-${i}`,
        name:     `${name}`,
        emoji:    BUILDING_EMOJI[name] ?? '🏠',
        cooking:  itemName ?? 'Unknown',
        amount,
        readyAt,
        msLeft,
        status:    getTimerClass(msLeft),
        countdown: formatCountdown(msLeft),
        type:     'building',
      });
    });
  });

  return items.sort((a, b) => a.msLeft - b.msLeft);
}

/**
 * Parse greenhouse
 */
function parseGreenhouse(farm) {
  if (!farm?.greenhouse?.pots) return [];
  const now = Date.now();

  return Object.entries(farm.greenhouse.pots).map(([id, pot]) => {
    if (!pot.plant) return null;
    const { name, plantedAt } = pot.plant;
    const growMs  = CROP_GROW_MS[name] ?? FRUIT_GROW_MS[name] ?? 3600_000;
    const readyAt = (plantedAt ?? now) + growMs;
    const msLeft  = readyAt - now;

    return {
      id,
      name,
      emoji:    CROP_EMOJI[name] ?? '🌱',
      msLeft,
      status:    getTimerClass(msLeft),
      countdown: formatCountdown(msLeft),
      type:     'greenhouse',
    };
  }).filter(Boolean).sort((a, b) => a.msLeft - b.msLeft);
}

/**
 * Parse oil reserves
 */
function parseOil(farm) {
  if (!farm?.oilReserves) return [];
  const now = Date.now();

  return Object.entries(farm.oilReserves).map(([id, res]) => {
    const drilledAt = res.oil?.drilledAt ?? 0;
    const readyAt   = drilledAt + OIL_REFILL_MS;
    const msLeft    = readyAt - now;

    return {
      id,
      name:     `Oil Reserve #${parseInt(id) + 1}`,
      emoji:    '🛢',
      msLeft,
      status:    drilledAt ? getTimerClass(msLeft) : 'ready',
      countdown: drilledAt ? formatCountdown(msLeft) : 'Available',
      type:     'oil',
      amount:    res.oil?.amount ?? 0,
    };
  }).sort((a, b) => a.msLeft - b.msLeft);
}

/**
 * Parse composting bins
 */
function parseComposting(farm) {
  // Support different structural formats for composters in SFL data
  const composters = farm?.composters || farm?.buildings?.['Composter'] || farm?.compost;
  if (!composters) return [];
  const now = Date.now();
  
  const entries = Array.isArray(composters) 
    ? composters.map((c, i) => [i.toString(), c]) 
    : Object.entries(composters);

  return entries.map(([id, bin]) => {
    const produce = bin.produce || bin.producing || {};
    const readyAt = bin.readyAt || produce.readyAt || 0;
    const msLeft  = readyAt > 0 ? readyAt - now : -1;
    
    // Extract item and slot amount
    const itemName = produce.name || bin.name || 'Fertilizante';
    const amount = produce.amount || bin.amount || 1;

    return {
      id,
      name:     `Composter #${parseInt(id) + 1}`,
      emoji:    '♻️',
      msLeft,
      status:    readyAt > 0 ? getTimerClass(msLeft) : 'ready',
      countdown: readyAt > 0 ? formatCountdown(msLeft) : 'Pronto',
      type:     'compost',
      itemName: itemName,
      amount:   amount,
      readyAt:  readyAt
    };
  }).sort((a, b) => (a.msLeft < 0 ? -1 : a.msLeft) - (b.msLeft < 0 ? -1 : b.msLeft));
}

/**
 * Parse flowers
 */
function parseFlowers(farm) {
  if (!farm?.flowers?.flowerBeds) return [];
  const now = Date.now();
  const FLOWER_GROW_MS = 24 * 3600_000; // Default 24h fallback

  return Object.entries(farm.flowers.flowerBeds).map(([id, bed]) => {
    if (!bed.flower) return null;
    const { name, plantedAt } = bed.flower;
    const growMs = CROP_GROW_MS[name] ?? FLOWER_GROW_MS;
    const readyAt = (plantedAt ?? now) + growMs;
    const msLeft = readyAt - now;

    return {
      id,
      name,
      emoji: getGenericEmoji(name) ?? '🌸',
      msLeft,
      status: getTimerClass(msLeft),
      countdown: formatCountdown(msLeft),
      type: 'flower',
    };
  }).filter(Boolean).sort((a, b) => a.msLeft - b.msLeft);
}

/**
 * Parse crop machine
 */
function parseCropMachine(farm) {
  const machineInstances = farm?.buildings?.['Crop Machine'];
  if (!machineInstances || !Array.isArray(machineInstances)) return [];
  
  const now = Date.now();
  const items = [];

  machineInstances.forEach((machine, i) => {
    if (!machine.queue || !machine.queue.length) return;
    
    // Find active growing crop or last one in queue
    const active = machine.queue.find(q => q.readyAt > now) || machine.queue[machine.queue.length - 1];
    
    if (active) {
      const msLeft = (active.readyAt ?? 0) - now;
      items.push({
        id: `cropmachine-${i}`,
        name: `Crop Machine (${active.crop})`,
        emoji: '🚜',
        msLeft,
        status: getTimerClass(msLeft),
        countdown: formatCountdown(msLeft),
        type: 'cropMachine',
        amount: active.seeds
      });
    }
  });

  return items.sort((a, b) => a.msLeft - b.msLeft);
}

/**
 * Parse bumpkin info
 */


/**
 * Parse inventory — group and filter meaningful items
 */
function parseInventory(farm) {
  if (!farm?.inventory) return { crops: [], resources: [], tools: [], food: [], special: [] };

  const inv = farm.inventory;

  const CROPS_LIST = Object.keys(CROP_GROW_MS);
  const FRUITS_LIST = Object.keys(FRUIT_GROW_MS);
  const RESOURCES = ['Wood', 'Stone', 'Iron', 'Gold', 'Crimstone', 'Obsidian', 'Honey', 'Egg', 'Feather', 'Wool', 'Merino Wool', 'Leather', 'Milk', 'Oil'];
  const CURRENCIES = ['Mark', 'Gem', 'Trade Point', 'SFL', 'Coins'];

  const cropItems     = [];
  const resourceItems = [];
  const toolItems     = [];
  const foodItems     = [];
  const specialItems  = [];

  Object.entries(inv).forEach(([name, qty]) => {
    const amount = parseFloat(qty) || 0;
    if (amount <= 0) return;

    const entry = { name, qty: amount, emoji: CROP_EMOJI[name] ?? getGenericEmoji(name) };

    if ([...CROPS_LIST, ...FRUITS_LIST].includes(name)) {
      cropItems.push(entry);
    } else if (RESOURCES.includes(name)) {
      resourceItems.push(entry);
    } else if (CURRENCIES.includes(name)) {
      specialItems.push(entry);
    } else if (name.includes('Seed') || name.includes('Pickaxe') || name.includes('Rod') || name.includes('Axe') || name.includes('Drill')) {
      toolItems.push(entry);
    } else {
      foodItems.push(entry);
    }
  });

  const sortByQty = arr => arr.sort((a, b) => b.qty - a.qty);

  return {
    crops:     sortByQty(cropItems),
    resources: sortByQty(resourceItems),
    tools:     sortByQty(toolItems).slice(0, 12),
    food:      sortByQty(foodItems).slice(0, 20),
    special:   sortByQty(specialItems),
  };
}

function getGenericEmoji(name) {
  if (name.includes('Cake') || name.includes('Pie') || name.includes('Bread')) return '🍰';
  if (name.includes('Soup') || name.includes('Stew')) return '🍲';
  if (name.includes('Juice') || name.includes('Smoothie') || name.includes('Shake')) return '🥤';
  if (name.includes('Salad')) return '🥗';
  if (name.includes('Seed')) return '🌱';
  if (name.includes('Bear')) return '🐻';
  if (name.includes('Fish') || name.includes('fish') || name.includes('Tuna') || name.includes('Shark')) return '🐟';
  if (name.includes('Egg')) return '🥚';
  if (name.includes('Milk') || name.includes('Cheese')) return '🥛';
  if (name.includes('Gem')) return '💎';
  if (name.includes('Gold')) return '🥇';
  if (name.includes('Iron')) return '⚙️';
  if (name.includes('Stone')) return '🪨';
  if (name.includes('Wood')) return '🪵';
  if (name.includes('Oil')) return '🛢';
  if (name.includes('Honey')) return '🍯';
  if (name.includes('Flower') || name.includes('Pansy') || name.includes('Cosmos')) return '🌸';
  return '📦';
}

/**
 * Parse chores board
 */
function parseChores(farm) {
  if (!farm?.choreBoard?.chores) return [];
  return Object.entries(farm.choreBoard.chores).map(([npc, chore]) => ({
    npc,
    description: chore.name,
    reward: chore.reward,
    progress: chore.initialProgress,
  }));
}

/**
 * Parse sfl.world /api/v1.1/land/{id} response
 * Shape: { land: { type, level, coins, balance, gem, marks, vip, taxResource, ... }, bumpkin: { level, experience, skills } }
 * This is the fallback when no community API key is configured.
 */
function parseLandInfo(landInfo) {
  if (!landInfo || !landInfo.land) return null;
  const { land, bumpkin: bk } = landInfo;

  const xp = bk?.experience ?? 0;
  const bumpkinData = bk ? (() => {
    const { level, progress } = xpProgress(xp, bk?.level);
    const skillsList = bk.skills ? (Array.isArray(bk.skills) ? bk.skills : Object.keys(bk.skills)) : [];
    return { level, xp, xpProgress: progress, skills: skillsList };
  })() : null;

  return {
    balance:     parseFloat(land.balance) || 0,
    coins:       parseFloat(land.coins) || 0,
    gems:        land.gem ?? 0,
    marks:       land.marks ?? 0,
    charm:       land.charm ?? 0,
    cheer:       land.cheer ?? 0,
    taxFreeSFL:  parseFloat(land.taxFreeSFL) || 0,
    taxRate:     land.taxResource !== undefined ? (parseFloat(land.taxResource) * 100) : 10,
    createdDate: land.created ?? null,
    referrals:   land.referrals ?? { totalReferrals: 0, totalVIPReferrals: 0 },
    isVip:       land.vip ?? false,
    vipLifetime: land.vip_info?.lifetime ?? false,
    vipDaysLeft: land.vip_info?.left ? Math.floor(land.vip_info.left / 86400) : 0,
    islandType:  land.type ?? 'basic',
    level:       parseInt(land.level) || 1,
    bumpkin:     bumpkinData,
    skills:      bumpkinData?.skills ?? [],
    crops:       [],
    fruits:      [],
    trees:       [],
    rocks:       [],
    animals:     [],
    beehives:    [],
    buildings:   [],
    greenhouse:  [],
    oil:         [],
    composting:  [],
    flowers:     [],
    cropMachine: [],
    inventory:   { crops: [], resources: [], tools: [], food: [], special: [] },
    chores:      [],
    _isLandInfoOnly: true,
  };
}

/**
 * Master parser — parses full game state (requires community API key)
 */
function parseFarm(farmData) {
  if (!farmData) return null;
  const farm = farmData.farm || farmData;

  let isVip = false, vipLifetime = false, vipDaysLeft = 0;
  
  // The 'level' variable here historically tracks the expansion index
  // The true expansion count is stored in the inventory as "Basic Land"
  let level = 1;
  if (farm.inventory?.['Basic Land']) {
    level = parseFloat(farm.inventory['Basic Land']);
  } else if (farm.island?.previousExpansions) {
    level = farm.island.previousExpansions + 3;
  }
  
  // Calculate true bumpkin level based on bumpkin experience
  let bumpkinLevel = 1;
  if (farm.bumpkin?.experience) {
    bumpkinLevel = Math.max(1, Math.floor(Math.sqrt(farm.bumpkin.experience / 3000)) + 1);
  }
  
  let islandType = farm.island?.type || 'basic';

  // Check VIP from official API
  if (farm.vip && farm.vip.expiresAt) {
    const now = Date.now();
    if (farm.vip.expiresAt > now) {
      isVip = true;
      vipDaysLeft = Math.floor((farm.vip.expiresAt - now) / 86400000);
      if (vipDaysLeft > 3650) vipLifetime = true;
    }
  }

  return {
    farmId:      farmData.id || farmData.farm?.id || 0,
    username:    farm.username || '',
    socialFarming: farm.socialFarming || {},
    rawBuildings: farm.buildings || {},
    rawCollectibles: farm.collectibles || {},
    level,
    bumpkinLevel,
    islandType,
    balance:     parseFloat(farm.balance) || 0,
    coins:       farm.coins || 0,
    gems:        parseFloat(farm.inventory?.Gem) || 0,
    marks:       parseFloat(farm.inventory?.Mark) || 0,
    charm:       parseFloat(farm.inventory?.Charm) || 0,
    taxFreeSFL:  0, // taxFreeSFL is only in sfl.world, we just default to 0 now
    isVip,
    vipLifetime,
    vipDaysLeft,
    crops:       parseCrops(farm),
    fruits:      parseFruits(farm),
    trees:       parseTrees(farm),
    rocks:       parseRocks(farm),
    animals:     parseAnimals(farm),
    beehives:    parseBeehives(farm),
    buildings:   parseBuildings(farm),
    greenhouse:  parseGreenhouse(farm),
    oil:         parseOil(farm),
    composting:  parseComposting(farm),
    flowers:     parseFlowers(farm),
    cropMachine: parseCropMachine(farm),
    bumpkin:     parseBumpkin(farm),
    inventory:   parseInventory(farm),
    chores:      parseChores(farm),
    expansionRequirements: farm.expansionRequirements,
    expansionConstruction: farm.expansionConstruction
  };
}

// Export timer utilities for use in UI update loop
export { formatCountdown, getTimerClass, parseFarm, parseLandInfo, CROP_EMOJI, getGenericEmoji };
export default { parseFarm, parseLandInfo, formatCountdown, getTimerClass, CROP_EMOJI, getGenericEmoji };
