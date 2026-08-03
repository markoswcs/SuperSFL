const fs = require('fs');

function main() {
    let code = fs.readFileSync('js/ui.js', 'utf8');

    // Restore the correct Bumpkin level and XP calculations
    // We already have `const level = parsedFarm.bumpkin?.level || parsedFarm.bumpkinLevel || 1;`
    // and `const xp = parsedFarm.bumpkin?.xp || 0;`
    // and `const xpProgress = parsedFarm.bumpkin?.xpProgress || 0;`
    // in the setup block of js/ui.js.
    
    // We just need to replace the HTML for the bottom bar.
    // In my last change (v67), I made the bottom bar this:
    /*
      <div class="level-text">Ilha Nível ${parsedFarm.level || 1}</div>
      <div style="font-size: 13px; font-weight: 700; color: rgba(255,255,255,0.6); font-family: 'SF Mono', Consolas, monospace;">
        <span style="color: #fff;">${formatNumber(parsedFarm.experience || 0, 1)}</span> XP
      </div>
    */
    /*
      <div class="xp-bar-container">
        <div class="xp-bar-fill" style="width: ${Math.min(100, Math.max(0, ((parsedFarm.experience || 0) / (parsedFarm.nextLevelExp || 1000000)) * 100))}%;"></div>
      </div>
    */

    // Let's replace it back to using `level`, `xp`, and `xpProgress`.
    
    code = code.replace(/<div class="level-text">Ilha Nível \$\{parsedFarm\.level \|\| 1\}<\/div>/g, '<div class="level-text">Bumpkin Nível ${level}</div>');
    code = code.replace(/\$\{formatNumber\(parsedFarm\.experience \|\| 0, 1\)\}/g, '${formatNumber(xp, 1)}');
    code = code.replace(/\$\{Math\.min\(100, Math\.max\(0, \(\(parsedFarm\.experience \|\| 0\) \/ \(parsedFarm\.nextLevelExp \|\| 1000000\)\) \* 100\)\)\}/g, '${Math.min(100, Math.max(0, xpProgress * 100))}');

    fs.writeFileSync('js/ui.js', code);
    console.log("Restored Bumpkin level and XP in the bottom bar.");
}

main();
