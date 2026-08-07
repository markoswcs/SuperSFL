/**
 * fix13.js — Add "Histórico" filter tab and sales history rendering to Market
 */
const fs = require('fs');

// ─── 1. Update index.html to add history chip ────────────────────────────────
let html = fs.readFileSync('index.html', 'utf8');

if (!html.includes('data-filter="history"')) {
  html = html.replace(
    `          <div class="chip" data-filter="fish" data-i18n="market_fish">Fish</div>`,
    `          <div class="chip" data-filter="fish" data-i18n="market_fish">Fish</div>\n          <div class="chip" data-filter="history">📜 Histórico</div>`
  );
  // Bump cache
  html = html.replace(/v=92/g, 'v=93');
  fs.writeFileSync('index.html', html);
  console.log('✓ index.html: Added history chip');
} else {
  console.log('→ History chip already exists');
}

// ─── 2. Update ui.js ─────────────────────────────────────────────────────────
let ui = fs.readFileSync('js/ui.js', 'utf8');

// 2a. Bump versions
ui = ui.replace(/v=92/g, 'v=93');

// 2b. Add history filter handling in renderMarketFiltered
const HISTORY_FILTER_ANCHOR = `  // Sort by Total Value (Qty * Price)\n  entries = entries.sort((a, b) => (b.qty * b.priceInSfl) - (a.qty * a.priceInSfl));`;

const HISTORY_FILTER_CODE = `  // Filter: history (show sales log)
  if (filter === 'history') {
    let salesLog = [];
    try {
      salesLog = JSON.parse(localStorage.getItem('sfl_sales_log') || '[]');
    } catch(e) {}

    if (salesLog.length === 0) {
      setHtml('#market-grid', \`
        <div class="empty-state" style="grid-column:1/-1">
          <span class="empty-state-icon">📜</span>
          <div class="empty-state-title">Nenhuma venda registrada ainda</div>
          <div class="empty-state-sub" style="margin-top:8px;">
            O histórico começa a ser registrado a partir de agora.<br>
            Cada vez que sincronizar após uma venda, ela aparecerá aqui.
          </div>
        </div>
      \`);
      return;
    }

    const totalSfl = salesLog.reduce((s, e) => s + (e.sflEarned || 0), 0);
    const listHtml = salesLog.slice().reverse().slice(0, 50).map(entry => {
      const date = new Date(entry.timestamp || Date.now());
      const dateStr = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      const timeStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      return \`
        <div style="display:flex;align-items:center;gap:12px;padding:12px 14px;background:var(--surface-2);border:1px solid var(--surface-border);border-radius:14px;margin-bottom:8px;">
          <div style="width:40px;height:40px;background:var(--surface-3);border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0;border:1px solid rgba(255,255,255,0.06);">
            <img src="https://sfl.world/img/source/\${encodeURIComponent(entry.item || 'SFL')}.png" style="width:26px;height:26px;object-fit:contain;image-rendering:pixelated;" onerror="this.style.display='none'">
          </div>
          <div style="flex:1;min-width:0;">
            <div style="font-size:14px;font-weight:800;color:var(--text-primary);">\${entry.item || 'Item desconhecido'}</div>
            <div style="font-size:11px;color:var(--text-tertiary);margin-top:2px;">\${dateStr} às \${timeStr}</div>
          </div>
          <div style="text-align:right;flex-shrink:0;">
            <div style="font-size:15px;font-weight:900;color:var(--emerald);">+\${(entry.sflEarned || 0).toFixed(3)} SFL</div>
            <div style="font-size:11px;color:var(--text-tertiary);">Qtd: \${entry.qty || '?'}</div>
          </div>
        </div>
      \`;
    }).join('');

    setHtml('#market-grid', \`
      <div style="grid-column:1/-1;margin-bottom:16px;padding:14px 16px;background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.2);border-radius:14px;display:flex;justify-content:space-between;align-items:center;">
        <div>
          <div style="font-size:12px;font-weight:700;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:0.5px;">Total Ganho (Registrado)</div>
          <div style="font-size:22px;font-weight:900;color:var(--emerald);">\${totalSfl.toFixed(3)} SFL</div>
        </div>
        <div>
          <div style="font-size:12px;color:var(--text-tertiary);">\${salesLog.length} vendas</div>
          <button onclick="if(confirm('Limpar todo o histórico?')){localStorage.removeItem('sfl_sales_log');window.__app.UI.renderMarketPage(window.__app.State.prices, window.__app.State.exchange);}" style="margin-top:6px;background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);color:var(--coral);border-radius:8px;padding:4px 10px;font-size:11px;font-weight:700;cursor:pointer;">🗑 Limpar</button>
        </div>
      </div>
      \${listHtml}
    \`);
    return;
  }

  // Sort by Total Value (Qty * Price)
  entries = entries.sort((a, b) => (b.qty * b.priceInSfl) - (a.qty * a.priceInSfl));`;

if (!ui.includes("filter === 'history'")) {
  ui = ui.replace(HISTORY_FILTER_ANCHOR, HISTORY_FILTER_CODE);
  console.log('✓ Added history filter logic');
} else {
  console.log('→ History filter already present');
}

fs.writeFileSync('js/ui.js', ui);
console.log('✓ ui.js saved');

// ─── 3. Update app.js to track sales ─────────────────────────────────────────
let app = fs.readFileSync('js/app.js', 'utf8');
app = app.replace(/v=92/g, 'v=93');

if (!app.includes('sfl_sales_log')) {
  // Find where farm data gets parsed after refresh, add sales detection
  const REFRESH_ANCHOR = `    if (farmData) {`;
  const SALES_TRACKING = `    // Track completed sales by comparing active listings before and after
    const prevListings = window.__sflPrevListings || [];
    const prevBalance = window.__sflPrevBalance || 0;

    if (farmData) {`;

  app = app.replace(REFRESH_ANCHOR, SALES_TRACKING);

  // Now find where parsedFarm is set to insert the post-parse tracking
  const POST_PARSE_ANCHOR = `      State.hasKeyError = false;`;
  const SALES_DETECTION = `      State.hasKeyError = false;

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
                const salesLog = JSON.parse(localStorage.getItem('sfl_sales_log') || '[]');
                salesLog.push({ item: itemName, qty, sflEarned, timestamp: Date.now() });
                if (salesLog.length > 200) salesLog.splice(0, salesLog.length - 200);
                localStorage.setItem('sfl_sales_log', JSON.stringify(salesLog));
                console.log('[Sales] Detected sale:', itemName, qty, sflEarned, 'SFL');
              }
            }
          });
        }
        window.__sflPrevListings = currentListings;
        window.__sflPrevBalance  = State.parsedFarm?.balance ?? 0;
      } catch(salesErr) {
        console.warn('[Sales] Tracking error:', salesErr);
      }`;

  app = app.replace(POST_PARSE_ANCHOR, SALES_DETECTION);
  console.log('✓ Added sales tracking to app.js');
} else {
  console.log('→ Sales tracking already present');
}

fs.writeFileSync('js/app.js', app);
console.log('✓ app.js saved');
