/**
 * fix10.js — Add showIslandResourcesModal to ui.js
 */
const fs = require('fs');
let ui = fs.readFileSync('js/ui.js', 'utf8');

if (ui.includes('showIslandResourcesModal')) {
  console.log('→ Already has showIslandResourcesModal, skipping');
  process.exit(0);
}

const MODAL_CODE = `

window.__app.showIslandResourcesModal = () => {
  const farm = window.__app.State.parsedFarm;
  if (!farm || farm.isPartial) {
    showModal('🌿 Recursos da Ilha', '<div style="padding:32px; text-align:center; color:var(--text-secondary); font-size:15px;">🔒 Conecte sua API Key para ver os recursos detalhados.</div>');
    return;
  }

  const IMG = (name) => \`https://sfl.world/img/source/\${encodeURIComponent(name)}.png\`;
  const now = Date.now();

  const resourceGroups = [
    {
      label: '🪵 Madeira',
      img: 'Wood',
      items: (farm.trees || []),
      ready: (farm.trees || []).filter(t => t.status === 'ready').length,
      total: (farm.trees || []).length,
      regrow: '2h',
    },
    {
      label: '🪨 Pedra',
      img: 'Stone',
      items: (farm.rocks || []).filter(r => r.name === 'Stone Rock'),
      ready: (farm.rocks || []).filter(r => r.name === 'Stone Rock' && r.status === 'ready').length,
      total: (farm.rocks || []).filter(r => r.name === 'Stone Rock').length,
      regrow: '4h',
    },
    {
      label: '🔩 Ferro',
      img: 'Iron',
      items: (farm.rocks || []).filter(r => r.name === 'Iron Rock'),
      ready: (farm.rocks || []).filter(r => r.name === 'Iron Rock' && r.status === 'ready').length,
      total: (farm.rocks || []).filter(r => r.name === 'Iron Rock').length,
      regrow: '8h',
    },
    {
      label: '🥇 Ouro',
      img: 'Gold',
      items: (farm.rocks || []).filter(r => r.name === 'Gold Rock'),
      ready: (farm.rocks || []).filter(r => r.name === 'Gold Rock' && r.status === 'ready').length,
      total: (farm.rocks || []).filter(r => r.name === 'Gold Rock').length,
      regrow: '24h',
    },
    {
      label: '💎 Crimstone',
      img: 'Crimstone',
      items: (farm.rocks || []).filter(r => r.name === 'Crimstone'),
      ready: (farm.rocks || []).filter(r => r.name === 'Crimstone' && r.status === 'ready').length,
      total: (farm.rocks || []).filter(r => r.name === 'Crimstone').length,
      regrow: '24h',
    },
    {
      label: '🌟 Sunstone',
      img: 'Sunstone',
      items: (farm.rocks || []).filter(r => r.name === 'Sunstone'),
      ready: (farm.rocks || []).filter(r => r.name === 'Sunstone' && r.status === 'ready').length,
      total: (farm.rocks || []).filter(r => r.name === 'Sunstone').length,
      regrow: '24h',
    },
    {
      label: '🍄 Cogumelos',
      img: 'Wild Mushroom',
      items: (farm.mushrooms || []),
      ready: (farm.mushrooms || []).filter(m => m.status === 'ready').length,
      total: (farm.mushrooms || []).length,
      regrow: '16h',
    },
    {
      label: '🛢 Petróleo',
      img: 'Oil',
      items: (farm.oil || []),
      ready: (farm.oil || []).filter(o => o.status === 'ready').length,
      total: (farm.oil || []).length,
      regrow: '24h',
    },
  ].filter(g => g.total > 0);

  if (resourceGroups.length === 0) {
    showModal('🌿 Recursos da Ilha', '<div style="padding:32px; text-align:center; color:var(--text-secondary); font-size:15px;">Nenhum recurso encontrado na ilha.</div>');
    return;
  }

  const listHtml = resourceGroups.map(g => {
    const pct = g.total > 0 ? Math.round((g.ready / g.total) * 100) : 0;
    const barColor = g.ready === g.total ? 'var(--emerald)' : (g.ready > 0 ? 'var(--amber)' : 'var(--text-tertiary)');
    
    // Find the soonest unavailable item
    const nextItem = g.items.filter(i => i.status !== 'ready' && i.msLeft > 0).sort((a,b) => a.msLeft - b.msLeft)[0];
    const subText = g.ready === g.total
      ? 'Todos disponíveis!'
      : (nextItem ? \`Próximo: \${nextItem.countdown}\` : \`\${g.total - g.ready} recuperando\`);
    
    return \`
      <div style="display:flex;align-items:center;gap:12px;padding:12px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:14px;margin-bottom:10px;">
        <div style="width:44px;height:44px;background:var(--surface-3);border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0;border:1px solid rgba(255,255,255,0.08);">
          <img src="\${IMG(g.img)}" style="width:28px;height:28px;object-fit:contain;image-rendering:pixelated;" onerror="this.style.display='none'">
        </div>
        <div style="flex:1;min-width:0;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
            <span style="font-size:13px;font-weight:700;color:var(--text-primary);">\${g.label}</span>
            <span style="font-size:13px;font-weight:800;color:\${g.ready > 0 ? 'var(--emerald)' : 'var(--text-secondary)'};">\${g.ready}/\${g.total}</span>
          </div>
          <div style="height:6px;background:rgba(255,255,255,0.06);border-radius:3px;overflow:hidden;margin-bottom:5px;">
            <div style="height:100%;width:\${pct}%;background:\${barColor};border-radius:3px;transition:width 0.3s ease;"></div>
          </div>
          <div style="font-size:11px;color:var(--text-tertiary);display:flex;justify-content:space-between;">
            <span>\${subText}</span>
            <span>Regenera: \${g.regrow}</span>
          </div>
        </div>
      </div>
    \`;
  }).join('');

  const totalReady = resourceGroups.reduce((s, g) => s + g.ready, 0);
  const totalItems = resourceGroups.reduce((s, g) => s + g.total, 0);

  const modalHtml = \`
    <div style="margin-bottom:16px;padding:12px 14px;background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.2);border-radius:12px;display:flex;justify-content:space-between;align-items:center;">
      <span style="font-size:13px;font-weight:600;color:var(--text-secondary);">Total disponível</span>
      <span style="font-size:18px;font-weight:800;color:var(--emerald);">\${totalReady} / \${totalItems}</span>
    </div>
    <div style="max-height:55vh;overflow-y:auto;padding-right:4px;">
      \${listHtml}
    </div>
  \`;

  showModal('🌿 Recursos da Ilha', modalHtml);
};

`;

// Insert before final blank lines
ui = ui.trimEnd() + MODAL_CODE;

fs.writeFileSync('js/ui.js', ui);
console.log('✓ Added showIslandResourcesModal to ui.js');
