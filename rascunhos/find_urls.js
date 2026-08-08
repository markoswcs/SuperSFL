const fs = require('fs');
let code = fs.readFileSync('js/ui.js', 'utf8');
const urls = code.match(/https?:\/\/[^\s\'\"]+\.(?:png|webp|gif)/g);
if (urls) console.log(Array.from(new Set(urls)));
