const fs = require('fs');

function main() {
    let code = fs.readFileSync('js/ui.js', 'utf8');

    // 1. Fix the Island tag to include the real photo and correct text format
    // Old tag: 
    // <div class="profile-tag tag-island">
    //   ${parsedFarm.islandType === 'desert' ? '🏜️ Deserto' : (parsedFarm.islandType === 'spring' ? '🌸 Primavera' : '🏝️ Básica')}
    // </div>
    const oldIslandTagRegex = /<div class="profile-tag tag-island">[\s\S]*?<\/div>/;
    
    // We will use the raw image of the island from the github assets:
    // https://raw.githubusercontent.com/sunflower-land/sunflower-land/main/src/assets/icons/islands/${parsedFarm.islandType || 'basic'}.webp
    const newIslandTag = `<div class="profile-tag tag-island" style="display:flex; align-items:center; gap:6px;">
                      <img src="https://raw.githubusercontent.com/sunflower-land/sunflower-land/main/src/assets/icons/islands/\${parsedFarm.islandType || 'basic'}.webp" style="height:14px; filter:drop-shadow(0 1px 2px rgba(0,0,0,0.5));" onerror="this.src='https://raw.githubusercontent.com/sunflower-land/sunflower-land/main/src/assets/icons/island.png'" />
                      \${parsedFarm.islandType === 'desert' ? 'Deserto' : (parsedFarm.islandType === 'spring' ? 'Primavera' : 'Básica')}
                    </div>`;

    if (oldIslandTagRegex.test(code)) {
        code = code.replace(oldIslandTagRegex, newIslandTag);
        console.log("Updated island tag.");
    }

    // 2. Fix the Level and XP at the bottom to use parsedFarm.level and parsedFarm.experience
    // Old bottom bar:
    /*
      <div style="display: flex; justify-content: space-between; align-items: flex-end;">
        <div class="level-text">Nível ${level}</div>
        <div style="font-size: 13px; font-weight: 700; color: rgba(255,255,255,0.6); font-family: 'SF Mono', Consolas, monospace;">
          <span style="color: #fff;">${formatNumber(xp, 1)}</span> XP
        </div>
      </div>
      <div class="xp-bar-container">
        <div class="xp-bar-fill" style="width: ${Math.min(100, Math.max(0, xpProgress * 100))}%;"></div>
      </div>
    */

    // We can replace the variables inside the template string directly, or replace the whole block.
    // Let's replace the variables:
    // Nível ${level} -> Nível ${parsedFarm.level || 1}
    // formatNumber(xp, 1) -> formatNumber(parsedFarm.experience || 0, 1)
    // xpProgress * 100 -> ((parsedFarm.experience || 0) / (parsedFarm.nextLevelExp || 1000000)) * 100

    code = code.replace(/<div class="level-text">Nível \$\{level\}<\/div>/g, '<div class="level-text">Ilha Nível ${parsedFarm.level || 1}</div>');
    code = code.replace(/\$\{formatNumber\(xp, 1\)\}/g, '${formatNumber(parsedFarm.experience || 0, 1)}');
    code = code.replace(/\$\{Math\.min\(100, Math\.max\(0, xpProgress \* 100\)\)\}/g, '${Math.min(100, Math.max(0, ((parsedFarm.experience || 0) / (parsedFarm.nextLevelExp || 1000000)) * 100))}');

    fs.writeFileSync('js/ui.js', code);
    console.log("Updated bottom progress bar.");
}

main();
