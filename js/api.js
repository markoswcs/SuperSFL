/**
 * api.js — Camada de API para o Sunflower Super App
 * sfl.world API funciona sem autenticação (dados de land info, exchange, prices).
 * A API oficial do jogo (community/farms) requer chave gerada no jogo em
 * Settings > Developer Options > API Key — inserida pelo usuário nas configurações do app.
 * CORS fallback chain: direct → corsproxy.io → allorigins
 */

import Storage from './storage.js?v=28';

const ENDPOINTS = {
  EXCHANGE:   'https://sfl.world/api/v1.1/exchange',
  PRICES:     'https://sfl.world/api/v1/prices',
  AUCTIONS:   'https://api.sunflower-land.com/community/data?type=auctions',
  NFTS:       'https://sfl.world/api/v1/nfts',
  LAND_INFO:  (id) => `https://sfl.world/api/v1.1/land/${id}`,
  FARM_DATA:  (id) => `https://api.sunflower-land.com/community/farms/${id}`,
  // Verified Official Community API endpoints
  AUCTION_RESULTS:       (id) => `https://api.sunflower-land.com/community/data?type=auctionResults&auctionId=${encodeURIComponent(id)}`,
  MARKETPLACE_ACTIVITY:  (date) => `https://api.sunflower-land.com/community/data?type=marketplaceActivity${date ? '&date=' + encodeURIComponent(date) : ''}`,
  MARKETPLACE_ITEM:      (collection, id) => `https://api.sunflower-land.com/community/data?type=tradeable&collection=${encodeURIComponent(collection || 'collectibles')}&id=${encodeURIComponent(id)}`,
  MARKETPLACE_PROFILE:   (farmId) => `https://api.sunflower-land.com/community/data?type=marketplaceProfile&farmId=${encodeURIComponent(farmId)}`,
  TRADEABLE_CATALOG:     'https://api.sunflower-land.com/community/data?type=tradeable',
  DISCORD_ANNOUNCEMENTS: 'https://api.sunflower-land.com/community/data?type=discordAnnouncements',
  TICKET_LEADERBOARD:    (farmId) => `https://api.sunflower-land.com/community/data?type=ticketLeaderboard${farmId ? '&farmId=' + encodeURIComponent(farmId) : ''}`,
  RAFFLES:               'https://api.sunflower-land.com/community/data?type=raffles',
  RAFFLE_RESULTS:        (id) => `https://api.sunflower-land.com/community/data?type=raffleResults&id=${encodeURIComponent(id)}`,
  NIGHTLY_DUMP:          'https://api.sunflower-land.com/community/data?type=nightlyDump',
};

const host = window.location.hostname || 'localhost';
const isLocal = host === 'localhost' || host === '127.0.0.1';

const PROXIES = [];

if (isLocal) {
  PROXIES.push((url) => `http://${host}:3001/?url=${encodeURIComponent(url)}`);
}

PROXIES.push(
  (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url) => url
);

async function fetchJson(url, options = {}) {
  const isPrivate = !!options.headers && !!options.headers['x-api-key'];
  let lastError = new Error(`Failed to fetch: ${url}`);
  
  // 1. ALWAYS try direct fetch first!
  // In Capacitor Android (with CapacitorHttp enabled) this handles all origins natively with zero CORS.
  // Sunflower Land community API also supports CORS natively.
  try {
    const urlWithCacheBust = url + (url.includes('?') ? '&' : '?') + '_t=' + Date.now();
    const res = await fetch(urlWithCacheBust, {
      signal: AbortSignal.timeout(8000),
      cache: 'no-cache',
      ...options,
    });
    if (res.ok) {
      const data = await res.json();
      if (data && typeof data === 'object' && data.error && !data.land && !data.sfl && !data.data) {
        throw new Error(data.error);
      }
      return data;
    }
    if (res.status === 401 || res.status === 403) {
      if (isPrivate) throw new Error('Invalid API Key or unauthorized.');
    }
    lastError = new Error(`HTTP ${res.status}`);
  } catch (err) {
    lastError = err;
    if (err.message?.includes('unauthorized') || err.message?.includes('API Key')) {
      throw err;
    }
  }

  // 2. Only if direct fetch failed (e.g. standard browser on web PWA without CORS headers), try proxies
  for (const proxy of PROXIES) {
    try {
      const urlWithCacheBust = url + (url.includes('?') ? '&' : '?') + '_t=' + Date.now();
      const proxyUrl = proxy(urlWithCacheBust);
      const res = await fetch(proxyUrl, {
        signal: AbortSignal.timeout(8000),
        cache: 'no-cache',
        ...options,
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data && typeof data === 'object' && data.error && !data.land && !data.sfl && !data.data) {
          throw new Error(data.error);
        }
        return data;
      }
      
      if (res.status === 401 || res.status === 403) {
        if (isPrivate) throw new Error('Invalid API Key or unauthorized.');
      }
      
      lastError = new Error(`HTTP ${res.status}`);
    } catch (e) {
      lastError = e;
      if (e.message?.toLowerCase().includes('api key')) break;
    }
  }
  
  throw lastError;
}

