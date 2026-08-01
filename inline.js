const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');
const css = fs.readFileSync('css/styles.css', 'utf8');
html = html.replace('<link rel="stylesheet" href="css/styles.css">', '<style>' + css + '</style>');
fs.writeFileSync('index.html', html);
