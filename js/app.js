/**
 * app.js Ã¢â‚¬â€ Controlador Principal
 * Gerencia o estado da aplicaÃƒÂ§ÃƒÂ£o, roteamento das abas e ciclo de vida
 */

import Storage from './storage.js?v=141';
import API from './api.js?v=141';
import Farm from './farm.js?v=141';
import UI from './ui.js?v=141';

import i18n from './i18n.js?v=141';

// --- State ---
const State = {
  currentTab: 'farm',
  farmId: Storage.getActiveFarm(),
  parsedFarm: null,
  exchange: null,
  prices: null,
  refreshTimer: null,
  isRefreshing: false,
  lastSyncTime: 0,
};

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];

// =====================================================
// INIT
// =====================================================

async function init() {
  console.log('Ã°Å¸Å’Â» Sunflower Super App init...');

  // Init i18n
  i18n.initI18n();

  const settings = Storage.getSettings();


  // Setup globals for UI callbacks
  window.__app = {
    State: State,
    UI: UI,
    ...(window.__app || {}),
    removeFarm,
    syncData: async () => {
      if (!State.farmId) return;
      UI.showToast('Sincronizando com a blockchain...', 'info');
      // Clear API caches for this farm to force fresh fetch
      localStorage.removeItem('sfl_cache_farm_' + State.farmId);
      localStorage.removeItem('sfl_cache_land_' + State.farmId);
      await refreshData(true);
      UI.showToast('Colheita Sincronizada!', 'success');
    },
    saveAndGoToFarm: async () => {
      const input = document.getElementById('settings-farm-input');
      const farmId = input ? input.value.trim() : '';
      
      const apiKeyInput = document.getElementById('input-api-key');
      if (apiKeyInput) {
        Storage.saveSettings({ communityApiKey: apiKeyInput.value.trim() });
      }

      if (!farmId) return;
      
      const btn = input ? input.nextElementSibling : null;
      if (btn) btn.innerHTML = '<span class="spinner" style="width:14px;height:14px;border:2px solid rgba(0,0,0,0.3);border-top-color:#000;border-radius:50%;display:inline-block;animation:spin 1s linear infinite;"></span> Entrando...';

      Storage.addFarmId(farmId);
      State.farmId = farmId;
      
      await refreshData(true);
      
      window.__app.switchTab('farm');
    },
    saveApiKey: async () => {
      const apiKeyInput = document.getElementById('input-api-key');
      let key = apiKeyInput ? apiKeyInput.value.trim() : '';
      Storage.saveSettings({ communityApiKey: key });
      UI.showToast('Chave da API salva com sucesso! Sincronizando...', 'success');
      await refreshData(true);
    },
    refreshData,
    State,
    Farm,
    openP2pCalc: UI.openP2pCalc,
    updateP2pCalc: UI.updateP2pCalc,
    showTargetProfit: UI.showTargetProfit,
    // Returns the current fully-parsed farm object so UI callbacks can access live data
    getFarmData: () => State.parsedFarm || {},
    getEstimatedCost: UI.getEstimatedCost,
    switchTab: (tabId) => {
      switchTab(tabId);
    },
    convertFlower: (val, rateBrl, rateUsd) => {
      const num = parseFloat(val) || 0;
      const resBrl = num * rateBrl;
      const resUsd = num * rateUsd;
      const el = document.getElementById('flw-converter-result');
      if (el) el.innerHTML = `R$&nbsp;${resBrl.toFixed(2)}<br><span style="font-size:11px;color:var(--text-tertiary);margin-top:2px;">($${resUsd.toFixed(2)})</span>`;
    },
    promptGlobalAlerts: () => {
      const html = `
        <div style="padding:16px;">
          <div style="margin-bottom:12px;color:var(--text-secondary);font-size:14px;">Defina automaticamente um alvo de venda para <b>TODOS</b> os itens do seu estoque baseados no preÃƒÂ§o atual de mercado.</div>
          
          <div style="display:flex; flex-direction:column; gap:8px;">
            <button onclick="window.__app.applyGlobalAlerts(1.10)" class="btn" style="border:1px solid var(--emerald); background:transparent; color:var(--emerald); padding:12px; font-weight:700; border-radius:8px; cursor:pointer;">+10% de Lucro</button>
            <button onclick="window.__app.applyGlobalAlerts(1.20)" class="btn" style="border:1px solid var(--emerald); background:transparent; color:var(--emerald); padding:12px; font-weight:700; border-radius:8px; cursor:pointer;">+20% de Lucro</button>
            <button onclick="window.__app.applyGlobalAlerts(1.50)" class="btn" style="border:1px solid var(--emerald); background:transparent; color:var(--emerald); padding:12px; font-weight:700; border-radius:8px; cursor:pointer;">+50% de Lucro</button>
          </div>
          
          <div style="margin-top:16px;font-size:11px;color:var(--text-tertiary);text-align:center;">
            Isso vai substituir os alvos que vocÃƒÂª definiu manualmente.
          </div>
        </div>
      `;
      UI.showModal('Ã°Å¸Å¡â‚¬ EstratÃƒÂ©gia Global', html);
    },
    applyGlobalAlerts: (multiplier) => {
      const inv = State.parsedFarm?.inventory;
      if (!inv) return;
      const allOwned = [...inv.crops, ...inv.resources, ...inv.food, ...inv.special];
      
      const prices = State.prices?.p2p || State.prices?.data?.p2p || {};
      
      let count = 0;
      allOwned.forEach(item => {
        const price = prices[item.name];
        if (price && item.qty > 0) {
          Storage.savePriceAlert({ item: item.name, type: 'up', threshold: price * multiplier });
          count++;
        }
      });
      UI.hideModal();
      UI.showToast(`${count} alvos atualizados com sucesso!`, 'success');
      if (State.currentTab === 'market') UI.renderMarketPage(State.prices, State.exchange);
    },
    promptPriceAlert: (item, currentPrice) => {
      let history = {};
      try { history = JSON.parse(localStorage.getItem('prices_history') || '{}'); } catch(e) {}
      const maxPrice = history[item]?.max;
      const autoPrice = maxPrice ? Math.max(maxPrice, currentPrice * 1.05).toFixed(4) : (currentPrice * 1.15).toFixed(4);

      const html = `
        <div style="padding:16px;">
          <div style="margin-bottom:12px;color:var(--text-secondary);font-size:14px;">Defina o preÃƒÂ§o alvo (SFL) para vender <b>${item}</b>. O card ficarÃƒÂ¡ destacado quando o mercado atingir este valor.</div>
          <div style="font-size:12px;margin-bottom:16px; display:flex; justify-content:space-between;">
            <span>PreÃƒÂ§o atual: <span style="color:var(--amber);font-weight:700;">${currentPrice} SFL</span></span>
            ${maxPrice ? `<span>MÃƒÂ¡x HistÃƒÂ³rico: <span style="color:var(--emerald);font-weight:700;">${maxPrice} SFL</span></span>` : ''}
          </div>
          <input type="number" id="prompt-alert-input" step="0.0001" placeholder="Ex: ${autoPrice}" style="width:100%;padding:12px;border-radius:8px;border:1px solid var(--surface-border);background:var(--surface-3);color:var(--text-primary);margin-bottom:16px;">
          <div style="display:flex; gap:8px;">
            <button id="prompt-alert-auto" class="btn" style="flex:1; border:1px solid var(--emerald); border-radius:8px; background:transparent; color:var(--emerald); padding:12px; font-weight:700; cursor:pointer;">Auto (${autoPrice})</button>
            <button id="prompt-alert-save" class="btn btn-primary" style="flex:1; border:none; border-radius:8px; background:var(--emerald); color:#fff; padding:12px; font-weight:700; cursor:pointer;">Salvar Alvo</button>
          </div>
        </div>
      `;
      UI.showModal('Ã°Å¸Å½Â¯ Alvo de Venda', html);
      setTimeout(() => {
        const btnSave = document.getElementById('prompt-alert-save');
        const btnAuto = document.getElementById('prompt-alert-auto');
        const input = document.getElementById('prompt-alert-input');
        
        if (btnAuto) {
          btnAuto.onclick = () => {
            input.value = autoPrice;
          };
        }
        if (btnSave) {
          btnSave.onclick = () => {
            const val = parseFloat(input.value);
            if (val > 0) {
              window.__app.addPriceAlert(item, 'up', val);
              if (State.currentTab === 'market') {
                UI.renderMarketPage(State.prices, State.exchange);
              }
            } else {
              UI.showToast('Valor invÃƒÂ¡lido', 'error');
            }
          };
        }
      }, 50);
    },
    addPriceAlert: (item, type, threshold) => {
      if (!item || !type || isNaN(threshold) || threshold <= 0) {
        UI.showToast('Insira um valor vÃƒÂ¡lido para o alerta!', 'error');
        return;
      }
      Storage.savePriceAlert({ item, type, threshold });
      UI.showToast(`Alerta salvo: ${item} ${type === 'up' ? 'Ã¢â€“Â²' : 'Ã¢â€“Â¼'} ${threshold} SFL Ã¢Å“â€¦`);
      UI.hideModal();
      if (State.currentTab === 'alerts') UI.renderAlertsPage();
    },
    deletePriceAlert: (item, type) => {
      Storage.deletePriceAlert(item, type);
      UI.renderAlertsPage();
      UI.showToast('Alerta removido.');
    },
    promptManualPurchase: () => {
      const html = `
        <div style="padding:16px;">
          <div style="margin-bottom:12px;">
            <label style="display:block;font-size:12px;font-weight:700;color:var(--text-tertiary);margin-bottom:4px;">Nome do Item</label>
            <input type="text" id="manual-purchase-item" placeholder="Ex: Sunflower" style="width:100%;padding:10px;border-radius:8px;border:1px solid var(--surface-border);background:var(--surface-3);color:var(--text-primary);">
          </div>
          <div style="margin-bottom:12px;display:flex;gap:12px;">
            <div style="flex:1;">
              <label style="display:block;font-size:12px;font-weight:700;color:var(--text-tertiary);margin-bottom:4px;">Quantidade</label>
              <input type="number" id="manual-purchase-qty" step="1" placeholder="Ex: 10" style="width:100%;padding:10px;border-radius:8px;border:1px solid var(--surface-border);background:var(--surface-3);color:var(--text-primary);">
            </div>
            <div style="flex:1;">
              <label style="display:block;font-size:12px;font-weight:700;color:var(--text-tertiary);margin-bottom:4px;">Custo (SFL/Flower)</label>
              <input type="number" id="manual-purchase-cost" step="0.0001" placeholder="Ex: 2.5" style="width:100%;padding:10px;border-radius:8px;border:1px solid var(--surface-border);background:var(--surface-3);color:var(--text-primary);">
            </div>
          </div>
          <div style="margin-bottom:16px;">
             <label style="display:block;font-size:12px;font-weight:700;color:var(--text-tertiary);margin-bottom:4px;">Data (Opcional)</label>
             <input type="datetime-local" id="manual-purchase-date" style="width:100%;padding:10px;border-radius:8px;border:1px solid var(--surface-border);background:var(--surface-3);color:var(--text-primary);">
          </div>
          <button id="manual-purchase-save" class="btn btn-primary" style="width:100%; border:none; border-radius:8px; background:var(--emerald); color:#fff; padding:12px; font-weight:700; cursor:pointer;">Registrar Compra</button>
        </div>
      `;
      UI.showModal('Ã°Å¸â€ºâ€™ Registrar Compra', html);
      setTimeout(() => {
        const btnSave = document.getElementById('manual-purchase-save');
        if (btnSave) {
          btnSave.onclick = () => {
            const item = document.getElementById('manual-purchase-item').value.trim();
            const qty = parseFloat(document.getElementById('manual-purchase-qty').value);
            const cost = parseFloat(document.getElementById('manual-purchase-cost').value);
            const dateStr = document.getElementById('manual-purchase-date').value;
            
            if (!item || isNaN(qty) || isNaN(cost)) {
              UI.showToast('Preencha os campos (Nome, Qtd, Custo).', 'error');
              return;
            }

            const ts = dateStr ? new Date(dateStr).getTime() : Date.now();
            let salesLog = [];
            try { salesLog = JSON.parse(localStorage.getItem('sfl_sales_log') || '[]'); } catch(e){}
            
            salesLog.push({
              id: 'manual_' + Date.now(),
              type: 'purchase',
              item: item,
              qty: qty,
              cost: cost,
              timestamp: ts
            });
            
            localStorage.setItem('sfl_sales_log', JSON.stringify(salesLog));
            UI.showToast('Compra registrada com sucesso!');
            UI.hideModal();
            if (State.currentTab === 'market') {
              UI.renderMarketFiltered('', 'history');
            }
          };
        }
      }, 50);
    },
    State,
  };

  // Unregister Service Workers to prevent caching bugs during dev
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(function(registrations) {
      for(let registration of registrations) {
        registration.unregister();
      }
    });
  }

  // Bind UI Events
  bindNavigation();

  // Listen for language changes
  document.addEventListener('language-changed', () => {
    renderCurrentTab();
  });
  bindGlobalEvents();

  // Load initial view instantly from cache (no API network delay on startup)
  loadCachedState();
  switchTab('farm');
  setupAutoRefresh();

  // First-run Push Notification Prompt
  setTimeout(() => {
    const hasSeenPrompt = localStorage.getItem('sfl_seen_push_prompt');
    if (!hasSeenPrompt && window.__app.UI && window.__app.UI.showModal) {
      const promptHtml = `
          <div style="text-align:center; padding: 10px;">
            <div style="font-size:40px; margin-bottom:12px;">ðŸ””</div>
            <p style="color:var(--text-secondary); margin-bottom: 20px;">Ative as notificaÃ§Ãµes para ser avisado quando suas PlantaÃ§Ãµes, Animais e Recursos estiverem prontos! Nunca mais perca tempo de jogo.</p>
            <div style="display:flex; flex-direction:column; gap:10px;">
              <button id="btn-activate-push" class="btn btn-primary" style="background:var(--emerald);color:#000;font-weight:bold;padding:12px;border-radius:12px;border:none;cursor:pointer;">Ativar NotificaÃ§Ãµes 24/7</button>
              <button id="btn-skip-push" class="btn btn-secondary" style="background:rgba(255,255,255,0.1);color:var(--text-tertiary);padding:12px;border-radius:12px;border:none;cursor:pointer;">Agora NÃ£o</button>
            </div>
          </div>
        `;
      window.__app.UI.showModal('NotificaÃ§Ãµes 24/7', promptHtml);
      
      setTimeout(() => {
        const btnActive = document.getElementById('btn-activate-push');
        const btnSkip = document.getElementById('btn-skip-push');
        
        if (btnActive) btnActive.addEventListener('click', async () => {
          window.__app.UI.hideModal();
          localStorage.setItem('sfl_seen_push_prompt', 'true');
          if (window.__app?.NotificationEngine) {
            window.__app.UI.showToast('Processando...', 'info');
            await window.__app.NotificationEngine.setPref('master', true);
            if (window.__app.NotificationEngine.prefs.master) { window.__app.UI.showToast('Notificações ativadas com sucesso!', 'success'); }
            window.__app.switchTab('settings');
          }
        });
        
        if (btnSkip) btnSkip.addEventListener('click', () => {
           window.__app.UI.hideModal();
           localStorage.setItem('sfl_seen_push_prompt', 'true');
        });
      }, 100);
    }
  }, 2000);

  // (Badge updates removed, using Web Push directly)
}

