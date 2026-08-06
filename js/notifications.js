/**
 * notifications.js — Sistema completo de Web Push Notifications
 * Detecta eventos da fazenda e dispara notificações nativas do navegador
 */

import Storage from './storage.js?v=28';

// --- Notification categories ---
const NOTIF_TYPES = {
  CROPS_READY:       { key: 'crops_ready',       label: 'Crops Ready',        icon: '🌻', dot: 'emerald' },
  FRUITS_READY:      { key: 'fruits_ready',       label: 'Fruits Ready',       icon: '🍎', dot: 'emerald' },
  ANIMALS_HUNGRY:    { key: 'animals_hungry',     label: 'Hungry Animals',     icon: '🐔', dot: 'coral' },
  ANIMALS_PRODUCE:   { key: 'animals_produce',    label: 'Collect Produce',    icon: '🥚', dot: 'amber' },
  TREES_READY:       { key: 'trees_ready',        label: 'Trees Ready',        icon: '🌳', dot: 'emerald' },
  ROCKS_READY:       { key: 'rocks_ready',        label: 'Rocks Ready',        icon: '🪨', dot: 'sky' },
  COOKING_READY:     { key: 'cooking_ready',      label: 'Cooking Done',       icon: '🍳', dot: 'amber' },
  COMPOSTING_READY:  { key: 'composting_ready',   label: 'Compost Ready',      icon: '♻️',  dot: 'emerald' },
  BEEHIVE_READY:     { key: 'beehive_ready',      label: 'Honey Ready',        icon: '🍯', dot: 'amber' },
  OIL_READY:         { key: 'oil_ready',          label: 'Oil Ready',          icon: '🛢', dot: 'sky' },
  FLOWER_READY:      { key: 'flower_ready',       label: 'Flowers Ready',      icon: '🌸', dot: 'emerald' },
  GREENHOUSE_READY:  { key: 'greenhouse_ready',   label: 'Greenhouse Ready',   icon: '🏡', dot: 'emerald' },
  CROP_MACHINE_READY:{ key: 'crop_machine_ready', label: 'Crop Machine Ready', icon: '⚙️',  dot: 'sky' },
  SFL_PRICE_ALERT:   { key: 'sfl_price_alert',    label: 'SFL Price Alert',    icon: '💰', dot: 'amber' },
};

export { NOTIF_TYPES };

// --- State ---
let _scheduledTimers = {};
let _lastFarmData    = null;
let _lastSflPrice    = null;
let _onBadgeUpdate   = null;

// =====================================================
// PERMISSION
// =====================================================

async function requestPermission() {
  if (!('Notification' in window)) return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  const result = await Notification.requestPermission();
  return result;
}

function hasPermission() {
  return 'Notification' in window && Notification.permission === 'granted';
}

// =====================================================
// SEND NOTIFICATION
// =====================================================

function sendNotification(title, body, options = {}) {
  if (!hasPermission()) return;

  const prefs = Storage.getNotifPrefs();
  if (!prefs.enabled) return;

  const typeKey = options.typeKey;
  if (typeKey && prefs[typeKey] === false) return;

  const notif = new Notification(title, {
    body,
    icon:  '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag:   options.tag ?? title,
    renotify: options.renotify ?? false,
    silent: false,
    ...options,
  });

  // Log to history
  Storage.addAlertLog({
    title,
    body,
    dot: options.dot ?? 'amber',
    typeKey,
  });

  // Update badge counter
  if (_onBadgeUpdate) _onBadgeUpdate();

  return notif;
}

// =====================================================
// SCHEDULE FUTURE NOTIFICATIONS
// =====================================================

function clearAllScheduled() {
  Object.values(_scheduledTimers).forEach(clearTimeout);
  _scheduledTimers = {};
}

function scheduleAt(id, fn, msFromNow) {
  if (msFromNow <= 0) { fn(); return; }
  if (msFromNow > 3 * 24 * 3600_000) return; // Don't schedule >3 days out
  clearTimeout(_scheduledTimers[id]);
  _scheduledTimers[id] = setTimeout(fn, msFromNow);
}

// =====================================================
// FARM EVENT CHECKERS
// =====================================================

