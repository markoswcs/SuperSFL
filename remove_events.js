const fs = require('fs');

function main() {
    let code = fs.readFileSync('js/ui.js', 'utf8');

    // Replace the actual rendering logic with empty string
    const regex = /setHtml\('#home-upcoming',\s*allEvents\.length > 0 \? `[\s\S]*?` : ''\);/;
    if (regex.test(code)) {
        code = code.replace(regex, "setHtml('#home-upcoming', '');");
        console.log('Replaced actual rendering.');
    } else {
        console.log('Actual rendering logic not found.');
    }

    // Replace the skeleton loader with empty string
    const skeletonRegex = /setHtml\('#home-upcoming',\s*skeletonList\(3\)\);/;
    if (skeletonRegex.test(code)) {
        code = code.replace(skeletonRegex, "setHtml('#home-upcoming', '');");
        console.log('Replaced skeleton loader.');
    } else {
        console.log('Skeleton loader not found.');
    }

    fs.writeFileSync('js/ui.js', code);
}

main();
