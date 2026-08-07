const fs = require('fs');
let ui = fs.readFileSync('js/ui.js', 'utf8');

const NEW_MODAL = `
window.__app.showIslandResourcesModal = () => {
  const farm = window.__app.State.parsedFarm;
  if (!farm || farm.isPartial) {
    window.__app.UI.showModal('🌿 Recursos da Ilha', '<div style="padding:32px; text-align:center; color:var(--text-secondary); font-size:15px;">🔒 Conecte sua API Key para ver os recursos detalhados.</div>');
    return;
  }

  const IMG = (name) => \`https://sfl.world/img/source/\${encodeURIComponent(name)}.png\`;

  const resourceGroups = [
    {
      label: '🪵 Madeira',
      img: 'Wood',
      items: (farm.trees || []),
      regrow: '2h',
    },
    {
      label: '🪨 Pedra',
      img: 'Stone',
      items: (farm.rocks || []).filter(r => r.name === 'Stone Rock'),
      regrow: '4h',
    },
    {
      label: '🔩 Ferro',
      img: 'Iron',
      items: (farm.rocks || []).filter(r => r.name === 'Iron Rock'),
      regrow: '8h',
    },
    {
      label: '🥇 Ouro',
      img: 'Gold',
      items: (farm.rocks || []).filter(r => r.name === 'Gold Rock'),
      regrow: '24h',
    },
    {
      label: '💎 Crimstone',
      img: 'Crimstone',
      items: (farm.rocks || []).filter(r => r.name === 'Crimstone'),
      regrow: '24h',
    },
    {
      label: '🌟 Sunstone',
      img: 'Sunstone',
      items: (farm.rocks || []).filter(r => r.name === 'Sunstone'),
      regrow: '24h',
    },
    {
      label: '🍄 Cogumelos',
      img: 'Wild Mushroom',
      items: (farm.mushrooms || []),
      regrow: '16h',
    },
    {
      label: '🛢 Petróleo',
      img: 'Oil',
      items: (farm.oil || []),
      regrow: '24h',
    },
  ];

  const listHtml = resourceGroups.map(g => {
    const total = g.items.length;
    const ready = g.items.filter(i => i.status === 'ready').length;
    
    if (total === 0) {
      return \`
        <div style="display:flex;align-items:center;gap:12px;padding:12px 14px;background:rgba(255,255,255,0.02);border:1px dashed rgba(255,255,255,0.05);border-radius:14px;margin-bottom:10px;opacity:0.6;">
          <div style="width:44px;height:44px;background:var(--surface-3);border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0;border:1px solid rgba(255,255,255,0.04);">
            <img src="\${IMG(g.img)}" style="width:28px;height:28px;object-fit:contain;image-rendering:pixelated;filter:grayscale(100%);" onerror="this.style.display='none'">
          </div>
          <div style="flex:1;min-width:0;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:2px;">
              <span style="font-size:13px;font-weight:700;color:var(--text-secondary);">\${g.label}</span>
              <span style="font-size:13px;font-weight:800;color:var(--text-tertiary);">0/0</span>
            </div>
            <div style="font-size:11px;color:var(--text-tertiary);">Ainda não desbloqueado na sua ilha.</div>
          </div>
        </div>
      \`;
    }

    const pct = Math.round((ready / total) * 100);
    const barColor = ready === total ? 'var(--emerald)' : (ready > 0 ? 'var(--amber)' : 'var(--text-tertiary)');
    
    // Sort items so recovering ones are at the end, and ready ones at the front
    const sortedItems = [...g.items].sort((a,b) => {
      if(a.status === 'ready' && b.status !== 'ready') return -1;
      if(b.status === 'ready' && a.status !== 'ready') return 1;
      return a.msLeft - b.msLeft;
    });

    const itemsGrid = sortedItems.map((item, idx) => {
      if(item.status === 'ready') {
        return \`<div style="background:rgba(16,185,129,0.15); color:var(--emerald); border:1px solid rgba(16,185,129,0.3); font-size:10px; padding:3px 6px; border-radius:6px; font-weight:700;">#\${idx+1} Pronto</div>\`;
      }
      return \`<div style="background:rgba(255,255,255,0.05); color:var(--text-secondary); border:1px solid rgba(255,255,255,0.1); font-size:10px; padding:3px 6px; border-radius:6px; font-family:monospace;">\${item.countdown}</div>\`;
    }).join('');

    return \`
      <div style="padding:14px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:14px;margin-bottom:10px;">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
          <div style="width:44px;height:44px;background:var(--surface-3);border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0;border:1px solid rgba(255,255,255,0.1);">
            <img src="\${IMG(g.img)}" style="width:28px;height:28px;object-fit:contain;image-rendering:pixelated;" onerror="this.style.display='none'">
          </div>
          <div style="flex:1;min-width:0;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
              <span style="font-size:14px;font-weight:800;color:var(--text-primary);">\${g.label}</span>
              <span style="font-size:14px;font-weight:800;color:\${ready > 0 ? 'var(--emerald)' : 'var(--text-secondary)'};">\${ready}/\${total}</span>
            </div>
            <div style="height:6px;background:rgba(255,255,255,0.06);border-radius:3px;overflow:hidden;margin-bottom:5px;">
              <div style="height:100%;width:\${pct}%;background:\${barColor};border-radius:3px;transition:width 0.3s ease;"></div>
            </div>
            <div style="font-size:11px;color:var(--text-tertiary);text-align:right;">Regenera: \${g.regrow}</div>
          </div>
        </div>
        <div style="display:flex; gap:6px; flex-wrap:wrap; padding-top:10px; border-top:1px dashed rgba(255,255,255,0.08);">
          \${itemsGrid}
        </div>
      </div>
    \`;
  }).join('');

  const totalReady = resourceGroups.reduce((s, g) => s + g.items.filter(i=>i.status==='ready').length, 0);
  const totalItems = resourceGroups.reduce((s, g) => s + g.items.length, 0);

  const modalHtml = \`
    <div style="margin-bottom:16px;padding:12px 14px;background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.2);border-radius:12px;display:flex;justify-content:space-between;align-items:center;">
      <span style="font-size:13px;font-weight:600;color:var(--text-secondary);">Total disponível na ilha</span>
      <span style="font-size:18px;font-weight:800;color:var(--emerald);">\${totalReady} / \${totalItems}</span>
    </div>
    <div style="max-height:55vh;overflow-y:auto;padding-right:4px;">
      \${listHtml}
    </div>
  \`;

  window.__app.UI.showModal('🌿 Recursos da Ilha', modalHtml);
};
`;

if (ui.includes('window.__app.showIslandResourcesModal =')) {
  // If we already had a definition, remove it or replace it
  console.log('Definition already found! Modifying it.');
  // We can just append it or replace it, but I'll replace everything after window.__app.showIslandResourcesModal = () => { to the end.
  // Actually, since I know there is NO definition in the file yet, I will just append it.
} else {
  // Append to the end of the file
  ui = ui.trimEnd() + NEW_MODAL;
  
  // Bump version for cache busting
  ui = ui.replace(/v=93/g, 'v=94');
  
  fs.writeFileSync('js/ui.js', ui);
  console.log('ui.js updated with new modal implementation');
  
  // Also bump html version
  let html = fs.readFileSync('index.html', 'utf8');
  html = html.replace(/v=93/g, 'v=94');
  fs.writeFileSync('index.html', html);
  console.log('index.html bumped to v94');
}