function loadCachedState() {
  const farmId = State.farmId;
  State.exchange = Storage.getCache('exchange', true);
  State.prices   = Storage.getCache('prices', true);
  State.lastSyncTime = Storage.getCache('last_sync_time', true) ?? 0;
  
  const farmData = farmId ? Storage.getCache(`farm_${farmId}`, true) : null;
  const landInfo = farmId ? Storage.getCache(`land_info_${farmId}`, true) : null;

  if (farmData) {
    State.rawFarm = farmData;
    State.parsedFarm = Farm.parseFarm(farmData, landInfo);
  } else if (landInfo) {
    State.rawFarm = landInfo;
    State.parsedFarm = Farm.parseLandInfo(landInfo);
    if (State.parsedFarm) {
      State.parsedFarm.isPartial = true;
    }
  } else {
    State.parsedFarm = null;
  }

  // Update badge UI on startup
  updateSyncBadge();

  // If a farmId is configured but no cache exists yet, fetch initial data
  if (farmId && !State.parsedFarm) {
    refreshData(false);
  }
}

// =====================================================
// DATA FETCH & LOOP
// =====================================================

async function refreshData(force = false) {
  if (State.isRefreshing) return;
  State.isRefreshing = true;
  updateSyncBadge();

  const btn = $('#btn-global-sync');
  if (btn) btn.classList.add('loading');

  try {
    const { exchange, prices, landInfo, farmData, errors } = await API.refreshAll(State.farmId, force);
    
    State.exchange = exchange;
    State.prices   = prices;
    
    const hasKeyError = errors.some(e => e?.includes('API Key') || e?.includes('unauthorized'));
    State.hasKeyError = hasKeyError;
    const settings = Storage.getSettings();

    if (errors.length > 0) {
      console.warn('API partial failures:', errors);
      if (hasKeyError) {
        UI.showToast('Chave de API InvÃƒÂ¡lida ou Expirada!', 'error');
        State.lastErrorMessage = 'API Key invalid/expired';
      }
    }

    // Track completed sales and purchases by comparing state before and after
    let prevListings = [];
    let prevBalance = 0;
    let prevInventory = {};
    try {
      prevListings = JSON.parse(localStorage.getItem('sfl_prev_listings') || '[]');
      prevBalance = parseFloat(localStorage.getItem('sfl_prev_balance') || '0');
      prevInventory = JSON.parse(localStorage.getItem('sfl_prev_inventory') || '{}');
    } catch(e) {}
    if (farmData) {
      // Full game state
      State.rawFarm = farmData;
      State.parsedFarm = Farm.parseFarm(farmData, landInfo);
      State.hasKeyError = false;

      // Detect completed sales (compare tradeListings before and after)
      try {
        const farm = farmData.farm || farmData;
        const currentListings = Object.entries(farm.tradeListings || {}).map(([id, l]) => ({id, ...l}));
        if (prevListings.length > 0) {
          prevListings.forEach(prev => {
            const stillExists = currentListings.find(c => c.id === prev.id);
            if (!stillExists) {
              // Listing disappeared Ã¢â‚¬â€ likely sold
              const itemName = Object.keys(prev.items || {})[0];
              const qty      = itemName ? (prev.items[itemName] || 0) : 0;
              const sflEarned = parseFloat(prev.sfl || 0) * (1 - (prev.tax || 0.1));
              if (itemName && sflEarned > 0) {
                const baseCost = window.__app && window.__app.getEstimatedCost ? window.__app.getEstimatedCost(itemName) : 0;
                const totalCost = baseCost * qty;
                const profit = sflEarned - totalCost;

                const salesLog = JSON.parse(localStorage.getItem('sfl_sales_log') || '[]');
                salesLog.push({ type: 'sale', item: itemName, qty, sflEarned, cost: totalCost, profit, timestamp: Date.now() });
                if (salesLog.length > 300) salesLog.splice(0, salesLog.length - 300);
                localStorage.setItem('sfl_sales_log', JSON.stringify(salesLog));
                console.log('[Sales] Detected sale:', itemName, qty, sflEarned, 'SFL');
              }
            }
          });
        }
        
        // --- Detect Automatic Purchases (Heuristic) ---
        const currentBalance = State.parsedFarm?.balance ?? 0;
        const currentInventory = State.parsedFarm?.inventory || {};
        
        if (prevBalance > 0 && currentBalance < prevBalance && Object.keys(prevInventory).length > 0) {
          const sflSpent = prevBalance - currentBalance;
          const p2pPrices = State.prices?.p2p || State.prices?.data?.p2p || {};
          
          let purchasedItem = null;
          let purchasedQty = 0;
          
          // Find if any tradable item (exists in P2P market) increased
          for (const item of Object.keys(currentInventory)) {
            const prevQty = prevInventory[item] || 0;
            const gained = currentInventory[item] - prevQty;
            if (gained > 0 && p2pPrices[item]) {
              purchasedItem = item;
              purchasedQty = gained;
              break; // Usually one purchase per transaction
            }
          }
          
          if (purchasedItem && purchasedQty > 0) {
            const salesLog = JSON.parse(localStorage.getItem('sfl_sales_log') || '[]');
            // Avoid logging the exact same automatic purchase multiple times
            const lastLog = salesLog[salesLog.length - 1];
            if (!lastLog || lastLog.item !== purchasedItem || lastLog.qty !== purchasedQty || (Date.now() - lastLog.timestamp > 60000)) {
              salesLog.push({ type: 'auto_purchase', item: purchasedItem, qty: purchasedQty, cost: sflSpent, profit: -sflSpent, timestamp: Date.now() });
              if (salesLog.length > 300) salesLog.splice(0, salesLog.length - 300);
              localStorage.setItem('sfl_sales_log', JSON.stringify(salesLog));
              console.log('[Purchases] Detected auto purchase:', purchasedItem, purchasedQty, sflSpent, 'SFL');
            }
          }
        }
        // ----------------------------------------------

        try {
          localStorage.setItem('sfl_prev_listings', JSON.stringify(currentListings));
          localStorage.setItem('sfl_prev_balance', currentBalance.toString());
          localStorage.setItem('sfl_prev_inventory', JSON.stringify(currentInventory));
        } catch(e) {}
        
      } catch(salesErr) {
        console.warn('[Sales] Tracking error:', salesErr);
      }
    } else if (landInfo) {
      if (!State.parsedFarm || State.parsedFarm.isPartial) {
        State.rawFarm = landInfo;
        State.parsedFarm = Farm.parseLandInfo(landInfo);
        if (State.parsedFarm) {
          State.parsedFarm.isPartial = true;
        }
      }
    } else {
      // Do not wipe State.parsedFarm on temporary network failures
      // State.parsedFarm = null;
    }

    if (State.parsedFarm && window.__app.NotificationEngine) {
      window.__app.NotificationEngine.process(State.parsedFarm);
    }

    renderCurrentTab();

    // Update sync time display and persist
    State.lastSyncTime = Date.now();
    Storage.setCache('last_sync_time', State.lastSyncTime, 86400000 * 365);
    updateSyncBadge();

    if (force) UI.showToast('Data synced! Ã¢Å“â€¦');
  } catch (err) {
    console.error('Refresh Error:', err);
    if (force) UI.showToast(`Sync Failed: ${err.message}`, 'error');
  } finally {
    State.isRefreshing = false;
    updateSyncBadge();
    if (btn) btn.classList.remove('loading');
  }
}

