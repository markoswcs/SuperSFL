const fs = require('fs');

function main() {
    let code = fs.readFileSync('js/ui.js', 'utf8');

    // We will replace the entire avatar container block
    // It looks something like:
    /*
      <div style="width:100px; height:100px; border-radius:18px; border:1px solid rgba(255,255,255,0.05); flex-shrink:0; position:relative; overflow:hidden; background:var(--surface-3); display:flex; align-items:center; justify-content:center;">
        <svg class="bumpkin-avatar-placeholder" width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="color:var(--text-tertiary); opacity:0.5;">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
        <img src="https://images.bumpkins.io/bumpkins/${parsedFarm.bumpkin?.id || farmId}.png" style="display:none; position:absolute; top:15px; width:140%; height:140%; object-fit:contain; object-position:top;" onload="this.style.display='block'; this.previousElementSibling.style.display='none';" onerror="this.onerror=null; this.src='https://sunflower-land.com/play/bumpkins/${parsedFarm.bumpkin?.id || farmId}.png'; this.onerror=function(){this.style.display='none'; this.previousElementSibling.style.display='block';};" />
      </div>
    */

    const avatarRegex = /<div style="width:100px; height:100px;[^>]*>[\s\S]*?<img src="https:\/\/images\.bumpkins\.io\/bumpkins\/\$\{parsedFarm\.bumpkin\?\.id \|\| farmId\}\.png"[\s\S]*?<\/div>/;

    const newAvatarHtml = `<div style="width:100px; height:100px; border-radius:18px; border:1px solid rgba(255,255,255,0.05); flex-shrink:0; position:relative; overflow:hidden; background:var(--surface-3); display:flex; align-items:center; justify-content:center; box-shadow: inset 0 2px 10px rgba(0,0,0,0.2);">
                  <div class="bumpkin-loader spinner" style="width:20px; height:20px; border:2px solid rgba(255,255,255,0.1); border-top-color:rgba(255,255,255,0.5); border-radius:50%; animation:spin 1s linear infinite;"></div>
                  <img src="\${parsedFarm.bumpkin?.id ? \`https://images.bumpkins.io/bumpkins/\${parsedFarm.bumpkin.id}.png\` : 'https://sfl.world/img/source/bumpkin.png'}" 
                       style="display:none; position:absolute; top:15px; width:140%; height:140%; object-fit:contain; object-position:top; filter:drop-shadow(0 4px 6px rgba(0,0,0,0.5));" 
                       onload="this.style.display='block'; this.previousElementSibling.style.display='none';" 
                       onerror="this.onerror=null; this.src='\${parsedFarm.bumpkin?.id ? \`https://sunflower-land.com/play/bumpkins/\${parsedFarm.bumpkin.id}.png\` : \`https://sfl.world/img/source/bumpkin.png\`}'; this.onerror=function(){this.src='https://sfl.world/img/source/bumpkin.png'; this.style.display='block'; this.previousElementSibling.style.display='none';};" />
                </div>`;

    if (avatarRegex.test(code)) {
        code = code.replace(avatarRegex, newAvatarHtml);
        console.log("Replaced avatar HTML logic successfully.");
    } else {
        console.log("Could not find the avatar HTML block.");
    }

    fs.writeFileSync('js/ui.js', code);
}

main();