function checkCrops(parsedFarm) {
  const { crops = [], fruits = [] } = parsedFarm;
  const prefs = Storage.getNotifPrefs();

  // Group ready crops
  const readyCrops  = crops.filter(c => c.status === 'ready');
  const readyFruits = fruits.filter(f => f.status === 'ready');

  if (readyCrops.length > 0 && prefs.crops_ready) {
    sendNotification(
      `🌻 ${readyCrops.length} Crop${readyCrops.length > 1 ? 's' : ''} Ready!`,
      `${readyCrops.map(c => c.name).slice(0, 3).join(', ')}${readyCrops.length > 3 ? ` +${readyCrops.length - 3} more` : ''} are ready to harvest.`,
      { typeKey: 'crops_ready', dot: 'emerald', tag: 'crops_ready', renotify: true }
    );
  }

  if (readyFruits.length > 0 && prefs.fruits_ready) {
    sendNotification(
      `🍎 ${readyFruits.length} Fruit${readyFruits.length > 1 ? 's' : ''} Ready!`,
      `${readyFruits.map(f => f.name).slice(0, 3).join(', ')} ready to pick.`,
      { typeKey: 'fruits_ready', dot: 'emerald', tag: 'fruits_ready', renotify: true }
    );
  }

  // Schedule FUTURE notifications
  [...crops, ...fruits].forEach(item => {
    if (item.status === 'ready') return;
    if (item.msLeft > 0) {
      const key = item.type === 'fruit' ? 'fruits_ready' : 'crops_ready';
      scheduleAt(`${item.type}_${item.id}`, () => {
        if (!Storage.getNotifPrefs()[key]) return;
        sendNotification(
          `${item.emoji} ${item.name} Ready!`,
          `Your ${item.name} is ready to harvest.`,
          { typeKey: key, dot: 'emerald', tag: `${item.type}_${item.id}` }
        );
      }, item.msLeft);
    }
  });
}

function checkAnimals(parsedFarm) {
  const { animals = [] } = parsedFarm;
  const prefs = Storage.getNotifPrefs();

  const hungry  = animals.filter(a => a.isHungry);
  const produce = animals.filter(a => a.hasProduceReady);

  if (hungry.length > 0 && prefs.animals_hungry) {
    sendNotification(
      `🐾 ${hungry.length} Animal${hungry.length > 1 ? 's' : ''} Hungry!`,
      `${hungry.map(a => a.type).join(', ')} need feeding.`,
      { typeKey: 'animals_hungry', dot: 'coral', tag: 'animals_hungry', renotify: true }
    );
  }

  if (produce.length > 0 && prefs.animals_produce) {
    sendNotification(
      `🥚 Produce Ready!`,
      `${produce.length} animal${produce.length > 1 ? 's have' : ' has'} produce to collect.`,
      { typeKey: 'animals_produce', dot: 'amber', tag: 'animals_produce', renotify: true }
    );
  }

  // Schedule future hungry notifications
  animals.filter(a => !a.isHungry && a.msLeft > 0).forEach(a => {
    scheduleAt(`animal_hungry_${a.id}`, () => {
      if (!Storage.getNotifPrefs().animals_hungry) return;
      sendNotification(
        `${a.emoji} ${a.name} is Hungry!`,
        `Your ${a.type} needs feeding.`,
        { typeKey: 'animals_hungry', dot: 'coral', tag: `animal_${a.id}` }
      );
    }, a.msLeft);
  });
}

function checkTrees(parsedFarm) {
  const { trees = [] } = parsedFarm;
  const prefs = Storage.getNotifPrefs();
  const ready = trees.filter(t => t.status === 'ready');

  if (ready.length > 0 && prefs.trees_ready) {
    sendNotification(
      `🌳 ${ready.length} Tree${ready.length > 1 ? 's' : ''} Ready!`,
      `Your trees are ready to chop.`,
      { typeKey: 'trees_ready', dot: 'emerald', tag: 'trees_ready', renotify: true }
    );
  }

  trees.filter(t => t.status !== 'ready' && t.msLeft > 0).forEach(t => {
    scheduleAt(`tree_${t.id}`, () => {
      if (!Storage.getNotifPrefs().trees_ready) return;
      sendNotification('🌳 Tree Ready!', 'A tree is ready to chop.', { typeKey: 'trees_ready', dot: 'emerald', tag: `tree_${t.id}` });
    }, t.msLeft);
  });
}

function checkRocks(parsedFarm) {
  const { rocks = [] } = parsedFarm;
  const prefs = Storage.getNotifPrefs();
  const ready = rocks.filter(r => r.status === 'ready');

  if (ready.length > 0 && prefs.rocks_ready) {
    sendNotification(
      `🪨 ${ready.length} Rock${ready.length > 1 ? 's' : ''} Ready!`,
      `${ready.map(r => r.name).slice(0, 3).join(', ')} ready to mine.`,
      { typeKey: 'rocks_ready', dot: 'sky', tag: 'rocks_ready', renotify: true }
    );
  }

  rocks.filter(r => r.status !== 'ready' && r.msLeft > 0).forEach(r => {
    scheduleAt(`rock_${r.id}`, () => {
      if (!Storage.getNotifPrefs().rocks_ready) return;
      sendNotification(`${r.emoji} ${r.name} Ready!`, 'Rock ready to mine.', { typeKey: 'rocks_ready', dot: 'sky', tag: `rock_${r.id}` });
    }, r.msLeft);
  });
}

