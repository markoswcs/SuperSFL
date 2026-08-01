const fs = require('fs');
let code = fs.readFileSync('d:/CODES/SunflowerSuperAPP/SuperSunflowerLand/js/ui.js', 'utf8');

const replacements = {
  // Home
  '<div class="section-title"></div>': '<div class="section-title">${t(\'home_farm_summary\')}</div>',
  '<div class="section-badge"></div>': '<div class="section-badge">${t(\'home_up_to_date\')}</div>',
  '<div class="stat-label">Y\' </div>': '<div class="stat-label">Y\' ${t(\'home_balance\')}</div>',
  '<div class="stat-label">YT </div>': '<div class="stat-label">YT ${t(\'home_coins\')}</div>',
  '<div class="stat-label">YO </div>': '<div class="stat-label">YO ${t(\'home_crops\')}</div>',
  '<div class="stat-label">Y </div>': '<div class="stat-label">Y ${t(\'home_animals\')}</div>',
  '<div class="empty-state-title"></div>': '<div class="empty-state-title">${t(\'home_no_farm\')}</div>',
  '<div class="empty-state-sub"></div>': '<div class="empty-state-sub">${t(\'home_no_farm_sub\')}</div>',
  
  // Farm
  '<div class="empty-state-title" style="color:var(--amber-glow)"></div>': '<div class="empty-state-title" style="color:var(--amber-glow)">${t(\'farm_partial_title\')}</div>',
  '<div class="empty-state-sub" style="margin-bottom:0"></div>': '<div class="empty-state-sub" style="margin-bottom:0">${t(\'farm_partial_desc\')}</div>',

  // Settings
  '<div style="font-family:var(--font-mono);font-size:11px;color:var(--text-tertiary);padding:12px 0"></div>': '<div style="font-family:var(--font-mono);font-size:11px;color:var(--text-tertiary);padding:12px 0">${t(\'settings_no_farms\')}</div>',
  '<button class="btn-primary" style="font-size:11px;padding:5px 10px;background:var(--coral-subtle);color:var(--coral);border:1px solid rgba(255,77,46,0.25)" onclick="window.__app.removeFarm(\'${f.id}\')"></button>': '<button class="btn-primary" style="font-size:11px;padding:5px 10px;background:var(--coral-subtle);color:var(--coral);border:1px solid rgba(255,77,46,0.25)" onclick="window.__app.removeFarm(\'${f.id}\')">${t(\'settings_remove\')}</button>',
  
  '<option value="basic" ${settings.island === \'basic\' ? \'selected\' : \'\'}></option>': '<option value="basic" ${settings.island === \'basic\' ? \'selected\' : \'\'}>${t(\'settings_island_basic\')}</option>',
  '<option value="petal" ${settings.island === \'petal\' ? \'selected\' : \'\'}></option>': '<option value="petal" ${settings.island === \'petal\' ? \'selected\' : \'\'}>${t(\'settings_island_petal\')}</option>',
  '<option value="desert" ${settings.island === \'desert\' ? \'selected\' : \'\'}></option>': '<option value="desert" ${settings.island === \'desert\' ? \'selected\' : \'\'}>${t(\'settings_island_desert\')}</option>',
  '<option value="volcano" ${settings.island === \'volcano\' ? \'selected\' : \'\'}></option>': '<option value="volcano" ${settings.island === \'volcano\' ? \'selected\' : \'\'}>${t(\'settings_island_volcano\')}</option>',
  
  // Notif
  '<div class="notif-item-label"></div>': '<div class="notif-item-label">${t(\'notif_title\')}</div>',
  '<div class="notif-item-sub"></div>': '<div class="notif-item-sub">${t(\'notif_desc\')}</div>',
  '<div class="notif-permission-title"></div>': '<div class="notif-permission-title">${t(\'notif_status_default\')}</div>',
};

code = code.replace('<div class="settings-group-title"></div>', '<div class="settings-group-title">${t(\'settings_saved_farms\')}</div>');
code = code.replace('<div class="settings-group-title"></div>', '<div class="settings-group-title">${t(\'settings_market\')}</div>');
code = code.replace('<div class="settings-group-title"></div>', '<div class="settings-group-title">${t(\'settings_price_alerts\')}</div>');
code = code.replace('<div class="settings-group-title"></div>', '<div class="settings-group-title">${t(\'settings_refresh\')}</div>');
code = code.replace('<div class="settings-group-title"></div>', '<div class="settings-group-title">${t(\'settings_api_key\')}</div>');
code = code.replace('<div class="settings-group-title"></div>', '<div class="settings-group-title">${t(\'notif_types\')}</div>');

for (const [key, value] of Object.entries(replacements)) {
  code = code.replaceAll(key, value);
}

code = code.replace('<div class="settings-row-label"></div>', '<div class="settings-row-label">${t(\'settings_island\')}</div>');
code = code.replace('<div class="settings-row-sub"></div>', '<div class="settings-row-sub">${t(\'settings_island_sub\')}</div>');

code = code.replace('<div class="settings-row-label"></div>', '<div class="settings-row-label">${t(\'settings_vip\')}</div>');
code = code.replace('<div class="settings-row-sub"></div>', '<div class="settings-row-sub">${t(\'settings_vip_sub\')}</div>');

code = code.replace('<div class="settings-row-label"></div>', '<div class="settings-row-label">${t(\'settings_shrine\')}</div>');
code = code.replace('<div class="settings-row-sub"></div>', '<div class="settings-row-sub">${t(\'settings_shrine_sub\')}</div>');

code = code.replace('<div class="settings-row-label"></div>', '<div class="settings-row-label">${t(\'settings_alert_high\')}</div>');
code = code.replace('<div class="settings-row-sub"></div>', '<div class="settings-row-sub">${t(\'settings_alert_high_sub\')}</div>');

code = code.replace('<div class="settings-row-label"></div>', '<div class="settings-row-label">${t(\'settings_alert_low\')}</div>');
code = code.replace('<div class="settings-row-sub"></div>', '<div class="settings-row-sub">${t(\'settings_alert_low_sub\')}</div>');

code = code.replace('<div class="settings-row-label"></div>', '<div class="settings-row-label">${t(\'settings_refresh_interval\')}</div>');
code = code.replace('<div class="settings-row-sub"></div>', '<div class="settings-row-sub">${t(\'settings_refresh_sub\')}</div>');

code = code.replace('<button class="btn-primary" onclick="window.__app.saveSettings()"></button>', '<button class="btn-primary" onclick="window.__app.saveSettings()">${t(\'settings_save\')}</button>');

fs.writeFileSync('d:/CODES/SunflowerSuperAPP/SuperSunflowerLand/js/ui.js', code);
console.log("Fixed!");
