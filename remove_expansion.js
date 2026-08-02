const fs = require('fs');

function main() {
    let content = fs.readFileSync('js/ui.js', 'utf8');
    
    // Find Expansion card in sectionsHtml
    const expStartStr = '<!-- Expansion -->';
    const expEndStr = '<!-- Player Profile -->';
    
    let eStart = content.indexOf(expStartStr);
    let eEnd = content.indexOf(expEndStr, eStart);
    
    if (eStart !== -1 && eEnd !== -1) {
        // Remove the block
        content = content.substring(0, eStart) + content.substring(eEnd);
        fs.writeFileSync('js/ui.js', content, 'utf8');
        console.log("Successfully removed the Expansion section.");
    } else {
        console.log("Could not find the Expansion section.");
    }
}

main();
