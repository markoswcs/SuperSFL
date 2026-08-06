const fs = require('fs');
const data = JSON.parse(fs.readFileSync('data/farm.json', 'utf8'));
const farm = data.farm || data;
const helpMonuments = ["Farmer's Monument", "Miner's Monument", "Woodcutter's Monument", "Teamwork Monument"];
let count = 0;
helpMonuments.forEach(m => {
  if (farm.rawCollectibles && farm.rawCollectibles[m] && farm.rawCollectibles[m].length > 0) {
    console.log('Has collectible:', m);
    count++;
  }
  if (farm.rawBuildings && farm.rawBuildings[m] && farm.rawBuildings[m].length > 0) {
    console.log('Has building:', m);
    count++;
  }
});
console.log('Total monuments:', count);