function updateSyncBadge() {
  const timeEl = $('#sync-time');
  if (!timeEl) return;
  
  if (State.isRefreshing) {
    timeEl.textContent = 'Atualizando...';
    timeEl.className = 'sync-time sync-outdated';
    return;
  }

  if (State.lastSyncTime === 0) {
    timeEl.textContent = '--';
    timeEl.className = 'sync-time sync-outdated';
    return;
  }
  
  const elapsed = Date.now() - State.lastSyncTime;
  if (elapsed > 15 * 60_000) { // > 15 minutes
    timeEl.textContent = 'Desatualizado';
    timeEl.className = 'sync-time sync-outdated';
  } else {
    timeEl.textContent = 'Atualizado';
    timeEl.className = 'sync-time sync-updated';
  }
}

function setupAutoRefresh() {
  if (State.refreshTimer) clearInterval(State.refreshTimer);
  
  // Update UI timers and auto-fetch from API every 60 seconds (Piloto AutomÃ¡tico)
  State.refreshTimer = setInterval(() => {
    updateSyncBadge();
    // Only auto-sync if we have a farm ID and not already refreshing
    if (State.farmId && !State.isRefreshing) {
       refreshData(false); // background silent sync
    }
  }, 60000);

  if (State.localProcessTimer) clearInterval(State.localProcessTimer);
  
  // Re-process local data every 30 seconds for local push notifications
  State.localProcessTimer = setInterval(() => {
    if (State.farmData && window.__app.FarmData && window.__app.NotificationEngine) {
      // Re-parse the cached raw data to update 'ready' statuses based on current time
      State.parsedFarm = window.__app.FarmData.parse(State.farmData);
      window.__app.NotificationEngine.process(State.parsedFarm);
      renderCurrentTab(); // Update UI timers
    }
  }, 30000);
}

