const fs = require('fs');

// --- Patch farm.js ---
let farm = fs.readFileSync('js/farm.js', 'utf8');

// 1. Trees
farm = farm.replace(
  "      type:  'tree',\n    };",
  "      type:  'tree',\n      amount: tree.wood?.amount ?? 1,\n    };"
);

// 2. Rocks
farm = farm.replace(
  "        type:  'rock',\n      });",
  "        type:  'rock',\n        amount: rock.stone?.amount ?? rock.amount ?? 1,\n      });"
);

// 3. Mushrooms
farm = farm.replace(
  "      type:  'mushroom',\n    };",
  "      type:  'mushroom',\n      amount: m.amount ?? 1,\n    };"
);

fs.writeFileSync('js/farm.js', farm);
console.log('farm.js patched');

// --- Patch ui.js ---
let ui = fs.readFileSync('js/ui.js', 'utf8');

const OLD_MAPPING = `    const itemsGrid = sortedItems.map((item, idx) => {
      if(item.status === 'ready') {
        return \`<div style="background:rgba(16,185,129,0.15); color:var(--emerald); border:1px solid rgba(16,185,129,0.3); font-size:10px; padding:3px 6px; border-radius:6px; font-weight:700;">#\${idx+1} Pronto</div>\`;
      }
      return \`<div style="background:rgba(255,255,255,0.05); color:var(--text-secondary); border:1px solid rgba(255,255,255,0.1); font-size:10px; padding:3px 6px; border-radius:6px; font-family:monospace;">\${item.countdown}</div>\`;
    }).join('');`;

const NEW_MAPPING = `
    const readyItems = g.items.filter(i => i.status === 'ready');
    const recoveringItems = g.items.filter(i => i.status !== 'ready').sort((a,b) => a.msLeft - b.msLeft);
    
    let itemsGrid = '';
    
    // 1. Render a single summary tag for all READY items
    if (readyItems.length > 0) {
      const totalYield = readyItems.reduce((acc, i) => acc + (i.amount || 1), 0);
      itemsGrid += \`<div style="background:rgba(16,185,129,0.15); color:var(--emerald); border:1px solid rgba(16,185,129,0.3); font-size:11px; padding:4px 8px; border-radius:6px; font-weight:800; display:flex; align-items:center; gap:4px;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> Rende +\${totalYield}</div>\`;
    }
    
    // 2. Render individual tags ONLY for recovering items
    itemsGrid += recoveringItems.map(item => {
      return \`<div style="background:rgba(255,255,255,0.05); color:var(--text-secondary); border:1px solid rgba(255,255,255,0.1); font-size:10px; padding:4px 6px; border-radius:6px; font-family:monospace; display:flex; align-items:center;">\${item.countdown}</div>\`;
    }).join('');
`;

if (ui.includes(OLD_MAPPING)) {
  ui = ui.replace(OLD_MAPPING, NEW_MAPPING);
  ui = ui.replace(/v=94/g, 'v=95');
  fs.writeFileSync('js/ui.js', ui);
  console.log('ui.js patched');

  let html = fs.readFileSync('index.html', 'utf8');
  html = html.replace(/v=94/g, 'v=95');
  fs.writeFileSync('index.html', html);
  console.log('index.html bumped to v95');
} else {
  console.log('Failed to find OLD_MAPPING in ui.js');
}
