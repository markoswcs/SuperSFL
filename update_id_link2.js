const fs = require('fs');

function main() {
    let code = fs.readFileSync('js/ui.js', 'utf8');

    // The current code has:
    // onclick="navigator.clipboard.writeText('${farmId}'); window.__app.showToast('ID Copiada!'); event.stopPropagation();"
    // We want to change it to:
    // onclick="window.open('https://sunflower-land.com/play/?farmId=${farmId}', '_blank'); event.stopPropagation();"
    
    const targetDiv = '<div class="profile-id-badge" title="Clique para copiar ID" onclick="navigator.clipboard.writeText(\\'${farmId}\\'); window.__app.showToast(\\'ID Copiada!\\'); event.stopPropagation();">#${farmId}</div>';
    
    // Use regex to find the button
    const regex = /<div class="profile-id-badge" title="Clique para copiar ID" onclick="navigator\.clipboard\.writeText\('\\$\\{farmId\\}'\); window\.__app\.showToast\('ID Copiada!'\); event\.stopPropagation\(\);">#\$\\{farmId\\}<\/div>/;
    
    const newDiv = `<div class="profile-id-badge" title="Visitar Fazenda" onclick="window.open('https://sunflower-land.com/play/?farmId=\${farmId}', '_blank'); event.stopPropagation();">#\${farmId} <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px; margin-left:2px; opacity:0.7;"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg></div>`;

    if (regex.test(code)) {
        code = code.replace(regex, newDiv);
        fs.writeFileSync('js/ui.js', code);
        console.log('Successfully updated the ID pill to open the island link directly using regex.');
    } else {
        // Fallback simple replacement
        const simpleRegex = /onclick="navigator\.clipboard\.writeText\('\\$\\{farmId\\}'\); window\.__app\.showToast\('ID Copiada!'\); event\.stopPropagation\(\);"/;
        if (simpleRegex.test(code)) {
            code = code.replace(simpleRegex, `onclick="window.open('https://sunflower-land.com/play/?farmId=\${farmId}', '_blank'); event.stopPropagation();" title="Visitar Fazenda"`);
            fs.writeFileSync('js/ui.js', code);
            console.log('Successfully updated click behavior using simple regex.');
        } else {
            console.log('Could not find the button to replace.');
        }
    }
}

main();
