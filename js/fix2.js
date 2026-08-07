const fs = require('fs');

// 1. Update app.js to add showCompostModal
let appJs = fs.readFileSync('js/app.js', 'utf8');
if (!appJs.includes('showCompostModal')) {
    appJs = appJs.replace(
        /showExpansionModal\(\) \{/,
        "showCompostModal() {\n    UI.renderCompostModal();\n  },\n\n  showExpansionModal() {"
    );
    fs.writeFileSync('js/app.js', appJs);
}

// 2. Update ui.js to add renderCompostModal and fix Composteiras card
let uiJs = fs.readFileSync('js/ui.js', 'utf8');

// Replace the compost card HTML in renderHome
const targetCompostCard = `<div class="stat-card spring-in stagger-6" \${parsedFarm.isPartial ? 'style="opacity:0.6; display:flex; flex-direction:row; align-items:center; gap:8px; padding: 12px;"' : 'style="display:flex; flex-direction:row; align-items:center; gap:8px; padding: 12px;"'} title="Composteiras">
          <div style="width:40px;height:40px;background:var(--surface-3);border:1px solid var(--surface-border);border-radius:12px;display:flex;align-items:center;justify-content:center;box-shadow:inset 0 2px 4px rgba(255,255,255,0.05);">
            <span style="font-size:24px;line-height:1">♻️</span>
          </div>`;

const newCompostCard = `<div class="stat-card spring-in stagger-6" onclick="window.__app && window.__app.showCompostModal && window.__app.showCompostModal()" \${parsedFarm.isPartial ? 'style="opacity:0.6; display:flex; flex-direction:row; align-items:center; gap:8px; padding: 12px; cursor:pointer;"' : 'style="display:flex; flex-direction:row; align-items:center; gap:8px; padding: 12px; cursor:pointer;"'} title="Ver detalhes das composteiras">
          <div style="width:40px;height:40px;background:var(--surface-3);border:1px solid var(--surface-border);border-radius:12px;display:flex;align-items:center;justify-content:center;box-shadow:inset 0 2px 4px rgba(255,255,255,0.05);">
            <img src="https://sfl.world/img/source/CompostBin.png" style="width:24px;height:24px;object-fit:contain;image-rendering:pixelated;" onerror="this.src=ASSETS.APPLE">
          </div>`;

uiJs = uiJs.replace(targetCompostCard, newCompostCard);

// Add renderCompostModal
if (!uiJs.includes('renderCompostModal:')) {
    const renderCompostModalStr = `  renderCompostModal: () => {
    const el = $('#app-modal-content');
    if (!el) return;

    const farm = window.__app.State.parsedFarm;
    if (!farm || farm.isPartial) {
      el.innerHTML = \`<div class="empty-state"><span class="empty-state-icon">🔒</span><div class="empty-state-title">Fazenda Bloqueada</div><div class="empty-state-sub">Não é possível ver os detalhes das composteiras.</div></div>\`;
      $('#app-modal').style.display = 'flex';
      return;
    }

    const items = farm.composting || [];

    if (items.length === 0) {
      el.innerHTML = \`
        <div class="modal-header">
          <div class="modal-title"><img src="https://sfl.world/img/source/CompostBin.png" style="width:24px;height:24px;vertical-align:middle;margin-right:8px;image-rendering:pixelated;"> Composteiras</div>
          <button class="modal-close" onclick="document.getElementById('app-modal').style.display='none'">×</button>
        </div>
        <div class="empty-state">
          <span class="empty-state-icon">🤷‍♂️</span>
          <div class="empty-state-title">Nenhuma Composteira</div>
          <div class="empty-state-sub">Você não possui composteiras na sua fazenda.</div>
        </div>
      \`;
      $('#app-modal').style.display = 'flex';
      return;
    }

    const listHtml = items.map((c, i) => {
      const isReady = c.status === 'ready';
      const isProducing = c.msLeft > 0;
      const imgUrl = \`https://sfl.world/img/source/\${c.name.replace(/\\s+/g, '')}.png\`;
      const produceImg = isProducing || isReady ? \`<img src="https://sfl.world/img/source/\${c.type.replace(/\\s+/g, '')}.png" style="width:16px;height:16px;image-rendering:pixelated;margin-right:4px;">\` : '';

      return \`
        <div class="list-item stagger-\${(i % 10) + 1}">
          <div class="list-item-icon" style="background:var(--surface-3);">
            <img src="\${imgUrl}" style="width:24px;height:24px;image-rendering:pixelated;" onerror="this.style.display='none'">
          </div>
          <div class="list-item-info">
            <div class="list-item-title">\${c.name}</div>
            <div class="list-item-sub">\${isProducing || isReady ? c.amount + 'x ' + c.type : 'Vazia'}</div>
          </div>
          <div class="list-item-meta">
            \${isReady 
              ? \`<div class="badge emerald" style="display:flex;align-items:center;">\${produceImg} Pronta!</div>\`
              : (isProducing 
                  ? \`<div class="badge \${c.status}" style="display:flex;align-items:center;">\${produceImg} \${c.countdown}</div>\`
                  : \`<div class="badge">Inativa</div>\`)
            }
          </div>
        </div>
      \`;
    }).join('');

    el.innerHTML = \`
      <div class="modal-header">
        <div class="modal-title"><img src="https://sfl.world/img/source/CompostBin.png" style="width:24px;height:24px;vertical-align:middle;margin-right:8px;image-rendering:pixelated;"> Composteiras</div>
        <button class="modal-close" onclick="document.getElementById('app-modal').style.display='none'">×</button>
      </div>
      <div class="modal-list">
        \${listHtml}
      </div>
    \`;

    $('#app-modal').style.display = 'flex';
  },

  renderExpansionModal:`;

    uiJs = uiJs.replace(/  renderExpansionModal:/, renderCompostModalStr);
}

fs.writeFileSync('js/ui.js', uiJs);
console.log('Fixed compost details');