// --- Exchange Rates (SFL, POL, Gems, Coins) ---
// Response shape: { sfl: { usd }, pol: { usd }, gem: { usd }, coins: { usd } }
async function getExchange(forceRefresh = false) {
  const CACHE_KEY = 'exchange';
  if (!forceRefresh) {
    const cached = Storage.getCache(CACHE_KEY);
    if (cached) return cached;
  }
  let data = null;
  try {
    data = await fetchJson(ENDPOINTS.EXCHANGE);
  } catch (e) {
    console.warn('getExchange live fetch failed, using fallback/cache:', e.message);
    data = Storage.getCache(CACHE_KEY, true);
    if (!data) {
      data = { sfl: { usd: 0.048, brl: 0.27 }, pol: { usd: 0.38 }, gem: { usd: 0.10 }, coins: { usd: 0.0001 } };
    }
  }

  // Fetch USD to BRL real-time rate
  try {
    const fx = await fetchJson('https://api.exchangerate-api.com/v4/latest/USD');
    if (fx && fx.rates && fx.rates.BRL) {
      if (data && data.sfl && data.sfl.usd) {
        data.sfl.brl = data.sfl.usd * fx.rates.BRL;
      }
    }
  } catch (e) {
    console.warn('Failed to fetch BRL exchange rate', e);
  }

  if (data) Storage.setCache(CACHE_KEY, data, 120_000); // 2min TTL
  return data;
}

// --- P2P Prices ---
// Response shape: { data: { p2p: { [itemName]: priceInSfl } }, updatedAt }
async function getPrices(forceRefresh = false) {
  const CACHE_KEY = 'prices';
  const HISTORY_KEY = 'prices_history';

  let cached = Storage.getCache(CACHE_KEY);
  if (!forceRefresh && cached) {
    return cached;
  }

  const data = await fetchJson(ENDPOINTS.PRICES);
  const currentPrices = data?.data?.p2p || data?.p2p || {};
  
  // Track history
  if (Object.keys(currentPrices).length > 0) {
    let history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '{}');
    let oldPrices = cached?.data?.p2p || cached?.p2p || {};
    
    for (const [item, newPrice] of Object.entries(currentPrices)) {
      if (!history[item]) history[item] = {};
      
      // Update max historical price
      if (!history[item].max || newPrice > history[item].max) {
        history[item].max = newPrice;
      }

      if (oldPrices[item] && oldPrices[item] !== newPrice) {
        history[item].prev = oldPrices[item];
        history[item].trend = newPrice > oldPrices[item] ? 'up' : 'down';
      }
    }
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  }

  Storage.setCache(CACHE_KEY, data, 900_000); // 15min TTL (API updates every 15min)
  return data;
}


// --- NFTs / Marketplace Prices ---
// Response shape: { collectibles: [{name, floor, lastSalePrice, ...}], wearables: [...] }
async function getNFTs(forceRefresh = false) {
  const CACHE_KEY = 'nfts';
  if (!forceRefresh) {
    const cached = Storage.getCache(CACHE_KEY);
    if (cached) return cached;
  }
  const data = await fetchJson(ENDPOINTS.NFTS);
  Storage.setCache(CACHE_KEY, data, 900_000); // 15min TTL (API updates every 15min)
  return data;
}

// --- Land Info via sfl.world (public — no API key required) ---
// Response shape: { land: { type, level, coins, balance, gem, marks, vip, taxResource, vip_info, ... }, bumpkin: { level, experience, skills } }
async function getLandInfo(farmId, forceRefresh = false) {
  if (!farmId) return null;
  const CACHE_KEY = `land_info_${farmId}`;
  if (!forceRefresh) {
    const cached = Storage.getCache(CACHE_KEY);
    if (cached) return cached;
  }
  const data = await fetchJson(ENDPOINTS.LAND_INFO(farmId));
  Storage.setCache(CACHE_KEY, data, 120_000); // 2min TTL
  return data;
}

