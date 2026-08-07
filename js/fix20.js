const fs = require('fs');

// --- Patch app.js ---
let app = fs.readFileSync('js/app.js', 'utf8');

const OLD_SALES_LOGIC = `              const itemName = Object.keys(prev.items || {})[0];
              const qty      = itemName ? (prev.items[itemName] || 0) : 0;
              const sflEarned = parseFloat(prev.sfl || 0) * (1 - (prev.tax || 0.1));
              if (itemName && sflEarned > 0) {
                const salesLog = JSON.parse(localStorage.getItem('sfl_sales_log') || '[]');
                salesLog.push({ item: itemName, qty, sflEarned, timestamp: Date.now() });
                if (salesLog.length > 200) salesLog.splice(0, salesLog.length - 200);
                localStorage.setItem('sfl_sales_log', JSON.stringify(salesLog));
                console.log('[Sales] Detected sale:', itemName, qty, sflEarned, 'SFL');
              }`;

const NEW_SALES_LOGIC = `              const itemName = Object.keys(prev.items || {})[0];
              const qty      = itemName ? (prev.items[itemName] || 0) : 0;
              const sflEarned = parseFloat(prev.sfl || 0) * (1 - (prev.tax || 0.1));
              if (itemName && sflEarned > 0) {
                const baseCost = window.__app.getEstimatedCost ? window.__app.getEstimatedCost(itemName) : 0;
                const totalCost = baseCost * qty;
                const profit = sflEarned - totalCost;

                const salesLog = JSON.parse(localStorage.getItem('sfl_sales_log') || '[]');
                salesLog.push({ type: 'sale', item: itemName, qty, sflEarned, cost: totalCost, profit, timestamp: Date.now() });
                if (salesLog.length > 300) salesLog.splice(0, salesLog.length - 300);
                localStorage.setItem('sfl_sales_log', JSON.stringify(salesLog));
                console.log('[Sales] Detected sale:', itemName, qty, sflEarned, 'SFL. Profit:', profit);
              }`;

if (app.includes(OLD_SALES_LOGIC)) {
  app = app.replace(OLD_SALES_LOGIC, NEW_SALES_LOGIC);
  fs.writeFileSync('js/app.js', app);
  console.log('app.js updated with new sales logic');
} else {
  console.log('Failed to find OLD_SALES_LOGIC in app.js');
}

// --- Patch ui.js ---
let ui = fs.readFileSync('js/ui.js', 'utf8');

// The massive replacement of renderMarketFiltered
const RENDER_MARKET_START = "function renderMarketFiltered(search = '', filter = 'all') {";
const RENDER_MARKET_END = "  }).join('') : `<div class=\"empty-state\" style=\"grid-column:1/-1\"><span class=\"empty-state-icon\">🤷</span><div class=\"empty-state-title\">Nada no Estoque</div><div class=\"empty-state-sub\" style=\"margin-top:8px;\">Você não tem itens nesta categoria com preços no mercado, ou o seu estoque está zerado.</div></div>`);\n}";

