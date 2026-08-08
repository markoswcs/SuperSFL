const fs = require('fs');

function main() {
    let code = fs.readFileSync('js/ui.js', 'utf8');

    const regex = /setHtml\('#farm-content',\s*partialNotice\s*\+\s*bumpkinHtml\s*\+\s*skillsHtml\s*\+\s*`<div id="farm-sections-container">\${sectionsHtml}<\/div>`\s*\+\s*invHtml\s*\+\s*choresHtml\);/;
    
    if (regex.test(code)) {
        code = code.replace(regex, "setHtml('#farm-content', partialNotice + bumpkinHtml + skillsHtml + choresHtml);");
        fs.writeFileSync('js/ui.js', code);
        console.log('Successfully removed sectionsHtml and invHtml using regex.');
    } else {
        console.log('Could not find the exact setHtml line. Printing the area around setHtml:');
        let idx = code.lastIndexOf("setHtml('#farm-content'");
        if (idx !== -1) {
            console.log(code.substring(idx, idx + 200));
        }
    }
}

main();