// --- Farm Data via official community API ---
// REQUIRES: user's own API key from in-game Settings > Developer Options > API Key
// Response shape: full game state with crops, animals, buildings, inventory, etc.
async function getFarmData(farmId, forceRefresh = false) {
  const targetId = farmId || Storage.getActiveFarm() || '2601876753363557';
  if (!targetId) return null;
  const settings = Storage.getSettings();
  const apiKey = settings?.communityApiKey || 'sfl.MjYwMTg3Njc1MzM2MzU1Nw.LAzux_ZbJcdgj8xUU_UMDukfG4iuEKdyvUxvxzu1kdo';

  const CACHE_KEY = `farm_${targetId}`;
  if (!forceRefresh) {
    const cached = Storage.getCache(CACHE_KEY);
    if (cached) return cached;
  }

  try {
    const data = await fetchJson(ENDPOINTS.FARM_DATA(targetId), {
      headers: {
        'x-api-key': apiKey,
      },
    });
    if (data && (data.farm || data.id)) {
      Storage.setCache(CACHE_KEY, data, 60_000); // 1min TTL
      return data;
    }
  } catch (err) {
    console.warn('[Community API] getFarmData live fetch error:', err.message);
  }
  return null;
}

// --- Combined refresh (all data at once, non-blocking on individual failures) ---
async function refreshAll(farmId, forceRefresh = false) {
  const results = await Promise.allSettled([
    getExchange(forceRefresh),
    getPrices(forceRefresh),
    farmId ? getLandInfo(farmId, forceRefresh) : Promise.resolve(null),
    farmId ? getFarmData(farmId, forceRefresh) : Promise.resolve(null),
    getNFTs(forceRefresh),
    farmId ? getMarketplaceProfile(farmId) : Promise.resolve(null),
  ]);

  return {
    exchange:  results[0].status === 'fulfilled' ? results[0].value : null,
    prices:    results[1].status === 'fulfilled' ? results[1].value : null,
    landInfo:  results[2].status === 'fulfilled' ? results[2].value : null,
    farmData:  results[3].status === 'fulfilled' ? results[3].value : null,
    nfts:      results[4].status === 'fulfilled' ? results[4].value : null,
    profile:   results[5].status === 'fulfilled' ? results[5].value : null,
    errors:    results.filter(r => r.status === 'rejected').map(r => r.reason?.message),
  };
}

function getCommunityHeaders() {
  const apiKey = Storage.getSettings()?.communityApiKey || 'sfl.MjYwMTg3Njc1MzM2MzU1Nw.LAzux_ZbJcdgj8xUU_UMDukfG4iuEKdyvUxvxzu1kdo';
  return apiKey ? { headers: { 'x-api-key': apiKey } } : {};
}

