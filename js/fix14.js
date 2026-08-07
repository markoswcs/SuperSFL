const fs = require('fs');
let farm = fs.readFileSync('js/farm.js', 'utf8');

// Update sunstones parsing to handle both singular and plural keys, just in case
farm = farm.replace(
  `addRocks(farm?.sunstones,    'Sunstone',      GOLD_REGROW_MS,   '🌟');`,
  `addRocks(farm?.sunstones || farm?.sunstone, 'Sunstone', GOLD_REGROW_MS, '🌟');`
);

fs.writeFileSync('js/farm.js', farm);
console.log('farm.js updated');
