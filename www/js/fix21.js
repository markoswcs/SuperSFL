const fs = require('fs');

let farm = fs.readFileSync('js/farm.js', 'utf8');

const YIELD_LOGIC = `
function getResourceYield(farm, type) {
  let base = 1;
  let multiplier = 1;
  
  const skills = farm?.bumpkin?.skills || {};
  const equipped = farm?.bumpkin?.equipped || {};
  const inv = farm?.inventory || {};
  
  if (type === 'wood') {
    // 0.1 for Lumberjack, 0.2 for Tree Hugger
    if (skills['Lumberjack']) base += 0.1;
    if (skills['Tree Hugger']) base += 0.2;
    if (skills['Tough Tree']) base += 0.2;
    if (equipped.hat === 'Woodsman Hat') base += 0.2;
    
    // Beavers give +20% each
    if (inv['Woody the Beaver']) multiplier += 0.2;
    if (inv['Apprentice Beaver']) multiplier += 0.2;
    if (inv['Foreman Beaver']) multiplier += 0.2;
  } 
  else if (type === 'stone') {
    if (skills['Coal Face']) base += 0.2;
  }
  else if (type === 'iron') {
    if (skills['Coal Face']) base += 0.2;
  }
  else if (type === 'gold') {
    if (skills['Gold Rush']) base += 0.2;
  }
  
  return base * multiplier;
}
`;

if (!farm.includes('getResourceYield')) {
  farm = farm.replace(
    'const TREE_REGROW_MS = 2 * 3600_000;',
    YIELD_LOGIC + '\nconst TREE_REGROW_MS = 2 * 3600_000;'
  );
}

// 1. Trees
farm = farm.replace(
  "      type:  'tree',\n    };",
  "      type:  'tree',\n      amount: getResourceYield(farm, 'wood'),\n    };"
);

// 2. Rocks
// Wait, parseRocks takes (collection, name, regrowMs, emoji)
// I need to determine the type ('stone', 'iron', 'gold') from 'name'
farm = farm.replace(
  "        type:  'rock',\n      });",
  "        type:  'rock',\n        amount: getResourceYield(farm, name.toLowerCase()),\n      });"
);

// 3. Mushrooms
farm = farm.replace(
  "      type:  'mushroom',\n    };",
  "      type:  'mushroom',\n      amount: 1,\n    };"
);

fs.writeFileSync('js/farm.js', farm);
console.log('farm.js patched with getResourceYield');
