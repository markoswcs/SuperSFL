const fs = require('fs');
let ui = fs.readFileSync('js/ui.js', 'utf8');

// 1. Fix Composteiras Card Icon on Home tab
// Replace CompostBin.png with compost.png
ui = ui.replace(
  /https:\/\/sfl\.world\/img\/source\/CompostBin\.png/g,
  'https://raw.githubusercontent.com/sunflower-land/sunflower-land/main/src/assets/composters/compost.png'
);

// 2. Fix Deliveries NPC Icons
// In deliveryCard, instead of `<img src="${npcImg}"... onerror...>`
// We will replace the entire NPC image block with a colorful circle containing the first letter of the NPC name
// The block is:
// <div style="width:48px;height:48px;background:var(--surface-3);border:2px solid rgba(255,255,255,0.05);border-radius:14px;display:flex;align-items:center;justify-content:center;overflow:hidden;flex-shrink:0;box-shadow:inset 0 2px 4px rgba(0,0,0,0.3);">
//   <img src="${npcImg}" style="width:38px;height:38px;object-fit:contain;image-rendering:pixelated;" onerror="this.textContent='📦';this.style.display='none';this.nextElementSibling.style.display='block'">
//   <span style="font-size:24px;display:none;">📦</span>
// </div>

const npcBlockPattern = /<div style="width:48px;height:48px;background:var\(--surface-3\)[^>]*>\s*<img src="\$\{npcImg\}"[^>]*>\s*<span[^>]*>📦<\/span>\s*<\/div>/g;

const newNpcBlock = `<div style="width:48px;height:48px;background:linear-gradient(135deg, var(--surface-3), var(--surface-2));border:2px solid rgba(255,255,255,0.05);border-radius:14px;display:flex;align-items:center;justify-content:center;overflow:hidden;flex-shrink:0;box-shadow:inset 0 2px 4px rgba(0,0,0,0.3); font-size:24px; font-weight:900; color:var(--text-secondary); text-transform:uppercase;">\${d.npc.charAt(0)}</div>`;

ui = ui.replace(npcBlockPattern, newNpcBlock);

// 3. Fix Composteiras Modal Title (remove HTML tag)
// Inside showCompostModal: showModal('<img src="https://raw.github.../compost.png"...> Detalhes das Composteiras', modalHtml);
// Wait, the previous replace changed CompostBin.png to compost.png everywhere. Let's just replace the whole showModal call.
ui = ui.replace(
  /showModal\('<img src="https:\/\/raw\.githubusercontent\.com[^>]+>\s*Detalhes das Composteiras',\s*modalHtml\);/g,
  "showModal('♻️ Detalhes das Composteiras', modalHtml);"
);

// 4. Fix Composteiras Modal Item Icons
// Currently it uses `imgUrl = \`https://sfl.world/img/source/\${c.name.replace(/\s+/g, '')}.png\`;`
// Change it to use `compost.png` for all composters or emojis.
const compostImgUrlPattern = /const imgUrl = `https:\/\/sfl\.world\/img\/source\/\$\{c\.name\.replace\(\/\\\\s\+\/g, ''\)\}\.png`;/;
const newCompostImgUrl = `const imgUrl = 'https://raw.githubusercontent.com/sunflower-land/sunflower-land/main/src/assets/composters/compost.png';`;

ui = ui.replace(compostImgUrlPattern, newCompostImgUrl);

fs.writeFileSync('js/ui.js', ui);
console.log('Fixed ui.js step 4');
