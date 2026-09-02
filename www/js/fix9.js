/**
 * fix9.js — Add Island Resources card and stats to renderHome / renderFarmPage
 * Uses string injection rather than regex to avoid corrupting template literals.
 */
const fs = require('fs');
let ui = fs.readFileSync('js/ui.js', 'utf8');

// ─── 1. Add island stats computation after expansionSub setup ────────────────
const EXPANSION_CALC_END = `    }\n\n    setHtml('#home-farm-summary', \``;

const ISLAND_STATS = `    }\n\n    // Island resources stats\n    const islandTrees = parsedFarm.trees || [];\n    const islandRocks = parsedFarm.rocks || [];\n    const islandMush  = parsedFarm.mushrooms || [];\n    const islandOil   = parsedFarm.oil || [];\n\n    const treesReady  = islandTrees.filter(t => t.status === 'ready').length;\n    const treesTotal  = islandTrees.length;\n    const stoneReady  = islandRocks.filter(r => r.name === 'Stone Rock' && r.status === 'ready').length;\n    const ironReady   = islandRocks.filter(r => r.name === 'Iron Rock' && r.status === 'ready').length;\n    const goldReady   = islandRocks.filter(r => r.name === 'Gold Rock' && r.status === 'ready').length;\n    const crimsReady  = islandRocks.filter(r => r.name === 'Crimstone' && r.status === 'ready').length;\n    const sunReady    = islandRocks.filter(r => r.name === 'Sunstone' && r.status === 'ready').length;\n    const mushReady   = islandMush.filter(m => m.status === 'ready').length;\n    const oilReady    = islandOil.filter(o => o.status === 'ready').length;\n    const totalIslandReady = treesReady + stoneReady + ironReady + goldReady + crimsReady + sunReady + mushReady + oilReady;\n\n    const nextIslandRes = [\n      ...islandTrees.filter(t => t.status !== 'ready' && t.msLeft > 0),\n      ...islandRocks.filter(r => r.status !== 'ready' && r.msLeft > 0),\n      ...islandMush.filter(m => m.status !== 'ready' && m.msLeft > 0),\n    ].sort((a, b) => a.msLeft - b.msLeft)[0];\n\n    const islandSub = parsedFarm.isPartial ? '-' :\n      (totalIslandReady > 0 ? \`\${totalIslandReady} pronto\${totalIslandReady > 1 ? 's' : ''} para coletar\` :\n       (nextIslandRes ? \`Próximo em \${nextIslandRes.countdown}\` : 'Tudo disponível'));\n\n    setHtml('#home-farm-summary', \``;

if (!ui.includes('// Island resources stats\n')) {
  ui = ui.replace(EXPANSION_CALC_END, ISLAND_STATS);
  console.log('✓ Added island stats computation');
} else {
  console.log('→ Island stats already present, skipping');
}

// ─── 2. Insert Island Resources card between Composting and Expansion ─────────
const ISLAND_CARD = `
        <!-- Island Resources -->
        <div class="stat-card spring-in stagger-6" onclick="window.__app && window.__app.showIslandResourcesModal && window.__app.showIslandResourcesModal()" style="grid-column: 1 / -1; display:flex; flex-direction:row; align-items:center; gap:12px; padding: 14px; cursor:pointer;" title="Recursos da Ilha">
          <div style="width:40px;height:40px;background:var(--surface-3);border:1px solid var(--surface-border);border-radius:12px;display:flex;align-items:center;justify-content:center;box-shadow:inset 0 2px 4px rgba(255,255,255,0.05);flex-shrink:0;">
            <img src="https://sfl.world/img/source/Wood.png" style="width:26px;height:26px;object-fit:contain;image-rendering:pixelated;" onerror="this.style.display='none'">
          </div>
          <div style="flex:1; min-width:0;">
            <div class="stat-label" style="font-size:12px; margin-bottom:5px;">🌿 RECURSOS DA ILHA</div>
            <div style="display:flex; gap:6px; flex-wrap:wrap; align-items:center;">
              \${[
                {img:'Wood', count: treesReady, total: treesTotal, label:'Madeira'},
                {img:'Stone', count: stoneReady, total: islandRocks.filter(r=>r.name==='Stone Rock').length, label:'Pedra'},
                {img:'Iron', count: ironReady, total: islandRocks.filter(r=>r.name==='Iron Rock').length, label:'Ferro'},
                {img:'Gold', count: goldReady, total: islandRocks.filter(r=>r.name==='Gold Rock').length, label:'Ouro'},
                {img:'Crimstone', count: crimsReady, total: islandRocks.filter(r=>r.name==='Crimstone').length, label:'Crimstone'},
                {img:'Sunstone', count: sunReady, total: islandRocks.filter(r=>r.name==='Sunstone').length, label:'Sunstone'},
                {img:'Wild Mushroom', count: mushReady, total: islandMush.length, label:'Cogumelo'},
                {img:'Oil', count: oilReady, total: islandOil.length, label:'Petróleo'},
              ].filter(r => r.total > 0).map(r => \`
                <div title="\${r.label}" style="display:flex;align-items:center;gap:4px;background:\${r.count>0?'rgba(16,185,129,0.12)':'rgba(255,255,255,0.04)'};border:1px solid \${r.count>0?'rgba(16,185,129,0.3)':'rgba(255,255,255,0.08)'};border-radius:8px;padding:4px 8px;">
                  <img src="https://sfl.world/img/source/\${encodeURIComponent(r.img)}.png" style="width:16px;height:16px;object-fit:contain;image-rendering:pixelated;" onerror="this.style.display='none'">
                  <span style="font-size:12px;font-weight:700;color:\${r.count>0?'var(--emerald)':'var(--text-secondary)'}">\${r.count}/\${r.total}</span>
                </div>
              \`).join('')}
            </div>
            <div class="stat-sub" style="margin-top:5px;font-size:11px;color:var(--text-tertiary);">\${islandSub}</div>
          </div>
          <div style="color:var(--text-tertiary);font-size:20px;">›</div>
        </div>

`;

const EXPANSION_MARKER = `        <!-- Expansion -->`;

if (!ui.includes('<!-- Island Resources -->')) {
  ui = ui.replace(EXPANSION_MARKER, ISLAND_CARD + EXPANSION_MARKER);
  console.log('✓ Inserted Island Resources card');
} else {
  console.log('→ Island Resources card already present, skipping');
}

fs.writeFileSync('js/ui.js', ui);
console.log('✓ ui.js saved');
