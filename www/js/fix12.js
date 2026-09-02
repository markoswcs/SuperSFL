/**
 * fix12.js — Final clean patch:
 * 1. Remove island stats from wrong place (renderLoadingState)
 * 2. Inject island stats in correct place (before setHtml at line ~290)
 */
const fs = require('fs');
let ui = fs.readFileSync('js/ui.js', 'utf8');

// Step 1: Remove the misplaced injection inside renderLoadingState
const WRONG_BLOCK = [
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
].join('\n');

ui = ui.replace(WRONG_BLOCK + '\n', '');
console.log('Step 1: removed wrong injection. Still has:', ui.includes('// Island resources stats'));

// Step 2: Inject in correct place — after the expansion construction block
// Target: line that closes the expansion if block followed by blank line and setHtml
const STATS_INJECTION = `\n    // Island resources stats\n    const islandTrees = parsedFarm.trees || [];\n    const islandRocks = parsedFarm.rocks || [];\n    const islandMush  = parsedFarm.mushrooms || [];\n    const islandOil   = parsedFarm.oil || [];\n\n    const treesReady  = islandTrees.filter(t => t.status === 'ready').length;\n    const treesTotal  = islandTrees.length;\n    const stoneReady  = islandRocks.filter(r => r.name === 'Stone Rock' && r.status === 'ready').length;\n    const ironReady   = islandRocks.filter(r => r.name === 'Iron Rock' && r.status === 'ready').length;\n    const goldReady   = islandRocks.filter(r => r.name === 'Gold Rock' && r.status === 'ready').length;\n    const crimsReady  = islandRocks.filter(r => r.name === 'Crimstone' && r.status === 'ready').length;\n    const sunReady    = islandRocks.filter(r => r.name === 'Sunstone' && r.status === 'ready').length;\n    const mushReady   = islandMush.filter(m => m.status === 'ready').length;\n    const oilReady    = islandOil.filter(o => o.status === 'ready').length;\n    const totalIslandReady = treesReady + stoneReady + ironReady + goldReady + crimsReady + sunReady + mushReady + oilReady;\n\n    const nextIslandRes = [\n      ...islandTrees.filter(t => t.status !== 'ready' && t.msLeft > 0),\n      ...islandRocks.filter(r => r.status !== 'ready' && r.msLeft > 0),\n      ...islandMush.filter(m => m.status !== 'ready' && m.msLeft > 0),\n    ].sort((a, b) => a.msLeft - b.msLeft)[0];\n\n    const islandSub = parsedFarm.isPartial ? '-' :\n      (totalIslandReady > 0 ? \`\${totalIslandReady} pronto\${totalIslandReady > 1 ? 's' : ''} para coletar\` :\n       (nextIslandRes ? \`Próximo em \${nextIslandRes.countdown}\` : 'Tudo disponível'));\n`;

// Find the exact closing of expansion block in renderHome context
// The anchor is the closing brace of the expansionConstruction if block
const lines = ui.split('\n');
let injected = false;

// Find the line "    }" that closes expansionConstruction if, followed by blank line,
// then setHtml('#home-farm-summary'
for (let i = 0; i < lines.length - 2; i++) {
  if (lines[i].trim() === '}' && 
      lines[i + 1].trim() === '' && 
      lines[i + 2].trim().startsWith("setHtml('#home-farm-summary'") &&
      // Make sure we're in the right context (look back for expansionConstruction)
      lines.slice(Math.max(0, i - 15), i).some(l => l.includes('expansionConstruction'))) {
    
    // Insert stats after the closing brace
    lines.splice(i + 1, 0, STATS_INJECTION);
    injected = true;
    console.log('✓ Injected at line', i + 1);
    break;
  }
}

if (!injected) {
  console.log('ERROR: Could not find insertion point');
  process.exit(1);
}

ui = lines.join('\n');
fs.writeFileSync('js/ui.js', ui);
console.log('✓ ui.js saved');
console.log('Has island stats now:', ui.includes('// Island resources stats'));
