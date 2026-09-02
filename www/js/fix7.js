const fs = require('fs');
let app = fs.readFileSync('js/app.js', 'utf8');

// Replace the old updateSyncBadge function
const oldFuncPattern = /function updateSyncBadge\(\) \{[\s\S]*?\}\s*function bindNavigation/g;
const newFunc = `function updateSyncBadge() {
  const timeEl = document.getElementById('last-update') || document.getElementById('sync-time');
  if (!timeEl) return;
  
  if (State.isRefreshing) {
    timeEl.textContent = 'Atualizando...';
    timeEl.style.color = 'var(--sky)';
    return;
  }

  if (State.lastSyncTime === 0) {
    timeEl.textContent = '--';
    timeEl.style.color = 'var(--text-tertiary)';
    return;
  }
  
  const elapsedMs = Date.now() - State.lastSyncTime;
  const elapsedMins = Math.floor(elapsedMs / 60_000);
  
  if (elapsedMins === 0) {
    timeEl.textContent = 'Atualizado';
    timeEl.style.color = 'var(--emerald)';
  } else if (elapsedMins < 5) {
    timeEl.textContent = \`Há \${elapsedMins} min\`;
    timeEl.style.color = 'var(--text-secondary)';
  } else {
    timeEl.textContent = \`Desatualizado (\${elapsedMins}m)\`;
    timeEl.style.color = 'var(--amber)';
  }
}

function bindNavigation`;

app = app.replace(oldFuncPattern, newFunc);
fs.writeFileSync('js/app.js', app);
console.log('Fixed updateSyncBadge');
