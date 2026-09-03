/**
 * storage.js — Wrapper de localStorage para o Sunflower Super App
 * Gerencia persistência de Farm ID, configurações e preferências
 */

const Storage = (() => {
  const KEYS = {
    FARM_IDS:      'sfl_farm_ids',
    ACTIVE_FARM:   'sfl_active_farm',
    SETTINGS:      'sfl_settings',
    NOTIF_PREFS:   'sfl_notif_prefs',
    CACHE_PREFIX:  'sfl_cache_',
    ALERT_LOG:     'sfl_alert_log',
    PRICE_ALERTS:  'sfl_price_alerts',
  };

  // --- Farm IDs ---

  function getFarmIds() {
    try {
      const ids = JSON.parse(localStorage.getItem(KEYS.FARM_IDS) || '[]');
      if (ids && ids.length > 0) return ids;
      return [{ id: '2601876753363557', label: 'Fazenda Oficial #2601876753363557', addedAt: Date.now() }];
    } catch { return [{ id: '2601876753363557', label: 'Fazenda Oficial #2601876753363557', addedAt: Date.now() }]; }
  }

  function addFarmId(farmId, label = '') {
    const ids = getFarmIds();
    const existing = ids.find(f => f.id === String(farmId));
    if (!existing) {
      ids.unshift({ id: String(farmId), label: label || `Farm #${farmId}`, addedAt: Date.now() });
      localStorage.setItem(KEYS.FARM_IDS, JSON.stringify(ids.slice(0, 10)));
    }
    setActiveFarm(String(farmId));
  }

  function removeFarmId(farmId) {
    const ids = getFarmIds().filter(f => f.id !== String(farmId));
    localStorage.setItem(KEYS.FARM_IDS, JSON.stringify(ids));
    if (getActiveFarm() === String(farmId)) {
      localStorage.setItem(KEYS.ACTIVE_FARM, ids[0]?.id || '2601876753363557');
    }
  }

  function getActiveFarm() {
    return localStorage.getItem(KEYS.ACTIVE_FARM) || '2601876753363557';
  }

  function setActiveFarm(farmId) {
    localStorage.setItem(KEYS.ACTIVE_FARM, String(farmId));
  }

  // --- Settings ---

  const DEFAULT_SETTINGS = {
    theme: 'light',
    island: 'volcano',
    isVip: false,
    hasShrine: false,
    sflPriceAlertHigh: null,
    sflPriceAlertLow: null,
    autoRefreshInterval: 5, // minutes
    currency: 'usd',
    language: 'pt', // Default to Portuguese
    communityApiKey: 'sfl.MjYwMTg3Njc1MzM2MzU1Nw.LAzux_ZbJcdgj8xUU_UMDukfG4iuEKdyvUxvxzu1kdo', // Full valid key from game
  };

  function getSettings() {
    try {
      const saved = JSON.parse(localStorage.getItem(KEYS.SETTINGS) || '{}');
      const merged = { ...DEFAULT_SETTINGS, ...saved };
      return merged;
    } catch { return { ...DEFAULT_SETTINGS }; }
  }

  function saveSettings(settings) {
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify({ ...getSettings(), ...settings }));
  }

  // --- Notification Preferences ---

  const DEFAULT_NOTIF_PREFS = {
    enabled: false,
    crops_ready: true,
    fruits_ready: true,
    animals_hungry: true,
    animals_produce: true,
    trees_ready: true,
    rocks_ready: true,
    cooking_ready: true,
    composting_ready: true,
    beehive_ready: true,
    oil_ready: true,
    flower_ready: true,
    greenhouse_ready: true,
    crop_machine_ready: true,
    sfl_price_alert: false,
  };

  function getNotifPrefs() {
    try {
      const saved = JSON.parse(localStorage.getItem(KEYS.NOTIF_PREFS) || '{}');
      return { ...DEFAULT_NOTIF_PREFS, ...saved };
    } catch { return { ...DEFAULT_NOTIF_PREFS }; }
  }

  function saveNotifPrefs(prefs) {
    localStorage.setItem(KEYS.NOTIF_PREFS, JSON.stringify({ ...getNotifPrefs(), ...prefs }));
  }

  // --- API Cache ---

  function setCache(key, data, ttlMs = 60_000) {
    const entry = { data, expiresAt: Date.now() + ttlMs };
    try {
      localStorage.setItem(KEYS.CACHE_PREFIX + key, JSON.stringify(entry));
    } catch (e) {
      // Storage might be full — clear old caches
      clearOldCaches();
    }
  }

  function getCache(key, ignoreExpiration = false) {
    try {
      const raw = localStorage.getItem(KEYS.CACHE_PREFIX + key);
      if (!raw) return null;
      const entry = JSON.parse(raw);
      if (!ignoreExpiration && Date.now() > entry.expiresAt) {
        return null;
      }
      return entry.data;
    } catch { return null; }
  }

  function clearOldCaches() {
    const prefix = KEYS.CACHE_PREFIX;
    Object.keys(localStorage)
      .filter(k => k.startsWith(prefix))
      .forEach(k => localStorage.removeItem(k));
  }

  // --- Alert Log ---

  function addAlertLog(entry) {
    try {
      const log = JSON.parse(localStorage.getItem(KEYS.ALERT_LOG) || '[]');
      log.unshift({ ...entry, time: Date.now() });
      localStorage.setItem(KEYS.ALERT_LOG, JSON.stringify(log.slice(0, 50)));
    } catch {}
  }

  function getAlertLog() {
    try {
      return JSON.parse(localStorage.getItem(KEYS.ALERT_LOG) || '[]');
    } catch { return []; }
  }

  function clearAlertLog() {
    localStorage.removeItem(KEYS.ALERT_LOG);
  }

  // --- Price Alerts ---

  function getPriceAlerts() {
    try {
      return JSON.parse(localStorage.getItem(KEYS.PRICE_ALERTS) || '[]');
    } catch { return []; }
  }

  function savePriceAlert(alert) {
    const alerts = getPriceAlerts();
    const existing = alerts.findIndex(a => a.item === alert.item && a.type === alert.type);
    if (existing >= 0) {
      alerts[existing] = alert;
    } else {
      alerts.push(alert);
    }
    localStorage.setItem(KEYS.PRICE_ALERTS, JSON.stringify(alerts));
  }

  function deletePriceAlert(item, type) {
    const alerts = getPriceAlerts().filter(a => !(a.item === item && a.type === type));
    localStorage.setItem(KEYS.PRICE_ALERTS, JSON.stringify(alerts));
  }

  return {
    getFarmIds,
    addFarmId,
    removeFarmId,
    getActiveFarm,
    setActiveFarm,
    getSettings,
    saveSettings,
    getNotifPrefs,
    saveNotifPrefs,
    setCache,
    getCache,
    addAlertLog,
    getAlertLog,
    clearAlertLog,
    getPriceAlerts,
    savePriceAlert,
    deletePriceAlert,
  };
})();

export default Storage;
