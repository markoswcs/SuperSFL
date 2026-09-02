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
  AUCTIONS:   'https://api.sunflower-land.com/community/auctions',
  NFTS:       'https://sfl.world/api/v1/nfts',
  LAND_INFO:  (id) => `https://sfl.world/api/v1.1/land/${id}`,
  FARM_DATA:  (id) => `https://api.sunflower-land.com/community/farms/${id}`,
  // New Community API endpoints
  AUCTION_RESULTS:      (id) => `https://api.sunflower-land.com/community/auctions/${id}/results`,
  MARKETPLACE_ACTIVITY: 'https://api.sunflower-land.com/community/marketplace/activity',
  MARKETPLACE_ITEM:     (name) => `https://api.sunflower-land.com/community/marketplace/items/${encodeURIComponent(name)}`,
  MARKETPLACE_PROFILE:  (id) => `https://api.sunflower-land.com/community/marketplace/profile/${id}`,
  TRADEABLE_CATALOG:    'https://api.sunflower-land.com/community/data?type=tradeable',
};

const host = window.location.hostname || 'localhost';
const isLocal = host === 'localhost' || host === '127.0.0.1';

const PROXIES = [];

// Somente tenta o proxy local (start.bat) se estiver rodando no localhost
// Isso evita erros de mixed-content e timeouts longos no celular (GitHub Pages)
if (isLocal) {
  PROXIES.push((url) => `http://${host}:3001/?url=${encodeURIComponent(url)}`);
}

PROXIES.push(
  (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url) => `https://thingproxy.freeboard.io/fetch/${url}`,
  (url) => url // Direct fallback just in case CORS is disabled
);

async function fetchJson(url, options = {}) {
  const isPrivate = !!options.headers && !!options.headers['x-api-key'];
  let lastError = new Error(`Failed to fetch: ${url}`);
  
  for (const proxy of PROXIES) {
    try {
      const urlWithCacheBust = url + (url.includes('?') ? '&' : '?') + '_t=' + Date.now();
      const proxyUrl = proxy(urlWithCacheBust);
      const res = await fetch(proxyUrl, {
        signal: AbortSignal.timeout(10000),
        cache: 'no-cache',
        ...options,
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data && typeof data === 'object' && data.error && !data.land && !data.sfl) {
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
  const data = await fetchJson(ENDPOINTS.EXCHANGE);

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

  Storage.setCache(CACHE_KEY, data, 120_000); // 2min TTL
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

// --- Auctions ---
async function getAuctions(forceRefresh = false) {
  const CACHE_KEY = 'auctions';
  if (!forceRefresh) {
    const cached = Storage.getCache(CACHE_KEY);
    if (cached) return cached;
  }
  const data = await fetchJson(ENDPOINTS.AUCTIONS);
  Storage.setCache(CACHE_KEY, data, 300_000); // 5min TTL
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
  if (!farmId) return null;
  const settings = Storage.getSettings();
  const apiKey = settings.communityApiKey;
  if (!apiKey) return null; // No key provided by user → skip silently

  const CACHE_KEY = `farm_${farmId}`;
  if (!forceRefresh) {
    const cached = Storage.getCache(CACHE_KEY);
    if (cached) return cached;
  }

  const data = await fetchJson(ENDPOINTS.FARM_DATA(farmId), {
    headers: {
      'x-api-key': apiKey,
    },
  });

  Storage.setCache(CACHE_KEY, data, 60_000); // 1min TTL
  return data;
}

// --- Combined refresh (all data at once, non-blocking on individual failures) ---
async function refreshAll(farmId, forceRefresh = false) {
  const results = await Promise.allSettled([
    getExchange(forceRefresh),
    getPrices(forceRefresh),
    farmId ? getLandInfo(farmId, forceRefresh) : Promise.resolve(null),
    farmId ? getFarmData(farmId, forceRefresh) : Promise.resolve(null),
    getNFTs(forceRefresh),
  ]);

  return {
    exchange:  results[0].status === 'fulfilled' ? results[0].value : null,
    prices:    results[1].status === 'fulfilled' ? results[1].value : null,
    landInfo:  results[2].status === 'fulfilled' ? results[2].value : null,
    farmData:  results[3].status === 'fulfilled' ? results[3].value : null,
    nfts:      results[4].status === 'fulfilled' ? results[4].value : null,
    errors:    results.filter(r => r.status === 'rejected').map(r => r.reason?.message),
  };
}

// --- Auction Results ---
// Response shape: { auctionId, status, summary: { minWinningBid, totalBids, totalWinners }, results: [...] }
async function getAuctionResults(auctionId) {
  if (!auctionId) return null;
  const CACHE_KEY = `auction_results_${auctionId}`;
  const cached = Storage.getCache(CACHE_KEY);
  if (cached) return cached;
  const data = await fetchJson(ENDPOINTS.AUCTION_RESULTS(auctionId));
  Storage.setCache(CACHE_KEY, data, 300_000); // 5min TTL
  return data;
}

// --- Marketplace Activity (live trades feed) ---
// Response shape: { activity: [{ item, quantity, sfl, type, timestamp, ... }] }
async function getMarketplaceActivity(forceRefresh = false) {
  const CACHE_KEY = 'marketplace_activity';
  if (!forceRefresh) {
    const cached = Storage.getCache(CACHE_KEY);
    if (cached) return cached;
  }
  const data = await fetchJson(ENDPOINTS.MARKETPLACE_ACTIVITY);
  Storage.setCache(CACHE_KEY, data, 120_000); // 2min TTL
  return data;
}

// --- Marketplace Item (deep item data: floor, volume, order book) ---
// Response shape: { item, floorPrice, lastSalePrice, volume24h, supply, listings: [...] }
async function getMarketplaceItem(itemName) {
  if (!itemName) return null;
  const CACHE_KEY = `mkt_item_${itemName}`;
  const cached = Storage.getCache(CACHE_KEY);
  if (cached) return cached;
  const data = await fetchJson(ENDPOINTS.MARKETPLACE_ITEM(itemName));
  Storage.setCache(CACHE_KEY, data, 300_000); // 5min TTL
  return data;
}

// --- Marketplace Profile (farm trading history & listings) ---
// Response shape: { farmId, reputation, totalTrades, activeListings: [...], history: [...] }
async function getMarketplaceProfile(farmId) {
  if (!farmId) return null;
  const CACHE_KEY = `mkt_profile_${farmId}`;
  const cached = Storage.getCache(CACHE_KEY);
  if (cached) return cached;
  const data = await fetchJson(ENDPOINTS.MARKETPLACE_PROFILE(farmId));
  Storage.setCache(CACHE_KEY, data, 300_000); // 5min TTL
  return data;
}

// --- Tradeable Catalog (master list of all tradeable items) ---
// Response shape: list of items with types, categories, metadata
async function getTradeableCatalog(forceRefresh = false) {
  const CACHE_KEY = 'tradeable_catalog';
  if (!forceRefresh) {
    const cached = Storage.getCache(CACHE_KEY);
    if (cached) return cached;
  }
  const data = await fetchJson(ENDPOINTS.TRADEABLE_CATALOG);
  Storage.setCache(CACHE_KEY, data, 3600_000); // 1h TTL (changes rarely)
  return data;
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
};
