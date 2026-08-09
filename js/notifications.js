/**
 * Notifications Engine for Super Sunflower Land
 * Handles HTML5 Web Push Notifications for in-game events
 */

window.__app = window.__app || {};

const DEFAULT_PREFS = {
  master: false,
  crops: true,
  animals: true,
  fruits: true,
  trees: true,
  rocks: true,
  beehives: true,
  flowers: true,
  oil: true,
  composting: true,
  greenhouse: true,
  buildings: true,
  cropMachine: true,
  crabTraps: true,
  shrines: true,
  agingShed: true,
  saltFarm: true,
  deliveries: true,
  market: true,
  dailyReset: true
};

class NotificationEngine {
  constructor() {
    this.prefs = { ...DEFAULT_PREFS };
    this.notifiedIds = this.loadNotifiedIds();
    this.loadPrefs();
  }

  loadNotifiedIds() {
    try {
      const arr = JSON.parse(localStorage.getItem('sfl_notified_ids') || '[]');
      return new Set(arr);
    } catch(e) {
      return new Set();
    }
  }

  saveNotifiedIds() {
    localStorage.setItem('sfl_notified_ids', JSON.stringify([...this.notifiedIds]));
  }

  loadPrefs() {
    try {
      const saved = localStorage.getItem('sfl_notify_prefs');
      if (saved) {
        this.prefs = { ...DEFAULT_PREFS, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.error('Failed to load notification prefs', e);
    }
  }

  savePrefs() {
    localStorage.setItem('sfl_notify_prefs', JSON.stringify(this.prefs));
  }

  setPref(key, value) {
    this.prefs[key] = value;
    this.savePrefs();
    
    // If enabling master, ask for permission
    if (key === 'master' && value === true) {
      this.requestPermission();
    } else {
      this.syncPrefsToSupabase();
    }

    if (window.__app?.ui) {
      window.__app.ui.renderNotificationSettings();
    }
  }

  async syncPrefsToSupabase() {
    if (!this.prefs.master) return;
    const farmId = window.__app?.State?.farmId;
    if (!farmId) return;

    try {
      const SUPABASE_URL = 'https://ykbpkhsrxtnnisnorwhd.supabase.co';
      const SUPABASE_ANON = 'sb_publishable_Txki7crNaFMuqseK9G6JKw_aR4TsulA';
      
      await fetch(`${SUPABASE_URL}/rest/v1/push_subscriptions?farm_id=eq.${farmId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON,
          'Authorization': `Bearer ${SUPABASE_ANON}`
        },
        body: JSON.stringify({
          preferences: this.prefs
        })
      });
      console.log('Preferências sincronizadas com a nuvem.');
    } catch(e) {
      console.error('Erro ao sincronizar prefs', e);
    }
  }

  // Helper for VAPID keys
  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  async requestPermission() {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      alert('Seu navegador não suporta Web Push.');
      this.setPref('master', false);
      return false;
    }
    
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        this.setPref('master', false);
        return false;
      }

      // IMPORTANTE: Insira sua Chave Pública VAPID aqui
      const publicVapidKey = 'BIyHzQRluCO6jIO6cifQJLbiVoZyPo9EH3Cmb-VQ78MSBkeRgPE87sc43aK4D8sIZlYwAmGY13fUt-c19GvpEpo'; 
      if (publicVapidKey === 'COLOQUE_SUA_CHAVE_PUBLICA_VAPID_AQUI') {
        alert('O desenvolvedor precisa configurar a chave VAPID no código para as notificações funcionarem 24/7.');
        return true;
      }

      const registration = await navigator.serviceWorker.ready;
      
      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(publicVapidKey)
        });
      }

      const p256dh = btoa(String.fromCharCode.apply(null, new Uint8Array(subscription.getKey('p256dh'))));
      const auth = btoa(String.fromCharCode.apply(null, new Uint8Array(subscription.getKey('auth'))));
      
      const farmId = window.__app?.State?.farmId;
      if (!farmId) {
         console.error('Farm ID não encontrado');
         return true;
      }

      // URL do Supabase fornecida pelo usuário
      const SUPABASE_URL = 'https://ykbpkhsrxtnnisnorwhd.supabase.co';
      const SUPABASE_ANON = 'sb_publishable_Txki7crNaFMuqseK9G6JKw_aR4TsulA';

      await fetch(`${SUPABASE_URL}/rest/v1/push_subscriptions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON,
          'Authorization': `Bearer ${SUPABASE_ANON}`,
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify({
          farm_id: farmId,
          endpoint: subscription.endpoint,
          p256dh: p256dh,
          auth: auth,
          preferences: this.prefs
        })
      });

      console.log('Push subscription salva no Supabase!');
      this.sendPush('Push 24/7 Ativado! ✅', { body: 'Você receberá notificações através do Supabase.', tag: 'system' });
      return true;
    } catch (e) {
      console.error(e);
      alert('Erro ao ativar notificações 24/7: ' + e.message);
      this.setPref('master', false);
      return false;
    }
  }

  async sendPush(title, options = {}) {
    if (!this.prefs.master || Notification.permission !== 'granted') return;
    
    const defaultOptions = {
      icon: 'https://sfl.world/favicon.ico',
      badge: 'https://sfl.world/favicon.ico',
      vibrate: [200, 100, 200],
      tag: 'sfl-pro-' + Date.now()
    };

    try {
      // If service worker is active, use it (better support for mobile PWA)
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.ready;
        reg.showNotification(title, { ...defaultOptions, ...options });
      } else {
        // Fallback for desktop standard
        new Notification(title, { ...defaultOptions, ...options });
      }
    } catch (e) {
      console.error('Push Error:', e);
    }
  }