function checkBuildings(parsedFarm) {
  const { buildings = [] } = parsedFarm;
  const prefs = Storage.getNotifPrefs();
  const ready = buildings.filter(b => b.status === 'ready');

  if (ready.length > 0 && prefs.cooking_ready) {
    sendNotification(
      `🍳 Cooking Done!`,
      `${ready.map(b => `${b.cooking} in ${b.name}`).slice(0, 2).join(', ')} ready.`,
      { typeKey: 'cooking_ready', dot: 'amber', tag: 'cooking_ready', renotify: true }
    );
  }

  buildings.filter(b => b.status !== 'ready' && b.msLeft > 0).forEach(b => {
    scheduleAt(`building_${b.id}`, () => {
      if (!Storage.getNotifPrefs().cooking_ready) return;
      sendNotification(`🍳 ${b.cooking} Ready!`, `Cooking done in ${b.name}.`, { typeKey: 'cooking_ready', dot: 'amber', tag: `building_${b.id}` });
    }, b.msLeft);
  });
}

function checkBeehives(parsedFarm) {
  const { beehives = [] } = parsedFarm;
  const prefs = Storage.getNotifPrefs();
  const ready = beehives.filter(h => h.status === 'ready');

  if (ready.length > 0 && prefs.beehive_ready) {
    sendNotification(
      `🍯 Honey Ready!`,
      `${ready.length} beehive${ready.length > 1 ? 's' : ''} ready to collect.`,
      { typeKey: 'beehive_ready', dot: 'amber', tag: 'beehive_ready', renotify: true }
    );
  }

  beehives.filter(h => h.status !== 'ready' && h.msLeft > 0).forEach(h => {
    scheduleAt(`hive_${h.id}`, () => {
      if (!Storage.getNotifPrefs().beehive_ready) return;
      sendNotification('🍯 Honey Ready!', 'Beehive is ready to collect.', { typeKey: 'beehive_ready', dot: 'amber', tag: `hive_${h.id}` });
    }, h.msLeft);
  });
}

function checkOil(parsedFarm) {
  const { oil = [] } = parsedFarm;
  const prefs = Storage.getNotifPrefs();
  const ready = oil.filter(o => o.status === 'ready');

  if (ready.length > 0 && prefs.oil_ready) {
    sendNotification(
      `🛢 Oil Ready!`,
      `${ready.length} oil reserve${ready.length > 1 ? 's' : ''} ready.`,
      { typeKey: 'oil_ready', dot: 'sky', tag: 'oil_ready', renotify: true }
    );
  }

  oil.filter(o => o.status !== 'ready' && o.msLeft > 0).forEach(o => {
    scheduleAt(`oil_${o.id}`, () => {
      if (!Storage.getNotifPrefs().oil_ready) return;
      sendNotification('🛢 Oil Ready!', 'Oil reserve is ready.', { typeKey: 'oil_ready', dot: 'sky', tag: `oil_${o.id}` });
    }, o.msLeft);
  });
}

function checkGreenhouse(parsedFarm) {
  const { greenhouse = [] } = parsedFarm;
  const prefs = Storage.getNotifPrefs();
  const ready = greenhouse.filter(g => g.status === 'ready');

  if (ready.length > 0 && prefs.greenhouse_ready) {
    sendNotification(
      `🏡 Greenhouse Ready!`,
      `${ready.length} plant${ready.length > 1 ? 's' : ''} ready to harvest.`,
      { typeKey: 'greenhouse_ready', dot: 'emerald', tag: 'greenhouse_ready', renotify: true }
    );
  }

  greenhouse.filter(g => g.status !== 'ready' && g.msLeft > 0).forEach(g => {
    scheduleAt(`gh_${g.id}`, () => {
      if (!Storage.getNotifPrefs().greenhouse_ready) return;
      sendNotification(`🏡 ${g.name} Ready!`, 'Greenhouse plant ready.', { typeKey: 'greenhouse_ready', dot: 'emerald', tag: `gh_${g.id}` });
    }, g.msLeft);
  });
}

function checkComposting(parsedFarm) {
  const { composting = [] } = parsedFarm;
  const prefs = Storage.getNotifPrefs();
  const ready = composting.filter(c => c.status === 'ready');

  if (ready.length > 0 && prefs.composting_ready) {
    sendNotification(
      `♻️ Compost Ready!`,
      `${ready.length} composter${ready.length > 1 ? 's' : ''} ready to collect.`,
      { typeKey: 'composting_ready', dot: 'emerald', tag: 'composting_ready', renotify: true }
    );
  }
}