// =====================================================
// NAVIGATION & ROUTING
// =====================================================

function bindNavigation() {
  $$('.nav-item').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const tab = btn.dataset.tab;
      if (tab) switchTab(tab);
    });
  });
}

function switchTab(tabId) {
  State.currentTab = tabId;

  // Update Nav UI
  $$('.nav-item').forEach(btn => {
    if (btn.dataset.tab === tabId) btn.classList.add('active');
    else btn.classList.remove('active');
  });

  // Update Page Visibility
  $$('.tab-page').forEach(page => {
    if (page.id === `tab-${tabId}`) page.classList.add('active');
    else page.classList.remove('active');
  });

  renderCurrentTab();
  window.scrollTo(0, 0);
}

function renderCurrentTab() {
  // Always render header ticker
  UI.renderPriceStrip(State.exchange);

  switch (State.currentTab) {
    case 'farm':
      UI.renderFarmPage(State.parsedFarm, State.farmId, State.exchange);
      break;
    case 'market':
      UI.renderMarketPage(State.prices, State.exchange);
      break;

    case 'alerts':
      UI.renderAlertsPage();
      const perm = (typeof Notification !== "undefined") ? Notification.permission : (window.__app.NotificationEngine?.prefs?.master ? "granted" : "default");
      UI.renderNotifSettings(perm);
      break;
    case 'settings':
      UI.renderSettingsPage();
      break;
  }
}

