const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');
const start = html.indexOf('<style>');
const end = html.indexOf('</style>', start) + 8;
if (start > -1 && end > 8) {
  html = html.substring(0, start) + '<link rel="stylesheet" href="css/styles.css">' + html.substring(end);
  fs.writeFileSync('index.html', html);
  console.log('Reverted inline CSS');
} else {
  console.log('Could not find inline CSS');
}
