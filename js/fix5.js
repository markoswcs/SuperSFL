const fs = require('fs');
let ui = fs.readFileSync('js/ui.js', 'utf8');

// Replace the imgUrl for modal composters
ui = ui.replace(
  "const imgUrl = `https://sfl.world/img/source/${c.name.replace(/\\s+/g, '')}.png`;",
  "const imgUrl = 'https://raw.githubusercontent.com/sunflower-land/sunflower-land/main/src/assets/composters/compost.png';"
);

// Replace the modal title HTML
ui = ui.replace(
  /showModal\('<img src="https:\/\/sfl\.world\/img\/source\/CompostBin\.png"[^>]+>\s*Detalhes das Composteiras',\s*modalHtml\);/g,
  "showModal('♻️ Detalhes das Composteiras', modalHtml);"
);

fs.writeFileSync('js/ui.js', ui);
console.log('Fixed ui.js step 5');
