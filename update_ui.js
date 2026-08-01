const fs = require('fs');

function main() {
    try {
        let content = fs.readFileSync('js/ui.js', 'utf8');
            
        const newHtml = `const bumpkinHtml = bumpkin ? \`
    <div class="bumpkin-card spring-in mb-4" style="background: linear-gradient(145deg, var(--surface-1), var(--surface-2)); border: 1px solid var(--surface-border); border-radius: 20px; overflow: hidden; padding: 20px; box-shadow: 0 10px 25px rgba(0,0,0,0.4);">
      <style>
        @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
        .bpk-avatar-box { width: 90px; height: 90px; min-width: 90px; background: linear-gradient(135deg, #2a2a2a, #1a1a1a); border-radius: 16px; border: 2px solid #f59e0b; padding: 4px; position: relative; overflow: hidden; box-shadow: 0 4px 15px rgba(245,158,11,0.2); display: flex; align-items: center; justify-content: center; }
        .bpk-name { margin:0; font-size:22px; font-weight:800; color:var(--text-primary); text-shadow: 0 2px 4px rgba(0,0,0,0.5); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 200px; }
      </style>
      <div style="display: flex; gap: 20px; align-items: stretch;">
        <div class="bpk-avatar-box">
          <svg viewBox="0 0 100 100" width="100%" height="100%" style="opacity: 0.6; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));">
            <rect x="35" y="20" width="30" height="30" fill="#f59e0b" rx="4" />
            <rect x="25" y="55" width="50" height="40" fill="#d97706" rx="6" />
            <rect x="30" y="30" width="10" height="10" fill="#1e1e1e" />
            <rect x="60" y="30" width="10" height="10" fill="#1e1e1e" />
            <rect x="40" y="45" width="20" height="5" fill="#1e1e1e" />
          </svg>
          <img src="https://sunflower-land.com/play/bumpkins/\${parsedFarm.bumpkin?.id || farmId}.png" style="display:none; position:absolute; top:0; left:0; width:100%; height:100%; object-fit:cover; border-radius:12px;" onload="this.style.display='block'; this.previousElementSibling.style.display='none';" onerror="this.src='https://images.bumpkins.io/bumpkins/\${parsedFarm.bumpkin?.id || farmId}.png'; this.onerror=function(){this.style.display='none'; this.previousElementSibling.style.display='block';};" />
        </div>
        <div class="bumpkin-info" style="flex:1; display:flex; flex-direction:column; justify-content:center; min-width:0;">
          <div style="display:flex; flex-direction:column; gap:6px; margin-bottom:12px;">
            <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
              <h2 class="bpk-name">\${parsedFarm.username || t('nav_farm')}</h2>
              <span style="font-size:12px; color:var(--text-tertiary); font-family:monospace; background:rgba(255,255,255,0.05); padding:2px 8px; border-radius:6px; user-select:all; cursor:pointer; white-space:nowrap;" title="Clique para copiar" onclick="navigator.clipboard.writeText('https://sunflower-land.com/play/?farmId=\${farmId}')">#\${farmId}</span>
            </div>
            <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
              \${isVip ? \`<span style="background:linear-gradient(135deg,#f59e0b,#ea580c); color:#000; font-size:11px; font-weight:800; padding:2px 8px; border-radius:99px; letter-spacing:0.5px; box-shadow: 0 2px 8px rgba(245,158,11,0.4); white-space:nowrap;">⭐ VIP \${parsedFarm.vipLifetime ? '(Vitalício)' : (parsedFarm.vipDaysLeft > 0 ? \`(\${parsedFarm.vipDaysLeft} d)\` : '')}</span>\` : ''}
              <span style="background:rgba(255,255,255,0.1); color:var(--text-secondary); font-size:11px; font-weight:600; padding:2px 8px; border-radius:99px; border:1px solid rgba(255,255,255,0.1); backdrop-filter:blur(4px); white-space:nowrap;">🏝️ \${islandLabel}</span>
            </div>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:6px;">
            <span style="background:var(--surface-3); border:1px solid #f59e0b; color:#f59e0b; font-size:13px; font-weight:700; padding:2px 10px; border-radius:8px; box-shadow: 0 2px 10px rgba(245,158,11,0.2);">Nível \${bumpkin.level}</span>
            <span style="font-size:12px; font-weight:600; color:var(--text-secondary); text-align:right;">\${formatNumber(bumpkin.xp, 0)} XP</span>
          </div>
          <div class="xp-bar-wrap" style="height:8px; background:rgba(0,0,0,0.5); border-radius:99px; overflow:hidden; border:1px solid rgba(255,255,255,0.05); position:relative; width:100%; margin:0;">
            <div class="xp-bar-fill" style="height:100%; background:linear-gradient(90deg, #d97706, #fbbf24); border-radius:99px; width:\${(bumpkin.xpProgress * 100).toFixed(1)}%; box-shadow: 0 0 10px rgba(251,191,36,0.6); position:relative;">
              <div style="position:absolute; top:0; left:0; right:0; bottom:0; background:linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent); animation: shimmer 2s infinite;"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  \` : '';`;
        
        let start_idx = content.indexOf('const bumpkinHtml = bumpkin ? `');
        let end_idx = content.indexOf('` : \'\';', start_idx);
        
        if (start_idx !== -1 && end_idx !== -1) {
            end_idx += 7; // length of "` : '';"
            content = content.substring(0, start_idx) + newHtml + content.substring(end_idx);
            fs.writeFileSync('js/ui.js', content, 'utf8');
            console.log("Successfully updated ui.js");
        } else {
            console.log("Could not find the block to replace");
        }
            
    } catch (e) {
        console.error(e);
    }
}

main();