// Fallback mock data matching exact Sunflower Land schemas
const FALLBACK_COMMUNITY_DATA = {
  auctions: [
    {
      auctionId: "coin-aura-2024-08-07-drop-1",
      type: "wearable",
      wearable: "Coin Aura",
      startAt: Date.now() - 3600000,
      endAt: Date.now() + 7200000,
      supply: 10,
      sfl: 5,
      ingredients: { Gold: 5 },
      chapterLimit: 1
    },
    {
      auctionId: "pet-2025-10-08-drop-1",
      type: "nft",
      nft: "Pet",
      startId: 2,
      startAt: Date.now() + 86400000,
      endAt: Date.now() + 90000000,
      supply: 15,
      sfl: 10,
      ingredients: { Gold: 10, Crimstone: 2 },
      chapterLimit: 2
    },
    {
      auctionId: "rocket-onesie-drop-3",
      type: "wearable",
      wearable: "Rocket Onesie",
      startAt: Date.now() - 86400000,
      endAt: Date.now() - 3600000,
      supply: 50,
      sfl: 25,
      ingredients: { Obsidian: 1 },
      chapterLimit: 1
    }
  ],
  auctionResults: {
    status: "complete",
    participantCount: 214,
    supply: 5,
    leaderboard: [
      { rank: 1, farmId: 121500, username: "gordy", sfl: 180.5, items: { Gold: 15 }, experience: 1250340 },
      { rank: 2, farmId: 98211, username: "farmer_pete", sfl: 155.0, items: { Gold: 12 }, experience: 940120 },
      { rank: 3, farmId: 24601, username: "jean_valjean", sfl: 140.0, items: { Gold: 10 }, experience: 820500 },
      { rank: 4, farmId: 38765, username: "sunflower_queen", sfl: 125.0, items: { Gold: 10 }, experience: 790400 },
      { rank: 5, farmId: 54120, username: "crop_master", sfl: 110.0, items: { Gold: 8 }, experience: 650000 }
    ]
  },
  activity: {
    flowerPrice: 0.1345,
    totals: { volume: 75628.76, trades: 15314 },
    items: {
      "collectibles-601": {
        name: "Victoria Sisters",
        collection: "collectibles",
        id: 601,
        low: 0.009,
        high: 0.015,
        volume: 3541.9,
        trades: 1078,
        quantity: 1726,
        latestSale: 0.0098,
        floor: 0.0098,
        listingCount: 52,
        offerCount: 34,
        bestOffer: 0.0095
      },
      "collectibles-415": {
        name: "Immortal Pear",
        collection: "collectibles",
        id: 415,
        low: 240,
        high: 310,
        volume: 3957,
        trades: 110,
        quantity: 110,
        latestSale: 264,
        floor: 259,
        listingCount: 3,
        offerCount: 1,
        bestOffer: 255
      },
      "wearables-112": {
        name: "Sunflower Shield",
        collection: "wearables",
        id: 112,
        low: 12,
        high: 22,
        volume: 890,
        trades: 54,
        quantity: 54,
        latestSale: 18.5,
        floor: 17.9,
        listingCount: 14,
        offerCount: 8,
        bestOffer: 16.0
      },
      "collectibles-702": {
        name: "Golden Cauliflower",
        collection: "collectibles",
        id: 702,
        low: 4.5,
        high: 8.0,
        volume: 1240,
        trades: 230,
        quantity: 230,
        latestSale: 6.2,
        floor: 5.9,
        listingCount: 22,
        offerCount: 12,
        bestOffer: 5.5
      }
    }
  },
  orderBook: {
    name: "Victoria Sisters",
    collection: "collectibles",
    id: 601,
    floor: 0.0098,
    lastSalePrice: 0.00985,
    supply: 5000,
    listings: [
      { id: "l1", farmId: 104231, sfl: 0.0098, quantity: 100, createdAt: Date.now() - 1200000 },
      { id: "l2", farmId: 85210, sfl: 0.0099, quantity: 250, createdAt: Date.now() - 3600000 },
      { id: "l3", farmId: 24601, sfl: 0.0102, quantity: 500, createdAt: Date.now() - 7200000 },
      { id: "l4", farmId: 98211, sfl: 0.0105, quantity: 150, createdAt: Date.now() - 14400000 }
    ],
    offers: [
      { id: "o1", farmId: 44102, sfl: 0.0095, quantity: 200, createdAt: Date.now() - 600000 },
      { id: "o2", farmId: 78912, sfl: 0.0092, quantity: 400, createdAt: Date.now() - 1800000 },
      { id: "o3", farmId: 121500, sfl: 0.0090, quantity: 1000, createdAt: Date.now() - 5400000 }
    ],
    history: [
      { date: "2026-08-31", low: 0.0092, high: 0.0115, volume: 1420, sales: 24 },
      { date: "2026-08-30", low: 0.0090, high: 0.0110, volume: 1100, sales: 19 },
      { date: "2026-08-29", low: 0.0088, high: 0.0108, volume: 950, sales: 15 }
    ]
  },
  profile: (farmId) => ({
    id: farmId || 2601876,
    username: "Fazendeiro Master",
    level: 74,
    ascension: 1,
    totalTrades: 1842,
    profit: 15204.6,
    weeklyFlowerSpent: 412.85,
    weeklyFlowerEarned: 638.20,
    listings: [
      { id: "l1", item: "Sunflower", sfl: 0.0005, quantity: 1500, collection: "collectibles", createdAt: Date.now() - 1800000 },
      { id: "l2", item: "Gold", sfl: 0.35, quantity: 40, collection: "collectibles", createdAt: Date.now() - 7200000 },
      { id: "l3", item: "Victoria Sisters", sfl: 0.010, quantity: 200, collection: "collectibles", createdAt: Date.now() - 14400000 }
    ],
    offers: [
      { id: "o1", item: "Immortal Pear", sfl: 255.0, quantity: 1, collection: "collectibles", createdAt: Date.now() - 3600000 }
    ],
    friends: [
      { id: 98211, username: "farmer_pete", trades: 61 },
      { id: 121500, username: "gordy", trades: 45 },
      { id: 38765, username: "sunflower_queen", trades: 28 }
    ],
    trades: [
      { id: "t1", item: "Wood", sfl: 0.0125, quantity: 800, collection: "collectibles", fulfilledAt: Date.now() - 900000, type: "sell" },
      { id: "t2", item: "Iron", sfl: 0.102, quantity: 150, collection: "collectibles", fulfilledAt: Date.now() - 3600000, type: "buy" },
      { id: "t3", item: "Honey", sfl: 0.105, quantity: 100, collection: "collectibles", fulfilledAt: Date.now() - 10800000, type: "sell" }
    ]
  }),
  catalog: [
    { id: 601, name: "Victoria Sisters", collection: "collectibles", type: "collectible", floor: 0.0098, supply: 5000 },
    { id: 415, name: "Immortal Pear", collection: "collectibles", type: "collectible", floor: 259.0, supply: 1105 },
    { id: 702, name: "Golden Cauliflower", collection: "collectibles", type: "collectible", floor: 5.9, supply: 2500 },
    { id: 112, name: "Sunflower Shield", collection: "wearables", type: "wearable", floor: 17.9, supply: 1000 },
    { id: 250, name: "Rocket Onesie", collection: "wearables", type: "wearable", floor: 45.0, supply: 250 },
    { id: 301, name: "Coin Aura", collection: "wearables", type: "wearable", floor: 85.0, supply: 100 },
    { id: 805, name: "Heart Air Balloon", collection: "collectibles", type: "collectible", floor: 12.5, supply: 3000 },
    { id: 915, name: "Love Charm", collection: "collectibles", type: "collectible", floor: 0.05, supply: 25000 },
  ],
  announcements: [
    {
      id: "1",
      channelName: "news",
      url: "https://discord.com/channels/880987707214544966/1174503269238837408",
      content: "Howdy Bumpkins! Acompanhe as últimas novidades, manutenções, patches e eventos oficiais do Sunflower Land aqui em tempo real.",
      createdAt: new Date().toISOString(),
      likes: 142
    }
  ],
  ticketLeaderboard: {
    topTen: [
      { id: "JJTheFarmer", count: 6254, bumpkin: { background: "Cemetery Background" }, experience: 804908437, farmId: 7305414419203497 },
      { id: "Kevin", count: 6249, bumpkin: { hair: "Sun Spots" }, experience: 750000000, farmId: 12044 }
    ],
    total: 125000
  },
  raffles: [
    {
      id: "beta-raffle-1",
      startAt: Date.now() - 3600000,
      endAt: Date.now() + 86400000,
      prizes: {
        "1": { type: "collectible", items: { "Gem": 100 } },
        "2": { type: "collectible", items: { "Gold": 1 } },
        "3": { type: "collectible", items: { "Bronze Food Box": 1 } }
      },
      entryRequirements: { "Pet Cookie": 10, "Paw Prints Raffle Ticket": 1 }
    }
  ]
};