function checkFlowers(parsedFarm) {
  const { flowers = [] } = parsedFarm;
  const prefs = Storage.getNotifPrefs();
  const ready = flowers.filter(f => f.status === 'ready');

  if (ready.length > 0 && prefs.flower_ready) {
    sendNotification(
      `🌸 Flowers Ready!`,
      `${ready.length} flower${ready.length > 1 ? 's' : ''} ready to pick.`,
      { typeKey: 'flower_ready', dot: 'emerald', tag: 'flower_ready', renotify: true }
    );
  }

  flowers.filter(f => f.status !== 'ready' && f.msLeft > 0).forEach(f => {
    scheduleAt(`flower_${f.id}`, () => {
      if (!Storage.getNotifPrefs().flower_ready) return;
      sendNotification(`🌸 ${f.name} Ready!`, 'Flower is ready to pick.', { typeKey: 'flower_ready', dot: 'emerald', tag: `flower_${f.id}` });
    }, f.msLeft);
  });
}

function checkCropMachine(parsedFarm) {
  const { cropMachine = [] } = parsedFarm;
  const prefs = Storage.getNotifPrefs();
  const ready = cropMachine.filter(c => c.status === 'ready');

  if (ready.length > 0 && prefs.crop_machine_ready) {
    sendNotification(
      `🚜 Crop Machine Ready!`,
      `${ready.length} batch${ready.length > 1 ? 'es' : ''} ready to collect.`,
      { typeKey: 'crop_machine_ready', dot: 'sky', tag: 'crop_machine_ready', renotify: true }
    );
  }

  cropMachine.filter(c => c.status !== 'ready' && c.msLeft > 0).forEach(c => {
    scheduleAt(`cropmachine_${c.id}`, () => {
      if (!Storage.getNotifPrefs().crop_machine_ready) return;
      sendNotification(`🚜 ${c.name} Ready!`, 'Crop machine harvest ready.', { typeKey: 'crop_machine_ready', dot: 'sky', tag: `cropmachine_${c.id}` });
    }, c.msLeft);
  });
}

function checkSflPrice(currentPrice) {
  if (!currentPrice) return;
  const prefs   = Storage.getNotifPrefs();
  const settings = Storage.getSettings();
  if (!prefs.sfl_price_alert) return;

  const { sflPriceAlertHigh, sflPriceAlertLow } = settings;
  const prev = _lastSflPrice;
  _lastSflPrice = currentPrice;

  if (prev === null) return;

  if (sflPriceAlertHigh && currentPrice >= sflPriceAlertHigh && prev < sflPriceAlertHigh) {
    sendNotification(
      `📈 SFL Price High Alert!`,
      `SFL is now $${currentPrice.toFixed(4)} (above your $${sflPriceAlertHigh} target).`,
      { typeKey: 'sfl_price_alert', dot: 'emerald', tag: 'sfl_price_alert' }
    );
  }

  if (sflPriceAlertLow && currentPrice <= sflPriceAlertLow && prev > sflPriceAlertLow) {
    sendNotification(
      `📉 SFL Price Low Alert!`,
      `SFL dropped to $${currentPrice.toFixed(4)} (below your $${sflPriceAlertLow} target).`,
      { typeKey: 'sfl_price_alert', dot: 'coral', tag: 'sfl_price_alert' }
    );
  }
}

// =====================================================
// MAIN: Schedule all notifications from farm data
// =====================================================

function scheduleAllNotifications(parsedFarm, sflPrice = null) {
  if (!hasPermission()) return;
  if (!parsedFarm) return;

  clearAllScheduled();
  _lastFarmData = parsedFarm;

  checkCrops(parsedFarm);
  checkAnimals(parsedFarm);
  checkTrees(parsedFarm);
  checkRocks(parsedFarm);
  checkBuildings(parsedFarm);
  checkBeehives(parsedFarm);
  checkOil(parsedFarm);
  checkGreenhouse(parsedFarm);
  checkComposting(parsedFarm);
  checkFlowers(parsedFarm);
  checkCropMachine(parsedFarm);
  if (sflPrice) checkSflPrice(sflPrice);
}

// =====================================================
// EXPORTS
// =====================================================

function onBadgeUpdate(cb) { _onBadgeUpdate = cb; }

export default {
  NOTIF_TYPES,
  requestPermission,
  hasPermission,
  sendNotification,
  scheduleAllNotifications,
  checkSflPrice,
  clearAllScheduled,
  onBadgeUpdate,
};
