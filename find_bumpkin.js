const fs = require('fs');
let code = fs.readFileSync('js/ui.js', 'utf8');
const urls = code.match(/https?:\/\/[^\s\'\"]+/g);
if (urls) {
  const bumpkinUrls = urls.filter(u => u.toLowerCase().includes('bumpkin'));
  console.log([...new Set(bumpkinUrls)]);
}
