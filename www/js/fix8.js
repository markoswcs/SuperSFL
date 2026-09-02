const fs = require('fs');
let app = fs.readFileSync('js/ui.js', 'utf8');

const oldModalFuncRegex = /const imgUrl = 'https:\/\/raw\.githubusercontent\.com\/sunflower-land\/sunflower-land\/main\/src\/assets\/composters\/compost\.png';/g;

const newImgLogic = `let composterImg = 'compost.png';
    if (c.name === 'Turbo Composter') composterImg = 'fruitful_blend.png';
    else if (c.name === 'Premium Composter') composterImg = 'rapid_root.png';
    else if (c.name === 'Compost Bin') composterImg = 'sprout_mix.png';
    
    const imgUrl = \`https://raw.githubusercontent.com/sunflower-land/sunflower-land/main/src/assets/composters/\${composterImg}\`;`;

app = app.replace(oldModalFuncRegex, newImgLogic);
fs.writeFileSync('js/ui.js', app);
console.log('Fixed composters icons');
