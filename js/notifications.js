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
  resources: true,
  market: true,
  deliveries: true
};

class NotificationEngine {
  constructor() {
    this.prefs = { ...DEFAULT_PREFS };
    this.notifiedIds = new Set();
    this.loadPrefs();
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
    }
  }

  async requestPermission() {
    if (!('Notification' in window)) {
      alert('Seu navegador não suporta notificações de sistema.');
      this.setPref('master', false);
      return false;
    }
    
    if (Notification.permission === 'granted') return true;
    
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        this.setPref('master', false);
        return false;
      }
      // Test notification
      this.sendPush('SFL PRO: Notificações Ativadas! ✅', { body: 'Você receberá avisos da sua fazenda por aqui.' });
      return true;
    } catch (e) {
      console.error(e);
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
            const uid = `res-${res.name}-${res.readyAt || res.msLeft}`;
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
              this.sendPush(`${title} Pronta! ${res.emoji}`, { 
                body: `Seu recurso ${res.name} (${res.amount} un) está pronto para coletar.`,
                tag: tag,
                icon: img
              });
              this.notifiedIds.add(uid);
            }
          }
        });
      };
      checkRes(parsedFarm.trees, 'trees', 'Madeira');
      checkRes(parsedFarm.stones, 'stones', 'Pedra');
      checkRes(parsedFarm.irons, 'irons', 'Ferro');
      checkRes(parsedFarm.golds, 'golds', 'Ouro');
      checkRes(parsedFarm.crimstones, 'crimstones', 'Crimstone');
      checkRes(parsedFarm.beehives, 'beehives', 'Mel');
      checkRes(parsedFarm.flowers, 'flowers', 'Flor');
      checkRes(parsedFarm.oil, 'oil', 'Óleo');
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
              tag: 'deliveries'
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
  }
}

window.__app.NotificationEngine = new NotificationEngine();
