const fs = require('fs');

function main() {
    let code = fs.readFileSync('js/ui.js', 'utf8');

    const marksStart = '<!-- Marks -->';
    const charmStart = '<!-- Charm -->';
    
    let mStart = code.indexOf(marksStart);
    let cStart = code.indexOf(charmStart);
    
    if (mStart !== -1 && cStart !== -1) {
        code = code.substring(0, mStart) + code.substring(cStart);
        fs.writeFileSync('js/ui.js', code);
        console.log('Successfully removed the Marks section.');
    } else {
        console.log('Could not find the Marks section bounds.');
    }
}

main();
