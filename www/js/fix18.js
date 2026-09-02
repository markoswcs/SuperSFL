const fs = require('fs');

let ui = fs.readFileSync('js/ui.js', 'utf8');

ui = ui.replace("label: '🪵 Madeira',", "label: 'Madeira',");
ui = ui.replace("label: '🪨 Pedra',", "label: 'Pedra',");
ui = ui.replace("label: '🔩 Ferro',", "label: 'Ferro',");
ui = ui.replace("label: '🥇 Ouro',", "label: 'Ouro',");
ui = ui.replace("label: '💎 Crimstone',", "label: 'Crimstone',");
ui = ui.replace("label: '🌟 Sunstone',", "label: 'Sunstone',");
ui = ui.replace("label: '🍄 Cogumelos',", "label: 'Cogumelos',");
ui = ui.replace("label: '🛢 Petróleo',", "label: 'Petróleo',");

ui = ui.replace(/v=95/g, 'v=96');

fs.writeFileSync('js/ui.js', ui);
console.log('ui.js patched to remove emojis from labels');

let html = fs.readFileSync('index.html', 'utf8');
html = html.replace(/v=95/g, 'v=96');
fs.writeFileSync('index.html', html);
console.log('index.html bumped to v96');