if (ui.includes(RENDER_MARKET_START)) {
  const startIndex = ui.indexOf(RENDER_MARKET_START);
  const endIndex = ui.indexOf(RENDER_MARKET_END) + RENDER_MARKET_END.length;

  const NEW_RENDER = `function renderMarketFiltered(search = '', filter = 'portfolio') {
  const p2p = Object.keys(_allPrices).length > 0 ? _allPrices : FALLBACK_PRICES;
  let history = {};
  let alerts = [];
  try {
    history = JSON.parse(localStorage.getItem('prices_history') || '{}');
    alerts = JSON.parse(localStorage.getItem('sfl_price_alerts') || '[]');
  } catch(e) {}

  // Filter: history (show sales & purchases log)
  if (filter === 'history') {
    let salesLog = [];
    try {
      salesLog = JSON.parse(localStorage.getItem('sfl_sales_log') || '[]');
    } catch(e) {}

    if (salesLog.length === 0) {
      setHtml('#market-grid', \`
        <div class="empty-state" style="grid-column:1/-1">
          <span class="empty-state-icon">📜</span>
          <div class="empty-state-title">Nenhum histórico registrado</div>
          <div class="empty-state-sub" style="margin-top:8px;">
            As suas vendas começarão a aparecer aqui automaticamente.<br>
            Você também pode registrar compras manuais.
          </div>
          <button onclick="window.__app.promptManualPurchase()" style="margin-top:16px; background:var(--emerald); color:var(--surface-1); border:none; padding:8px 16px; border-radius:8px; font-weight:800; cursor:pointer;">+ Registrar Compra Manual</button>
        </div>
      \`);
      return;
    }

    const totalProfit = salesLog.reduce((s, e) => s + (e.profit !== undefined ? e.profit : (e.sflEarned || 0)), 0);
    const totalSales = salesLog.filter(e => e.type !== 'purchase').length;
    const totalPurchases = salesLog.filter(e => e.type === 'purchase').length;

    const listHtml = salesLog.slice().reverse().slice(0, 100).map(entry => {
      const date = new Date(entry.timestamp || Date.now());
      const dateStr = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      const timeStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      
      const isPurchase = entry.type === 'purchase';
      const profit = entry.profit !== undefined ? entry.profit : (entry.sflEarned || 0);
      const isPositive = profit >= 0;
      
      const valColor = isPurchase ? 'var(--coral)' : (isPositive ? 'var(--emerald)' : 'var(--coral)');
      const valSign = isPurchase ? '-' : (isPositive ? '+' : '');
      const valStr = isPurchase ? (entry.cost || 0).toFixed(3) : Math.abs(profit).toFixed(3);

      return \`
        <div style="display:flex;align-items:center;gap:12px;padding:12px 14px;background:var(--surface-2);border:1px solid var(--surface-border);border-radius:14px;margin-bottom:8px;position:relative;overflow:hidden;">
          \${isPurchase ? '<div style="position:absolute;left:0;top:0;bottom:0;width:4px;background:var(--coral);"></div>' : ''}
          <div style="width:40px;height:40px;background:var(--surface-3);border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0;border:1px solid rgba(255,255,255,0.06);">
            <img src="https://sfl.world/img/source/\${encodeURIComponent(entry.item || 'SFL')}.png" style="width:26px;height:26px;object-fit:contain;image-rendering:pixelated;" onerror="this.style.display='none'">
          </div>
          <div style="flex:1;min-width:0;">
            <div style="font-size:14px;font-weight:800;color:var(--text-primary);">\${entry.item || 'Item'} \${isPurchase ? '<span style="font-size:10px;background:var(--coral-subtle);color:var(--coral);padding:2px 4px;border-radius:4px;margin-left:4px;">COMPRA</span>' : ''}</div>
            <div style="font-size:11px;color:var(--text-tertiary);margin-top:2px;">\${dateStr} às \${timeStr}</div>
          </div>
          <div style="text-align:right;flex-shrink:0;">
            <div style="font-size:15px;font-weight:900;color:\${valColor};">\${valSign}\${valStr} SFL</div>
            <div style="font-size:11px;color:var(--text-tertiary);">Qtd: \${entry.qty || '?'}</div>
          </div>
        </div>
      \`;
    }).join('');

    setHtml('#market-grid', \`
      <div style="grid-column:1/-1;margin-bottom:16px;padding:14px 16px;background:var(--surface-2);border:1px solid var(--surface-border);border-radius:14px;display:flex;justify-content:space-between;align-items:center;">
        <div>
          <div style="font-size:12px;font-weight:700;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:0.5px;">Lucro Total P&L</div>
          <div style="font-size:22px;font-weight:900;color:\${totalProfit >= 0 ? 'var(--emerald)' : 'var(--coral)'};">\${totalProfit >= 0 ? '+' : ''}\${totalProfit.toFixed(3)} SFL</div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:12px;color:var(--text-tertiary);">\${totalSales} vendas / \${totalPurchases} compras</div>
          <div style="display:flex; gap:6px; margin-top:6px; justify-content:flex-end;">
            <button onclick="window.__app.promptManualPurchase()" style="background:var(--emerald-subtle);border:1px solid var(--emerald);color:var(--emerald);border-radius:8px;padding:4px 10px;font-size:11px;font-weight:700;cursor:pointer;">+ Compra</button>
            <button onclick="if(confirm('Limpar todo o histórico?')){localStorage.removeItem('sfl_sales_log');window.__app.UI.renderMarketPage(window.__app.State.prices, window.__app.State.exchange);}" style="background:var(--coral-subtle);border:1px solid rgba(239,68,68,0.3);color:var(--coral);border-radius:8px;padding:4px 10px;font-size:11px;font-weight:700;cursor:pointer;">Limpar</button>
          </div>
        </div>
      </div>
      \${listHtml}
    \`);
    return;
  }

  let entries = [];
  
  // Fetch exactly what the user has in their inventory
  if (window.__app.State.parsedFarm && window.__app.State.parsedFarm.inventory) {
    const inv = window.__app.State.parsedFarm.inventory;
    const allOwned = [...inv.crops, ...inv.resources, ...inv.food, ...inv.special];
    
    allOwned.forEach(item => {
      const priceInSfl = p2p[item.name];
      if (priceInSfl && item.qty > 0) {
        const baseCost = window.__app.getEstimatedCost ? window.__app.getEstimatedCost(item.name) : 0;
        const totalValue = item.qty * priceInSfl;
        const unitProfit = priceInSfl - baseCost;
        const totalProfit = unitProfit * item.qty;
        const profitMargin = baseCost > 0 ? (unitProfit / baseCost) * 100 : 100; // 100% if cost is 0

        entries.push({
          name: item.name,
          qty: item.qty,
          priceInSfl: priceInSfl,
          baseCost,
          unitProfit,
          totalProfit,
          profitMargin,
          totalValue
        });
      }
    });
  }

  // If no farm data, show warning
  if (!window.__app.State.parsedFarm || !window.__app.State.parsedFarm.inventory || window.__app.State.parsedFarm.isPartial) {
    setHtml('#market-grid', '<div class="empty-state" style="grid-column:1/-1"><span class="empty-state-icon">⚠️</span><div class="empty-state-title">Inventário não encontrado</div><div class="empty-state-sub" style="margin-top:8px;">Conecte sua API Key na aba Ajustes para ver o seu portfólio no Mercado.</div></div>');
    return;
  }

  if (search) {
    const q = search.toLowerCase();
    entries = entries.filter(e => e.name.toLowerCase().includes(q));
  }

  if (filter === 'portfolio') {
    // Sort by total Value
    entries = entries.sort((a, b) => b.totalValue - a.totalValue);
  } else if (filter === 'opportunities') {
    // Sort by Profit Margin descending
    entries = entries.sort((a, b) => b.profitMargin - a.profitMargin);
  }

  const marketGrid = $('#market-grid');
  let dashboard = $('#market-dashboard-container');
  if (!dashboard && marketGrid && marketGrid.parentNode) {
    dashboard = document.createElement('div');
    dashboard.id = 'market-dashboard-container';
    dashboard.className = 'mb-4';
    marketGrid.parentNode.insertBefore(dashboard, marketGrid);
  }

  setHtml('#market-grid', entries.length > 0 ? entries.map(item => {
    const safeName = item.name.replace(/'/g, "\\\\'");
    const totalSfl = item.qty * item.priceInSfl;
    
    let trendHtml = '';
    let isPump = false;
    if (history[item.name]) {
      const h = history[item.name];
      if (h.trend === 'up') {
        isPump = h.prev && item.priceInSfl > h.prev * 1.10; // >10% pump
        trendHtml = \`<span style="color:var(--emerald); font-size:11px; margin-left:4px;">▲ \${isPump ? '🔥' : ''}</span>\`;
      } else if (h.trend === 'down') {
        trendHtml = '<span style="color:var(--coral); font-size:11px; margin-left:4px;">▼</span>';
      }
    }

    const targetAlert = alerts.find(a => a.item === item.name && a.type === 'up');
    const targetPrice = targetAlert ? targetAlert.threshold : null;
    const isTargetHit = targetPrice && item.priceInSfl >= targetPrice;
    
    const cardBorder = isTargetHit ? 'var(--emerald)' : 'var(--surface-border)';
    const cardShadow = isTargetHit ? '0 0 16px rgba(16,185,129,0.3)' : 'var(--shadow-sm)';
    
    const isHighProfit = item.profitMargin > 40; // > 40% profit margin
    
    return \`
      <div class="market-item spring-in" style="display:flex; flex-direction:column; padding:16px; height:auto; gap:12px; background:var(--surface-2); border:1px solid \${cardBorder}; border-radius:16px; box-shadow:\${cardShadow}; position:relative; overflow:hidden;">
        \${isPump ? \`<div style="position:absolute; top:8px; right:8px; background:rgba(239,68,68,0.1); color:var(--coral); font-size:10px; font-weight:800; padding:4px 8px; border-radius:8px; border:1px solid rgba(239,68,68,0.3); z-index:2; animation:pulse 2s infinite;">PUMP 🔥</div>\` : ''}
        
        <div style="display:flex; gap:12px; align-items:center; z-index:1; cursor:pointer;" onclick="window.__app.openP2pCalc('\${safeName}', \${item.priceInSfl})">
          <div style="width:48px;height:48px;background:var(--surface-3);border:1px solid rgba(255,255,255,0.05);border-radius:12px;display:flex;align-items:center;justify-content:center;box-shadow:inset 0 2px 4px rgba(0,0,0,0.2);flex-shrink:0;">
            <img src="https://sfl.world/img/source/\${encodeURIComponent(item.name)}.png" style="width:32px;height:32px;object-fit:contain;image-rendering:pixelated;" onerror="this.style.display='none';">
          </div>
          
          <div style="flex:1; display:flex; flex-direction:column; gap:2px;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
              <div style="font-size:16px; font-weight:900; color:var(--text-primary); letter-spacing:-0.2px;">\${item.name}</div>
              <div style="font-size:11px; font-weight:700; color:var(--text-tertiary); background:var(--surface-3); padding:4px 8px; border-radius:8px;">\${item.qty} un</div>
            </div>
            
            <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-top:4px;">
              <div style="display:flex; align-items:center; gap:4px;">
                <span style="font-size:14px; font-weight:700; color:var(--text-secondary);">\${item.priceInSfl.toFixed(3)} SFL</span>
                \${trendHtml}
              </div>
              <div style="font-size:15px; font-weight:900; color:var(--emerald);">= \${totalSfl.toFixed(2)} SFL</div>
            </div>
          </div>
        </div>
        
        <div style="z-index:1; border-top:1px solid var(--surface-border); padding-top:12px; margin-top:4px;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div>
              <div style="font-size:10px; font-weight:700; color:var(--text-tertiary); text-transform:uppercase;">Custo Est.</div>
              <div style="font-size:12px; font-weight:700; color:var(--text-secondary);">\${item.baseCost > 0 ? item.baseCost.toFixed(3) : '---'} SFL</div>
            </div>
            <div style="text-align:right;">
              <div style="font-size:10px; font-weight:700; color:var(--text-tertiary); text-transform:uppercase;">Lucro Un.</div>
              <div style="font-size:12px; font-weight:800; color:\${item.unitProfit >= 0 ? 'var(--emerald)' : 'var(--coral)'};">\${item.unitProfit >= 0 ? '+' : ''}\${item.unitProfit.toFixed(3)} SFL \${item.baseCost > 0 ? \`<span style="background:\${item.unitProfit >= 0 ? 'var(--emerald-subtle)' : 'var(--coral-subtle)'}; padding:2px 4px; border-radius:4px; font-size:10px; margin-left:4px;">\${item.unitProfit >= 0 ? '+' : ''}\${item.profitMargin.toFixed(0)}%</span>\` : ''}</div>
            </div>
          </div>
        </div>
      </div>
    \`;
  }).join('') : \`<div class="empty-state" style="grid-column:1/-1"><span class="empty-state-icon">🤷</span><div class="empty-state-title">Nenhum item encontrado</div><div class="empty-state-sub" style="margin-top:8px;">O seu estoque não possui itens que correspondam a esta visualização.</div></div>\`);
}`;

  ui = ui.substring(0, startIndex) + NEW_RENDER + ui.substring(endIndex);
  console.log('ui.js updated with new renderMarketFiltered');

  // Add promptManualPurchase function
  const MANUAL_PURCHASE_FUNC = `
window.__app.promptManualPurchase = () => {
  const item = prompt('Nome do Item comprado (em inglês, ex: Wood):');
  if (!item) return;
  const qty = parseFloat(prompt('Quantidade:'));
  if (isNaN(qty) || qty <= 0) return;
  const cost = parseFloat(prompt('Preço Total Pago (em SFL):'));
  if (isNaN(cost) || cost <= 0) return;

  const salesLog = JSON.parse(localStorage.getItem('sfl_sales_log') || '[]');
  salesLog.push({ type: 'purchase', item, qty, cost, profit: -cost, timestamp: Date.now() });
  localStorage.setItem('sfl_sales_log', JSON.stringify(salesLog));
  
  window.__app.UI.renderMarketPage(window.__app.State.prices, window.__app.State.exchange);
};
`;
  ui += MANUAL_PURCHASE_FUNC;
  
  fs.writeFileSync('js/ui.js', ui);
} else {
  console.log('Failed to find RENDER_MARKET_START in ui.js');
}

// BUMP VERSIONS
let html = fs.readFileSync('index.html', 'utf8');
html = html.replace(/v=97/g, 'v=98');
fs.writeFileSync('index.html', html);

app = fs.readFileSync('js/app.js', 'utf8');
app = app.replace(/v=97/g, 'v=98');
fs.writeFileSync('js/app.js', app);

ui = fs.readFileSync('js/ui.js', 'utf8');
ui = ui.replace(/v=97/g, 'v=98');
fs.writeFileSync('js/ui.js', ui);

console.log('Bumped all to v98');