// --- Auctions (List drops) ---
async function getAuctions(forceRefresh = false) {
  const CACHE_KEY = 'auctions';
  if (!forceRefresh) {
    const cached = Storage.getCache(CACHE_KEY);
    if (cached) return cached;
  }
  try {
    const data = await fetchJson(ENDPOINTS.AUCTIONS, getCommunityHeaders());
    if (data && (data.data?.auctions || Array.isArray(data.auctions) || data.auctions)) {
      const result = { ...(data.data || data), isFallback: false };
      Storage.setCache(CACHE_KEY, result, 300_000);
      return result;
    }
  } catch (err) {
    console.warn('[Community API] getAuctions live fetch error, using fallback:', err.message);
  }
  return { auctions: FALLBACK_COMMUNITY_DATA.auctions, isFallback: true };
}

// --- Auction Results ---
async function getAuctionResults(auctionId) {
  if (!auctionId) return null;
  const CACHE_KEY = `auction_results_${auctionId}`;
  const cached = Storage.getCache(CACHE_KEY);
  if (cached) return cached;
  try {
    const data = await fetchJson(ENDPOINTS.AUCTION_RESULTS(auctionId), getCommunityHeaders());
    if (data && (data.data || data.leaderboard || data.status)) {
      const result = { ...(data.data || data), isFallback: false };
      Storage.setCache(CACHE_KEY, result, 300_000);
      return result;
    }
  } catch (err) {
    console.warn('[Community API] getAuctionResults error, using fallback:', err.message);
  }
  return { ...FALLBACK_COMMUNITY_DATA.auctionResults, isFallback: true };
}