// =====================================================
// GLOBAL EVENTS (Search, Forms, Actions)
// =====================================================

function bindGlobalEvents() {
  // Sync button
  $('#btn-global-sync')?.addEventListener('click', () => refreshData(true));

  // Modal Close
  $('#btn-modal-close')?.addEventListener('click', () => {
    UI.hideModal();
  });
  
  // Close modal on backdrop click
  $('#app-modal')?.addEventListener('click', (e) => {
    if (e.target === $('#app-modal')) UI.hideModal();
  });

  // Farm ID Input & Load
  const inputFarmId = $('#input-farm-id');
  const btnLoadFarm = $('#btn-load-farm');

  if (inputFarmId) inputFarmId.value = State.farmId || '';

  btnLoadFarm?.addEventListener('click', () => {
    const val = inputFarmId.value.trim();
    if (!val) {
      UI.showToast('Enter a valid Farm ID', 'error');
      return;
    }
    loadNewFarm(val);
  });

  inputFarmId?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') btnLoadFarm.click();
  });

  // Market Filters
  $$('.filter-chips[data-target="market"] .chip').forEach(chip => {
    chip.addEventListener('click', () => {
      $$('.filter-chips[data-target="market"] .chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      $('#market-filter-active').dataset.filter = chip.dataset.filter;
      UI.renderMarketFiltered($('#market-search').value, chip.dataset.filter);
    });
  });

  // Market Search
  $('#market-search')?.addEventListener('input', (e) => {
    UI.renderMarketFiltered(e.target.value, $('#market-filter-active')?.dataset.filter || 'all');
  });

  // Settings custom events
  document.addEventListener('settings-saved', () => {
    setupAutoRefresh();
    switchTab('farm');
  });
}

