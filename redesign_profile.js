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
                width: 100px; height: 100px; min-width: 100px;
                border-radius: 20px;
                background: linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.02));
                border: 1px solid rgba(255, 255, 255, 0.15);
                box-shadow: 0 8px 32px rgba(0,0,0,0.4), inset 0 2px 10px rgba(255,255,255,0.1);
                display: flex; align-items: center; justify-content: center;
                overflow: hidden; position: relative;
              }
              .profile-avatar-img {
                width: 120%; height: 120%;
                object-fit: contain;
                object-position: center;
                filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3));
              }
              .profile-name {
                margin: 0; font-size: 26px; font-weight: 800; color: #fff;
                letter-spacing: -0.5px;
                text-shadow: 0 2px 10px rgba(0,0,0,0.5);
              }
              .profile-id-badge {
                font-size: 13px; font-family: 'SF Mono', Consolas, monospace;
                color: rgba(255,255,255,0.6);
                background: rgba(0,0,0,0.3);
                border: 1px solid rgba(255,255,255,0.05);
                padding: 4px 10px; border-radius: 8px;
                cursor: pointer; transition: all 0.2s ease;
              }
              .profile-id-badge:hover {
                color: #fff; background: rgba(255,255,255,0.1);
              }
              .profile-tag {
                font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;
                padding: 4px 10px; border-radius: 12px;
                display: inline-flex; align-items: center; gap: 4px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.2);
              }
              .tag-vip { background: linear-gradient(135deg, #f59e0b, #d97706); color: #000; border: 1px solid #fcd34d; }
              .tag-island { background: rgba(255,255,255,0.1); color: #ddd; border: 1px solid rgba(255,255,255,0.1); }
              .level-pill {
                background: linear-gradient(135deg, #3b82f6, #2563eb);
                color: white; font-weight: 800; font-size: 12px;
                padding: 4px 12px; border-radius: 12px;
                box-shadow: 0 4px 15px rgba(37, 99, 235, 0.4);
                border: 1px solid #60a5fa;
              }
              .xp-bar-container {
                height: 8px; background: rgba(0,0,0,0.4); border-radius: 4px;
                overflow: hidden; width: 100%; border: 1px solid rgba(255,255,255,0.05);
              }
              .xp-bar-fill {
                height: 100%; background: linear-gradient(90deg, #3b82f6, #60a5fa);
                border-radius: 4px; box-shadow: 0 0 10px rgba(96, 165, 250, 0.5);
              }
              .stats-block {
                display: flex; flex-direction: column; align-items: flex-end; gap: 4px;
              }
              .stats-text { font-size: 13px; color: rgba(255,255,255,0.5); font-weight: 500; }
              .stats-val { font-size: 15px; font-weight: 700; color: #fff; }
            </style>
            
            <div style="display: flex; gap: 24px; align-items: center; position: relative; z-index: 2; flex-wrap: wrap;">
              <!-- Avatar -->
              <div class="profile-avatar-container">
                <!-- Premium Fallback SVG (Farmer Silhouette) -->
                <svg viewBox="0 0 100 100" width="80%" height="80%" style="position:absolute; opacity:0.8; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));">
                  <circle cx="50" cy="35" r="18" fill="rgba(255,255,255,0.2)"/>
                  <path d="M20 90 Q50 50 80 90 Z" fill="rgba(255,255,255,0.2)"/>
                  <path d="M25 30 Q50 15 75 30 L85 35 L15 35 Z" fill="rgba(255,255,255,0.3)"/>
                </svg>
                <!-- API Image -->
                <img src="https://images.bumpkins.io/bumpkins/\${parsedFarm.bumpkin?.id || farmId}.png" style="display:none; position:absolute; top:10px; width:140%; height:140%; object-fit:contain; object-position:top;" onload="this.style.display='block'; this.previousElementSibling.style.display='none';" onerror="this.onerror=null; this.src='https://sunflower-land.com/play/bumpkins/\${parsedFarm.bumpkin?.id || farmId}.png'; this.onerror=function(){this.style.display='none'; this.previousElementSibling.style.display='block';};" />
              </div>
              
              <!-- Core Info -->
              <div style="flex:1; min-width: 250px; display:flex; flex-direction:column; gap: 14px;">
                <!-- Header: Name & Stats -->
                <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:16px;">
                  <div style="display:flex; flex-direction:column; gap: 8px;">
                    <div style="display:flex; align-items:center; gap: 12px; flex-wrap:wrap;">
                      <h2 class="profile-name">\${username === 'Fazenda' ? \`Fazenda #\${farmId}\` : username}</h2>
                    </div>
                    
                    <div style="display:flex; align-items:center; gap: 8px; flex-wrap:wrap;">
                      \${username !== 'Fazenda' ? \`<div class="profile-id-badge" title="Clique para copiar ID" onclick="navigator.clipboard.writeText('\${farmId}'); window.__app.showToast('ID Copiada!'); event.stopPropagation();">#\${farmId}</div>\` : ''}
                      
                      \${parsedFarm.isVip ? \`<div class="profile-tag tag-vip">
                        <i class="bi bi-star-fill" style="font-size:10px;"></i> 
                        VIP \${parsedFarm.vipLifetime ? '(Vitalício)' : (parsedFarm.vipDaysLeft > 0 ? \`(\${parsedFarm.vipDaysLeft}d)\` : '')}
                      </div>\` : ''}
                      
                      <div class="profile-tag tag-island">
                        🏝️ \${t('farm_island_' + (parsedFarm.islandType || 'basic')) || (parsedFarm.islandType || 'Basic')}
                      </div>
                    </div>
                  </div>
                  
                  <!-- Farm Stats (Helps) -->
                  <div style="display:flex; gap: 20px; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.05); padding: 12px 16px; border-radius: 16px;">
                    <div class="stats-block">
                      <div class="stats-text">Ajudados</div>
                      <div class="stats-val">\${formatNumber(parsedFarm.farmHelps || 0)}</div>
                    </div>
                    <div style="width:1px; background:rgba(255,255,255,0.1);"></div>
                    <div class="stats-block">
                      <div class="stats-text">Ajudas Hoje</div>
                      <div class="stats-val" style="color: \${(parsedFarm.farmHelpsToday || 0) < 6 ? '#4ade80' : '#f87171'};">\${parsedFarm.farmHelpsToday || 0} <span style="color:rgba(255,255,255,0.3); font-size:12px;">/ 6</span></div>
                    </div>
                  </div>
                </div>
                
                <!-- Level & XP Bar -->
                <div style="display:flex; flex-direction:column; gap: 8px; margin-top: 4px;">
                  <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div class="level-pill">Nível \${parsedFarm.level || 1}</div>
                    <div style="font-size: 14px; font-weight: 700; color: rgba(255,255,255,0.8); font-family: 'SF Mono', Consolas, monospace;">\${formatNumber(parsedFarm.experience || 0, 1)} XP</div>
                  </div>
                  <div class="xp-bar-container">
                    <div class="xp-bar-fill" style="width: \${Math.min(100, ((parsedFarm.experience || 0) / (parsedFarm.nextLevelExp || 1000000)) * 100)}%;"></div>
                  </div>
                </div>
                
              </div>
            </div>
          </div>
          `;

    code = code.substring(0, pStart) + newProfileHtml + code.substring(pEnd);
    fs.writeFileSync('js/ui.js', code);
    console.log("Successfully redesigned the Player Profile card.");
}

main();
