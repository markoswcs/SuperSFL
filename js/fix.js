const fs = require('fs');
let ui = fs.readFileSync('js/ui.js', 'utf8');
ui = ui.split('<div style="flex:1;">').join('<div style="flex:1; min-width:0;">');
fs.writeFileSync('js/ui.js', ui);
console.log('Fixed min-width:0');
