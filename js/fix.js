const fs = require('fs');
let ui = fs.readFileSync('js/ui.js', 'utf8');

// 1. Remove the chevron arrows entirely to save horizontal space (they are visual fluff and take up 24px)
ui = ui.replace(/<div style=\"display:flex; align-items:center; color:var\(--text-tertiary\); opacity:0.6;\">\s*<svg xmlns=\"http:\/\/www.w3.org\/2000\/svg\" width=\"20\" height=\"20\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><polyline points=\"9 18 15 12 9 6\"><\/polyline><\/svg>\s*<\/div>/g, '');

// 2. Reduce padding from 16px to 12px and gap from 12px to 8px in all stat-cards
ui = ui.replace(/gap:12px; padding: 16px/g, 'gap:8px; padding: 12px');
ui = ui.replace(/gap: 12px; padding: 16px/g, 'gap: 8px; padding: 12px');

// 3. Make Expansion card full width (grid-column: 1 / -1) by finding its class
// We only want the specific expansion one, which has title="Ver detalhes da expansão" or similar
// Let's just do a string replacement on the exact line.
let targetExpansion = `<div class="stat-card spring-in stagger-6" onclick="window.__app && window.__app.showExpansionModal && window.__app.showExpansionModal()" \${parsedFarm.isPartial ? 'style="opacity:0.6; display:flex; flex-direction:row; align-items:center; gap:8px; padding: 12px; cursor:pointer;" title="Ver detalhes da expansão"' : 'style="display:flex; flex-direction:row; align-items:center; gap:8px; padding: 12px; cursor:pointer;" title="Ver detalhes da expansão"'}>`;
let replacementExpansion = `<div class="stat-card spring-in stagger-6" onclick="window.__app && window.__app.showExpansionModal && window.__app.showExpansionModal()" \${parsedFarm.isPartial ? 'style="grid-column: 1 / -1; opacity:0.6; display:flex; flex-direction:row; align-items:center; gap:8px; padding: 12px; cursor:pointer;" title="Ver detalhes da expansão"' : 'style="grid-column: 1 / -1; display:flex; flex-direction:row; align-items:center; gap:8px; padding: 12px; cursor:pointer;" title="Ver detalhes da expansão"'}>`;
ui = ui.replace(targetExpansion, replacementExpansion);

// 4. Make Player Profile full width
let targetProfile = `<div class="stat-card spring-in stagger-6-5" style="flex: 1 1 100%;`;
let replacementProfile = `<div class="stat-card spring-in stagger-6-5" style="grid-column: 1 / -1; flex: 1 1 100%;`;
ui = ui.replace(targetProfile, replacementProfile);

// Also fix Composteiras which is also stagger-6 but title="Composteiras"
let targetCompost = `title="Composteiras">`;
// Wait, we don't want Composteiras to be full width, we want it side by side with Animals.
// Let's just make sure Expansion and Profile are full width.

fs.writeFileSync('js/ui.js', ui);
console.log('Fixed inline styles in ui.js');
