const fs = require('fs');
let ui = fs.readFileSync('js/ui.js', 'utf8');
console.log('Fixed NPC block:', !ui.includes('<img src="${npcImg}"'));
console.log('Fixed Modal Title:', !ui.includes('<img src="https://raw.githubusercontent.com/sunflower-land/sunflower-land/main/src/assets/composters/compost.png" style="width:24px'));
console.log('Fixed Modal Img URL:', ui.includes(`const imgUrl = 'https://raw.githubusercontent.com/sunflower-land/sunflower-land/main/src/assets/composters/compost.png';`));
