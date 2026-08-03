const fs = require('fs');

function main() {
    let code = fs.readFileSync('js/ui.js', 'utf8');

    const profileStart = '<!-- Player Profile -->';
    const profileEnd = '<!-- Charm -->';
    
    let pStart = code.indexOf(profileStart);
    let pEnd = code.indexOf(profileEnd);
    
    if (pStart === -1 || pEnd === -1) {
        console.log("Could not find bounds.");
        return;
    }

    const newProfileHtml = `<!-- Player Profile -->
          <div class="stat-card spring-in stagger-6-5" style="grid-column: 1 / -1; background: rgba(30, 30, 35, 0.6); backdrop-filter: blur(16px); border: 1px solid rgba(255,255,255,0.06); border-radius: 24px; padding: 24px; box-shadow: 0 10px 40px rgba(0,0,0,0.3); position: relative; overflow: hidden;">
            <!-- Background Glow -->
            <div style="position:absolute; top:-50%; left:-10%; width:150%; height:150%; background: radial-gradient(circle at 10% 50%, rgba(245, 158, 11, 0.08) 0%, transparent 50%); pointer-events: none;"></div>
            
            <style>
              .profile-avatar-container {
                width: 90px; height: 90px; min-width: 90px;
                border-radius: 24px;
                background: linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.01));
                border: 1px solid rgba(255, 255, 255, 0.1);
                box-shadow: 0 8px 32px rgba(0,0,0,0.3), inset 0 2px 10px rgba(255,255,255,0.05);
                display: flex; align-items: center; justify-content: center;
                overflow: hidden; position: relative;
              }
              .profile-avatar-img {
                width: 140%; height: 140%;
                object-fit: contain;
                object-position: top;
                filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3));
              }
              .profile-name {
                margin: 0; font-size: 24px; font-weight: 800; color: #fff;
                letter-spacing: -0.5px;
                text-shadow: 0 2px 10px rgba(0,0,0,0.5);
              }
              .profile-id-badge {
                font-size: 13px; font-family: 'SF Mono', Consolas, monospace;
                color: rgba(255,255,255,0.6);
                background: rgba(0,0,0,0.2);
                border: 1px solid rgba(255,255,255,0.05);
                padding: 4px 10px; border-radius: 8px;
                cursor: pointer; transition: all 0.2s ease;
              }
              .profile-id-badge:hover {
                color: #fff; background: rgba(255,255,255,0.1);
              }
              .profile-tag {
                font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;
                padding: 4px 10px; border-radius: 8px;
                display: inline-flex; align-items: center; gap: 4px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.2);
              }
              .tag-vip { background: linear-gradient(135deg, #f59e0b, #d97706); color: #000; border: 1px solid #fcd34d; }
              .tag-island { background: rgba(255,255,255,0.1); color: #ddd; border: 1px solid rgba(255,255,255,0.1); }
              .level-text {
                font-weight: 800; font-size: 14px; color: #fff;
              }
              .xp-bar-container {
                height: 8px; background: rgba(0,0,0,0.4); border-radius: 4px;
                overflow: hidden; width: 100%; border: 1px solid rgba(255,255,255,0.05);
                margin-top: 8px;
              }
              .xp-bar-fill {
                height: 100%; background: linear-gradient(90deg, #3b82f6, #60a5fa);
                border-radius: 4px; box-shadow: 0 0 10px rgba(96, 165, 250, 0.5);
              }
              .stats-block {
                display: flex; flex-direction: column; align-items: center; justify-content: center;
              }
              .stats-text { font-size: 11px; color: rgba(255,255,255,0.5); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
              .stats-val { font-size: 18px; font-weight: 800; color: #fff; line-height: 1.2; }
            </style>
            
            <div style="position: relative; z-index: 2; display: flex; flex-direction: column; gap: 20px;">
              
              <!-- Top Row: Avatar & Info & Stats -->
              <div style="display: flex; gap: 20px; align-items: center; flex-wrap: wrap;">
                
                <!-- Avatar -->
                <div class="profile-avatar-container">
                  <!-- Fallback SVG -->
                  <svg viewBox="0 0 100 100" width="80%" height="80%" style="position:absolute; opacity:0.6; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));">
                    <circle cx="50" cy="35" r="16" fill="rgba(255,255,255,0.2)"/>
                    <path d="M25 90 Q50 50 75 90 Z" fill="rgba(255,255,255,0.2)"/>
                    <path d="M25 30 Q50 15 75 30 L85 35 L15 35 Z" fill="rgba(255,255,255,0.3)"/>
                  </svg>
                  <img src="https://images.bumpkins.io/bumpkins/\${parsedFarm.bumpkin?.id || farmId}.png" style="display:none; position:absolute; top:15px; width:140%; height:140%; object-fit:contain; object-position:top;" onload="this.style.display='block'; this.previousElementSibling.style.display='none';" onerror="this.onerror=null; this.src='https://sunflower-land.com/play/bumpkins/\${parsedFarm.bumpkin?.id || farmId}.png'; this.onerror=function(){this.style.display='none'; this.previousElementSibling.style.display='block';};" />
                </div>
                
                <!-- Name and Badges -->
                <div style="flex: 1; min-width: 150px; display: flex; flex-direction: column; gap: 8px;">
                  <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
                    <h2 class="profile-name">\${username === 'Fazenda' ? \`Fazenda #\${farmId}\` : username}</h2>
                    \${username !== 'Fazenda' ? \`<div class="profile-id-badge" title="Clique para copiar ID" onclick="navigator.clipboard.writeText('\${farmId}'); window.__app.showToast('ID Copiada!'); event.stopPropagation();">#\${farmId}</div>\` : ''}
                  </div>
                  
                  <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                    \${parsedFarm.isVip ? \`<div class="profile-tag tag-vip">
                      <i class="bi bi-star-fill" style="font-size:10px;"></i> 
                      VIP \${parsedFarm.vipLifetime ? '(Vitalício)' : (parsedFarm.vipDaysLeft > 0 ? \`(\${parsedFarm.vipDaysLeft}d)\` : '')}
                    </div>\` : ''}
                    <div class="profile-tag tag-island">
                      \${parsedFarm.islandType === 'desert' ? '🏜️ Deserto' : (parsedFarm.islandType === 'spring' ? '🌸 Primavera' : '🏝️ Básica')}
                    </div>
                  </div>
                </div>

                <!-- Helps Stats -->
                <div style="display: flex; gap: 20px; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.05); padding: 16px 24px; border-radius: 20px; min-width: max-content;">
                  <div class="stats-block">
                    <div class="stats-text">Ajudados</div>
                    <div class="stats-val">\${formatNumber(totalHelps, 0)}</div>
                  </div>
                  <div style="width: 1px; background: rgba(255,255,255,0.1); margin: 0 4px;"></div>
                  <div class="stats-block">
                    <div class="stats-text">Ajudas Hoje</div>
                    <div class="stats-val" style="color: \${helpsLeft > 0 ? '#4ade80' : '#f87171'};">\${helpsLeft} <span style="color:rgba(255,255,255,0.3); font-size:14px;">/ \${maxHelps}</span></div>
                  </div>
                </div>
                
              </div>
              
              <!-- Bottom Row: Level & Progress -->
              <div style="background: rgba(0,0,0,0.15); padding: 16px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.03);">
                <div style="display: flex; justify-content: space-between; align-items: flex-end;">
                  <div class="level-text">Nível \${level}</div>
                  <div style="font-size: 13px; font-weight: 700; color: rgba(255,255,255,0.6); font-family: 'SF Mono', Consolas, monospace;">
                    <span style="color: #fff;">\${formatNumber(xp, 1)}</span> XP
                  </div>
                </div>
                <div class="xp-bar-container">
                  <div class="xp-bar-fill" style="width: \${Math.min(100, Math.max(0, xpProgress * 100))}%;"></div>
                </div>
              </div>
              
            </div>
          </div>
          `;

    code = code.substring(0, pStart) + newProfileHtml + code.substring(pEnd);
    fs.writeFileSync('js/ui.js', code);
    console.log("Successfully redesigned the Player Profile card again.");
}

main();