// --- Marketplace Activity (live trades feed) ---
async function getMarketplaceActivity(forceRefresh = false, date = null) {
  const CACHE_KEY = `marketplace_activity_${date || 'today'}`;
  if (!forceRefresh) {
    const cached = Storage.getCache(CACHE_KEY);
    if (cached) return cached;
  }
  try {
    const data = await fetchJson(ENDPOINTS.MARKETPLACE_ACTIVITY(date), getCommunityHeaders());
    if (data && (data.data || data.reports || data.activity)) {
      const result = { ...(data.data || data), isFallback: false };
      Storage.setCache(CACHE_KEY, result, 60_000); // 1min TTL
      return result;
    }
  } catch (err) {
    console.warn('[Community API] getMarketplaceActivity error, using fallback:', err.message);
  }
  return { ...FALLBACK_COMMUNITY_DATA.activity, isFallback: true };
}

// --- Marketplace Item (deep item data: floor, volume, order book) ---
async function getMarketplaceItem(itemNameOrId, collection = 'collectibles') {
  if (!itemNameOrId) return null;
  const CACHE_KEY = `mkt_item_${collection}_${itemNameOrId}`;
  const cached = Storage.getCache(CACHE_KEY);
  if (cached) return cached;
  try {
    const data = await fetchJson(ENDPOINTS.MARKETPLACE_ITEM(collection, itemNameOrId), getCommunityHeaders());
    if (data && (data.data || data.listings || data.floorPrice || data.floor)) {
      const result = { ...(data.data || data), isFallback: false };
      Storage.setCache(CACHE_KEY, result, 120_000); // 2min TTL
      return result;
    }
  } catch (err) {
    console.warn('[Community API] getMarketplaceItem error, using fallback:', err.message);
  }
  return { ...FALLBACK_COMMUNITY_DATA.orderBook, isFallback: true };
}

// --- Marketplace Profile (farm trading history & listings) ---
async function getMarketplaceProfile(farmId) {
  const targetId = farmId || Storage.getSettings()?.farmId;
  if (!targetId) return null;
  const CACHE_KEY = `mkt_profile_${targetId}`;
  const cached = Storage.getCache(CACHE_KEY);
  if (cached) return cached;
  try {
    const data = await fetchJson(ENDPOINTS.MARKETPLACE_PROFILE(targetId), getCommunityHeaders());
    if (data && (data.data || data.trades || data.totalTrades !== undefined)) {
      const result = { ...(data.data || data), isFallback: false };
      Storage.setCache(CACHE_KEY, result, 120_000);
      return result;
    }
  } catch (err) {
    console.warn('[Community API] getMarketplaceProfile error, using fallback:', err.message);
  }
  return { ...FALLBACK_COMMUNITY_DATA.profile(targetId), isFallback: true };
}

// --- Tradeable Catalog (master list of all tradeable items) ---
async function getTradeableCatalog(forceRefresh = false) {
  const CACHE_KEY = 'tradeable_catalog';
  if (!forceRefresh) {
    const cached = Storage.getCache(CACHE_KEY);
    if (cached) return cached;
  }
  try {
    const data = await fetchJson(ENDPOINTS.TRADEABLE_CATALOG, getCommunityHeaders());
    if (data && Array.isArray(data)) {
      const result = { catalog: data, isFallback: false };
      Storage.setCache(CACHE_KEY, result, 3600_000);
      return result;
    }
  } catch (err) {
    console.warn('[Community API] getTradeableCatalog error, using fallback:', err.message);
  }
  return { catalog: FALLBACK_COMMUNITY_DATA.catalog, isFallback: true };
}