async function loadNewFarm(id) {
  State.farmId = id;
  Storage.addFarmId(id);
  
  // Set UI state to loading
  UI.showToast('Loading farm data...');
  UI.renderLoadingState();
  
  const btn = $('#btn-load-farm');
  if(btn) {
    btn.textContent = '...';
    btn.disabled = true;
  }

  await refreshData(true);
  
  if(btn) {
    btn.textContent = 'Load';
    btn.disabled = false;
  }
}

function removeFarm(id) {
  Storage.removeFarmId(id);
  if (State.farmId === String(id)) {
    State.farmId = Storage.getActiveFarm();
    State.parsedFarm = null;
  }
  UI.renderSettingsPage();
  if (!State.farmId) {
    $('#input-farm-id').value = '';
    UI.showToast('Farm removed.');
  }
}

// =====================================================
// UI UPDATE LOOP (for countdown timers)
// =====================================================

// Real-time countdown update every second
setInterval(() => {
  if (!State.parsedFarm) return;
  const now = Date.now();
  // Update all DOM elements with data-readyat attribute
  $$('[data-readyat]').forEach(el => {
    const readyAt = parseInt(el.dataset.readyat, 10);
    if (isNaN(readyAt)) return;
    const msLeft = readyAt - now;
    const timerEl = el.querySelector('.farm-item-timer');
    if (!timerEl) return;
    if (msLeft <= 0) {
      timerEl.textContent = 'READY';
      timerEl.className = 'farm-item-timer ready';
      el.className = el.className.replace(/\b(waiting|soon)\b/g, 'ready');
    } else {
      const s = Math.floor(msLeft / 1000);
      const m = Math.floor(s / 60);
      const h = Math.floor(m / 60);
      const d = Math.floor(h / 24);
      let text;
      if (d > 0) text = `${d}d ${h % 24}h`;
      else if (h > 0) text = `${h}h ${m % 60}m`;
      else if (m > 0) text = `${m}m ${s % 60}s`;
      else text = `${s}s`;
      timerEl.textContent = text;
      const cls = msLeft < 600_000 ? 'soon' : 'waiting';
      timerEl.className = `farm-item-timer ${cls}`;
    }
  });
}, 1000);

// =====================================================
// BOOTSTRAP
// =====================================================

document.addEventListener('DOMContentLoaded', init);
