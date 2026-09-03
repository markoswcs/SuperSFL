/**
 * app.js — Controlador Principal
 * Gerencia o estado da aplicação, roteamento das abas e ciclo de vida
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
  priceTimer: null,
  localProcessTimer: null,
  isRefreshing: false,
  lastSyncTime: 0,
};

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];

// Central price normalizer — merges P2P crop prices + NFT floor prices into one flat map
function normalizePrices(prices, nfts) {
  const p2p = {};
  // Extract P2P prices from whichever shape the API returns
  const raw = prices?.data?.p2p || prices?.p2p || {};
  Object.assign(p2p, raw);
  // Merge NFT floor prices (collectibles + wearables)
  if (nfts) {
    const allNfts = [...(nfts.collectibles || []), ...(nfts.wearables || [])];
    allNfts.forEach(nft => {
      if (nft.floor && nft.name) {
        p2p[nft.name] = nft.floor;
      }
    });
  }
  return p2p;
}

// =====================================================
// INIT
// =====================================================

async function init() {
  console.log('ðŸŒ» Sunflower Super App init...');

  // Init i18n
  i18n.initI18n();

  const settings = Storage.getSettings();


  // Setup globals for UI callbacks
  window.__app = {
    ...(window.__app || {}),
    State: State,
    UI: UI,
    API: API,
    Storage: Storage,
    Notifications: window.__app?.Notifications || window.Notifications || null,
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
      if (apiKeyInput && apiKeyInput.value.trim()) {
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
          <div style="margin-bottom:12px;color:var(--text-secondary);font-size:14px;">Defina automaticamente um alvo de venda para <b>TODOS</b> os itens do seu estoque baseados no preço atual de mercado.</div>
          
          <div style="display:flex; flex-direction:column; gap:8px;">
            <button onclick="window.__app.applyGlobalAlerts(1.10)" class="btn" style="border:1px solid var(--emerald); background:transparent; color:var(--emerald); padding:12px; font-weight:700; border-radius:8px; cursor:pointer;">+10% de Lucro</button>
            <button onclick="window.__app.applyGlobalAlerts(1.20)" class="btn" style="border:1px solid var(--emerald); background:transparent; color:var(--emerald); padding:12px; font-weight:700; border-radius:8px; cursor:pointer;">+20% de Lucro</button>
            <button onclick="window.__app.applyGlobalAlerts(1.50)" class="btn" style="border:1px solid var(--emerald); background:transparent; color:var(--emerald); padding:12px; font-weight:700; border-radius:8px; cursor:pointer;">+50% de Lucro</button>
          </div>
          
          <div style="margin-top:16px;font-size:11px;color:var(--text-tertiary);text-align:center;">
            Isso vai substituir os alvos que você definiu manualmente.
          </div>
        </div>
      `;
      UI.showModal('🚀 Estratégia Global', html);
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
          <div style="margin-bottom:12px;color:var(--text-secondary);font-size:14px;">Defina o preço alvo (SFL) para vender <b>${item}</b>. O card ficará destacado quando o mercado atingir este valor.</div>
          <div style="font-size:12px;margin-bottom:16px; display:flex; justify-content:space-between;">
            <span>Preço atual: <span style="color:var(--amber);font-weight:700;">${currentPrice} SFL</span></span>
            ${maxPrice ? `<span>Máx Histórico: <span style="color:var(--emerald);font-weight:700;">${maxPrice} SFL</span></span>` : ''}
          </div>
          <input type="number" id="prompt-alert-input" step="0.0001" placeholder="Ex: ${autoPrice}" style="width:100%;padding:12px;border-radius:8px;border:1px solid var(--surface-border);background:var(--surface-3);color:var(--text-primary);margin-bottom:16px;">
          <div style="display:flex; gap:8px;">
            <button id="prompt-alert-auto" class="btn" style="flex:1; border:1px solid var(--emerald); border-radius:8px; background:transparent; color:var(--emerald); padding:12px; font-weight:700; cursor:pointer;">Auto (${autoPrice})</button>
            <button id="prompt-alert-save" class="btn btn-primary" style="flex:1; border:none; border-radius:8px; background:var(--emerald); color:#fff; padding:12px; font-weight:700; cursor:pointer;">Salvar Alvo</button>
          </div>
        </div>
      `;
      UI.showModal('🎯 Alvo de Venda', html);
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
              UI.showToast('Valor inválido', 'error');
            }
          };
        }
      }, 50);
    },
    addPriceAlert: (item, type, threshold) => {
      if (!item || !type || isNaN(threshold) || threshold <= 0) {
        UI.showToast('Insira um valor válido para o alerta!', 'error');
        return;
      }
      Storage.savePriceAlert({ item, type, threshold });
      UI.showToast(`Alerta salvo: ${item} ${type === 'up' ? '▲' : '▼'} ${threshold} SFL ✅`);
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
      UI.showModal('🛒 Registrar Compra', html);
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
    const hasSeenPrompt = localStorage.getItem('sfl_seen_push_prompt_v3');
    if (!hasSeenPrompt && window.__app.UI && window.__app.UI.showModal) {
      const promptHtml = `
          <div style="text-align:center; padding: 10px;">
            <div style="font-size:40px; margin-bottom:12px;">🔔</div>
            <p style="color:var(--text-secondary); margin-bottom: 20px;">Ative as notificações para ser avisado quando suas Plantações, Animais e Recursos estiverem prontos! Nunca mais perca tempo de jogo.</p>
            <div style="display:flex; flex-direction:column; gap:10px;">
              <button id="btn-activate-push" class="btn btn-primary" style="background:var(--emerald);color:#000;font-weight:bold;padding:12px;border-radius:12px;border:none;cursor:pointer;">Ativar Notificações 24/7</button>
              <button id="btn-skip-push" class="btn btn-secondary" style="background:rgba(255,255,255,0.1);color:var(--text-tertiary);padding:12px;border-radius:12px;border:none;cursor:pointer;">Agora Não</button>
            </div>
          </div>
        `;
      window.__app.UI.showModal('Notificações 24/7', promptHtml);
      
      setTimeout(() => {
        const btnActive = document.getElementById('btn-activate-push');
        const btnSkip = document.getElementById('btn-skip-push');
        
        if (btnActive) btnActive.addEventListener('click', async () => {
          window.__app.UI.hideModal();
          localStorage.setItem('sfl_seen_push_prompt_v3', 'true');
          if (window.__app?.Notifications) {
            window.__app.UI.showToast('Processando...', 'info');
            await window.__app.Notifications.setPref('master', true);
            if ((typeof Notification === 'undefined') || Notification.permission === 'granted') {
               window.__app.UI.showToast('Notificações ativadas com sucesso!', 'success');
            }
            window.__app.switchTab('settings');
          }
        });
        
        if (btnSkip) btnSkip.addEventListener('click', () => {
           window.__app.UI.hideModal();
           localStorage.setItem('sfl_seen_push_prompt_v3', 'true');
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

  // Restaura a inscrição imediatamente quando há dados completos em cache.
  if (State.parsedFarm && !State.parsedFarm.isPartial && window.__app.Notifications) {
    window.__app.Notifications.syncAfterFarmLoad();
  }

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
    const { exchange, prices, landInfo, farmData, nfts, profile, errors } = await API.refreshAll(State.farmId, force);

    State.exchange = exchange;
    State.prices   = prices;
    State.nfts     = nfts;
    
    // Build a single flat p2p map from all price sources (Fix Bug B)
    State.p2p = normalizePrices(prices, nfts);
    
    const hasKeyError = errors.some(e => e?.includes('API Key') || e?.includes('unauthorized'));
    State.hasKeyError = hasKeyError;
    const settings = Storage.getSettings();

    if (errors.length > 0) {
      console.warn('API partial failures:', errors);
      if (hasKeyError) {
        UI.showToast('Chave de API Inválida ou Expirada!', 'error');
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
              // Listing disappeared — likely sold
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
        const currentInventory = State.parsedFarm?.rawInventory || {};
        
        if (prevBalance > 0 && currentBalance < prevBalance && Object.keys(prevInventory).length > 0) {
          const sflSpent = prevBalance - currentBalance;
          const p2pPrices = State.p2p || {};
          
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
    } else if (landInfo || profile) {
      State.rawFarm = landInfo || profile;
      State.parsedFarm = Farm.parseLandInfo(landInfo, profile);
      if (State.parsedFarm) {
        State.parsedFarm.isPartial = true;
        State.parsedFarm.farmId = State.farmId;
      }
    } else {
      // Do not wipe State.parsedFarm on temporary network failures
    }

    if (State.parsedFarm && window.__app.Notifications) {
      // Quando uma fazenda é carregada depois da permissão, a inscrição precisa
      // ser vinculada novamente ao Farm ID antes de enviar as agendas.
      await window.__app.Notifications.syncAfterFarmLoad();
      await window.__app.Notifications.scheduleToSupabase(State.parsedFarm);
      await window.__app.Notifications.checkMarketplaceActivity(State.parsedFarm);
      window.__app.Notifications.checkFloatingIsland(State.parsedFarm);
      window.__app.Notifications.scheduleDailyReset();
    }

    renderCurrentTab();

    // Update sync time display and persist
    State.lastSyncTime = Date.now();
    Storage.setCache('last_sync_time', State.lastSyncTime, 86400000 * 365);
    updateSyncBadge();

    if (force) UI.showToast('Data synced! ✅');
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
  
  // Update UI timers and auto-fetch from API every 60 seconds (Piloto Automático)
  State.refreshTimer = setInterval(() => {
    updateSyncBadge();
    // Only auto-sync if we have a farm ID and not already refreshing
    if (State.farmId && !State.isRefreshing) {
       refreshData(false); // background silent sync
    }
  }, 60000);

  if (State.localProcessTimer) clearInterval(State.localProcessTimer);
  
  // Reprocessa o estado em memória para manter a agenda local atualizada entre
  // sincronizações. O código anterior lia propriedades que não existem no State.
  State.localProcessTimer = setInterval(async () => {
    try {
      if (State.rawFarm && State.parsedFarm && !State.parsedFarm.isPartial && window.__app.Notifications) {
        State.parsedFarm = Farm.parseFarm(State.rawFarm, Storage.getCache(`land_info_${State.farmId}`, true));
        window.__app.Notifications.checkFloatingIsland(State.parsedFarm);
        await window.__app.Notifications.scheduleToSupabase(State.parsedFarm);
        renderCurrentTab();
      }
    } catch (err) {
      console.error('[LocalProcess] update error:', err);
    }
  }, 30000);

  // --- Real-time price update: refresh exchange every 60s independently ---
  if (State.priceTimer) clearInterval(State.priceTimer);
  State.priceTimer = setInterval(async () => {
    try {
      const exchange = await API.getExchange(true); // force fresh
      if (exchange) {
        State.exchange = exchange;
        // Update price strip without re-rendering full farm tab
        UI.renderPriceStrip(exchange);
        // If on farm tab, also update the SFL card price numbers
        if (State.currentTab === 'farm') {
          const sflUsd = exchange?.sfl?.usd ?? 0;
          const sflBrl = exchange?.sfl?.brl ?? 0;
          const usdEl = document.querySelector('#home-sfl-card [data-price-usd]');
          const brlEl = document.querySelector('#home-sfl-card [data-price-brl]');
          if (usdEl) usdEl.textContent = `$${sflUsd.toFixed(4)}`;
          if (brlEl) brlEl.textContent = `R$ ${sflBrl.toFixed(4)}`;
        }
        // If on market tab update prices too
        if (State.currentTab === 'market') {
          const [prices, nfts] = await Promise.all([
            API.getPrices(true),
            API.getNFTs(true),
          ]);
          if (prices) State.prices = prices;
          if (nfts) State.nfts = nfts;
          State.p2p = normalizePrices(State.prices, State.nfts);
          UI.renderMarketPage(State.prices, exchange);
        }
      }
    } catch(e) {
      console.warn('[Price poll]', e.message);
    }
  }, 60000);
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
// WALLET MANAGEMENT
// =====================================================

function getWalletPositions() {
  if (!State.farmId) return [];
  try {
    return JSON.parse(localStorage.getItem(`sfl_wallet_${State.farmId}`) || '[]');
  } catch(e) {
    return [];
  }
}

function getWalletGlobalBalance() {
  if (!State.farmId) return 0;
  return parseFloat(localStorage.getItem(`sfl_wallet_balance_${State.farmId}`) || '0') || 0;
}

function saveWalletGlobalBalance(balance) {
  if (!State.farmId) return;
  localStorage.setItem(`sfl_wallet_balance_${State.farmId}`, String(balance));
}

function setWalletGlobalBalance(balance) {
  saveWalletGlobalBalance(balance);
  if (State.currentTab === 'market' && window.__app.UI && window.__app.UI.renderMarketFiltered) {
    window.__app.UI.renderMarketFiltered(document.querySelector('#market-search')?.value || '', 'wallet');
  }
}

function saveWalletPositions(positions) {
  if (!State.farmId) return;
  localStorage.setItem(`sfl_wallet_${State.farmId}`, JSON.stringify(positions));
}

function addWalletPosition(itemName, qty, totalCostSfl) {
  const positions = getWalletPositions();
  const existing = positions.find(p => p.itemName === itemName);
  const numericQty = parseFloat(qty);
  const numericCost = parseFloat(totalCostSfl);
  
  if (existing) {
    existing.qty += numericQty;
    existing.totalCostSfl += numericCost;
    existing.averagePrice = existing.totalCostSfl / existing.qty;
  } else {
    positions.push({
      itemName,
      qty: numericQty,
      totalCostSfl: numericCost,
      averagePrice: numericCost / numericQty
    });
  }
  saveWalletPositions(positions);
  if (State.currentTab === 'market') {
    if (window.__app.UI && window.__app.UI.renderMarketFiltered) {
      window.__app.UI.renderMarketFiltered(document.querySelector('#market-search')?.value || '', 'wallet');
    }
  }
}

function removeWalletPosition(itemName) {
  let positions = getWalletPositions();
  positions = positions.filter(p => p.itemName !== itemName);
  saveWalletPositions(positions);
  if (State.currentTab === 'market') {
    if (window.__app.UI && window.__app.UI.renderMarketFiltered) {
      window.__app.UI.renderMarketFiltered(document.querySelector('#market-search')?.value || '', 'wallet');
    }
  }
}

function sellWalletPosition(itemName, qtySold, saleTotal) {
  let positions = getWalletPositions();
  const pos = positions.find(p => p.itemName === itemName);
  if (!pos) return;

  const qty    = parseFloat(qtySold);
  const sale   = parseFloat(saleTotal);
  const cost   = pos.averagePrice * qty;
  const profit = sale - cost;

  // Log the realized PnL to history
  try {
    const key  = `sfl_wallet_history_${State.farmId}`;
    const hist = JSON.parse(localStorage.getItem(key) || '[]');
    hist.push({ itemName, qty, sale, cost, profit, timestamp: Date.now() });
    if (hist.length > 500) hist.splice(0, hist.length - 500);
    localStorage.setItem(key, JSON.stringify(hist));
  } catch(e) {}

  // Add the realized profit to the global balance
  const currentBalance = getWalletGlobalBalance();
  saveWalletGlobalBalance(currentBalance + profit);

  if (qty >= pos.qty) {
    // Sold everything: remove position
    positions = positions.filter(p => p.itemName !== itemName);
  } else {
    pos.qty          -= qty;
    pos.totalCostSfl -= cost;
    // averagePrice stays the same
  }

  saveWalletPositions(positions);

  // Show toast with realized P&L
  const sign = profit >= 0 ? '+' : '';
  const col  = profit >= 0 ? 'success' : 'error';
  if (window.__app.UI && window.__app.UI.showToast) {
    window.__app.UI.showToast(`Venda registrada! P&L: ${sign}${profit.toFixed(4)} SFL`, col);
  }

  if (State.currentTab === 'market') {
    if (window.__app.UI && window.__app.UI.renderMarketFiltered) {
      window.__app.UI.renderMarketFiltered(document.querySelector('#market-search')?.value || '', 'wallet');
    }
  }
}

window.__app.getWalletPositions = getWalletPositions;
window.__app.addWalletPosition = addWalletPosition;
window.__app.removeWalletPosition = removeWalletPosition;
window.__app.sellWalletPosition = sellWalletPosition;
window.__app.getWalletGlobalBalance = getWalletGlobalBalance;
window.__app.setWalletGlobalBalance = setWalletGlobalBalance;

// =====================================================
// BOOTSTRAP
// =====================================================

document.addEventListener('DOMContentLoaded', init);