// --- Discord Announcements (official game news feed) ---
async function getDiscordAnnouncements(forceRefresh = false) {
  const CACHE_KEY = 'discord_announcements';
  if (!forceRefresh) {
    const cached = Storage.getCache(CACHE_KEY);
    if (cached) return cached;
  }
  try {
    const data = await fetchJson(ENDPOINTS.DISCORD_ANNOUNCEMENTS, getCommunityHeaders());
    if (data && (Array.isArray(data.data) || Array.isArray(data))) {
      const list = data.data || data;
      const result = { announcements: list, isFallback: false };
      Storage.setCache(CACHE_KEY, result, 300_000); // 5min TTL
      return result;
    }
  } catch (err) {
    console.warn('[Community API] getDiscordAnnouncements error, using fallback:', err.message);
  }
  return { announcements: FALLBACK_COMMUNITY_DATA.announcements, isFallback: true };
}

// --- Ticket Leaderboard (chapter ticket rankings) ---
async function getTicketLeaderboard(farmId = null, forceRefresh = false) {
  const targetId = farmId || Storage.getActiveFarm() || '2601876753363557';
  const CACHE_KEY = `ticket_leaderboard_${targetId}`;
  if (!forceRefresh) {
    const cached = Storage.getCache(CACHE_KEY);
    if (cached) return cached;
  }
  try {
    const data = await fetchJson(ENDPOINTS.TICKET_LEADERBOARD(targetId), getCommunityHeaders());
    if (data && (data.data || data.topTen)) {
      const result = { ...(data.data || data), isFallback: false };
      Storage.setCache(CACHE_KEY, result, 300_000); // 5min TTL
      return result;
    }
  } catch (err) {
    console.warn('[Community API] getTicketLeaderboard error, using fallback:', err.message);
  }
  return { ...FALLBACK_COMMUNITY_DATA.ticketLeaderboard, isFallback: true };
}

// --- Raffles (all game raffles & prizes) ---
async function getRaffles(forceRefresh = false) {
  const CACHE_KEY = 'raffles';
  if (!forceRefresh) {
    const cached = Storage.getCache(CACHE_KEY);
    if (cached) return cached;
  }
  try {
    const data = await fetchJson(ENDPOINTS.RAFFLES, getCommunityHeaders());
    if (data && (Array.isArray(data.data) || Array.isArray(data))) {
      const list = data.data || data;
      const result = { raffles: list, isFallback: false };
      Storage.setCache(CACHE_KEY, result, 600_000); // 10min TTL
      return result;
    }
  } catch (err) {
    console.warn('[Community API] getRaffles error, using fallback:', err.message);
  }
  return { raffles: FALLBACK_COMMUNITY_DATA.raffles, isFallback: true };
}

// --- Raffle Results (draw winners for one raffle) ---
async function getRaffleResults(raffleId) {
  if (!raffleId) return null;
  const CACHE_KEY = `raffle_results_${raffleId}`;
  const cached = Storage.getCache(CACHE_KEY);
  if (cached) return cached;
  try {
    const data = await fetchJson(ENDPOINTS.RAFFLE_RESULTS(raffleId), getCommunityHeaders());
    if (data && (data.data || data.winners)) {
      const result = { ...(data.data || data), isFallback: false };
      Storage.setCache(CACHE_KEY, result, 300_000);
      return result;
    }
  } catch (err) {
    console.warn('[Community API] getRaffleResults error:', err.message);
  }
  return null;
}

// --- Nightly Farm Dump manifest ---
async function getNightlyDump(forceRefresh = false) {
  const CACHE_KEY = 'nightly_dump';
  if (!forceRefresh) {
    const cached = Storage.getCache(CACHE_KEY);
    if (cached) return cached;
  }
  try {
    const data = await fetchJson(ENDPOINTS.NIGHTLY_DUMP, getCommunityHeaders());
    if (data && (Array.isArray(data.data) || Array.isArray(data))) {
      const result = { files: data.data || data, isFallback: false };
      Storage.setCache(CACHE_KEY, result, 3600_000);
      return result;
    }
  } catch (err) {
    console.warn('[Community API] getNightlyDump error:', err.message);
  }
  return { files: [], isFallback: true };
}

export default {
  getExchange,
  getPrices,
  getAuctions,
  getNFTs,
  getFarmData,
  getLandInfo,
  refreshAll,
  getAuctionResults,
  getMarketplaceActivity,
  getMarketplaceItem,
  getMarketplaceProfile,
  getTradeableCatalog,
  getDiscordAnnouncements,
  getTicketLeaderboard,
  getRaffles,
  getRaffleResults,
  getNightlyDump,
};
