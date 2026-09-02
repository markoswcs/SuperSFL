/**
 * fix11.js — Inject island resource stats before the second setHtml #home-farm-summary call
 */
const fs = require('fs');
let ui = fs.readFileSync('js/ui.js', 'utf8');

if (ui.includes('// Island resources stats')) {
  console.log('→ Island stats already present');
  process.exit(0);
}

// The exact anchor (the end of the expansion calc block, right before setHtml)
// We'll find the second occurrence of setHtml('#home-farm-summary'
// and insert the stats code before it.
const ANCHOR = `    }\n\r\n    setHtml('#home-farm-summary', \``;

const STATS_CODE = `    }\n\r\n    // Island resources stats\n    const islandTrees = parsedFarm.trees || [];\n    const islandRocks = parsedFarm.rocks || [];\n    const islandMush  = parsedFarm.mushrooms || [];\n    const islandOil   = parsedFarm.oil || [];\n\n    const treesReady  = islandTrees.filter(t => t.status === 'ready').length;\n    const treesTotal  = islandTrees.length;\n    const stoneReady  = islandRocks.filter(r => r.name === 'Stone Rock' && r.status === 'ready').length;\n    const ironReady   = islandRocks.filter(r => r.name === 'Iron Rock' && r.status === 'ready').length;\n    const goldReady   = islandRocks.filter(r => r.name === 'Gold Rock' && r.status === 'ready').length;\n    const crimsReady  = islandRocks.filter(r => r.name === 'Crimstone' && r.status === 'ready').length;\n    const sunReady    = islandRocks.filter(r => r.name === 'Sunstone' && r.status === 'ready').length;\n    const mushReady   = islandMush.filter(m => m.status === 'ready').length;\n    const oilReady    = islandOil.filter(o => o.status === 'ready').length;\n    const totalIslandReady = treesReady + stoneReady + ironReady + goldReady + crimsReady + sunReady + mushReady + oilReady;\n\n    const nextIslandRes = [\n      ...islandTrees.filter(t => t.status !== 'ready' && t.msLeft > 0),\n      ...islandRocks.filter(r => r.status !== 'ready' && r.msLeft > 0),\n      ...islandMush.filter(m => m.status !== 'ready' && m.msLeft > 0),\n    ].sort((a, b) => a.msLeft - b.msLeft)[0];\n\n    const islandSub = parsedFarm.isPartial ? '-' :\n      (totalIslandReady > 0 ? \`\${totalIslandReady} pronto\${totalIslandReady > 1 ? 's' : ''} para coletar\` :\n       (nextIslandRes ? \`Próximo em \${nextIslandRes.countdown}\` : 'Tudo disponível'));\n\n    setHtml('#home-farm-summary', \``;

