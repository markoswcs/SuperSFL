const fs = require('fs');
let ui = fs.readFileSync('js/ui.js', 'utf8');

// 1. Fix the card
const compostCardPattern = /<div class="stat-card spring-in stagger-6"[^>]*title="Composteiras">\s*<div[^>]*>\s*<span[^>]*>♻️<\/span>\s*<\/div>/s;
const replacement = `<div class="stat-card spring-in stagger-6" onclick="window.__app && window.__app.showCompostModal && window.__app.showCompostModal()" \${parsedFarm.isPartial ? 'style="opacity:0.6; display:flex; flex-direction:row; align-items:center; gap:8px; padding: 12px; cursor:pointer;"' : 'style="display:flex; flex-direction:row; align-items:center; gap:8px; padding: 12px; cursor:pointer;"'} title="Composteiras">
          <div style="width:40px;height:40px;background:var(--surface-3);border:1px solid var(--surface-border);border-radius:12px;display:flex;align-items:center;justify-content:center;box-shadow:inset 0 2px 4px rgba(255,255,255,0.05);">
            <img src="https://sfl.world/img/source/CompostBin.png" style="width:24px;height:24px;object-fit:contain;image-rendering:pixelated;" onerror="this.src=ASSETS.APPLE">
          </div>`;

ui = ui.replace(compostCardPattern, replacement);

// 2. Add showCompostModal function
if (!ui.includes('showCompostModal = ()')) {
  const modalFunc = `
window.__app.showCompostModal = () => {
  const farm = window.__app.State.parsedFarm;
  if (!farm || farm.isPartial) {
    showModal('♻️ Composteiras', '<div style="padding:32px; text-align:center; color:var(--text-secondary); font-size:15px;">🔒 Fazenda Bloqueada. Não é possível ver detalhes.</div>');
    return;
  }

  const items = farm.composting || [];
  if (items.length === 0) {
    showModal('♻️ Composteiras', '<div style="padding:32px; text-align:center; color:var(--text-secondary); font-size:15px;">Você não possui composteiras na sua fazenda.</div>');
    return;
  }

  const listHtml = items.map((c, i) => {
    const isReady = c.status === 'ready';
    const isProducing = c.msLeft > 0;
    const imgUrl = \`https://sfl.world/img/source/\${c.name.replace(/\\s+/g, '')}.png\`;
    const produceImg = isProducing || isReady ? \`<img src="https://sfl.world/img/source/\${c.type.replace(/\\s+/g, '')}.png" style="width:16px;height:16px;image-rendering:pixelated;vertical-align:middle;margin-right:4px;">\` : '';

    return \`
      <div style="background:var(--surface-2);border:1px solid var(--surface-border);border-radius:16px;padding:12px;margin-bottom:12px;display:flex;align-items:center;gap:12px;">
        <div style="width:40px;height:40px;background:var(--surface-3);border:1px solid rgba(255,255,255,0.05);border-radius:12px;display:flex;align-items:center;justify-content:center;box-shadow:inset 0 2px 4px rgba(0,0,0,0.3);flex-shrink:0;">
          <img src="\${imgUrl}" style="width:24px;height:24px;image-rendering:pixelated;" onerror="this.style.display='none'">
        </div>
        <div style="flex:1;min-width:0;">
          <div style="font-size:15px;font-weight:800;color:var(--text-primary);">\${c.name}</div>
          <div style="font-size:12px;font-weight:600;color:var(--text-tertiary);margin-top:2px;">\${isProducing || isReady ? c.amount + 'x ' + c.type : 'Vazia'}</div>
        </div>
        <div style="text-align:right;">
          \${isReady 
            ? \`<div style="background:rgba(16,185,129,0.15);color:var(--emerald);border:1px solid rgba(16,185,129,0.3);padding:6px 10px;border-radius:10px;font-size:11px;font-weight:800;">\${produceImg} Pronta!</div>\`
            : (isProducing 
                ? \`<div style="background:rgba(251,191,36,0.15);color:var(--amber);border:1px solid rgba(251,191,36,0.3);padding:6px 10px;border-radius:10px;font-size:11px;font-weight:800;" class="\${c.status}">\${produceImg} \${c.countdown}</div>\`
                : \`<div style="background:rgba(255,255,255,0.05);color:var(--text-tertiary);border:1px solid rgba(255,255,255,0.1);padding:6px 10px;border-radius:10px;font-size:11px;font-weight:700;">Inativa</div>\`)
          }
        </div>
      </div>
    \`;
  }).join('');

  const modalHtml = \`
    <div style="max-height:60vh;overflow-y:auto;padding-right:4px;">
      \${listHtml}
    </div>
  \`;
  
  showModal('<img src="https://sfl.world/img/source/CompostBin.png" style="width:24px;height:24px;vertical-align:middle;margin-right:8px;image-rendering:pixelated;"> Detalhes das Composteiras', modalHtml);
};

`;
  ui = ui + modalFunc;
}

fs.writeFileSync('js/ui.js', ui);
console.log('Fixed ui.js');