  process(parsedFarm) {
    if (!this.prefs.master || Notification.permission !== 'granted' || !parsedFarm) return;
    
    const activeIdsThisTick = new Set();
    const now = Date.now();

    // 1. CROPS
    if (this.prefs.crops && parsedFarm.crops) {
      parsedFarm.crops.forEach(crop => {
        if (crop.status === 'ready') {
          // Use crop name + readyAt as unique signature for this batch
          const uid = `crop-${crop.name}-${crop.readyAt}`;
          activeIdsThisTick.add(uid);
          
          if (!this.notifiedIds.has(uid)) {
            const img = `https://sfl.world/img/source/${encodeURIComponent(crop.name)}.png`;
            this.sendPush(`Colheita Pronta! ${crop.emoji}`, { 
              body: `Suas plantações de ${crop.name} (${crop.amount} un) estão prontas para colher.`,
              tag: 'crops',
              icon: img
            });
            this.notifiedIds.add(uid);
          }
        }
      });
    }

    // 2. ANIMALS
    if (this.prefs.animals && parsedFarm.animals) {
      parsedFarm.animals.forEach(animal => {
        const isReady = animal.status === 'ready';
        const isHungry = animal.status === 'soon';
        const needsLove = animal.status === 'needsLove';
        
        if (isReady || isHungry || needsLove) {
          const uid = `animal-${animal.id}-${animal.status}`;
          activeIdsThisTick.add(uid);
          
          if (!this.notifiedIds.has(uid)) {
            let msg = '';
            if (isReady) msg = `${animal.name} tem recursos para coletar!`;
            if (isHungry) msg = `${animal.name} está com fome.`;
            if (needsLove) msg = `${animal.name} precisa de carinho.`;
            
            let imgName = animal.type || animal.name.split(' ')[0];
            const img = `https://sfl.world/img/source/${encodeURIComponent(imgName)}.png`;
            this.sendPush(`Aviso Animal! ${animal.emoji}`, { body: msg, tag: 'animals', icon: img });
            this.notifiedIds.add(uid);
          }
        }
      });
    }

    // 3. FRUITS
    if (this.prefs.fruits && parsedFarm.fruits) {
      parsedFarm.fruits.forEach(fruit => {
        if (fruit.status === 'ready') {
          const uid = `fruit-${fruit.name}-${fruit.readyAt}`;
          activeIdsThisTick.add(uid);
          
          if (!this.notifiedIds.has(uid)) {
            const img = `https://sfl.world/img/source/${encodeURIComponent(fruit.name)}.png`;
            this.sendPush(`Fruta Pronta! ${fruit.emoji}`, { 
              body: `Suas árvores de ${fruit.name} (${fruit.amount} un) estão prontas para colher.`,
              tag: 'fruits',
              icon: img
            });
            this.notifiedIds.add(uid);
          }
        }
      });
    }

    // 4. RESOURCES (Wood, Stone, Iron, Gold, Beehives)
    if (this.prefs.resources) {
      const checkRes = (list, tag, title) => {
        if (!list) return;
        list.forEach(res => {
          if (res.status === 'ready') {
            const timeKey = res.readyAt !== undefined ? res.readyAt : res.msLeft;
            const uid = `res-${res.id || res.name}-${timeKey}`;
            activeIdsThisTick.add(uid);
            if (!this.notifiedIds.has(uid)) {
              let imgName = res.name;
              if (res.name.includes('Tree')) imgName = 'Wood';
              else if (res.name.includes('Stone')) imgName = 'Stone';
              else if (res.name.includes('Iron')) imgName = 'Iron';
              else if (res.name.includes('Gold')) imgName = 'Gold';
              else if (res.name.includes('Crimstone')) imgName = 'Crimstone';
              else if (res.name.includes('Sunstone')) imgName = 'Sunstone';
              else if (res.name.includes('Beehive')) imgName = 'Honey';
              else if (res.name.includes('Oil')) imgName = 'Oil';
              else if (res.name.includes('Mushroom')) imgName = 'Wild Mushroom';
              
              const img = `https://sfl.world/img/source/${encodeURIComponent(imgName)}.png`;
              const amountStr = (res.amount && parseFloat(res.amount) > 0) ? ` (${res.amount} un)` : '';
              
              this.sendPush(`${title} Pronta! ${res.emoji || '📦'}`, { 
                body: `Seu recurso ${res.name}${amountStr} está pronto para coletar.`,
                tag: tag,
                icon: img
              });
              this.notifiedIds.add(uid);
    // 4. RESOURCES & BUILDINGS
    const checkRes = (list, tag, title) => {
      if (!list) return;
      list.forEach(res => {
        if (res.status === 'ready') {
          const timeKey = res.readyAt !== undefined ? res.readyAt : res.msLeft;
          const uid = `res-${res.id || res.name}-${timeKey}`;
          activeIdsThisTick.add(uid);
          if (!this.notifiedIds.has(uid)) {
            let imgName = res.name;
            if (res.name.includes('Tree')) imgName = 'Wood';
            else if (res.name.includes('Stone')) imgName = 'Stone';
            else if (res.name.includes('Iron')) imgName = 'Iron';
            else if (res.name.includes('Gold')) imgName = 'Gold';
            else if (res.name.includes('Crimstone')) imgName = 'Crimstone';
            else if (res.name.includes('Sunstone')) imgName = 'Sunstone';
            else if (res.name.includes('Beehive')) imgName = 'Honey';
            else if (res.name.includes('Oil')) imgName = 'Oil';
            else if (res.name.includes('Mushroom')) imgName = 'Wild Mushroom';
            
            const img = `https://sfl.world/img/source/${encodeURIComponent(imgName)}.png`;
            const amountStr = (res.amount && parseFloat(res.amount) > 0) ? ` (${res.amount} un)` : '';
            
            this.sendPush(`${title} Pronta! ${res.emoji || '📦'}`, { 
              body: `Seu recurso ${res.name}${amountStr} está pronto para coletar.`,
              tag: tag,
              icon: img
            });
            this.notifiedIds.add(uid);
          }
        }
      });
    };
    if (parsedFarm.trees && this.prefs.trees) checkRes(parsedFarm.trees, 'trees', 'Árvore');
    if (parsedFarm.stones && this.prefs.rocks) checkRes(parsedFarm.stones, 'stones', 'Pedra');
    if (parsedFarm.iron && this.prefs.rocks) checkRes(parsedFarm.iron, 'iron', 'Ferro');
    if (parsedFarm.gold && this.prefs.rocks) checkRes(parsedFarm.gold, 'gold', 'Ouro');
    if (parsedFarm.crimstones && this.prefs.rocks) checkRes(parsedFarm.crimstones, 'crimstones', 'Crimstone');
    if (parsedFarm.sunstones && this.prefs.rocks) checkRes(parsedFarm.sunstones, 'sunstones', 'Sunstone');
    if (parsedFarm.beehives && this.prefs.beehives) checkRes(parsedFarm.beehives, 'beehives', 'Colmeia');
    if (parsedFarm.flowers && this.prefs.flowers) checkRes(parsedFarm.flowers, 'flowers', 'Flor');
    if (parsedFarm.oil && this.prefs.oil) checkRes(parsedFarm.oil, 'oil', 'Óleo');
    
    if (parsedFarm.composting && this.prefs.composting) checkRes(parsedFarm.composting, 'composting', 'Composteira');
    if (parsedFarm.greenhouse && this.prefs.greenhouse) checkRes(parsedFarm.greenhouse, 'greenhouse', 'Estufa');
    if (parsedFarm.buildings && this.prefs.buildings) checkRes(parsedFarm.buildings, 'buildings', 'Construção');
    if (parsedFarm.cropMachine && this.prefs.cropMachine) checkRes(parsedFarm.cropMachine, 'cropMachine', 'Crop Machine');
    
    if (parsedFarm.crabTraps && this.prefs.crabTraps) checkRes(parsedFarm.crabTraps, 'crabTraps', 'Armadilha');
    if (parsedFarm.shrines && this.prefs.shrines) checkRes(parsedFarm.shrines, 'shrines', 'Santuário');
    if (parsedFarm.agingShed && this.prefs.agingShed) checkRes(parsedFarm.agingShed, 'agingShed', 'Galpão');
    if (parsedFarm.saltFarm && this.prefs.saltFarm) checkRes(parsedFarm.saltFarm, 'saltFarm', 'Salina');

    // Daily Reset (00:00 UTC)
    if (this.prefs.dailyReset) {
      const nowUtc = new Date();
      if (nowUtc.getUTCHours() === 0 && nowUtc.getUTCMinutes() < 15) {
        const resetDateStr = nowUtc.toISOString().split('T')[0];
        const uid = `dailyreset-${resetDateStr}`;
        activeIdsThisTick.add(uid);
        if (!this.notifiedIds.has(uid)) {
          this.sendPush(`Daily Reset!`, {
            body: `Your farm has been reset. Time to start a new day!`,
            tag: 'general-farm',
            icon: `https://sfl.world/favicon.ico`
          });
          this.notifiedIds.add(uid);
        }
      }
    }

    // 5. DELIVERIES
    if (this.prefs.deliveries && parsedFarm.deliveries) {
      parsedFarm.deliveries.forEach(deliv => {
        if (deliv.status === 'ready') {
          const uid = `deliv-${deliv.id}`;
          activeIdsThisTick.add(uid);
          
          if (!this.notifiedIds.has(uid)) {
            this.sendPush(`Entrega Disponível! 📦`, { 
              body: `NPC ${deliv.npc} está pronto para receber sua entrega.`,
              tag: 'deliveries',
              icon: `https://sfl.world/img/source/${encodeURIComponent(deliv.npc || 'bumpkin')}.png`
            });
            this.notifiedIds.add(uid);
          }
        }
      });
    }

    // 6. MARKET
    if (this.prefs.market && parsedFarm.inventory) {
      // Profit targets are evaluated per item by checking current API prices
      const prices = window.__app.State?.parsedPrices;
      if (prices) {
        let targetsStr = localStorage.getItem('sfl_profit_pct');
        let costsStr = localStorage.getItem('sfl_base_cost');
        let alertsStr = localStorage.getItem('sfl_alerts'); 
        
        try {
          const targets = JSON.parse(targetsStr || '{}');
          const costs = JSON.parse(costsStr || '{}');
          const oldAlerts = JSON.parse(alertsStr || '[]');
          
          // default farm tax is 15% if we can't parse it
          let farmTaxPct = 15;
          if (parsedFarm.bumpkin) {
             const vip = parsedFarm.inventory?.['VIP Ticket'];
             if (vip) farmTaxPct = 7.5;
          }
          const taxRate = farmTaxPct / 100;
          
          // Check targets
          Object.keys(targets).forEach(itemName => {
            const itemProfitPct = targets[itemName] || 0;
            const costToUse = costs[itemName] || 0;
            const currentPrice = prices[itemName];
            
            if (itemProfitPct > 0 && costToUse > 0 && currentPrice > 0) {
              const targetPriceNeeded = (costToUse * (1 + itemProfitPct / 100)) / (1 - taxRate);
              if (currentPrice >= targetPriceNeeded) {
                const uid = `market-target-${itemName}-${targetPriceNeeded.toFixed(4)}`;
                activeIdsThisTick.add(uid);
                
                if (!this.notifiedIds.has(uid)) {
                  const img = `https://sfl.world/img/source/${encodeURIComponent(itemName)}.png`;
                  this.sendPush(`Meta de Lucro Atingida! 💰`, {
                    body: `${itemName} atingiu o preço de ${currentPrice.toFixed(4)} SFL! Venda agora para lucrar +${itemProfitPct}%.`,
                    tag: 'market',
                    icon: img
                  });
                  this.notifiedIds.add(uid);
                }
              }
            }
          });
          
          // Check custom price alerts (Pump)
          oldAlerts.forEach(alert => {
            const currentPrice = prices[alert.item];
            if (currentPrice && alert.type === 'up' && currentPrice >= alert.threshold) {
              const uid = `market-alert-${alert.item}-${alert.threshold}`;
              activeIdsThisTick.add(uid);
              if (!this.notifiedIds.has(uid)) {
                const img = `https://sfl.world/img/source/${encodeURIComponent(alert.item)}.png`;
                this.sendPush(`ALERTA: PUMP no Mercado! 🚀`, {
                  body: `${alert.item} subiu para ${currentPrice.toFixed(4)} SFL!`,
                  tag: 'market',
                  icon: img
                });
                this.notifiedIds.add(uid);
              }
            }
          });
        } catch(e) {}
      }
    }

    // CLEANUP
    const toKeep = new Set();
    this.notifiedIds.forEach(uid => {
      if (activeIdsThisTick.has(uid)) {
        toKeep.add(uid);
      }
    });
    this.notifiedIds = toKeep;
    this.saveNotifiedIds();
  }
}

window.__app.NotificationEngine = new NotificationEngine();
