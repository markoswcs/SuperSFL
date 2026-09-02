const fs = require('fs');
let ui = fs.readFileSync('js/ui.js', 'utf8');

// 1. Add filter logic
const filterLogic = `  const chores = Array.isArray(farm.chores) ? farm.chores : farm.chores?.active || [];
  let deliveries = chores.filter(c => c.type === 'delivery');
  const tasks = chores.filter(c => c.type === 'chore');

  // --- FILTER LOGIC ---
  window.__app.State.deliveriesFilter = window.__app.State.deliveriesFilter || 'ALL';
  const activeFilter = window.__app.State.deliveriesFilter;

  // Evaluate if delivery is 'sent' (done)
  function isDeliveryDone(d) {
    if (!d.items) return false;
    const inv = farm.inventory || {};
    const allOwned = {};
    [...(inv.crops || []), ...(inv.resources || []), ...(inv.food || []), ...(inv.special || [])].forEach(item => {
      allOwned[item.name] = item.qty;
    });
    let done = true;
    for (let [name, qty] of Object.entries(d.items)) {
      if ((allOwned[name] ?? 0) < qty) done = false;
    }
    return done;
  }

  if (activeFilter === 'SENT') {
    deliveries = deliveries.filter(isDeliveryDone);
  } else if (activeFilter === 'FLOWER') {
    deliveries = deliveries.filter(d => d.rewardSfl && d.rewardSfl > 0);
  } else if (activeFilter === 'COINS') {
    deliveries = deliveries.filter(d => d.rewardCoins && d.rewardCoins > 0);
  } else if (activeFilter === 'SEASONAL') {
    deliveries = deliveries.filter(d => d.rewardMarks && d.rewardMarks > 0);
  }
  // --------------------`;

ui = ui.replace(
  /const chores = Array.isArray\(farm.chores\)\s*\?.*?const tasks = chores\.filter\(c => c\.type === 'chore'\);/s,
  filterLogic
);

// 2. Add filter UI
const filterHtml = `
      <!-- Filter Bar -->
      <div style="display:flex; gap:8px; overflow-x:auto; padding-bottom:12px; margin-bottom:16px; scrollbar-width:none; -webkit-overflow-scrolling:touch;">
        \${['ALL', 'SENT', 'FLOWER', 'SEASONAL', 'COINS'].map(f => {
          const isActive = activeFilter === f;
          const bg = isActive ? 'var(--amber-subtle)' : 'var(--surface-3)';
          const border = isActive ? 'var(--amber)' : 'var(--surface-border)';
          const color = isActive ? 'var(--amber)' : 'var(--text-secondary)';
          let label = f;
          if (f === 'ALL') label = 'TUDO';
          if (f === 'SENT') label = 'PRONTOS';
          if (f === 'FLOWER') label = 'FLOWER';
          if (f === 'SEASONAL') label = 'TICKETS';
          if (f === 'COINS') label = 'MOEDAS';
          
          return \`<button onclick="window.__app.State.deliveriesFilter='\${f}'; window.__app.renderDeliveriesPage();" 
                  style="background:\${bg}; border:1px solid \${border}; color:\${color}; padding:6px 12px; border-radius:12px; font-size:11px; font-weight:800; white-space:nowrap; cursor:pointer;">\${label}</button>\`;
        }).join('')}
      </div>
`;

ui = ui.replace(
  /<!-- Deliveries Section -->/g,
  filterHtml + '\n      <!-- Deliveries Section -->'
);

fs.writeFileSync('js/ui.js', ui);
console.log('Filters added');
