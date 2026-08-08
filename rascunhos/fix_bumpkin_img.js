const fs = require('fs');

function main() {
    let code = fs.readFileSync('js/ui.js', 'utf8');

    // We will find the onerror attribute and replace it.
    // Original:
    // onerror="this.onerror=null; this.src='https://sunflower-land.com/play/bumpkins/${parsedFarm.bumpkin?.id || farmId}.png'; this.onerror=function(){this.style.display='none'; this.previousElementSibling.style.display='block';};"
    
    // We want the last fallback to be 'https://sfl.world/img/source/bumpkin.png' instead of hiding it.
    // So if the official image fails, it sets src to sfl.world image and displays it!
    // We also should remove the fallback to farmId because it causes 403s.
    
    // Let's replace the whole <img> tag
    const oldImgRegex = /<img src="https:\/\/images\.bumpkins\.io\/bumpkins\/\$\{parsedFarm\.bumpkin\?\.id \|\| farmId\}\.png"[^>]+>/;
    
    const newImgHtml = `<img src="\${parsedFarm.bumpkin?.id ? \`https://images.bumpkins.io/bumpkins/\${parsedFarm.bumpkin.id}.png\` : 'https://sfl.world/img/source/bumpkin.png'}" style="display:none; position:absolute; top:15px; width:140%; height:140%; object-fit:contain; object-position:top;" onload="this.style.display='block'; this.previousElementSibling.style.display='none';" onerror="this.onerror=null; this.src='\${parsedFarm.bumpkin?.id ? \`https://sunflower-land.com/play/bumpkins/\${parsedFarm.bumpkin.id}.png\` : \`https://sfl.world/img/source/bumpkin.png\`}'; this.onerror=function(){this.src='https://sfl.world/img/source/bumpkin.png'; this.style.display='block'; this.previousElementSibling.style.display='none';};" />`;

    if (oldImgRegex.test(code)) {
        code = code.replace(oldImgRegex, newImgHtml);
        fs.writeFileSync('js/ui.js', code);
        console.log("Image tag replaced successfully.");
    } else {
        console.log("Could not find image tag.");
    }
}

main();