// replace ONLY the second occurrence (at line 273)
let count = 0;
let result = ui.replace(/    }\n\r\n    setHtml\('#home-farm-summary', `/g, (match) => {
  count++;
  if (count === 2) return STATS_CODE;
  return match;
});

if (count < 2) {
  // Try with \r\n instead
  count = 0;
  result = ui.replace(/    }\r?\n\r?\n    setHtml\('#home-farm-summary', `/g, (match) => {
    count++;
    if (count === 2) return match.replace('setHtml', '// Island resources stats\n    const islandTrees = parsedFarm.trees || [];\n    const islandRocks = parsedFarm.rocks || [];\n    const islandMush  = parsedFarm.mushrooms || [];\n    const islandOil   = parsedFarm.oil || [];\n\n    const treesReady  = islandTrees.filter(t => t.status === "ready").length;\n    const treesTotal  = islandTrees.length;\n    const stoneReady  = islandRocks.filter(r => r.name === "Stone Rock" && r.status === "ready").length;\n    const ironReady   = islandRocks.filter(r => r.name === "Iron Rock" && r.status === "ready").length;\n    const goldReady   = islandRocks.filter(r => r.name === "Gold Rock" && r.status === "ready").length;\n    const crimsReady  = islandRocks.filter(r => r.name === "Crimstone" && r.status === "ready").length;\n    const sunReady    = islandRocks.filter(r => r.name === "Sunstone" && r.status === "ready").length;\n    const mushReady   = islandMush.filter(m => m.status === "ready").length;\n    const oilReady    = islandOil.filter(o => o.status === "ready").length;\n    const totalIslandReady = treesReady + stoneReady + ironReady + goldReady + crimsReady + sunReady + mushReady + oilReady;\n\n    const nextIslandRes = [\n      ...islandTrees.filter(t => t.status !== "ready" && t.msLeft > 0),\n      ...islandRocks.filter(r => r.status !== "ready" && r.msLeft > 0),\n      ...islandMush.filter(m => m.status !== "ready" && m.msLeft > 0),\n    ].sort((a, b) => a.msLeft - b.msLeft)[0];\n\n    const islandSub = parsedFarm.isPartial ? \'-\' :\n      (totalIslandReady > 0 ? `${totalIslandReady} pronto${totalIslandReady > 1 ? \'s\' : \'\'} para coletar` :\n       (nextIslandRes ? `Próximo em ${nextIslandRes.countdown}` : \'Tudo disponível\'));\n\n    setHtml');
    return match;
  });
  console.log('Used fallback CRLF, count:', count);
}

if (!result.includes('// Island resources stats')) {
  // Last resort: find by line
  const lines = ui.split('\n');
  const idx = lines.findIndex(l => l.trim() === "setHtml('#home-farm-summary', `");
  if (idx > -1) {
    lines.splice(idx, 0, 
      "    // Island resources stats",
      "    const islandTrees = parsedFarm.trees || [];",
      "    const islandRocks = parsedFarm.rocks || [];",
      "    const islandMush  = parsedFarm.mushrooms || [];",
      "    const islandOil   = parsedFarm.oil || [];",
      "    const treesReady  = islandTrees.filter(t => t.status === 'ready').length;",
      "    const treesTotal  = islandTrees.length;",
      "    const stoneReady  = islandRocks.filter(r => r.name === 'Stone Rock' && r.status === 'ready').length;",
      "    const ironReady   = islandRocks.filter(r => r.name === 'Iron Rock' && r.status === 'ready').length;",
      "    const goldReady   = islandRocks.filter(r => r.name === 'Gold Rock' && r.status === 'ready').length;",
      "    const crimsReady  = islandRocks.filter(r => r.name === 'Crimstone' && r.status === 'ready').length;",
      "    const sunReady    = islandRocks.filter(r => r.name === 'Sunstone' && r.status === 'ready').length;",
      "    const mushReady   = islandMush.filter(m => m.status === 'ready').length;",
      "    const oilReady    = islandOil.filter(o => o.status === 'ready').length;",
      "    const totalIslandReady = treesReady + stoneReady + ironReady + goldReady + crimsReady + sunReady + mushReady + oilReady;",
      "    const nextIslandRes = [...islandTrees, ...islandRocks, ...islandMush].filter(x => x.status !== 'ready' && x.msLeft > 0).sort((a, b) => a.msLeft - b.msLeft)[0];",
      "    const islandSub = parsedFarm.isPartial ? '-' : (totalIslandReady > 0 ? `${totalIslandReady} prontos para coletar` : (nextIslandRes ? `Próximo em ${nextIslandRes.countdown}` : 'Tudo disponível'));"
    );
    result = lines.join('\n');
    console.log('✓ Injected via line splice at index', idx);
  } else {
    console.log('ERROR: Could not find injection point. idx =', idx);
    process.exit(1);
  }
}

fs.writeFileSync('js/ui.js', result);
console.log('✓ Island stats saved to ui.js');
console.log('Has stats now:', result.includes('// Island resources stats'));
